const { Worker } = require('bullmq');
const { createRedisConnection } = require('../../config/redis');
const { processNotificationJob } = require('../processors/notification.processor');

const notificationWorker = new Worker('notificationQueue', processNotificationJob, { connection: createRedisConnection() });

notificationWorker.on('failed', (job, err) => {
  console.error(`[notificationWorker] Job ${job?.id} failed:`, err);
});

module.exports = {
  notificationWorker,
};
