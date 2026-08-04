const { Queue } = require('bullmq');
const { redis } = require('../../config/redis');

const notificationQueue = new Queue('notificationQueue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 100 },
  },
});

module.exports = {
  notificationQueue,
};
