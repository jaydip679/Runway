const prisma = require('../../config/db');
const env = require('../../config/env');
const { buildPrompt } = require('./ai.promptBuilder');
const geminiProvider = require('./providers/gemini.provider');
const openaiProvider = require('./providers/openai.provider');
const AppError = require('../../common/errors/AppError');

// Select provider based on env
const getProvider = () => {
  return env.AI_PROVIDER === 'OPENAI' ? openaiProvider : geminiProvider;
};

const queryAffordability = async (userId, question) => {
  let logRecord;
  try {
    // 1. Gather context
    const forecast = await prisma.forecastSnapshot.findMany({
      where: { userId },
      orderBy: { forecastDate: 'asc' },
      take: 30, // Get next 30 days
    });

    const recurringCommitments = await prisma.recurringCommitment.findMany({
      where: {
        userId,
        status: 'CONFIRMED',
        deletedAt: null,
      },
      orderBy: { nextOccurrenceDate: 'asc' },
    });

    // 2. Build prompt
    const prompt = buildPrompt({ forecast, recurringCommitments, question });

    // 3. Call AI Provider
    const provider = getProvider();
    
    // Add timeout handling for provider
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new AppError('AI provider timed out', 503, 'AI_PROVIDER_UNAVAILABLE')), 10000)
    );

    const response = await Promise.race([
      provider.query(prompt),
      timeoutPromise
    ]);

    // 4. Parse response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response.raw);
      
      // Clean up markdown code blocks if the LLM wraps the response in ```json
      if (typeof parsedResponse === 'string') {
        parsedResponse = JSON.parse(parsedResponse);
      }

      if (!parsedResponse.answer || !parsedResponse.reasoning || !parsedResponse.confidence) {
        throw new Error('Missing required fields in AI response');
      }
      
      parsedResponse.isMock = response.isMock;
    } catch (parseError) {
      throw new AppError('Failed to parse AI response', 502, 'AI_RESPONSE_PARSE_FAILED');
    }

    // 5. Log success
    logRecord = await prisma.aiQueryLog.create({
      data: {
        userId,
        question,
        answer: JSON.stringify(parsedResponse),
        succeeded: true,
      }
    });

    return parsedResponse;

  } catch (error) {
    // Log failure
    await prisma.aiQueryLog.create({
      data: {
        userId,
        question,
        answer: error.message,
        succeeded: false,
      }
    });

    throw error;
  }
};

module.exports = {
  queryAffordability,
};
