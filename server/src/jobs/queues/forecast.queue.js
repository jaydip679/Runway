const { Queue, Worker } = require('bullmq');
const redis = require('../../config/redis');
const logger = require('../../config/logger');
const { processForecastJob } = require('../processors/forecast.processor');

const QUEUE_NAME = 'forecastQueue';

const forecastQueue = new Queue(QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

const forecastWorker = new Worker(QUEUE_NAME, processForecastJob, {
  connection: redis,
  concurrency: 5,
});

forecastWorker.on('failed', (job, err) => {
  logger.error(`Forecast job ${job?.id} failed: ${err.message}`, { error: err });
});

forecastWorker.on('completed', (job) => {
  logger.info(`Forecast job ${job.id} completed successfully.`);
});

/**
 * Debounced enqueue function.
 * Sets a flag in redis `debounce:forecast:{userId}`.
 * If the flag already exists, it skips enqueueing.
 */
const enqueueForecastRecompute = async (userId) => {
  try {
    const lockKey = `debounce:forecast:${userId}`;
    // 5 seconds debounce window
    const set = await redis.set(lockKey, '1', 'NX', 'EX', 5);
    
    if (set) {
      await forecastQueue.add('compute', { userId }, { jobId: `forecast:${userId}:${Date.now()}` });
      logger.info(`[Forecast Queue] Enqueued forecast recompute for userId: ${userId}`);
    } else {
      logger.debug(`[Forecast Queue] Skipped enqueue for userId: ${userId} (debounced)`);
    }
  } catch (error) {
    logger.error(`Error enqueueing forecast for user ${userId}: ${error.message}`);
  }
};

module.exports = {
  forecastQueue,
  forecastWorker,
  enqueueForecastRecompute,
};
