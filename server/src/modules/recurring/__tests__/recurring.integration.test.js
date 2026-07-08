const request = require('supertest');
const app = require('../../../app');
const prisma = require('../../../config/db');
const jwt = require('jsonwebtoken');
const env = require('../../../config/env');

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    ping: jest.fn().mockResolvedValue('PONG'),
    on: jest.fn(),
    quit: jest.fn()
  }));
});

jest.mock('../../../config/db', () => require('../../../config/__mocks__/db'));
jest.mock('../../../jobs/queues/forecast.queue', () => ({
  enqueueForecastRecompute: jest.fn()
}));

const { enqueueForecastRecompute } = require('../../../jobs/queues/forecast.queue');

describe('Recurring Commitments API', () => {
  let token;
  const userId = 'user-1';
  const accountId = 'account-1';

  beforeAll(() => {
    token = jwt.sign({ sub: userId, role: 'USER' }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/recurring', () => {
    it('returns a list of recurring commitments', async () => {
      prisma.recurringCommitment.findMany.mockResolvedValue([
        { id: 'rec-1', name: 'Netflix', status: 'CONFIRMED', account: { id: accountId, name: 'Bank' } }
      ]);

      const res = await request(app)
        .get('/api/v1/recurring')
        .set('Cookie', [`accessToken=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Netflix');
      expect(prisma.recurringCommitment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId, deletedAt: null })
        })
      );
    });
  });

  describe('POST /api/v1/recurring', () => {
    it('creates a manual recurring commitment and returns 201', async () => {
      prisma.account.findUnique.mockResolvedValue({ id: accountId, userId, deletedAt: null });
      prisma.recurringCommitment.create.mockResolvedValue({ id: 'rec-2', name: 'Gym', status: 'CONFIRMED' });

      const res = await request(app)
        .post('/api/v1/recurring')
        .set('Cookie', [`accessToken=${token}`])
        .send({
          accountId,
          name: 'Gym',
          amount: 50,
          type: 'EXPENSE',
          intervalUnit: 'MONTHLY',
          intervalCount: 1,
          nextOccurrenceDate: new Date().toISOString()
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Gym');
      expect(enqueueForecastRecompute).toHaveBeenCalledWith(userId);
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('returns 404 if account not found or not owned', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/recurring')
        .set('Cookie', [`accessToken=${token}`])
        .send({
          accountId,
          name: 'Gym',
          amount: 50,
          type: 'EXPENSE',
          intervalUnit: 'MONTHLY',
          intervalCount: 1,
          nextOccurrenceDate: new Date().toISOString()
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ACCOUNT_NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/recurring/:id', () => {
    it('updates a commitment without confirming it if it was pending', async () => {
      prisma.recurringCommitment.findUnique.mockResolvedValue({ id: 'rec-1', userId, deletedAt: null, status: 'PENDING_CONFIRMATION' });
      prisma.recurringCommitment.update.mockResolvedValue({ id: 'rec-1', name: 'Updated Gym', status: 'PENDING_CONFIRMATION' });

      const res = await request(app)
        .patch('/api/v1/recurring/rec-1')
        .set('Cookie', [`accessToken=${token}`])
        .send({ name: 'Updated Gym' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Gym');
      expect(res.body.data.status).toBe('PENDING_CONFIRMATION');
    });
  });

  describe('POST /api/v1/recurring/:id/confirm', () => {
    it('confirms a pending commitment', async () => {
      prisma.recurringCommitment.findUnique.mockResolvedValue({ id: 'rec-1', userId, deletedAt: null, status: 'PENDING_CONFIRMATION' });
      prisma.recurringCommitment.update.mockResolvedValue({ id: 'rec-1', status: 'CONFIRMED' });

      const res = await request(app)
        .post('/api/v1/recurring/rec-1/confirm')
        .set('Cookie', [`accessToken=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CONFIRMED');
      expect(enqueueForecastRecompute).toHaveBeenCalledWith(userId);
    });

    it('returns 422 if already confirmed', async () => {
      prisma.recurringCommitment.findUnique.mockResolvedValue({ id: 'rec-1', userId, deletedAt: null, status: 'CONFIRMED' });

      const res = await request(app)
        .post('/api/v1/recurring/rec-1/confirm')
        .set('Cookie', [`accessToken=${token}`]);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('RECURRING_INVALID_STATUS_TRANSITION');
    });
  });

  describe('POST /api/v1/recurring/:id/dismiss', () => {
    it('dismisses a pending commitment', async () => {
      prisma.recurringCommitment.findUnique.mockResolvedValue({ id: 'rec-1', userId, deletedAt: null, status: 'PENDING_CONFIRMATION' });
      prisma.recurringCommitment.update.mockResolvedValue({ id: 'rec-1', status: 'DISMISSED' });

      const res = await request(app)
        .post('/api/v1/recurring/rec-1/dismiss')
        .set('Cookie', [`accessToken=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('DISMISSED');
    });
  });

  describe('DELETE /api/v1/recurring/:id', () => {
    it('soft deletes a commitment', async () => {
      prisma.recurringCommitment.findUnique.mockResolvedValue({ id: 'rec-1', userId, deletedAt: null });
      prisma.recurringCommitment.update.mockResolvedValue({ id: 'rec-1', deletedAt: new Date() });

      const res = await request(app)
        .delete('/api/v1/recurring/rec-1')
        .set('Cookie', [`accessToken=${token}`]);

      expect(res.status).toBe(204);
      expect(prisma.recurringCommitment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { deletedAt: expect.any(Date) } })
      );
    });
  });
});
