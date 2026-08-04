const env = require('../../config/env');
const logger = require('../../config/logger');
const EmailProviderFactory = require('./provider.factory');

class EmailService {
  constructor() {
    this.providerName = env.EMAIL_PROVIDER || 'resend';
    try {
      this.provider = EmailProviderFactory.createProvider(this.providerName);
      logger.info(`[EmailService] Initialized with provider: ${this.providerName}`);
    } catch (err) {
      logger.error(`[EmailService] Failed to initialize provider: ${err.message}`);
      throw err;
    }
  }

  /**
   * Send an email payload using the configured provider
   * @param {Object} payload 
   * @param {string} payload.to
   * @param {string} payload.subject
   * @param {string} payload.html
   * @param {string} payload.text
   * @returns {Promise<{ id: string }>}
   */
  async sendMail(payload) {
    // Inject the default sender if not explicitly provided
    const finalPayload = {
      from: env.EMAIL_FROM || '"Runway" <noreply@runway.com>',
      ...payload,
    };

    const result = await this.provider.sendMail(finalPayload);
    return result;
  }
}

// Export a singleton instance
module.exports = new EmailService();
