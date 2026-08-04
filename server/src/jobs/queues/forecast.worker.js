const { Worker } = require('bullmq');
const { createRedisConnection } = require('../../config/redis');
const logger = require('../../config/logger');
const { processForecastJob } = require('../processors/forecast.processor');

const QUEUE_NAME = 'forecastQueue';

const forecastWorker = new Worker(QUEUE_NAME, processForecastJob, {
  connection: createRedisConnection(),
  concurrency: 5,
});

forecastWorker.on('failed', (job, err) => {
  logger.error(`Forecast job ${job?.id} failed: ${err.message}`, { error: err });
});

forecastWorker.on('completed', (job) => {
  logger.info(`Forecast job ${job.id} completed successfully.`);
});

module.exports = {
  forecastWorker,
};
