const logger = require('./config/logger');
const prisma = require('./config/db');
const { redis } = require('./config/redis');

const { csvImportWorker } = require('./jobs/queues/csvImport.worker');
const { forecastWorker } = require('./jobs/queues/forecast.worker');
const { recurringDetectionWorker } = require('./jobs/queues/recurringDetection.worker');
const { notificationWorker } = require('./jobs/queues/notification.worker');
const { exportWorker, pdfCleanupWorker } = require('./jobs/queues/export.worker');
const { initScheduler } = require('./jobs/scheduler');

logger.info('Runway background worker started');
logger.info('CSV Import worker initialized');
logger.info('Forecast worker initialized');
logger.info('Recurring Detection worker initialized');
logger.info('Notification worker initialized');
logger.info('Export worker initialized');
logger.info('PDF Cleanup worker initialized');
initScheduler();
logger.info('Scheduler initialized for recurring cron jobs');

const shutdown = async () => {
  logger.info('SIGINT/SIGTERM received — starting graceful shutdown...');
  
  await csvImportWorker.close();
  logger.info('CSV Import worker closed');
  
  await forecastWorker.close();
  logger.info('Forecast worker closed');
  
  await recurringDetectionWorker.close();
  logger.info('Recurring Detection worker closed');
  
  try {
    await notificationWorker.close();
  } catch (err) {
    logger.error('Error closing notification worker', err);
  }
  
  try {
    await exportWorker.close();
    await pdfCleanupWorker.close();
  } catch (err) {
    logger.error('Error closing export workers', err);
  }
  
  try {
    await prisma.$disconnect();
    logger.info('PostgreSQL connection closed');
  } catch (err) {
    logger.error('Error disconnecting PostgreSQL', err);
  }
  
  try {
    await redis.quit();
    logger.info('Redis connection closed');
  } catch (err) {
    logger.error('Error disconnecting Redis', err);
  }

  logger.info('Graceful shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
