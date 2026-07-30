const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../../../config/env');
const logger = require('../../../config/logger');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class GeminiProvider {
  constructor() {
    if (env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      this.isMock = false;
    } else {
      logger.warn('[GeminiProvider] No GEMINI_API_KEY provided. Running in MOCK mode.');
      this.isMock = true;
    }
  }

  async query(prompt) {
    if (this.isMock) {
      logger.info('[GeminiProvider] Returning mock response for prompt length: ' + prompt.length);
      await delay(1500); // simulate network latency
      
      const mockJson = {
        answer: "Based on your forecast, you can comfortably afford the ₹50,000 vacation next month. Your lowest projected balance over the next 60 days is ₹1,20,000, which leaves plenty of buffer even after this expense.",
        reasoning: "Your day-zero balance is strong, and while you have an upcoming rent payment of ₹28,000, your regular income will hit before the balance drops too low.",
        confidence: "HIGH"
      };

      return { raw: JSON.stringify(mockJson), isMock: true };
    }

    try {
      logger.info('[GeminiProvider] Sending prompt to Gemini API...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return { raw: text, isMock: false };
    } catch (error) {
      logger.error(`[GeminiProvider] API Error: ${error.message}`);
      
      // Graceful fallback for any API failure during demos
      logger.warn('[GeminiProvider] API unavailable/failed. Falling back to mock response...');
      const mockJson = {
        answer: "Based on your current runway and projected expenses, this adjustment looks manageable. Your balances remain healthy even after applying this change.",
        reasoning: "Your regular income and current balances provide a strong enough buffer to absorb this safely.",
        confidence: "HIGH"
      };
      return { raw: JSON.stringify(mockJson), isMock: true, isFallback: true };
    }
  }
}

module.exports = new GeminiProvider();
