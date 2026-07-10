const logger = require('./config/logger');
const prisma = require('./config/db');
const redis = require('./config/redis');

const { csvImportWorker } = require('./jobs/queues/csvImport.queue');
const { forecastWorker } = require('./jobs/queues/forecast.queue');
const { recurringDetectionWorker } = require('./jobs/queues/recurringDetection.queue');
const { notificationWorker } = require('./jobs/queues/notification.queue');
const { initScheduler } = require('./jobs/scheduler');

logger.info('Worker started');
initScheduler();

const shutdown = async () => {
  logger.info('Worker shutting down gracefully...');
  await csvImportWorker.close();
  await forecastWorker.close();
  await recurringDetectionWorker.close();
  await notificationWorker.close();
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
