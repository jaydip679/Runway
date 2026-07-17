const recurringService = require('./recurring.service');
const prisma = require('../../config/db');
const { subDays } = require('date-fns');

jest.mock('../../config/db', () => ({
  recurringCommitment: {
    findMany: jest.fn(),
    update: jest.fn()
  },
  recurringOccurrence: {
    upsert: jest.fn(),
    updateMany: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn()
  },
  transaction: {
    create: jest.fn()
  }
}));

describe('Recurring Service - Sync Occurrences', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should generate pending occurrences for due commitments', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Simulate a commitment that was due yesterday
    const pastDue = new Date(today);
    pastDue.setDate(pastDue.getDate() - 1);

    prisma.recurringCommitment.findMany.mockResolvedValue([
      { 
        id: 'commit1', 
        userId: 'user1', 
        status: 'CONFIRMED',
        amount: 50,
        intervalUnit: 'MONTHLY',
        intervalCount: 1,
        nextOccurrenceDate: pastDue
      }
    ]);

    await recurringService.syncOccurrences('user1');

    expect(prisma.recurringOccurrence.upsert).toHaveBeenCalled();
    expect(prisma.recurringOccurrence.upsert.mock.calls[0][0].create.status).toBe('PENDING');
    
    // It should advance the nextOccurrenceDate by 1 month
    expect(prisma.recurringCommitment.update).toHaveBeenCalled();
    const updateCall = prisma.recurringCommitment.update.mock.calls[0][0];
    expect(updateCall.where.id).toBe('commit1');
    expect(updateCall.data.nextOccurrenceDate.getTime()).toBeGreaterThan(pastDue.getTime());
  });
});
