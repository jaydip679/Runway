const logger = require('./config/logger');
const prisma = require('./config/db');
const redis = require('./config/redis');

logger.info('Worker started');

const shutdown = async () => {
  logger.info('Worker shutting down gracefully...');
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
