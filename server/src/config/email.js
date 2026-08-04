const nodemailer = require('nodemailer');
const env = require('./env');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // Dynamically use Implicit TLS for 465, STARTTLS otherwise
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
  logger.info('[SMTP] Verifying SMTP connection...');

  try {
    await transporter.verify();
    logger.info('[SMTP] SMTP connection verified successfully');
    return true;
  } catch (error) {
    logger.error('[SMTP] SMTP verification failed:');
    logger.error(`[SMTP] Code: ${error.code}`);
    logger.error(`[SMTP] Message: ${error.message}`);
    // Do not log the full error object to prevent credential leakage
    return false;
  }
};

module.exports = {
  transporter,
  verifySmtpConnection,
};
