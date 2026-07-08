const prisma = require('../../config/db');
const { sendSuccess } = require('../../common/utils/apiResponse');
const catchAsync = require('../../common/utils/catchAsync');

/**
 * GET /api/v1/forecast
 * Retrieves the user's 60-day forecast snapshot
 */
const getForecast = catchAsync(async (req, res) => {
  const userId = req.user.id;

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
    return sendSuccess(res, { ready: false, days: [] });
  }

  return sendSuccess(res, { ready: true, days: forecast });
});

/**
 * GET /api/v1/forecast/summary
 * Retrieves summary metrics for Day 7, Day 30, and Day 60
 */
const getForecastSummary = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
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
    return sendSuccess(res, { ready: false });
  }

  const getDayBalance = (dayIndex) => {
    // Array is 0-indexed, so day 7 is index 6.
    // However, if the forecast starts tomorrow vs today depending on run time,
    // it's safer to just take the length constraint or find the specific day.
    if (dayIndex < forecast.length) {
      return forecast[dayIndex].projectedBalance;
    }
    // Fallback to the last available if not enough days
    return forecast[forecast.length - 1].projectedBalance;
  };

  const summary = {
    ready: true,
    day7: getDayBalance(6),
    day30: getDayBalance(29),
    day60: getDayBalance(59),
  };

  return sendSuccess(res, summary);
});

module.exports = {
  getForecast,
  getForecastSummary
};
