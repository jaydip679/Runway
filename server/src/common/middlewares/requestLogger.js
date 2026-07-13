const logger = require('../../config/logger');
const metrics = require('../utils/metrics');

const requestLogger = (req, res, next) => {
  metrics.recordRequest();
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });
  next();
};

module.exports = requestLogger;
