const env = require('../../../config/env');
const logger = require('../../../config/logger');

// Wait for a given number of milliseconds
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes a query against Gemini.
 * Since no API key is provided, this currently mocks the response.
 */
class GeminiProvider {
  async query(prompt) {
    logger.info('[GeminiProvider] Mocking response for prompt length: ' + prompt.length);

    // Mock network latency
    await delay(1500);

    // Hardcoded mock response for demonstration
    const mockJson = {
      answer: "Based on your forecast, you can comfortably afford the $500 vacation next month. Your lowest projected balance over the next 60 days is $1,200, which leaves plenty of buffer even after this expense.",
      reasoning: "Your day-zero balance is strong, and while you have an upcoming rent payment of $1,000, your bi-weekly income of $2,000 will hit before the balance drops too low.",
      confidence: "HIGH"
    };

    return { raw: JSON.stringify(mockJson) };
  }
}

module.exports = new GeminiProvider();
