const logger = require('../../config/logger');

/**
 * Stub for forecastQueue.
 * In Phase 5, this will be implemented with BullMQ to asynchronously compute forecasts.
 */
const enqueueForecastRecompute = async (userId) => {
  logger.info(`[Forecast Queue Stub] Enqueued forecast recompute for userId: ${userId}`);
  // No-op for now.
};

module.exports = {
  enqueueForecastRecompute,
};
