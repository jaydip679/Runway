const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('../../config/redis');
const AppError = require('../errors/AppError');
const errorCodes = require('../errors/errorCodes');

const createRateLimiter = (options = {}) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
    }),
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    handler: (req, res, next) => {
      next(new AppError('Too many requests from this IP, please try again later.', 429, errorCodes.RATE_LIMIT_EXCEEDED));
    },
    ...options,
  });
};

module.exports = createRateLimiter;
