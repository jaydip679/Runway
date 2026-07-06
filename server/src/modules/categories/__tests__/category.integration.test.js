const request = require('supertest');
const app = require('../../../app');
const prisma = require('../../../config/db');
const redis = require('../../../config/redis');
const { generateAccessToken } = require('../../auth/auth.utils');

describe('Category Integration', () => {
  const testEmail = `test_cat_${Date.now()}@example.com`;
  const otherEmail = `test_cat_other_${Date.now()}@example.com`;
  let userId;
  let otherUserId;
  let accessTokenCookie;
  let otherAccessTokenCookie;
  let customCategoryId;
  let systemCategoryId;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Test Cat User',
        authProvider: 'LOCAL',
        isEmailVerified: true,
        isActive: true,
      },
    });
    userId = user.id;

    const otherUser = await prisma.user.create({
      data: {
        email: otherEmail,
        name: 'Other Cat User',
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

    // Ensure at least one system category exists
    let sysCat = await prisma.category.findFirst({ where: { userId: null, isSystem: true } });
    if (!sysCat) {
      sysCat = await prisma.category.create({
        data: { name: 'SysTest', type: 'EXPENSE', isSystem: true, userId: null }
      });
    }
    systemCategoryId = sysCat.id;
  });

  afterAll(async () => {
    await prisma.category.deleteMany({ where: { userId: { in: [userId, otherUserId] } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } }).catch(() => {});
    
    await prisma.$disconnect();
    await redis.quit();
  });

  it('should create a custom category', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Cookie', accessTokenCookie)
      .send({
        name: 'My Custom Cat',
        type: 'EXPENSE',
      });
      
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('My Custom Cat');
    
    customCategoryId = res.body.data.id;
  });

  it('should list union of system and custom categories', async () => {
    const res = await request(app)
      .get('/api/v1/categories')
      .set('Cookie', accessTokenCookie);
      
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    
    const cats = res.body.data;
    const hasSystem = cats.some(c => c.isSystem === true);
    const hasCustom = cats.some(c => c.id === customCategoryId);
    
    expect(hasSystem).toBe(true);
    expect(hasCustom).toBe(true);
  });

  it('should prevent editing a system category', async () => {
    const res = await request(app)
      .patch(`/api/v1/categories/${systemCategoryId}`)
      .set('Cookie', accessTokenCookie)
      .send({ name: 'Hacked' });
      
    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('CATEGORY_SYSTEM_READONLY');
  });

  it('should prevent cross-user category access', async () => {
    const res = await request(app)
      .patch(`/api/v1/categories/${customCategoryId}`)
      .set('Cookie', otherAccessTokenCookie)
      .send({ name: 'Hacked 2' });
      
    expect(res.statusCode).toBe(404);
  });
});
