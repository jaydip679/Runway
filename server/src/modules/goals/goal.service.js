const prisma = require('../../config/db');
const AppError = require('../../common/errors/AppError');
const errorCodes = require('../../common/errors/errorCodes');
const { computeForecast } = require('../forecast/forecastEngine');
const { differenceInMonths, differenceInDays } = require('date-fns');
const { Decimal } = require('@prisma/client/runtime/library');
const { computeSignature } = require('../recurring/detectionAlgorithm');

// Helper to calculate affordability for a single goal
const calculateGoalAffordability = async (userId, goal) => {
  const targetDate = new Date(goal.targetDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthsRemaining = Math.max(1, differenceInMonths(targetDate, today));
  const daysRemaining = Math.max(1, differenceInDays(targetDate, today));

  let currentSavedAmount = Number(goal.currentAmount);

  if (goal.linkedAccounts && goal.linkedAccounts.length > 0) {
    const linkedBalance = goal.linkedAccounts.reduce((acc, link) => {
      return acc + Number(link.account.currentBalance);
    }, 0);
    currentSavedAmount = linkedBalance;
  }

  const remainingGoal = Math.max(0, Number(goal.targetAmount) - currentSavedAmount);
  const requiredMonthlySavings = remainingGoal / monthsRemaining;

  // Let's get the minimum projected balance over the window
  let minProjectedBalance = null;
  let targetDateProjectedBalance = null;

  if (daysRemaining <= 60) {
    // We can use the persisted ForecastSnapshots
    const snapshots = await prisma.forecastSnapshot.findMany({
      where: {
        userId,
        forecastDate: {
          gte: today,
          lte: targetDate
        }
      },
      orderBy: { forecastDate: 'asc' }
    });

    if (snapshots.length > 0) {
      minProjectedBalance = Math.min(...snapshots.map(s => Number(s.projectedBalance)));
      targetDateProjectedBalance = Number(snapshots[snapshots.length - 1].projectedBalance);
    }
  }

  // If we didn't get it from snapshots or need to compute further
  if (minProjectedBalance === null || daysRemaining > 60) {
    // Execute computeForecast on-demand for the larger window
    const accountAggregation = await prisma.account.aggregate({
      _sum: { currentBalance: true },
      where: { userId, deletedAt: null, isActive: true }
    });
    const dayZeroBalance = accountAggregation._sum.currentBalance || new Decimal('0');

    const confirmedRecurring = await prisma.recurringCommitment.findMany({
      where: { userId, status: 'CONFIRMED', deletedAt: null }
    });

    const recurringSignatures = new Set(confirmedRecurring.map(rc => rc.groupSignature).filter(Boolean));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentExpenses = await prisma.transaction.findMany({
      where: { userId, type: 'EXPENSE', deletedAt: null, transactionDate: { gte: thirtyDaysAgo } }
    });

    let totalDiscretionary = new Decimal('0');
    for (const tx of recentExpenses) {
      const sig = computeSignature(tx.accountId, tx.categoryId, tx.description);
      if (!recurringSignatures.has(sig)) {
        totalDiscretionary = totalDiscretionary.plus(tx.amount);
      }
    }
    const discretionaryDaily = totalDiscretionary.dividedBy(30);

    const days = computeForecast({
      dayZeroBalance,
      confirmedRecurring,
      discretionaryDaily,
      windowDays: daysRemaining,
    });

    if (days.length > 0) {
      minProjectedBalance = Math.min(...days.map(d => Number(d.projectedBalance)));
      targetDateProjectedBalance = Number(days[days.length - 1].projectedBalance);
    }
  }

  const isAchievable = minProjectedBalance !== null && minProjectedBalance >= remainingGoal;

  let recommendation = '';
  if (remainingGoal === 0) {
    recommendation = "You have already reached this goal!";
  } else if (isAchievable) {
    recommendation = `Based on your projected balances, this goal appears easily achievable before the target date. Your minimum balance remains above $${minProjectedBalance.toFixed(2)} throughout the saving period.`;
  } else {
    recommendation = `To comfortably reach this goal, try to save approximately $${requiredMonthlySavings.toFixed(2)} per month.`;
  }

  return {
    ...goal,
    currentAmount: currentSavedAmount,
    targetAmount: Number(goal.targetAmount),
    remainingAmount: remainingGoal,
    isAchievable,
    recommendation,
    minProjectedBalance,
    targetDateProjectedBalance
  };
};

exports.createGoal = async (userId, data) => {
  const { linkedAccountIds, ...goalData } = data;

  const goal = await prisma.savingsGoal.create({
    data: {
      userId,
      ...goalData,
      ...(linkedAccountIds && linkedAccountIds.length > 0 ? {
        linkedAccounts: {
          create: linkedAccountIds.map(accountId => ({ accountId }))
        }
      } : {})
    },
    include: {
      linkedAccounts: {
        include: { account: { select: { id: true, name: true, currentBalance: true } } }
      }
    }
  });

  return calculateGoalAffordability(userId, goal);
};

exports.getGoals = async (userId) => {
  const goals = await prisma.savingsGoal.findMany({
    where: { userId },
    include: {
      linkedAccounts: {
        include: { account: { select: { id: true, name: true, currentBalance: true } } }
      }
    },
    orderBy: { targetDate: 'asc' }
  });

  const enrichedGoals = await Promise.all(goals.map(goal => calculateGoalAffordability(userId, goal)));
  return enrichedGoals;
};

exports.updateGoal = async (userId, id, data) => {
  const existing = await prisma.savingsGoal.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new AppError('Goal not found', 404, errorCodes.NOT_FOUND);
  }

  const { linkedAccountIds, ...goalData } = data;

  const updateData = { ...goalData };

  if (linkedAccountIds) {
    updateData.linkedAccounts = {
      deleteMany: {},
      create: linkedAccountIds.map(accountId => ({ accountId }))
    };
  }

  const goal = await prisma.savingsGoal.update({
    where: { id },
    data: updateData,
    include: {
      linkedAccounts: {
        include: { account: { select: { id: true, name: true, currentBalance: true } } }
      }
    }
  });

  return calculateGoalAffordability(userId, goal);
};

exports.deleteGoal = async (userId, id) => {
  const existing = await prisma.savingsGoal.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new AppError('Goal not found', 404, errorCodes.NOT_FOUND);
  }

  await prisma.savingsGoal.delete({ where: { id } });
};

exports.calculateGoalAffordability = calculateGoalAffordability;
