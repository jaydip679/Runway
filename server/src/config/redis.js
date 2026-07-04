const Redis = require('ioredis');
const env = require('./env');

const redis = new Redis(env.REDIS_URL, {
  retryStrategy: (times) => {
    if (times >= 10) {
      return null;
    }
    return Math.min(times * 1000, 5000);
  },
  maxRetriesPerRequest: null,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redis.on('ready', () => {
  console.log('Redis connected and ready');
});

module.exports = redis;
