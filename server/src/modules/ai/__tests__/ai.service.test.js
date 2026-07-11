const prisma = require('../../../config/db');
const aiService = require('../ai.service');
const geminiProvider = require('../providers/gemini.provider');

jest.mock('../../../config/db', () => ({
  forecastSnapshot: { findMany: jest.fn() },
  recurringCommitment: { findMany: jest.fn() },
  aiQueryLog: { create: jest.fn() },
}));

jest.mock('../providers/gemini.provider', () => ({
  query: jest.fn(),
}));

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AI_PROVIDER = 'GEMINI';
  });

  describe('queryAffordability', () => {
    it('should successfully execute query and log it', async () => {
      prisma.forecastSnapshot.findMany.mockResolvedValue([]);
      prisma.recurringCommitment.findMany.mockResolvedValue([]);
      
      geminiProvider.query.mockResolvedValue({
        raw: JSON.stringify({
          answer: 'Yes',
          reasoning: 'Good balance',
          confidence: 'HIGH'
        })
      });

      const res = await aiService.queryAffordability('user-1', 'Can I buy a laptop?');

      expect(res.answer).toBe('Yes');
      expect(prisma.aiQueryLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          succeeded: true,
          question: 'Can I buy a laptop?'
        })
      }));
    });

    it('should handle malformed JSON', async () => {
      prisma.forecastSnapshot.findMany.mockResolvedValue([]);
      prisma.recurringCommitment.findMany.mockResolvedValue([]);
      
      geminiProvider.query.mockResolvedValue({
        raw: 'Invalid JSON'
      });

      await expect(aiService.queryAffordability('user-1', 'test')).rejects.toThrow('Failed to parse AI response');
      
      expect(prisma.aiQueryLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          succeeded: false
        })
      }));
    });
  });
});
