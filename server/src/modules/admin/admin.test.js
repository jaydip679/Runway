const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const bcrypt = require('bcrypt');

// Mock ioredis and bullmq before requiring app
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    off: jest.fn(),
    quit: jest.fn(),
    connect: jest.fn(),
  }));
});

jest.mock('bullmq', () => {
  return {
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      on: jest.fn(),
      close: jest.fn(),
      getJobCounts: jest.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 })
    })),
    Worker: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      close: jest.fn()
    }))
  };
});

const app = require('../../app');
const prisma = new PrismaClient();

describe('Admin API (Phase 9)', () => {
  let adminToken, userToken;
  let adminUser, normalUser;

  beforeAll(async () => {
    await prisma.csvImportJob.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash('password123', 10);

    adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        passwordHash,
        role: 'ADMIN',
        isEmailVerified: true
      }
    });

    normalUser = await prisma.user.create({
      data: {
        email: 'user@example.com',
        name: 'Normal User',
        passwordHash,
        role: 'USER',
        isEmailVerified: true
      }
    });

    adminToken = jwt.sign({ sub: adminUser.id, role: 'ADMIN' }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    userToken = jwt.sign({ sub: normalUser.id, role: 'USER' }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  });

  afterAll(async () => {
    await prisma.csvImportJob.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('RBAC Enforcement', () => {
    it('should block normal users from GET /admin/users with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('should block normal users from GET /admin/csv-imports with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/csv-imports')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('should block normal users from GET /admin/metrics with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/metrics')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /admin/users', () => {
    it('should allow admin and return strict payload shape without passwordHash', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toBeInstanceOf(Array);
      
      const firstUser = res.body.data.users[0];
      
      // Strict keys check
      const expectedKeys = ['id', 'email', 'name', 'role', 'isActive', 'isEmailVerified', 'createdAt', 'lastLoginAt'];
      const actualKeys = Object.keys(firstUser);
      
      expect(actualKeys.sort()).toEqual(expectedKeys.sort());
      
      // Explicit negative check
      expect(firstUser).not.toHaveProperty('passwordHash');
    });
  });

  describe('PATCH /admin/users/:id/deactivate', () => {
    it('should block self-deactivation with 422', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${adminUser.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should deactivate another user successfully', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${normalUser.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.user.isActive).toBe(false);

      // Verify db
      const dbUser = await prisma.user.findUnique({ where: { id: normalUser.id } });
      expect(dbUser.isActive).toBe(false);
    });
  });

  describe('GET /admin/csv-imports', () => {
    it('should return failed csv imports by default', async () => {
      await prisma.csvImportJob.create({
        data: {
          id: 'test-job',
          userId: normalUser.id,
          status: 'FAILED',
          filename: 'test.csv',
          totalRows: 10,
          processedRows: 5,
          error: 'Test error'
        }
      });

      const res = await request(app)
        .get('/api/v1/admin/csv-imports')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.imports).toHaveLength(1);
      expect(res.body.data.imports[0].status).toBe('FAILED');
      expect(res.body.data.imports[0].user.email).toBe('user@example.com');
    });
  });

  describe('GET /admin/metrics', () => {
    it('should return metrics dashboard data', async () => {
      const res = await request(app)
        .get('/api/v1/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.users.total).toBeGreaterThanOrEqual(2);
      expect(res.body.data.users.active7d).toBeDefined();
      expect(res.body.data.queues).toBeDefined();
      expect(res.body.data.api.errorRate).toBeDefined();
    });
  });
});
