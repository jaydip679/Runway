const prisma = require('../../config/db');
const AppError = require('../../common/errors/AppError');
const errorCodes = require('../../common/errors/errorCodes');
const { enqueueForecastRecompute } = require('../../jobs/queues/forecast.queue');
const { getSoftDeleteFilter } = require('../../common/utils/softDelete');
const { addDays, subDays } = require('date-fns');

const GRACE_PERIOD_DAYS = 7;

const checkAccountOwnership = async (userId, accountId) => {
  const account = await prisma.account.findUnique({
    where: { id: accountId }
  });
  if (!account || account.userId !== userId || account.deletedAt !== null) {
    throw new AppError('Account not found', 404, errorCodes.ACCOUNTS.ACCOUNT_NOT_FOUND);
  }
};

const getCommitment = async (userId, id) => {
  const commitment = await prisma.recurringCommitment.findUnique({
    where: { id },
    include: { account: true }
  });
  if (!commitment || commitment.userId !== userId || commitment.deletedAt !== null) {
    throw new AppError('Recurring commitment not found', 404, errorCodes.RECURRING?.COMMITMENT_NOT_FOUND || 'RECURRING_NOT_FOUND');
  }
  return commitment;
};

const listRecurring = async (userId) => {
  await syncOccurrences(userId);
  return await prisma.recurringCommitment.findMany({
    where: {
      userId,
      ...getSoftDeleteFilter()
    },
    orderBy: { nextOccurrenceDate: 'asc' },
    include: {
      account: {
        select: { id: true, name: true }
      }
    }
  });
};

const createRecurring = async (userId, data) => {
  await checkAccountOwnership(userId, data.accountId);

  const commitment = await prisma.recurringCommitment.create({
    data: {
      ...data,
      nextOccurrenceDate: new Date(data.nextOccurrenceDate),
      userId,
      detectionSource: 'MANUAL',
      status: 'CONFIRMED'
    }
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'RECURRING_CREATED',
      entityType: 'RecurringCommitment',
      entityId: commitment.id,
      metadata: { ...data, status: 'CONFIRMED' }
    }
  });

  enqueueForecastRecompute(userId);
  return commitment;
};

const updateRecurring = async (userId, id, data) => {
  const existing = await getCommitment(userId, id);

  if (data.accountId) {
    await checkAccountOwnership(userId, data.accountId);
  }

  // Editing a PENDING_CONFIRMATION candidate must NOT implicitly confirm it.
  const commitment = await prisma.recurringCommitment.update({
    where: { id },
    data: {
      ...data,
      ...(data.nextOccurrenceDate && { nextOccurrenceDate: new Date(data.nextOccurrenceDate) })
      // We intentionally do not touch 'status' here
    }
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'RECURRING_UPDATED',
      entityType: 'RecurringCommitment',
      entityId: id,
      metadata: { updates: data }
    }
  });

  enqueueForecastRecompute(userId);
  return commitment;
};

const confirmRecurring = async (userId, id) => {
  const existing = await getCommitment(userId, id);

  if (existing.status !== 'PENDING_CONFIRMATION') {
    throw new AppError('Invalid status transition', 422, 'RECURRING_INVALID_STATUS_TRANSITION');
  }

  const commitment = await prisma.recurringCommitment.update({
    where: { id },
    data: { status: 'CONFIRMED' }
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'RECURRING_CONFIRMED',
      entityType: 'RecurringCommitment',
      entityId: id,
      metadata: { previousStatus: existing.status, newStatus: 'CONFIRMED' }
    }
  });

  enqueueForecastRecompute(userId);
  return commitment;
};

const dismissRecurring = async (userId, id) => {
  const existing = await getCommitment(userId, id);

  if (existing.status !== 'PENDING_CONFIRMATION') {
    throw new AppError('Invalid status transition', 422, 'RECURRING_INVALID_STATUS_TRANSITION');
  }

  const commitment = await prisma.recurringCommitment.update({
    where: { id },
    data: { status: 'DISMISSED' }
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'RECURRING_DISMISSED',
      entityType: 'RecurringCommitment',
      entityId: id,
      metadata: { previousStatus: existing.status, newStatus: 'DISMISSED' }
    }
  });

  enqueueForecastRecompute(userId);
  return commitment;
};

const deleteRecurring = async (userId, id) => {
  const existing = await getCommitment(userId, id);

  await prisma.recurringCommitment.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'RECURRING_DELETED',
      entityType: 'RecurringCommitment',
      entityId: id,
      metadata: { deletedAt: new Date().toISOString() }
    }
  });

  enqueueForecastRecompute(userId);
};

const advanceDate = (date, unit, count) => {
  const next = new Date(date);
  if (unit === 'DAILY') next.setDate(next.getDate() + count);
  else if (unit === 'WEEKLY') next.setDate(next.getDate() + (7 * count));
  else if (unit === 'MONTHLY') next.setMonth(next.getMonth() + count);
  else if (unit === 'YEARLY') next.setFullYear(next.getFullYear() + count);
  return next;
};

const syncOccurrences = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Generate new occurrences for due commitments
  const dueCommitments = await prisma.recurringCommitment.findMany({
    where: { 
      userId, 
      status: 'CONFIRMED', 
      deletedAt: null,
      nextOccurrenceDate: { lte: today }
    }
  });

  for (const commitment of dueCommitments) {
    let currentExpected = new Date(commitment.nextOccurrenceDate);
    currentExpected.setHours(0, 0, 0, 0);
    
    // We loop in case a commitment is multiple cycles behind
    while (currentExpected <= today) {
      // Idempotency: upsert the occurrence so it doesn't duplicate
      await prisma.recurringOccurrence.upsert({
        where: {
          commitmentId_expectedDate: {
            commitmentId: commitment.id,
            expectedDate: currentExpected
          }
        },
        update: {},
        create: {
          commitmentId: commitment.id,
          userId: userId,
          expectedDate: currentExpected,
          amount: commitment.amount,
          status: 'PENDING'
        }
      });
      currentExpected = advanceDate(currentExpected, commitment.intervalUnit, commitment.intervalCount);
    }

    // Update commitment's nextOccurrenceDate
    await prisma.recurringCommitment.update({
      where: { id: commitment.id },
      data: { nextOccurrenceDate: currentExpected }
    });
  }

  // 2. Mark stale pending occurrences as MISSED
  const cutoffDate = subDays(today, GRACE_PERIOD_DAYS);
  await prisma.recurringOccurrence.updateMany({
    where: {
      userId,
      status: 'PENDING',
      expectedDate: { lt: cutoffDate }
    },
    data: { status: 'MISSED' }
  });
};

const getPendingOccurrences = async (userId) => {
  await syncOccurrences(userId);
  return await prisma.recurringOccurrence.findMany({
    where: { userId, status: 'PENDING' },
    include: {
      commitment: {
        include: { account: { select: { id: true, name: true, currency: true } } }
      }
    },
    orderBy: { expectedDate: 'asc' }
  });
};

const resolveOccurrence = async (userId, occurrenceId, action) => {
  const occurrence = await prisma.recurringOccurrence.findUnique({
    where: { id: occurrenceId },
    include: { commitment: true }
  });

  if (!occurrence || occurrence.userId !== userId) {
    throw new AppError('Occurrence not found', 404, 'OCCURRENCE_NOT_FOUND');
  }

  if (occurrence.status !== 'PENDING') {
    throw new AppError('Occurrence is already resolved', 422, 'OCCURRENCE_ALREADY_RESOLVED');
  }

  if (action === 'SKIP') {
    return await prisma.recurringOccurrence.update({
      where: { id: occurrenceId },
      data: { status: 'SKIPPED' }
    });
  }

  if (action === 'COMPLETE') {
    // Create the real transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        accountId: occurrence.commitment.accountId,
        amount: occurrence.amount,
        type: occurrence.commitment.type,
        description: occurrence.commitment.name,
        transactionDate: occurrence.expectedDate,
        source: 'MANUAL'
      }
    });

    // Link and mark completed
    return await prisma.recurringOccurrence.update({
      where: { id: occurrenceId },
      data: { 
        status: 'COMPLETED',
        transactionId: transaction.id
      }
    });
  }

  throw new AppError('Invalid action', 400, 'INVALID_RESOLVE_ACTION');
};

module.exports = {
  listRecurring,
  createRecurring,
  updateRecurring,
  confirmRecurring,
  dismissRecurring,
  deleteRecurring,
  syncOccurrences,
  getPendingOccurrences,
  resolveOccurrence
};
