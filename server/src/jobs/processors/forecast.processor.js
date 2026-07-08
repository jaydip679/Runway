const logger = require('../../config/logger');
const prisma = require('../../config/db');
const redis = require('../../config/redis');
const { computeForecast } = require('../../modules/forecast/forecastEngine');
const { computeSignature } = require('../../modules/recurring/detectionAlgorithm');
const { Decimal } = require('@prisma/client/runtime/library');
const env = require('../../config/env');

async function processForecastJob(job) {
  const { userId } = job.data;
  
  if (!userId) {
    throw new Error('Missing userId in forecast job');
  }

  logger.info(`Starting forecast generation for user ${userId}`);

  // 1. dayZeroBalance
  const accountAggregation = await prisma.account.aggregate({
    _sum: { currentBalance: true },
    where: {
      userId,
      deletedAt: null,
      isActive: true,
    }
  });
  const dayZeroBalance = accountAggregation._sum.currentBalance || new Decimal('0');

  // 2. confirmedRecurring
  const confirmedRecurring = await prisma.recurringCommitment.findMany({
    where: {
      userId,
      status: 'CONFIRMED',
      deletedAt: null
    }
  });

  // 3. discretionaryDaily
  const recurringSignatures = new Set(
    confirmedRecurring
      .map(rc => rc.groupSignature)
      .filter(Boolean)
  );

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentExpenses = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'EXPENSE',
      deletedAt: null,
      transactionDate: {
        gte: thirtyDaysAgo
      }
    }
  });

  let totalDiscretionary = new Decimal('0');
  for (const tx of recentExpenses) {
    const sig = computeSignature(tx.accountId, tx.categoryId, tx.description);
    if (!recurringSignatures.has(sig)) {
      totalDiscretionary = totalDiscretionary.plus(tx.amount);
    }
  }

  const discretionaryDaily = totalDiscretionary.dividedBy(30);

  // 4. Compute forecast
  const windowDays = env.FORECAST_WINDOW_DAYS || 60;
  const days = computeForecast({
    dayZeroBalance,
    confirmedRecurring,
    discretionaryDaily,
    windowDays,
  });

  // 5. UPSERT ForecastSnapshot and Delete Stale
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const generatedAt = new Date();

  await prisma.$transaction(async (tx) => {
    for (const day of days) {
      await tx.forecastSnapshot.upsert({
        where: {
          userId_forecastDate: {
            userId,
            forecastDate: day.forecastDate,
          }
        },
        update: {
          projectedBalance: day.projectedBalance,
          confidenceLevel: day.confidenceLevel,
          generatedAt,
        },
        create: {
          userId,
          forecastDate: day.forecastDate,
          projectedBalance: day.projectedBalance,
          confidenceLevel: day.confidenceLevel,
          generatedAt,
        }
      });
    }

    // Delete stale forecasts (before today)
    await tx.forecastSnapshot.deleteMany({
      where: {
        userId,
        forecastDate: {
          lt: today
        }
      }
    });
  });

  // 6. Update Redis cache if necessary, though GET /forecast can just fetch from DB.
  // "Update Redis cache: forecast:{userId}" from the spec. We can just cache a simple flag or the whole thing.
  // For now, since GET /forecast might just hit the DB which is bounded (60 rows), maybe we just cache the 60 rows.
  // Actually, DATABASE_DESIGN.md says it's a materialized cache. Wait, does GET /forecast hit redis?
  // Let's check T5.3: "upsert wrapped in prisma.$transaction, the stale-row prune, and the forecast:{userId} Redis cache write."
  const forecastJson = days.map(d => ({
    forecastDate: d.forecastDate.toISOString(),
    projectedBalance: d.projectedBalance.toString(),
    confidenceLevel: d.confidenceLevel,
    generatedAt: generatedAt.toISOString(),
  }));
  await redis.set(`forecast:${userId}`, JSON.stringify(forecastJson), 'EX', 60 * 60 * 24 * 2); // 2 days TTL

  logger.info(`Forecast generation completed for user ${userId}`);
}

module.exports = {
  processForecastJob,
};
