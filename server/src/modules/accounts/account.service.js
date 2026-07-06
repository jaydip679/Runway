const prisma = require('../../config/db');
const AppError = require('../../common/errors/AppError');
const errorCodes = require('../../common/errors/errorCodes');
const { enqueueForecastRecompute } = require('../../jobs/queues/forecast.queue');

/**
 * Creates a new account.
 */
const createAccount = async (userId, data) => {
  const account = await prisma.account.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      currentBalance: data.currentBalance,
      currency: data.currency || 'INR',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'ACCOUNT_CREATED',
      entityType: 'ACCOUNT',
      entityId: account.id,
      metadata: { name: account.name, type: account.type },
    },
  });

  // Enqueue forecast recompute
  await enqueueForecastRecompute(userId);

  return account;
};

/**
 * Gets paginated accounts for a user. Excludes soft-deleted accounts.
 */
const getAccounts = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [accounts, total] = await Promise.all([
    prisma.account.findMany({
      where: { userId, deletedAt: null },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.account.count({
      where: { userId, deletedAt: null },
    }),
  ]);

  return { accounts, total, page, limit };
};

/**
 * Gets a single account. Excludes soft-deleted accounts.
 */
const getAccountById = async (userId, accountId) => {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId, deletedAt: null },
  });

  if (!account) {
    throw new AppError('Account not found', 404, errorCodes.RESOURCE_NOT_FOUND);
  }

  return account;
};

/**
 * Updates an account.
 */
const updateAccount = async (userId, accountId, data) => {
  // Verify ownership and existence
  await getAccountById(userId, accountId);

  const updatedAccount = await prisma.account.update({
    where: { id: accountId },
    data,
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'ACCOUNT_UPDATED',
      entityType: 'ACCOUNT',
      entityId: updatedAccount.id,
      metadata: data,
    },
  });

  await enqueueForecastRecompute(userId);

  return updatedAccount;
};

/**
 * Soft deletes an account.
 */
const deleteAccount = async (userId, accountId) => {
  // Verify ownership and existence
  await getAccountById(userId, accountId);

  await prisma.account.update({
    where: { id: accountId },
    data: { deletedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'ACCOUNT_DELETED',
      entityType: 'ACCOUNT',
      entityId: accountId,
      metadata: {},
    },
  });

  await enqueueForecastRecompute(userId);
};

module.exports = {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
};
