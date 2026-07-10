const cron = require('node-cron');
const logger = require('../config/logger');
const prisma = require('../config/db');
const { forecastQueue } = require('./queues/forecast.queue');
const { processRenewalSweep } = require('./processors/renewalSweep.processor');

/**
 * Initializes all cron jobs.
 * This should only be called from the worker process.
 */
function initScheduler() {
  logger.info('Initializing scheduled cron jobs...');

  // 1. Forecast Recompute (Nightly at 00:00 UTC)
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running nightly forecast recompute cron job...');
    try {
      // Fetch all active users
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true }
      });
      
      logger.info(`Enqueuing forecast jobs for ${users.length} active users.`);

      const jobs = users.map(u => ({
        name: 'compute',
        data: { userId: u.id },
        opts: { jobId: `nightly:forecast:${u.id}:${Date.now()}` }
      }));

      // Add jobs in bulk for efficiency
      await forecastQueue.addBulk(jobs);
      
      logger.info('Finished enqueuing nightly forecast jobs.');
    } catch (error) {
      logger.error(`Error in nightly forecast cron job: ${error.message}`, { error });
    }
  }, {
    timezone: 'UTC'
  });

  // Daily Renewal Sweep Cron - 6:00 AM UTC
  cron.schedule('0 6 * * *', async () => {
    logger.info('Starting daily recurring renewal sweep cron job');
    try {
      await processRenewalSweep();
      logger.info('Completed daily recurring renewal sweep cron job');
    } catch (error) {
      logger.error('Error running daily recurring renewal sweep cron job:', error);
    }
  });
}

module.exports = {
  initScheduler,
};
