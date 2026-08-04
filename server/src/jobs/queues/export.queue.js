const { Queue } = require('bullmq');
const { redis } = require('../../config/redis');

const exportQueue = new Queue('pdf-export', {
  connection: redis,
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

const pdfCleanupQueue = new Queue('pdf-cleanup', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: true,
  }
});

/**
 * Enqueue a PDF export job
 * @param {string} userId - ID of the user requesting the export
 * @param {Object} filters - filters { startDate, endDate, accountId, categoryId }
 */
const enqueueExportJob = async (userId, filters) => {
  // Prevent duplicate jobs for the same user and identical filters
  const activeJobs = await exportQueue.getJobs(['active', 'waiting', 'delayed']);
  
  for (const job of activeJobs) {
    if (job.data.userId === userId && JSON.stringify(job.data.filters) === JSON.stringify(filters)) {
      return job; // Return existing job instead of queuing a new one
    }
  }

  return await exportQueue.add('export-pdf', {
    userId,
    filters
  });
};

const enqueuePdfCleanup = async (filename, delayMs = 10 * 60 * 1000) => {
  return await pdfCleanupQueue.add('cleanup-pdf', { filename }, { delay: delayMs });
};

module.exports = {
  exportQueue,
  pdfCleanupQueue,
  enqueueExportJob,
  enqueuePdfCleanup,
};
