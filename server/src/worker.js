const logger = require('./config/logger');
const prisma = require('./config/db');
const { redis } = require('./config/redis');
const { initSentry, Sentry } = require('./config/sentry');

// Initialize Sentry early
initSentry('worker');

const os = require('os');

const attachSentryToWorker = (worker) => {
  if (!Sentry || typeof Sentry.captureException !== 'function' || !worker) return;
  
  worker.on('failed', (job, err) => {
    Sentry.withScope((scope) => {
      scope.setTag('queue', worker.name);
      scope.setTag('worker_hostname', os.hostname());
      
      if (job) {
        scope.setContext('Job Details', {
          id: job.id,
          name: job.name,
          attemptsMade: job.attemptsMade,
          totalAttemptsConfigured: job.opts?.attempts || 1,
          // Only log payload keys to avoid leaking sensitive data
          payloadKeys: job.data ? Object.keys(job.data) : [],
        });
      }
      
      Sentry.captureException(err);
    });
  });
};


logger.info(`Runway background worker started in ${process.env.NODE_ENV} mode`);

let csvImportWorker, forecastWorker, recurringDetectionWorker, notificationWorker, exportWorker, pdfCleanupWorker;

(async () => {
  try {
    // Initialize workers dynamically
    const csvModule = require('./jobs/queues/csvImport.worker');
    csvImportWorker = csvModule.csvImportWorker;
    attachSentryToWorker(csvImportWorker);
    logger.info('CSV Import worker initialized');

    const forecastModule = require('./jobs/queues/forecast.worker');
    forecastWorker = forecastModule.forecastWorker;
    attachSentryToWorker(forecastWorker);
    logger.info('Forecast worker initialized');

    const recurringModule = require('./jobs/queues/recurringDetection.worker');
    recurringDetectionWorker = recurringModule.recurringDetectionWorker;
    attachSentryToWorker(recurringDetectionWorker);
    logger.info('Recurring Detection worker initialized');

    const notificationModule = require('./jobs/queues/notification.worker');
    notificationWorker = notificationModule.notificationWorker;
    attachSentryToWorker(notificationWorker);
    logger.info('Notification worker initialized');

    const exportModule = require('./jobs/queues/export.worker');
    exportWorker = exportModule.exportWorker;
    pdfCleanupWorker = exportModule.pdfCleanupWorker;
    attachSentryToWorker(exportWorker);
    attachSentryToWorker(pdfCleanupWorker);
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
