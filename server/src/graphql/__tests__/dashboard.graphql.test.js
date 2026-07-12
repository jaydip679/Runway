const dashboardResolver = require('../resolvers/dashboard.resolver');
const fs = require('fs');
const path = require('path');

jest.mock('../../modules/accounts/account.service');
jest.mock('../../modules/forecast/forecast.service');
jest.mock('../../modules/recurring/recurring.service');
jest.mock('../../modules/alerts/alerts.service');

const accountsService = require('../../modules/accounts/account.service');
const forecastService = require('../../modules/forecast/forecast.service');
const recurringService = require('../../modules/recurring/recurring.service');
const alertsService = require('../../modules/alerts/alerts.service');

describe('GraphQL Dashboard API', () => {
  const mockUserId = '123-abc';
  const req = { user: { id: mockUserId } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return dashboard data matching REST responses', async () => {
    // Mock service responses exactly as REST would return
    accountsService.getAccounts.mockResolvedValue({
      accounts: [{ id: 'acc1', name: 'Test Account', type: 'CHECKING', currentBalance: 1000, currency: 'USD' }]
    });

    forecastService.getForecastSummary.mockResolvedValue({
      ready: true,
      day7Balance: 1100,
      day30Balance: 1200,
      day60Balance: 1300,
      fullSeries: []
    });

    recurringService.listRecurring.mockResolvedValue([
      { id: 'rec1', name: 'Netflix', amount: 15, type: 'EXPENSE', intervalUnit: 'MONTH', intervalCount: 1, nextOccurrenceDate: '2026-08-01T00:00:00.000Z', status: 'CONFIRMED' },
      { id: 'rec2', name: 'Spotify', amount: 10, status: 'PENDING_CONFIRMATION' }
    ]);

    alertsService.getAlerts.mockResolvedValue({
      alerts: [{ id: 'al1', type: 'LOW_BALANCE', message: 'Balance low', severity: 'HIGH', createdAt: '2026-07-11T00:00:00.000Z', isRead: false }]
    });

    const result = await dashboardResolver.dashboard({}, req);

    expect(accountsService.getAccounts).toHaveBeenCalledWith(mockUserId, 1, 100);
    expect(forecastService.getForecastSummary).toHaveBeenCalledWith(mockUserId);
    expect(recurringService.listRecurring).toHaveBeenCalledWith(mockUserId);
    expect(alertsService.getAlerts).toHaveBeenCalledWith(mockUserId, { isRead: false, limit: 5 });

    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0].name).toBe('Test Account');
    expect(result.forecastSummary.ready).toBe(true);
    expect(result.forecastSummary.day7Balance).toBe(1100);
    // Should filter only confirmed and limit to 5
    expect(result.upcomingRecurringCommitments).toHaveLength(1);
    expect(result.upcomingRecurringCommitments[0].name).toBe('Netflix');
    expect(result.unreadAlerts).toHaveLength(1);
  });
  
  it('should ensure no direct prisma calls in resolver file', () => {
    const resolverPath = path.join(__dirname, '../resolvers/dashboard.resolver.js');
    const resolverContent = fs.readFileSync(resolverPath, 'utf8');
    
    // Check for direct prisma imports or calls
    expect(resolverContent).not.toMatch(/require\(['"]\.\.\/\.\.\/config\/db['"]\)/);
    expect(resolverContent).not.toMatch(/prisma\./);
  });
});

