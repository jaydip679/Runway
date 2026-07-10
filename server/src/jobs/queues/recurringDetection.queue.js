const { Queue, Worker } = require('bullmq');
const redis = require('../../config/redis');
const prisma = require('../../config/db');
const { detect } = require('../../modules/recurring/detectionAlgorithm');
const { subDays } = require('date-fns');
const alertsService = require('../../modules/alerts/alerts.service');

const recurringDetectionQueue = new Queue('recurringDetectionQueue', { connection: redis });

const processRecurringDetection = async (job) => {
  const { userId } = job.data;
  
  // 1. Fetch trailing 90 days of transactions for this user
  const ninetyDaysAgo = subDays(new Date(), 90);
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      deletedAt: null,
      transactionDate: {
        gte: ninetyDaysAgo
      }
    },
    orderBy: {
      transactionDate: 'asc'
    }
  });

  if (transactions.length === 0) return;

  // 2. Detect candidates
  const candidates = detect(transactions);

  // 3. Process each candidate
  for (const candidate of candidates) {
    const { groupSignature } = candidate;

    // Check if dismissed within last 90 days
    const recentlyDismissed = await prisma.recurringCommitment.findFirst({
      where: {
        userId,
        groupSignature,
        status: 'DISMISSED',
        updatedAt: {
          gt: ninetyDaysAgo
        }
      }
    });

    if (recentlyDismissed) continue;

    // Check if already confirmed (ignoring deleted)
    const alreadyConfirmed = await prisma.recurringCommitment.findFirst({
      where: {
        userId,
        groupSignature,
        status: 'CONFIRMED',
        deletedAt: null
      }
    });

    if (alreadyConfirmed) continue;

    // Find existing PENDING_CONFIRMATION to update, or create a new one
    const existingPending = await prisma.recurringCommitment.findFirst({
      where: {
        userId,
        groupSignature,
        status: 'PENDING_CONFIRMATION',
        deletedAt: null
      }
    });

    if (existingPending) {
      await prisma.recurringCommitment.update({
        where: { id: existingPending.id },
        data: {
          nextOccurrenceDate: candidate.nextOccurrenceDate,
          confidenceScore: candidate.confidenceScore
        }
      });
    } else {
      const newCommitment = await prisma.recurringCommitment.create({
        data: {
          userId,
          accountId: candidate.accountId,
          name: candidate.name,
          amount: candidate.amount,
          type: candidate.type,
          intervalUnit: candidate.intervalUnit,
          intervalCount: candidate.intervalCount,
          nextOccurrenceDate: candidate.nextOccurrenceDate,
          detectionSource: candidate.detectionSource,
          confidenceScore: candidate.confidenceScore,
          groupSignature: candidate.groupSignature,
          status: 'PENDING_CONFIRMATION'
        }
      });

      // Create an alert for the newly detected commitment
      await alertsService.createAlertIfNotDuplicate({
        userId,
        type: 'RECURRING_DETECTED_PENDING_CONFIRMATION',
        relatedEntityType: 'RECURRING_COMMITMENT',
        relatedEntityId: newCommitment.id,
        relevantDate: newCommitment.nextOccurrenceDate,
        message: `We noticed a new recurring pattern for "${newCommitment.name}". Please review to include it in your forecast.`,
        severity: 'INFO',
      });
    }
  }
};

const recurringDetectionWorker = new Worker('recurringDetectionQueue', processRecurringDetection, { connection: redis });

recurringDetectionWorker.on('failed', (job, err) => {
  console.error(`[recurringDetectionWorker] Job ${job.id} failed:`, err);
});

module.exports = {
  recurringDetectionQueue,
  recurringDetectionWorker,
  processRecurringDetection // Exported for testing
};
