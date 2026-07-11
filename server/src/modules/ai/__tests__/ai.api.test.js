const request = require('supertest');
const app = require('../../../app');
const prisma = require('../../../config/db');
const jwt = require('jsonwebtoken');
const env = require('../../../config/env');
const geminiProvider = require('../providers/gemini.provider');

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    off: jest.fn(),
    quit: jest.fn(),
    connect: jest.fn(),
  }));
});

jest.mock('../providers/gemini.provider', () => ({
  query: jest.fn(),
}));

describe('AI API Endpoints', () => {
  let user;
  let token;

  beforeAll(async () => {
    user = await prisma.user.create({
      data: {
        email: 'ai_test@example.com',
        passwordHash: 'hashed',
        name: 'AI Test User'
      }
    });
    token = jwt.sign({ sub: user.id, role: 'USER' }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    process.env.AI_PROVIDER = 'GEMINI';
  });

  afterAll(async () => {
    await prisma.aiQueryLog.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/ai/affordability', () => {
    it('should return a 200 with structured response on success', async () => {
      geminiProvider.query.mockResolvedValue({
        raw: JSON.stringify({
          answer: 'Yes',
          reasoning: 'Good balance',
          confidence: 'HIGH'
        })
      });

      const res = await request(app)
        .post('/api/v1/ai/affordability')
        .set('Authorization', `Bearer ${token}`)
        .send({ question: 'Can I afford this?' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.answer).toBe('Yes');
    });

    it('should return 502 when AI provider returns malformed JSON', async () => {
      geminiProvider.query.mockResolvedValue({
        raw: 'Invalid JSON here'
      });

      const res = await request(app)
        .post('/api/v1/ai/affordability')
        .set('Authorization', `Bearer ${token}`)
        .send({ question: 'Will this fail?' });

      expect(res.status).toBe(502);
      expect(res.body.error.code).toBe('AI_RESPONSE_PARSE_FAILED');
    });

    it('should return 503 when AI provider times out', async () => {
      geminiProvider.query.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 15000)));

      // Note: We can't easily wait 10 seconds in a fast test, but we can mock the Promise.race logic
      // Actually, since the service uses setTimeout of 10s, we should use fake timers.
      jest.useFakeTimers();

      const reqPromise = request(app)
        .post('/api/v1/ai/affordability')
        .set('Authorization', `Bearer ${token}`)
        .send({ question: 'Timeout test' });

      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(11000);

      const res = await reqPromise;
      jest.useRealTimers();

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('AI_PROVIDER_UNAVAILABLE');
    });

    it('should rate limit to 10 requests', async () => {
      // Mock success for all
      geminiProvider.query.mockResolvedValue({
        raw: JSON.stringify({ answer: 'Yes', reasoning: '', confidence: 'HIGH' })
      });

      // We already made 1 success, 1 malformed, 1 timeout in this suite = 3 requests
      // Let's make 7 more to hit 10
      for (let i = 0; i < 7; i++) {
        await request(app)
          .post('/api/v1/ai/affordability')
          .set('Authorization', `Bearer ${token}`)
          .send({ question: 'Spam' });
      }

      // The 11th request (4th in this block + 7 = 11 total for this IP/user) should fail
      const res = await request(app)
        .post('/api/v1/ai/affordability')
        .set('Authorization', `Bearer ${token}`)
        .send({ question: 'One too many' });

      expect(res.status).toBe(429);
      expect(res.body.error.code).toBe('AI_RATE_LIMIT_EXCEEDED');
      expect(res.body.error.details.resetAt).toBeDefined();
    });
    
    it('AI provider failure should not affect other modules', async () => {
      // Mock failure
      geminiProvider.query.mockResolvedValue({ raw: 'Invalid' });
      
      // AI fails
      const aiRes = await request(app)
        .post('/api/v1/ai/affordability')
        .set('Authorization', `Bearer ${token}`)
        .send({ question: 'test' });
        
      expect(aiRes.status).toBeGreaterThanOrEqual(400); // 429 or 502 depending on test execution order
      
      // But another module works fine
      const healthRes = await request(app).get('/health');
      expect(healthRes.status).toBe(200);
    });
  });
});
