const ResendProvider = require('./providers/resend.provider');
const GmailProvider = require('./providers/gmail.provider');

class EmailProviderFactory {
  /**
   * Creates an instance of the configured email provider
   * @param {string} providerName 
   * @returns {Object} Email provider instance matching the common contract
   */
  static createProvider(providerName) {
    switch (providerName) {
      case 'resend':
        return new ResendProvider();
      case 'gmail':
        return new GmailProvider();
      case 'mock':
        return {
          sendMail: async (payload) => {
            console.log('[MOCK_EMAIL_PROVIDER] Payload:', payload);
            return { id: `mock_${Date.now()}` };
          }
        };
      default:
        throw new Error(`Unsupported email provider: ${providerName}`);
    }
  }
}

module.exports = EmailProviderFactory;
