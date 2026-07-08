const request = require('supertest');
const app = require('../../../app');
const prisma = require('../../../config/db');
const { Decimal } = require('@prisma/client/runtime/library');

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
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    addBulk: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
}));
jest.mock('../../../jobs/queues/forecast.queue', () => ({
  enqueueForecastRecompute: jest.fn(),
}));

describe('Forecast Integration Tests', () => {
  let token;
  let userId;
  let today;

  beforeAll(async () => {
    // We mock authenticate middleware to bypass actual login
    // but here we can just create a test user and get a real token if we don't want to mock middleware.
    // Or we mock it. The project standard uses real users in tests?
    // Let's create a user and log in.
    token = jwt.sign({ sub: userId, role: 'USER' }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    today = new Date();
    today.setHours(0, 0, 0, 0);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/forecast', () => {
    it('returns { ready: false, days: [] } when no forecast exists', async () => {
      prisma.forecastSnapshot.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/v1/forecast')
        .set('Cookie', [`accessToken=${token}`]);
      
      expect(res.status).toBe(200);
      expect(res.body.data.ready).toBe(false);
      expect(res.body.data.days).toEqual([]);
    });

    it('returns forecast days when snapshots exist', async () => {
      prisma.forecastSnapshot.findMany.mockResolvedValue([
        {
          userId,
          forecastDate: today,
          projectedBalance: new Decimal('100.50'),
          confidenceLevel: 'HIGH',
          generatedAt: new Date()
        },
        {
          userId,
          forecastDate: new Date(today.getTime() + 86400000), // tomorrow
          projectedBalance: new Decimal('90.50'),
          confidenceLevel: 'HIGH',
          generatedAt: new Date()
        }
      ]);

      const res = await request(app)
        .get('/api/v1/forecast')
        .set('Cookie', [`accessToken=${token}`]);
      
      expect(res.status).toBe(200);
      expect(res.body.data.ready).toBe(true);
      expect(res.body.data.days.length).toBe(2);
      expect(res.body.data.days[0].projectedBalance).toBe('100.5');
    });
  });

  describe('GET /api/v1/forecast/summary', () => {
    it('returns summary for Day 7, 30, 60', async () => {
      prisma.forecastSnapshot.findMany.mockResolvedValue([
        {
          userId,
          forecastDate: today,
          projectedBalance: new Decimal('100.50'),
          confidenceLevel: 'HIGH',
          generatedAt: new Date()
        },
        {
          userId,
          forecastDate: new Date(today.getTime() + 86400000), // tomorrow
          projectedBalance: new Decimal('90.50'),
          confidenceLevel: 'HIGH',
          generatedAt: new Date()
        }
      ]);

      const res = await request(app)
        .get('/api/v1/forecast/summary')
        .set('Cookie', [`accessToken=${token}`]);
      
      expect(res.status).toBe(200);
      expect(res.body.data.ready).toBe(true);
      // Because we only seeded 2 days (indexes 0 and 1), the getDayBalance(6), (29), (59) will all fallback to index 1 which is '90.5'
      expect(res.body.data.day7).toBe('90.5');
      expect(res.body.data.day30).toBe('90.5');
      expect(res.body.data.day60).toBe('90.5');
    });
  });
});
