jest.mock('../../../config/db');
const prisma = require('../../../config/db');
const transactionService = require('../transaction.service');
const { encodeCursor } = require('../../../common/utils/pagination');

// Also mock bullmq queue since the service tries to import it
jest.mock('../../../jobs/queues/csvImport.queue', () => ({
  csvImportQueue: { add: jest.fn() }
}));

describe('Transactions Service', () => {
  const mockUserId = 'user-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new transaction successfully', async () => {
    // Mock the account existing
    prisma.account.findFirst.mockResolvedValue({ id: 'acc-1', userId: mockUserId, deletedAt: null });
    // Mock category existing and type matching
    prisma.category.findUnique.mockResolvedValue({ id: 'cat-1', type: 'EXPENSE', userId: mockUserId });
    
    const mockTx = {
      id: 'tx-1',
      description: 'Lunch',
      amount: '50',
      type: 'EXPENSE'
    };
    prisma.transaction.create.mockResolvedValue(mockTx);

    const result = await transactionService.createTransaction(mockUserId, {
      accountId: 'acc-1',
      categoryId: 'cat-1',
      amount: 50,
      type: 'EXPENSE',
      description: 'Lunch',
      transactionDate: new Date().toISOString()
    });

    expect(result.description).toBe('Lunch');
    expect(prisma.transaction.create).toHaveBeenCalledTimes(1);
  });

  it('should prevent mismatching category type', async () => {
    prisma.account.findFirst.mockResolvedValue({ id: 'acc-1', userId: mockUserId, deletedAt: null });
    // Category is EXPENSE but we pass INCOME
    prisma.category.findUnique.mockResolvedValue({ id: 'cat-1', type: 'EXPENSE', userId: mockUserId });

    await expect(transactionService.createTransaction(mockUserId, {
      accountId: 'acc-1',
      categoryId: 'cat-1',
      amount: 50,
      type: 'INCOME', // mismatch!
      description: 'Lunch',
      transactionDate: new Date().toISOString()
    })).rejects.toThrow('Category type mismatch');
  });

  it('should fetch transactions and return nextCursor', async () => {
    const mockTxs = [
      { id: 'tx-1', transactionDate: new Date('2023-10-01'), type: 'EXPENSE' },
      { id: 'tx-2', transactionDate: new Date('2023-10-01'), type: 'INCOME' }
    ];
    // Return a shallow copy so the service popping doesn't mutate our test data reference
    prisma.transaction.findMany.mockResolvedValue([...mockTxs]);

    const result = await transactionService.getTransactions(mockUserId, { limit: 1 });
    
    expect(result.data.length).toBe(1);
    expect(result.nextCursor).toBeDefined();
    // Verify cursor logic
    const expectedCursor = encodeCursor(mockTxs[1].transactionDate, mockTxs[1].id);
    expect(result.nextCursor).toBe(expectedCursor);
  });
});
