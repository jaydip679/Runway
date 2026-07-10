const logger = require('../../config/logger');
const prisma = require('../../config/db');
// In a real application, you'd use nodemailer or a service like SendGrid here.
// const nodemailer = require('nodemailer');

const processNotificationJob = async (job) => {
  const { userId, type, message, email } = job.data;
  
  let targetEmail = email;
  if (!targetEmail) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) targetEmail = user.email;
  }
  
  // For MVP/Demonstration, just log the email sending action
  logger.info(`[NOTIFICATION] Sending ${type} email to ${targetEmail || userId}: ${message}`);

  // Example real implementation:
  /*
  const transporter = nodemailer.createTransport({ ... });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Runway Alert: ${type.replace(/_/g, ' ')}`,
    text: message,
  });
  */
};

module.exports = {
  processNotificationJob,
};
