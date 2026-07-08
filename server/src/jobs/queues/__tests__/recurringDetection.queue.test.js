const { processRecurringDetection } = require('../recurringDetection.queue');
const prisma = require('../../../config/db');
const { detect } = require('../../../modules/recurring/detectionAlgorithm');

jest.mock('../../../config/db', () => require('../../../config/__mocks__/db'));
jest.mock('bullmq');
jest.mock('../../../config/redis', () => ({}));
jest.mock('../../../modules/recurring/detectionAlgorithm');

describe('recurringDetection.queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const job = { data: { userId: 'user1' } };

  it('does nothing if no transactions are found in the last 90 days', async () => {
    prisma.transaction.findMany.mockResolvedValue([]);
    await processRecurringDetection(job);
    expect(detect).not.toHaveBeenCalled();
    expect(prisma.recurringCommitment.create).not.toHaveBeenCalled();
  });

  it('skips candidates that were recently dismissed (within 90 days)', async () => {
    prisma.transaction.findMany.mockResolvedValue([{ id: 'tx1' }]);
    detect.mockReturnValue([
      { groupSignature: 'sig1', nextOccurrenceDate: new Date(), confidenceScore: 0.8 }
    ]);

    // Mock findFirst for recently dismissed to return a record
    prisma.recurringCommitment.findFirst.mockResolvedValueOnce({ id: 'dismissed1', status: 'DISMISSED' });

    await processRecurringDetection(job);

    expect(prisma.recurringCommitment.findFirst).toHaveBeenCalledTimes(1); // Only the dismissed check
    expect(prisma.recurringCommitment.update).not.toHaveBeenCalled();
    expect(prisma.recurringCommitment.create).not.toHaveBeenCalled();
  });

  it('creates new candidate if it was dismissed MORE than 90 days ago', async () => {
    prisma.transaction.findMany.mockResolvedValue([{ id: 'tx1' }]);
    detect.mockReturnValue([
      { groupSignature: 'sig1', nextOccurrenceDate: new Date(), confidenceScore: 0.8, accountId: 'a', name: 'n', amount: '10', type: 'EXPENSE', intervalUnit: 'MONTHLY', intervalCount: 1, detectionSource: 'AUTO_DETECTED' }
    ]);

    // recently dismissed check -> returns null
    prisma.recurringCommitment.findFirst.mockResolvedValueOnce(null);
    // already confirmed check -> returns null
    prisma.recurringCommitment.findFirst.mockResolvedValueOnce(null);
    // existing pending check -> returns null
    prisma.recurringCommitment.findFirst.mockResolvedValueOnce(null);

    await processRecurringDetection(job);

    expect(prisma.recurringCommitment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'PENDING_CONFIRMATION',
        groupSignature: 'sig1'
      })
    }));
  });

  it('skips candidates that are already CONFIRMED', async () => {
    prisma.transaction.findMany.mockResolvedValue([{ id: 'tx1' }]);
    detect.mockReturnValue([{ groupSignature: 'sig1' }]);

    prisma.recurringCommitment.findFirst.mockResolvedValueOnce(null); // not recently dismissed
    prisma.recurringCommitment.findFirst.mockResolvedValueOnce({ id: 'confirmed1', status: 'CONFIRMED' });

    await processRecurringDetection(job);

    expect(prisma.recurringCommitment.findFirst).toHaveBeenCalledTimes(2);
    expect(prisma.recurringCommitment.update).not.toHaveBeenCalled();
    expect(prisma.recurringCommitment.create).not.toHaveBeenCalled();
  });

  it('updates existing PENDING_CONFIRMATION candidates instead of creating duplicates', async () => {
    prisma.transaction.findMany.mockResolvedValue([{ id: 'tx1' }]);
    const nextDate = new Date('2023-05-01');
    detect.mockReturnValue([{ groupSignature: 'sig1', nextOccurrenceDate: nextDate, confidenceScore: 0.9 }]);

    prisma.recurringCommitment.findFirst.mockResolvedValueOnce(null); // dismissed
    prisma.recurringCommitment.findFirst.mockResolvedValueOnce(null); // confirmed
    prisma.recurringCommitment.findFirst.mockResolvedValueOnce({ id: 'pending1', status: 'PENDING_CONFIRMATION' }); // pending

    await processRecurringDetection(job);

    expect(prisma.recurringCommitment.create).not.toHaveBeenCalled();
    expect(prisma.recurringCommitment.update).toHaveBeenCalledWith({
      where: { id: 'pending1' },
      data: { nextOccurrenceDate: nextDate, confidenceScore: 0.9 }
    });
  });
});
