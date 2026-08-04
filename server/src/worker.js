const logger = require('./config/logger');
const prisma = require('./config/db');
const { redis } = require('./config/redis');

logger.info(`Runway background worker started in ${process.env.NODE_ENV} mode`);

let csvImportWorker, forecastWorker, recurringDetectionWorker, notificationWorker, exportWorker, pdfCleanupWorker;

(async () => {
  try {
    // Initialize workers dynamically
    const csvModule = require('./jobs/queues/csvImport.worker');
    csvImportWorker = csvModule.csvImportWorker;
    logger.info('CSV Import worker initialized');

    const forecastModule = require('./jobs/queues/forecast.worker');
    forecastWorker = forecastModule.forecastWorker;
    logger.info('Forecast worker initialized');

    const recurringModule = require('./jobs/queues/recurringDetection.worker');
    recurringDetectionWorker = recurringModule.recurringDetectionWorker;
    logger.info('Recurring Detection worker initialized');

    const notificationModule = require('./jobs/queues/notification.worker');
    notificationWorker = notificationModule.notificationWorker;
    logger.info('Notification worker initialized');

    const exportModule = require('./jobs/queues/export.worker');
    exportWorker = exportModule.exportWorker;
    pdfCleanupWorker = exportModule.pdfCleanupWorker;
    logger.info('Export worker initialized');
    logger.info('PDF Cleanup worker initialized');

    // 3. Initialize scheduler
    const { initScheduler } = require('./jobs/scheduler');
    initScheduler();
    logger.info('Scheduler initialized for recurring cron jobs');

  } catch (err) {
    logger.error('Worker startup error:', err);
    process.exit(1);
  }
})();

const shutdown = async () => {
  logger.info('SIGINT/SIGTERM received — starting graceful shutdown...');
  
  if (csvImportWorker) await csvImportWorker.close();
  logger.info('CSV Import worker closed');
  
  if (forecastWorker) await forecastWorker.close();
  logger.info('Forecast worker closed');
  
  if (recurringDetectionWorker) await recurringDetectionWorker.close();
  logger.info('Recurring Detection worker closed');
  
  try {
    if (notificationWorker) await notificationWorker.close();
  } catch (err) {
    logger.error('Error closing notification worker', err);
  }
  
  try {
    if (exportWorker) await exportWorker.close();
    if (pdfCleanupWorker) await pdfCleanupWorker.close();
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
