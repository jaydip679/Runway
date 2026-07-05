const { Queue } = require('bullmq');
const env = require('../../config/env');

const connection = {
  url: env.REDIS_URL,
};

const notificationQueue = new Queue('notificationQueue', {
  connection,
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
