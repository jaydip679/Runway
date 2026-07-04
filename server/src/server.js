const env = require('./config/env');
const logger = require('./config/logger');
const prisma = require('./config/db');
const redis = require('./config/redis');
const app = require('./app');

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
