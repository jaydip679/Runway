const env = require('../../../config/env');

class GmailProvider {
  constructor() {
    this.clientId = env.GOOGLE_CLIENT_ID;
    this.clientSecret = env.GOOGLE_CLIENT_SECRET;
    this.refreshToken = env.GMAIL_REFRESH_TOKEN;
    
    if (!this.clientId || !this.clientSecret || !this.refreshToken) {
      throw new Error('Gmail OAuth credentials are required to use the Gmail provider');
    }
  }

  /**
   * Fetch a fresh Access Token using the Refresh Token
   * @returns {Promise<string>}
   */
  async getAccessToken() {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      const errorMsg = data.error_description || data.error || 'Failed to get access token';
      const error = new Error(errorMsg);
      error.code = 'oauth_error';
      throw error;
    }
    return data.access_token;
  }

  /**
   * Send an email using Gmail REST API
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
    
    // Construct standard RFC 2822 email
    const boundary = `----=_Part_${Date.now()}`;
    const emailParts = [
      `To: ${to}`,
      `From: ${from}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"\n`,
      `--${boundary}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `Content-Transfer-Encoding: 7bit\n`,
      `${text || ''}\n`,
      `--${boundary}`,
      `Content-Type: text/html; charset="UTF-8"`,
      `Content-Transfer-Encoding: 7bit\n`,
      `${html || text || ''}\n`,
      `--${boundary}--`
    ];

    const emailRaw = emailParts.join('\n');
    
    // Gmail API requires base64url encoded string
    const base64EncodedEmail = Buffer.from(emailRaw)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Get fresh token
    const accessToken = await this.getAccessToken();

    // Send the email
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: base64EncodedEmail }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const formattedError = new Error(data.error?.message || 'Failed to send email via Gmail API');
      formattedError.code = data.error?.status || 'api_error';
      formattedError.statusCode = data.error?.code || response.status;
      throw formattedError;
    }

    return { id: data.id };
  }
}

module.exports = GmailProvider;
