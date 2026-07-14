const winston = require('winston');
const util = require('util');
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

  redactObject(info);
  return info;
});

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    redact(),
    env.NODE_ENV === 'development' 
      ? winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const colors = {
            info: '\x1b[32m',
            warn: '\x1b[33m',
            error: '\x1b[31m',
            debug: '\x1b[34m'
          };
          const reset = '\x1b[0m';
          const color = colors[level] || '';
          const cleanMeta = {};
          for (const k of Object.keys(meta)) {
            cleanMeta[k] = meta[k];
          }
          const metaStr = Object.keys(cleanMeta).length 
            ? '\n' + util.inspect(cleanMeta, { colors: true, depth: null }) 
            : '';
          return `${timestamp} ${color}[${level}]${reset} ${message} ${metaStr}`;
        })
      : winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ],
});

module.exports = logger;
