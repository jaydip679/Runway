const request = require('supertest');
const app = require('../../../../src/app');
const prisma = require('../../../../src/config/db');
const { generateAccessToken } = require('../../auth/auth.utils');

describe('User Routes Integration', () => {
  let token;
  let testUser;

  beforeAll(async () => {
    // Create a test user
    testUser = await prisma.user.create({
      data: {
        email: 'user-test@example.com',
        name: 'Test User',
        passwordHash: 'hashedpassword',
        role: 'USER',
        authProvider: 'LOCAL',
        isEmailVerified: true,
        isActive: true
      }
    });

    // Generate token
    token = generateAccessToken({ sub: testUser.id, role: testUser.role });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { email: 'user-test@example.com' } });
    await prisma.$disconnect();
  });

  it('GET /api/v1/users/me should return user profile', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Cookie', [`accessToken=${token}`]);
      
    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe('user-test@example.com');
    expect(res.body.data.name).toBe('Test User');
    expect(res.body.data.passwordHash).toBeUndefined(); // Should not leak password
  });

  it('PATCH /api/v1/users/me should update user name', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Cookie', [`accessToken=${token}`])
      .send({ name: 'Updated Name' });
      
    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Updated Name');
  });

  it('GET /api/v1/users/me should return 401 without token', async () => {
    const res = await request(app)
      .get('/api/v1/users/me');
      
    expect(res.statusCode).toBe(401);
  });
});
