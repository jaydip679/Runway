const accountsService = require('../../modules/accounts/account.service');
const forecastService = require('../../modules/forecast/forecast.service');
const { listRecurring, syncOccurrences } = require('../../modules/recurring/recurring.service');
const alertsService = require('../../modules/alerts/alerts.service');

const dashboardResolver = {
  dashboard: async (args, req) => {
    const userId = req.user.id;

    // Sync occurrences first
    await syncOccurrences(userId);

    // Accounts
    const accountsResult = await accountsService.getAccounts(userId, 1, 100);
    const accounts = accountsResult.accounts;

    // Forecast Summary
    const forecastSummary = await forecastService.getForecastSummary(userId);

    // Upcoming Recurring Commitments
    // get all confirmed, slice first 5
    const allRecurring = await recurringService.listRecurring(userId);
    const upcomingRecurringCommitments = allRecurring
      .filter(c => c.status === 'CONFIRMED')
      .slice(0, 5);

    // Unread Alerts
    const alertsResult = await alertsService.getAlerts(userId, { isRead: false, limit: 5 });
    const unreadAlerts = alertsResult.alerts;

    return {
      accounts,
      forecastSummary: {
        ready: forecastSummary.ready,
        day7Balance: forecastSummary.day7Balance,
        day30Balance: forecastSummary.day30Balance,
        day60Balance: forecastSummary.day60Balance,
        fullSeries: forecastSummary.fullSeries || []
      },
      upcomingRecurringCommitments,
      unreadAlerts,
    };
  }
};

module.exports = dashboardResolver;
