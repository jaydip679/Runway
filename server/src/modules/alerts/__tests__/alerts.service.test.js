const prisma = require('../../../config/db');
const { createAlertIfNotDuplicate, getAlerts, markAlertRead } = require('../alerts.service');
const { notificationQueue } = require('../../../jobs/queues/notification.queue');

jest.mock('../../../config/db', () => ({
  alert: {
    create: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
}));

jest.mock('../../../jobs/queues/notification.queue', () => ({
  notificationQueue: {
    add: jest.fn(),
  },
}));

describe('Alerts Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAlertIfNotDuplicate', () => {
    it('should create an alert and enqueue a notification', async () => {
      const mockAlert = { id: 'alert-1', userId: 'user-1' };
      prisma.alert.create.mockResolvedValue(mockAlert);

      const params = {
        userId: 'user-1',
        type: 'LOW_BALANCE_PREDICTED',
        relatedEntityType: 'FORECAST',
        relatedEntityId: 'f-1',
        relevantDate: new Date(),
        message: 'Low balance',
        severity: 'WARNING',
      };

      const result = await createAlertIfNotDuplicate(params);

      expect(result).toEqual(mockAlert);
      expect(prisma.alert.create).toHaveBeenCalledWith({ data: params });
      expect(notificationQueue.add).toHaveBeenCalledWith('sendAlertEmail', {
        userId: 'user-1',
        type: 'LOW_BALANCE_PREDICTED',
        message: 'Low balance',
      });
    });

    it('should return null on unique constraint violation (P2002)', async () => {
      const error = new Error('Constraint violation');
      error.code = 'P2002';
      prisma.alert.create.mockRejectedValue(error);

      const result = await createAlertIfNotDuplicate({
        userId: 'user-1',
        type: 'LOW_BALANCE_PREDICTED',
      });

      expect(result).toBeNull();
      expect(notificationQueue.add).not.toHaveBeenCalled();
    });

    it('should throw other errors', async () => {
      const error = new Error('DB Error');
      prisma.alert.create.mockRejectedValue(error);

      await expect(createAlertIfNotDuplicate({
        userId: 'user-1',
      })).rejects.toThrow('DB Error');
    });
  });

  describe('getAlerts', () => {
    it('should fetch alerts and return nextCursor', async () => {
      const mockAlerts = [
        { id: '1', message: 'a' },
        { id: '2', message: 'b' },
        { id: '3', message: 'c' },
      ];
      prisma.alert.findMany.mockResolvedValue([...mockAlerts]);

      const result = await getAlerts('user-1', { limit: 2 });
      
      expect(prisma.alert.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 'user-1' },
        take: 3,
        orderBy: { createdAt: 'desc' },
      }));

      expect(result.alerts).toHaveLength(2);
      expect(result.nextCursor).toBe('3');
    });
  });

  describe('markAlertRead', () => {
    it('should return true if updated', async () => {
      prisma.alert.updateMany.mockResolvedValue({ count: 1 });
      const result = await markAlertRead('user-1', 'alert-1');
      expect(result).toBe(true);
      expect(prisma.alert.updateMany).toHaveBeenCalledWith({
        where: { id: 'alert-1', userId: 'user-1' },
        data: { isRead: true },
      });
    });

    it('should return false if no rows updated', async () => {
      prisma.alert.updateMany.mockResolvedValue({ count: 0 });
      const result = await markAlertRead('user-1', 'alert-1');
      expect(result).toBe(false);
    });
  });
});
