const nodemailer = require('nodemailer');
const env = require('./env');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // Dynamically use Implicit TLS for 465, STARTTLS otherwise
  requireTLS: env.SMTP_PORT === 587, // Force TLS upgrade for STARTTLS
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  // Production explicit timeouts
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

const verifySmtpConnection = async () => {
  logger.info('[SMTP] Initializing transporter...');
  logger.info(`[SMTP] Host: ${env.SMTP_HOST}`);
  logger.info(`[SMTP] Port: ${env.SMTP_PORT}`);
  logger.info(`[SMTP] Secure: ${env.SMTP_PORT === 465}`);
  logger.info(`[SMTP] RequireTLS: ${env.SMTP_PORT === 587}`);
  logger.info('[SMTP] Verifying SMTP connection...');

  try {
    await transporter.verify();
    logger.info('[SMTP] SMTP connection verified successfully');
    return true;
  } catch (error) {
    logger.error('[SMTP] SMTP verification failed!');
    
    // Classify the failure
    if (error.code === 'ETIMEDOUT') {
      logger.error('[SMTP] Failure Type: NETWORK_TIMEOUT (Firewall or routing issue)');
    } else if (error.code === 'ECONNREFUSED') {
      logger.error('[SMTP] Failure Type: CONNECTION_REFUSED (Host rejected connection or is down)');
    } else if (error.code === 'EAUTH') {
      logger.error('[SMTP] Failure Type: AUTHENTICATION (Invalid credentials)');
    } else if (error.code === 'ENOTFOUND') {
      logger.error('[SMTP] Failure Type: DNS_RESOLUTION (Invalid SMTP host)');
    } else {
      logger.error(`[SMTP] Failure Type: ${error.code || 'UNKNOWN'}`);
    }

    logger.error(`[SMTP] Error Details: ${error.message}`);
    // Do not log the full error object to prevent credential leakage
    return false;
  }
};

module.exports = {
  transporter,
  verifySmtpConnection,
};
