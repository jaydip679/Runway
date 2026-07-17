const { getCategoryBreakdown } = require('./analytics.service');
const prisma = require('../../config/db');

jest.mock('../../config/db', () => ({
  transaction: { groupBy: jest.fn() },
  category: { findMany: jest.fn() },
}));

describe('Analytics Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCategoryBreakdown', () => {
    it('should aggregate transactions by category and calculate percentages', async () => {
      prisma.transaction.groupBy.mockResolvedValue([
        { categoryId: 'cat1', _sum: { amount: 150 } },
        { categoryId: 'cat2', _sum: { amount: 50 } },
      ]);
      
      prisma.category.findMany.mockResolvedValue([
        { id: 'cat1', name: 'Food', icon: '🍔' },
        { id: 'cat2', name: 'Transport', icon: '🚗' },
      ]);

      const result = await getCategoryBreakdown('user1', { startDate: '2023-01-01', endDate: '2023-12-31' });

      expect(result.length).toBe(2);
      expect(result[0].percentage).toBe(75); // 150 / 200
      expect(result[1].percentage).toBe(25); // 50 / 200
      expect(result[0].category.name).toBe('Food');
    });
  });
});
