const prisma = require('../../config/db');
const AppError = require('../../common/errors/AppError');
const errorCodes = require('../../common/errors/errorCodes');
const { enqueueForecastRecompute } = require('../../jobs/queues/forecast.queue');
const { getSoftDeleteFilter } = require('../../common/utils/softDelete');

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
      ...data
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

module.exports = {
  listRecurring,
  createRecurring,
  updateRecurring,
  confirmRecurring,
  dismissRecurring,
  deleteRecurring
};
