const winston = require('winston');
const env = require('./env');

const SENSITIVE_KEYS = [
  'password',
  'passwordhash',
  'otp',
  'accesstoken',
  'refreshtoken',
  'token',
  'authorization',
  'cookie',
];

const redact = winston.format((info) => {
  const clone = JSON.parse(JSON.stringify(info));
  
  const redactObject = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        redactObject(obj[key]);
      }
    }
  };

  redactObject(clone);
  return clone;
});

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    redact(),
    env.NODE_ENV === 'development' ? winston.format.prettyPrint() : winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ],
});

module.exports = logger;
