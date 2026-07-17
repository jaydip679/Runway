const { Queue } = require('bullmq');

const connection = {
  url: process.env.REDIS_URL,
};

const exportQueue = new Queue('pdf-export', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  }
});

/**
 * Enqueue a PDF export job
 * @param {string} userId - ID of the user requesting the export
 * @param {Object} filters - filters { startDate, endDate, accountId, categoryId }
 */
const enqueueExportJob = async (userId, filters) => {
  return await exportQueue.add('export-pdf', {
    userId,
    filters
  });
};

module.exports = {
  exportQueue,
  enqueueExportJob,
};
