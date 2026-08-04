const { Queue } = require('bullmq');
const { redis } = require('../../config/redis');

const recurringDetectionQueue = new Queue('recurringDetectionQueue', { connection: redis });

module.exports = {
  recurringDetectionQueue
};
