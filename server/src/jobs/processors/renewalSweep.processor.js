const prisma = require('../../config/db');
const alertsService = require('../../modules/alerts/alerts.service');
const { addDays, startOfDay, endOfDay } = require('date-fns');

const processRenewalSweep = async () => {
  const targetDate = addDays(new Date(), 3);
  const start = startOfDay(targetDate);
  const end = endOfDay(targetDate);

  // Find all CONFIRMED commitments with nextOccurrenceDate exactly 3 days from now
  const upcomingRenewals = await prisma.recurringCommitment.findMany({
    where: {
      status: 'CONFIRMED',
      deletedAt: null,
      nextOccurrenceDate: {
        gte: start,
        lte: end,
      },
    },
  });

  for (const commitment of upcomingRenewals) {
    await alertsService.createAlertIfNotDuplicate({
      userId: commitment.userId,
      type: 'RECURRING_RENEWAL_UPCOMING',
      relatedEntityType: 'RECURRING_COMMITMENT',
      relatedEntityId: commitment.id,
      relevantDate: commitment.nextOccurrenceDate,
      message: `Your recurring ${commitment.type === 'EXPENSE' ? 'expense' : 'income'} "${commitment.name}" for $${commitment.amount.toFixed(2)} is coming up on ${commitment.nextOccurrenceDate.toLocaleDateString()}.`,
      severity: 'INFO',
    });
  }
};

module.exports = {
  processRenewalSweep,
};
