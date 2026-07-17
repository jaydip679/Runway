const forecastService = require('./forecast.service');
const prisma = require('../../config/db');
const { computeForecast, isOccurrenceDay } = require('./forecastEngine');

jest.mock('../../config/db', () => ({
  forecastSnapshot: { findMany: jest.fn(), findFirst: jest.fn() },
  recurringCommitment: { findMany: jest.fn() },
  account: { aggregate: jest.fn() },
  transaction: { findMany: jest.fn() }
}));

describe('Forecast Service - Phase 13', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getForecastInsights', () => {
    it('should generate rule-based insights', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      // Mock snapshots to trigger LOW_BALANCE
      prisma.forecastSnapshot.findMany.mockResolvedValue([
        { forecastDate: new Date(), projectedBalance: 600 },
        { forecastDate: nextWeek, projectedBalance: 300 }, // dip
        { forecastDate: new Date(nextWeek.getTime() + 86400000), projectedBalance: 200 },
        { forecastDate: new Date(nextWeek.getTime() + 172800000), projectedBalance: 100 },
      ]);

      // Mock recurring commitments for BIGGEST_EXPENSE
      prisma.recurringCommitment.findMany.mockResolvedValue([
        { name: 'Rent', amount: 1500, type: 'EXPENSE', nextOccurrenceDate: nextWeek, intervalUnit: 'MONTHLY', intervalCount: 1 }
      ]);

      const insights = await forecastService.getForecastInsights('user1');
      
      expect(insights.length).toBeGreaterThan(0);
      
      const biggestExpenseInsight = insights.find(i => i.type === 'BIGGEST_EXPENSE');
      expect(biggestExpenseInsight).toBeDefined();
      expect(biggestExpenseInsight.message).toMatch(/Rent/);
      
      const lowBalanceInsight = insights.find(i => i.type === 'LOW_BALANCE');
      expect(lowBalanceInsight).toBeDefined();
      expect(lowBalanceInsight.priority).toBe('WARNING');
    });
  });
});
