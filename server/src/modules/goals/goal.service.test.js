const { calculateGoalAffordability } = require('./goal.service');
const prisma = require('../../config/db');

jest.mock('../../config/db', () => ({
  account: { aggregate: jest.fn() },
  recurringCommitment: { findMany: jest.fn() },
  transaction: { findMany: jest.fn() },
  forecastSnapshot: { findMany: jest.fn() },
}));

describe('calculateGoalAffordability', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should compute forecast on demand for targetDate > 60 days', async () => {
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + 90); // 90 days away

    const goal = {
      id: '1',
      targetAmount: 5000,
      targetDate: targetDate,
      currentAmount: 0,
      linkedAccounts: []
    };

    prisma.account.aggregate.mockResolvedValue({ _sum: { currentBalance: 10000 } });
    prisma.recurringCommitment.findMany.mockResolvedValue([]);
    prisma.transaction.findMany.mockResolvedValue([]);

    const result = await calculateGoalAffordability('user1', goal);

    // Initial balance is 10000, no expenses -> minimum is 10000
    expect(result.minProjectedBalance).toBe(10000);
    expect(result.isAchievable).toBe(true);
    expect(prisma.account.aggregate).toHaveBeenCalled(); // verified it ran on-demand
  });
});
