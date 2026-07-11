const logger = require('../../../config/logger');

class OpenAIProvider {
  async query(prompt) {
    logger.info('[OpenAIProvider] Mocking response');
    
    throw new Error('OpenAI Provider not yet fully implemented. Please use GEMINI.');
  }
}

module.exports = new OpenAIProvider();
