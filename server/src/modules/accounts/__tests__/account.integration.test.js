const request = require('supertest');
const app = require('../../../app');
const prisma = require('../../../config/db');
const redis = require('../../../config/redis');
const { generateAccessToken } = require('../../auth/auth.utils');

describe('Account Integration', () => {
  const testEmail = `test_account_${Date.now()}@example.com`;
  const otherEmail = `test_account_other_${Date.now()}@example.com`;
  let userId;
  let otherUserId;
  let accessTokenCookie;
  let otherAccessTokenCookie;
  let accountId;
  let otherAccountId;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Test Account User',
        authProvider: 'LOCAL',
        isEmailVerified: true,
        isActive: true,
      },
    });
    userId = user.id;

    const otherUser = await prisma.user.create({
      data: {
        email: otherEmail,
        name: 'Other User',
        authProvider: 'LOCAL',
        isEmailVerified: true,
        isActive: true,
      },
    });
    otherUserId = otherUser.id;

    const token = generateAccessToken({ sub: userId, role: 'USER' });
    accessTokenCookie = `accessToken=${token};`;

    const otherToken = generateAccessToken({ sub: otherUserId, role: 'USER' });
    otherAccessTokenCookie = `accessToken=${otherToken};`;
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { userId: { in: [userId, otherUserId] } } }).catch(() => {});
    await prisma.account.deleteMany({ where: { userId: { in: [userId, otherUserId] } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } }).catch(() => {});
    
    await prisma.$disconnect();
    await redis.quit();
  });

  it('should create a new account successfully including negative balance', async () => {
    const res = await request(app)
      .post('/api/v1/accounts')
      .set('Cookie', accessTokenCookie)
      .send({
        name: 'My Credit Card',
        type: 'CREDIT_CARD',
        currentBalance: -500.50,
      });
      
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('My Credit Card');
    expect(Number(res.body.data.currentBalance)).toBe(-500.5);
    
    accountId = res.body.data.id;
  });

  it('should list accounts excluding soft-deleted', async () => {
    const res = await request(app)
      .get('/api/v1/accounts')
      .set('Cookie', accessTokenCookie);
      
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  it('should prevent cross-user account access', async () => {
    const res = await request(app)
      .get(`/api/v1/accounts/${accountId}`)
      .set('Cookie', otherAccessTokenCookie);
      
    expect(res.statusCode).toBe(404);
    expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('should soft delete an account', async () => {
    const res = await request(app)
      .delete(`/api/v1/accounts/${accountId}`)
      .set('Cookie', accessTokenCookie);
      
    expect(res.statusCode).toBe(204);

    const check = await request(app)
      .get(`/api/v1/accounts/${accountId}`)
      .set('Cookie', accessTokenCookie);
      
    expect(check.statusCode).toBe(404); // Should be excluded because it's deleted
  });
});
