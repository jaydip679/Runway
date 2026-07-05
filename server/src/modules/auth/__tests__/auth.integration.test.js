const request = require('supertest');
const app = require('../../../app');
const prisma = require('../../../config/db');
const redis = require('../../../config/redis');

describe('Auth Integration (T1.3 & T1.4)', () => {
  const testEmail = `test_${Date.now()}@example.com`;
  let userId;
  let refreshTokenCookie;
  let oldRefreshTokenCookie;
  
  afterAll(async () => {
    // cleanup
    if (userId) {
      await prisma.auditLog.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.refreshToken.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.user.delete({ where: { email: testEmail } }).catch(() => {});
    }
    await prisma.$disconnect();
    await redis.quit();
  });

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: testEmail, password: 'Password123!', name: 'Test User' });
      
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBeDefined();
    
    userId = res.body.data.userId;
    
    // Redis key should exist
    const redisKey = `otp:verify:${userId}`;
    const otpData = await redis.get(redisKey);
    expect(otpData).toBeDefined();
  });

  it('should prevent duplicate registration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: testEmail, password: 'Password123!', name: 'Test User' });
      
    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('AUTH_EMAIL_EXISTS');
  });

  it('should resend OTP', async () => {
    const res = await request(app)
      .post('/api/v1/auth/resend-otp')
      .send({ userId });
      
    expect(res.statusCode).toBe(200);
    expect(res.body.data.message).toBe('A new OTP has been sent.');
    
    // Cooldown should be active
    const cdRes = await request(app)
      .post('/api/v1/auth/resend-otp')
      .send({ userId });
    expect(cdRes.statusCode).toBe(429);
  });

  it('should verify OTP', async () => {
    const redisKey = `otp:verify:${userId}`;
    const raw = await redis.get(redisKey);
    const { otp } = JSON.parse(raw);
    
    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ userId, otp });
      
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should login successfully and return cookies', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: 'Password123!' });
      
    if (res.statusCode === 500) {
      console.log('Login 500 Error:', res.body);
    }
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['set-cookie']).toBeDefined();
    
    // Extract cookies for refresh test
    res.headers['set-cookie'].forEach(cookie => {
      if (cookie.startsWith('refreshToken=')) {
        refreshTokenCookie = cookie.split(';')[0];
      }
    });
  });

  it('should refresh tokens successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [refreshTokenCookie]);
      
    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
    
    // Extract new refresh token cookie
    res.headers['set-cookie'].forEach(cookie => {
      if (cookie.startsWith('refreshToken=')) {
        oldRefreshTokenCookie = refreshTokenCookie;
        refreshTokenCookie = cookie.split(';')[0];
      }
    });
  });
  
  it('should detect reuse of rotated refresh token and revoke family', async () => {
    // Attempting to use the OLD refresh token that was just rotated
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [oldRefreshTokenCookie]);
      
    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REFRESH_TOKEN_REUSED');
    
    // Now the NEW token should also be invalid since the family was revoked
    const res2 = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [refreshTokenCookie]);
      
    expect(res2.statusCode).toBe(401);
    expect(res2.body.error.code).toBe('AUTH_REFRESH_TOKEN_REUSED'); // It's revoked now
  });

  it('should logout successfully', async () => {
    // Need to login first to get a valid token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: 'Password123!' });
      
    let accessCookie, refreshCookie;
    loginRes.headers['set-cookie'].forEach(cookie => {
      if (cookie.startsWith('accessToken=')) accessCookie = cookie.split(';')[0];
      if (cookie.startsWith('refreshToken=')) refreshCookie = cookie.split(';')[0];
    });

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', [accessCookie, refreshCookie]);
      
    expect(res.statusCode).toBe(204);
    
    // Check if cookies are cleared
    const cookies = res.headers['set-cookie'].join(';');
    expect(cookies).toContain('accessToken=;');
    expect(cookies).toContain('refreshToken=;');
  });

  it('should return Google OAuth redirect URL', async () => {
    const res = await request(app)
      .get('/api/v1/auth/google');
      
    // Because we used res.redirect, it will respond with 302
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(res.headers.location).toContain('client_id');
    expect(res.headers.location).toContain('response_type=code');
  });

  it('should process forgot password without revealing existence', async () => {
    // 1. Unregistered email
    const res1 = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nonexistent@example.com' });
      
    expect(res1.statusCode).toBe(200);
    expect(res1.body.data.message).toContain('password reset code has been sent');

    // 2. Registered email
    const res2 = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: testEmail });
      
    expect(res2.statusCode).toBe(200);
    expect(res2.body.data.message).toContain('password reset code has been sent');
  });

  it('should reject reset password with invalid OTP', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ email: testEmail, otp: '000000', newPassword: 'NewPassword123!' });
      
    expect(res.statusCode).toBe(400);
    expect(['AUTH_OTP_INVALID', 'AUTH_OTP_EXPIRED']).toContain(res.body.error.code);
  });
});
