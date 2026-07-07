const logger = require('./config/logger');
const prisma = require('./config/db');
const redis = require('./config/redis');

const { csvImportWorker } = require('./jobs/queues/csvImport.queue');

logger.info('Worker started');

const shutdown = async () => {
  logger.info('Worker shutting down gracefully...');
  await csvImportWorker.close();
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
