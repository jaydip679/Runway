const { Queue } = require('bullmq');
const { redis } = require('../../config/redis');

const csvImportQueue = new Queue('csvImportQueue', { connection: redis });

module.exports = {
  csvImportQueue
};


