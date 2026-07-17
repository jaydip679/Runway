const prisma = require('../../config/db');
const { computeForecast, isOccurrenceDay } = require('./forecastEngine');
const { computeSignature } = require('../recurring/detectionAlgorithm');
const { differenceInDays, isSameDay, addDays } = require('date-fns');
const { Decimal } = require('@prisma/client/runtime/library');

const getForecast = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const forecast = await prisma.forecastSnapshot.findMany({
    where: {
      userId,
      forecastDate: {
        gte: today
      }
    },
    orderBy: {
      forecastDate: 'asc'
    }
  });

  if (forecast.length === 0) {
    return { ready: false, days: [] };
  }

  return { ready: true, days: forecast };
};

const getForecastSummary = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const forecast = await prisma.forecastSnapshot.findMany({
    where: {
      userId,
      forecastDate: {
        gte: today
      }
    },
    orderBy: {
      forecastDate: 'asc'
    }
  });

  if (forecast.length === 0) {
    return { ready: false };
  }

  const getDayBalance = (dayIndex) => {
    if (dayIndex < forecast.length) {
      return forecast[dayIndex].projectedBalance;
    }
    return forecast[forecast.length - 1].projectedBalance;
  };

  return {
    ready: true,
    day7Balance: getDayBalance(6),
    day30Balance: getDayBalance(29),
    day60Balance: getDayBalance(59),
    fullSeries: forecast // added full series so we can satisfy graphql shape if needed
  };
};

const evaluateExactDate = async (userId, targetDateStr) => {
  const targetDate = new Date(targetDateStr);
  targetDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (targetDate < today) {
    throw new Error('Cannot evaluate exact date in the past');
  }

  const daysDifference = differenceInDays(targetDate, today);

  let projectedBalance = null;
  let confidenceLevel = 'LOW';
  
  const confirmedRecurring = await prisma.recurringCommitment.findMany({
    where: { userId, status: 'CONFIRMED', deletedAt: null }
  });

  const matchingCommitments = confirmedRecurring.filter(c => isOccurrenceDay(c, targetDate));

  if (daysDifference <= 60) {
    // Read from snapshot
    const snapshot = await prisma.forecastSnapshot.findFirst({
      where: { userId, forecastDate: targetDate }
    });
    if (snapshot) {
      projectedBalance = Number(snapshot.projectedBalance);
      confidenceLevel = snapshot.confidenceLevel;
    }
  } 
  
  if (projectedBalance === null) {
    // Run on-demand calculation
    const accountAggregation = await prisma.account.aggregate({
      _sum: { currentBalance: true },
      where: { userId, deletedAt: null, isActive: true }
    });
    const dayZeroBalance = accountAggregation._sum.currentBalance || new Decimal('0');

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
      windowDays: daysDifference,
    });

    if (days.length > 0) {
      const match = days[days.length - 1];
      projectedBalance = Number(match.projectedBalance);
      confidenceLevel = match.confidenceLevel;
    } else {
      projectedBalance = Number(dayZeroBalance);
    }
  }

  let totalIncome = 0;
  let totalExpense = 0;
  for (const c of matchingCommitments) {
    if (c.type === 'INCOME') totalIncome += Number(c.amount);
    if (c.type === 'EXPENSE') totalExpense += Number(c.amount);
  }

  return {
    date: targetDate,
    projectedBalance,
    confidenceLevel,
    expectedIncome: totalIncome,
    expectedExpense: totalExpense,
    upcomingCommitments: matchingCommitments.map(c => ({
      name: c.name,
      amount: Number(c.amount),
      type: c.type
    }))
  };
};

const getForecastInsights = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const forecast = await prisma.forecastSnapshot.findMany({
    where: { userId, forecastDate: { gte: today } },
    orderBy: { forecastDate: 'asc' }
  });

  const confirmedRecurring = await prisma.recurringCommitment.findMany({
    where: { userId, status: 'CONFIRMED', deletedAt: null }
  });

  const insights = [];

  // Find biggest upcoming expense
  let biggestExpense = null;
  let biggestExpenseDate = null;

  for (let i = 1; i <= 60; i++) {
    const currentDay = addDays(today, i);
    for (const c of confirmedRecurring) {
      if (c.type === 'EXPENSE' && isOccurrenceDay(c, currentDay)) {
        if (!biggestExpense || Number(c.amount) > Number(biggestExpense.amount)) {
          biggestExpense = c;
          biggestExpenseDate = currentDay;
        }
      }
    }
  }

  if (biggestExpense) {
    insights.push({
      type: 'BIGGEST_EXPENSE',
      priority: 'HIGH',
      message: `Your largest upcoming recurring expense is ${biggestExpense.name} ($${Number(biggestExpense.amount).toFixed(2)}) on ${biggestExpenseDate.toLocaleDateString()}.`
    });
  }

  // Find consecutive low balance days or major dips
  let consecutiveLowDays = 0;
  let firstLowDay = null;
  const LOW_BALANCE_THRESHOLD = 500; // configurable later

  for (let i = 0; i < forecast.length; i++) {
    if (Number(forecast[i].projectedBalance) < LOW_BALANCE_THRESHOLD) {
      if (consecutiveLowDays === 0) firstLowDay = forecast[i].forecastDate;
      consecutiveLowDays++;
    } else {
      if (consecutiveLowDays >= 3) {
        insights.push({
          type: 'LOW_BALANCE',
          priority: 'WARNING',
          message: `Your balance is projected to remain below $${LOW_BALANCE_THRESHOLD} for ${consecutiveLowDays} days starting ${firstLowDay.toLocaleDateString()}.`
        });
      }
      consecutiveLowDays = 0;
      firstLowDay = null;
    }
  }
  // catch end of loop
  if (consecutiveLowDays >= 3) {
    insights.push({
      type: 'LOW_BALANCE',
      priority: 'WARNING',
      message: `Your balance is projected to remain below $${LOW_BALANCE_THRESHOLD} for ${consecutiveLowDays} days starting ${firstLowDay.toLocaleDateString()}.`
    });
  }

  // Major balance dips
  for (let i = 1; i < forecast.length; i++) {
    const prev = Number(forecast[i-1].projectedBalance);
    const curr = Number(forecast[i].projectedBalance);
    if (prev - curr > 1000) { // arbitrary major dip threshold
      // find what caused it
      const currentDay = forecast[i].forecastDate;
      const causes = confirmedRecurring.filter(c => c.type === 'EXPENSE' && isOccurrenceDay(c, currentDay));
      const causeNames = causes.map(c => c.name).join(', ');
      
      insights.push({
        type: 'BALANCE_DIP',
        priority: 'INFO',
        message: `Your balance will decrease significantly on ${currentDay.toLocaleDateString()}${causeNames ? ` because of ${causeNames}` : ''}.`
      });
      break; // only report the first major dip to avoid spam
    }
  }

  // Deduplicate insights
  const uniqueInsights = insights.filter((v, i, a) => a.findIndex(t => (t.message === v.message)) === i);

  return uniqueInsights;
};

const simulateScenario = async (userId, events = []) => {
  // 1. Load base data
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

  // 2. Compute Baseline
  const baseline = computeForecast({
    dayZeroBalance,
    confirmedRecurring,
    discretionaryDaily,
    windowDays: 60
  });

  // 3. Prepare Scenario Inputs
  const scenarioRecurring = [...confirmedRecurring];
  const oneTimeEvents = [];

  for (const ev of events) {
    if (ev.type === 'NEW_RECURRING') {
      scenarioRecurring.push({
        name: ev.name || 'Scenario Subscription',
        amount: new Decimal(ev.amount),
        type: ev.recurringType, // 'EXPENSE' or 'INCOME'
        intervalUnit: ev.intervalUnit, // 'MONTHLY', 'YEARLY', etc.
        intervalCount: ev.intervalCount || 1,
        nextOccurrenceDate: new Date(ev.date)
      });
    } else if (ev.type === 'ONE_TIME_EXPENSE' || ev.type === 'ONE_TIME_INCOME') {
      oneTimeEvents.push({
        date: ev.date,
        amount: ev.amount,
        type: ev.type
      });
    }
  }

  // 4. Compute Scenario
  const scenario = computeForecast({
    dayZeroBalance,
    confirmedRecurring: scenarioRecurring,
    discretionaryDaily,
    windowDays: 60,
    oneTimeEvents
  });

  return { baseline, scenario };
};

module.exports = {
  getForecast,
  getForecastSummary,
  evaluateExactDate,
  getForecastInsights,
  simulateScenario
};
