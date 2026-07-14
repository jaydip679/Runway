const env = require('./config/env');
const logger = require('./config/logger');
const prisma = require('./config/db');
const redis = require('./config/redis');
const app = require('./app');

const server = app.listen(env.PORT, () => {
  logger.info(`Runway server running on port ${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`Health check: http://localhost:${env.PORT}/health`);
  logger.info(`Swagger UI:   http://localhost:${env.PORT}/api-docs`);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('SIGINT/SIGTERM received — starting graceful shutdown...');
  server.close(async () => {
    logger.info('HTTP server closed — no more new connections accepted');
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
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
