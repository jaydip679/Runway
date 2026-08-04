const { Resend } = require('resend');
const env = require('../../../config/env');

class ResendProvider {
  constructor() {
    if (!env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is required to use the Resend provider');
    }
    this.client = new Resend(env.RESEND_API_KEY);
  }

  /**
   * Send an email using Resend
   * @param {Object} payload 
   * @param {string} payload.from
   * @param {string} payload.to
   * @param {string} payload.subject
   * @param {string} payload.html
   * @param {string} payload.text
   * @returns {Promise<{ id: string }>}
   */
  async sendMail(payload) {
    const { from, to, subject, html, text } = payload;
    
    const { data, error } = await this.client.emails.send({
      from,
      to,
      subject,
      html,
      text
    });

    if (error) {
      const formattedError = new Error(error.message);
      formattedError.code = error.name; // Resend sets a 'name' like 'validation_error'
      formattedError.statusCode = error.statusCode;
      throw formattedError;
    }

    return { id: data.id };
  }
}

module.exports = ResendProvider;
