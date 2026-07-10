const { Queue, Worker } = require('bullmq');
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

const { processNotificationJob } = require('../processors/notification.processor');

const notificationWorker = new Worker('notificationQueue', processNotificationJob, { connection });

notificationWorker.on('failed', (job, err) => {
  console.error(`[notificationWorker] Job ${job.id} failed:`, err);
});

module.exports = {
  notificationQueue,
  notificationWorker,
};
