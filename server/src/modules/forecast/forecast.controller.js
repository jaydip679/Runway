const prisma = require('../../config/db');
const { sendSuccess } = require('../../common/utils/apiResponse');
const catchAsync = require('../../common/utils/catchAsync');

const forecastService = require('./forecast.service');

/**
 * GET /api/v1/forecast
 * Retrieves the user's 60-day forecast snapshot
 */
const getForecast = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await forecastService.getForecast(userId);
  return sendSuccess(res, result);
});

/**
 * GET /api/v1/forecast/summary
 * Retrieves summary metrics for Day 7, Day 30, and Day 60
 */
const getForecastSummary = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const summary = await forecastService.getForecastSummary(userId);
  
  // Keep REST response shape consistent with previous mapping
  return sendSuccess(res, {
    ready: summary.ready,
    day7: summary.day7Balance,
    day30: summary.day30Balance,
    day60: summary.day60Balance
  });
});

module.exports = {
  getForecast,
  getForecastSummary
};
