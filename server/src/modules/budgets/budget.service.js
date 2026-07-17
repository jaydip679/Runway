const prisma = require('../../config/db');
const AppError = require('../../common/errors/AppError');
const errorCodes = require('../../common/errors/errorCodes');
const alertsService = require('../alerts/alerts.service');

exports.createBudget = async (userId, data) => {
  // Check if budget already exists for this category and period
  const existing = await prisma.budget.findUnique({
    where: {
      userId_categoryId_period: {
        userId,
        categoryId: data.categoryId,
        period: data.period || 'MONTHLY',
      }
    }
  });

  if (existing) {
    throw new AppError('Budget for this category already exists in the given period', 400, errorCodes.CONFLICT);
  }

  const budget = await prisma.budget.create({
    data: {
      userId,
      ...data,
    },
    include: {
      category: {
        select: { id: true, name: true, type: true, icon: true }
      }
    }
  });

  return budget;
};

exports.getBudgets = async (userId) => {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    include: {
      category: {
        select: { id: true, name: true, type: true, icon: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Calculate progress for each budget
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Aggregate transactions for the current month
  const aggregations = await prisma.transaction.groupBy({
    by: ['categoryId'],
    _sum: { amount: true },
    where: {
      userId,
      type: 'EXPENSE',
      deletedAt: null,
      transactionDate: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  });

  const categoryTotals = {};
  for (const agg of aggregations) {
    if (agg.categoryId) {
      categoryTotals[agg.categoryId] = Number(agg._sum.amount || 0);
    }
  }

  return budgets.map(budget => {
    const amountSpent = categoryTotals[budget.categoryId] || 0;
    const progressPercentage = budget.amount > 0 ? (amountSpent / Number(budget.amount)) * 100 : 0;
    
    return {
      ...budget,
      amount: Number(budget.amount),
      amountSpent,
      remainingAmount: Math.max(0, Number(budget.amount) - amountSpent),
      progressPercentage: Math.min(100, progressPercentage),
      isExceeded: amountSpent > Number(budget.amount)
    };
  });
};

exports.updateBudget = async (userId, id, data) => {
  const existing = await prisma.budget.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new AppError('Budget not found', 404, errorCodes.NOT_FOUND);
  }

  const budget = await prisma.budget.update({
    where: { id },
    data,
    include: {
      category: {
        select: { id: true, name: true, type: true, icon: true }
      }
    }
  });
  return budget;
};

exports.deleteBudget = async (userId, id) => {
  const existing = await prisma.budget.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new AppError('Budget not found', 404, errorCodes.NOT_FOUND);
  }

  await prisma.budget.delete({ where: { id } });
};

exports.checkBudgetAlerts = async (userId, categoryId) => {
  const budget = await prisma.budget.findFirst({
    where: { userId, categoryId, period: 'MONTHLY' },
    include: { category: true }
  });

  if (!budget || budget.amount <= 0) return;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const aggregations = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      userId,
      categoryId,
      type: 'EXPENSE',
      deletedAt: null,
      transactionDate: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  });

  const amountSpent = Number(aggregations._sum.amount || 0);
  const budgetAmount = Number(budget.amount);
  const progressPercentage = (amountSpent / budgetAmount) * 100;

  if (progressPercentage >= 100) {
    await alertsService.createAlertIfNotDuplicate({
      userId,
      type: 'BUDGET_EXCEEDED', // We'll add this to schema later or just reuse
      relatedEntityType: 'BUDGET',
      relatedEntityId: budget.id,
      relevantDate: startOfMonth,
      message: `You have exceeded your ${budget.category.name} budget for this month. Spent: $${amountSpent.toFixed(2)} / $${budgetAmount.toFixed(2)}`,
      severity: 'CRITICAL',
    });
  } else if (progressPercentage >= 80) {
    await alertsService.createAlertIfNotDuplicate({
      userId,
      type: 'BUDGET_APPROACHING',
      relatedEntityType: 'BUDGET',
      relatedEntityId: budget.id,
      relevantDate: startOfMonth,
      message: `You are approaching your ${budget.category.name} budget for this month. Spent: $${amountSpent.toFixed(2)} / $${budgetAmount.toFixed(2)}`,
      severity: 'WARNING',
    });
  }
};
