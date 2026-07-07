const prisma = require('../../config/db');
const AppError = require('../../common/errors/AppError');
const errorCodes = require('../../common/errors/errorCodes');
const { encodeCursor, decodeCursor } = require('../../common/utils/pagination');

// Stub for forecast queue which doesn't exist until Phase 5
const enqueueForecastRecompute = (userId) => {
  console.log(`[STUB] Enqueue forecast recompute for user: ${userId}`);
};

const validateAccountAndCategory = async (userId, accountId, categoryId, transactionType) => {
  if (accountId) {
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId, deletedAt: null }
    });
    if (!account) throw new AppError('Account not found', 404, errorCodes.RESOURCE_NOT_FOUND);
  }

  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    if (!category || (category.userId && category.userId !== userId)) {
      throw new AppError('Category not found', 404, errorCodes.RESOURCE_NOT_FOUND);
    }
    if (transactionType && category.type !== transactionType) {
      throw new AppError('Category type mismatch', 400, errorCodes.TRANSACTION_TYPE_MISMATCH);
    }
  }
};

const createTransaction = async (userId, data) => {
  await validateAccountAndCategory(userId, data.accountId, data.categoryId, data.type);

  const transaction = await prisma.transaction.create({
    data: {
      ...data,
      userId,
      transactionDate: new Date(data.transactionDate)
    },
    include: {
      account: true,
      category: true
    }
  });

  enqueueForecastRecompute(userId);
  return transaction;
};

const getTransactions = async (userId, query) => {
  const { limit = 20, cursor, accountId, categoryId, type, startDate, endDate, search } = query;

  const where = {
    userId,
    deletedAt: null,
    ...(accountId && { accountId }),
    ...(categoryId && { categoryId }),
    ...(type && { type }),
    ...((startDate || endDate) && {
      transactionDate: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) })
      }
    }),
    ...(search && {
      description: {
        contains: search,
        mode: 'insensitive'
      }
    })
  };

  let cursorObj = null;
  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      cursorObj = {
        transactionDate: new Date(decoded.date),
        id: decoded.id
      };
    }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    take: limit + 1,
    orderBy: [
      { transactionDate: 'desc' },
      { id: 'asc' }
    ],
    cursor: cursorObj ? {
      userId_transactionDate: {
        userId,
        transactionDate: cursorObj.transactionDate
      }
    } : undefined, // Wait, compound cursor using transactionDate and id is tricky in Prisma unless there's a unique index on them.
    // Let's adjust to Prisma's cursor pagination requirements.
    // Actually, Prisma requires a unique identifier for cursor. 
    // Since id is unique, we can use just { id: cursorObj.id } if we sort by transactionDate and id.
    // wait, if we sort by multiple fields, prisma's cursor requires a unique constraint covering the sorted fields or just the id if it's unique.
    // In schema, id is unique.
    ...(cursorObj && {
      cursor: { id: cursorObj.id },
      skip: 1 // skip the cursor itself
    }),
    include: {
      account: { select: { name: true, type: true } },
      category: { select: { name: true, icon: true, type: true } }
    }
  });

  let nextCursor = null;
  if (transactions.length > limit) {
    const nextItem = transactions.pop(); // remove the +1 item
    nextCursor = encodeCursor(nextItem.transactionDate, nextItem.id);
  }

  return {
    data: transactions,
    nextCursor
  };
};

const updateTransaction = async (userId, id, data) => {
  const existing = await prisma.transaction.findFirst({
    where: { id, userId, deletedAt: null }
  });
  
  if (!existing) {
    throw new AppError('Transaction not found', 404, errorCodes.RESOURCE_NOT_FOUND);
  }

  await validateAccountAndCategory(
    userId, 
    data.accountId || existing.accountId, 
    data.categoryId !== undefined ? data.categoryId : existing.categoryId, 
    data.type || existing.type
  );

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      ...data,
      ...(data.transactionDate && { transactionDate: new Date(data.transactionDate) })
    },
    include: {
      account: true,
      category: true
    }
  });

  enqueueForecastRecompute(userId);
  return transaction;
};

const deleteTransaction = async (userId, id) => {
  const existing = await prisma.transaction.findFirst({
    where: { id, userId, deletedAt: null }
  });
  
  if (!existing) {
    throw new AppError('Transaction not found', 404, errorCodes.RESOURCE_NOT_FOUND);
  }

  await prisma.transaction.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  enqueueForecastRecompute(userId);
};

const aggregateTransactions = async (userId, { startDate, endDate, groupBy = 'categoryId' }) => {
  const validGroups = ['categoryId', 'accountId', 'transactionDate', 'type'];
  if (!validGroups.includes(groupBy)) {
    throw new AppError('Invalid groupBy field', 400, errorCodes.VALIDATION_ERROR);
  }

  const where = {
    userId,
    deletedAt: null,
    ...(startDate || endDate ? {
      transactionDate: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) })
      }
    } : {})
  };

  const results = await prisma.transaction.groupBy({
    by: [groupBy],
    where,
    _sum: {
      amount: true
    }
  });

  return results;
};

const uploadReceipt = async (userId, id, receiptImageUrl) => {
  const existing = await prisma.transaction.findFirst({
    where: { id, userId, deletedAt: null }
  });
  
  if (!existing) {
    throw new AppError('Transaction not found', 404, errorCodes.RESOURCE_NOT_FOUND);
  }

  const transaction = await prisma.transaction.update({
    where: { id },
    data: { receiptImageUrl },
    include: {
      account: true,
      category: true
    }
  });

  return transaction;
};

const { csvImportQueue } = require('../../jobs/queues/csvImport.queue');
const fs = require('fs');

const importCsv = async (userId, accountId, filePath) => {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId, deletedAt: null }
  });
  if (!account) {
    fs.unlinkSync(filePath);
    throw new AppError('Account not found', 404, errorCodes.RESOURCE_NOT_FOUND);
  }

  // Count lines quickly to set totalRows
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const totalRows = Math.max(0, fileContent.split('\n').filter(l => l.trim()).length - 1); // -1 for header

  const job = await prisma.csvImportJob.create({
    data: {
      userId,
      accountId,
      totalRows,
      status: 'PENDING'
    }
  });

  await csvImportQueue.add('processCsv', {
    jobId: job.id,
    userId,
    accountId,
    filePath
  });

  return job;
};

const getImportJobStatus = async (userId, jobId) => {
  const job = await prisma.csvImportJob.findFirst({
    where: { id: jobId, userId }
  });
  if (!job) {
    throw new AppError('Job not found', 404, errorCodes.RESOURCE_NOT_FOUND);
  }
  return job;
};

module.exports = {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  aggregateTransactions,
  uploadReceipt,
  importCsv,
  getImportJobStatus
};
