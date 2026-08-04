const logger = require('../../config/logger');
const prisma = require('../../config/db');
const emailService = require('../../services/email/email.service');

const processNotificationJob = async (job) => {
  const { userId, type, metadata = {}, message } = job.data;
  
  let targetEmail = metadata.email;
  if (!targetEmail && userId) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) targetEmail = user.email;
    } catch (err) {
      logger.error(`[NOTIFICATION] Failed to fetch user for id ${userId}: ${err.message}`);
    }
  }
  
  let logMessage = message || '';
  let htmlMessage = '';

  if (type === 'email_otp' || type === 'password_reset') {
    logMessage = `Your OTP code is: ${metadata.otp}`;
    htmlMessage = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f9fafb; border-radius: 12px;">
      <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center;">
        <h1 style="color: #111827; margin-bottom: 8px; font-size: 24px; font-weight: 700;">Runway Security</h1>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 32px;">Please use the following 6-digit code to securely complete your request.</p>
        
        <div style="background: #f3f4f6; padding: 24px; border-radius: 12px; margin-bottom: 32px; letter-spacing: 8px; font-size: 36px; font-weight: 800; color: #4f46e5;">
          ${metadata.otp}
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">This code will expire shortly. If you did not request this, please safely ignore this email.</p>
      </div>
    </div>
    `;
  }

  try {
    logger.info(`[NOTIFICATION] Attempting to send email to ${targetEmail || userId} for ${type}`);

    const info = await emailService.sendMail({
      to: targetEmail || userId,
      subject: `Runway Alert: ${type.replace(/_/g, ' ').toUpperCase()}`,
      text: logMessage,
      html: htmlMessage || logMessage,
    });
    
    logger.info(`[NOTIFICATION] Successfully delivered email to ${targetEmail || userId} (Message ID: ${info.id})`);
  } catch (error) {
    logger.error(`[NOTIFICATION] Failed to send email to ${targetEmail || userId}:`);
    logger.error(`[NOTIFICATION] Code: ${error.code || 'UNKNOWN'}`);
    logger.error(`[NOTIFICATION] Message: ${error.message}`);
    throw error; // Let BullMQ handle retries and failure states
  }
};

module.exports = {
  processNotificationJob,
};
