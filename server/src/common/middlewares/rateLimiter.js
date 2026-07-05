const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const redis = require('../../config/redis');

const createRateLimiter = (options = {}) => {
  // Bypass rate limiting entirely during tests to avoid 429 errors and DOUBLE_COUNT warnings
  if (process.env.NODE_ENV === 'test') {
    return (req, res, next) => next();
  }

  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // default 15 min
    max: options.max || 100,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: options.prefix || 'rl:',
    }),
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: options.message || 'Too many requests, please try again later.'
      }
    }
  });
};

module.exports = createRateLimiter;
