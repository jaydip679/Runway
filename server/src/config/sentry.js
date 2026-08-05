const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');
const env = require('./env');
const logger = require('./logger');

/**
 * Initializes Sentry for error tracking.
 * @param {string} serviceName - Name of the service (e.g., 'api', 'worker')
 */
const initSentry = (serviceName = 'backend') => {
  const dsn = process.env.SENTRY_BACKEND_DSN;

  if (!dsn) {
    return; // Skip initialization if DSN is missing
  }

  // Only initialize in production unless explicitly enabled for local testing
  if (env.NODE_ENV !== 'production' && process.env.ENABLE_SENTRY_LOCAL !== 'true') {
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: env.NODE_ENV,
      release: process.env.npm_package_version || '1.0.0', // Release tracking
      serverName: serviceName,
      integrations: [
        nodeProfilingIntegration(),
      ],
      // Focused on reliable error monitoring first. 
      // Keep performance profiling overhead negligible.
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1,
      
      // Before sending, ensure we strip any sensitive environment variables or secrets
      // that might inadvertently get attached to the error context.
      beforeSend(event, hint) {
        const originalException = hint.originalException;
        if (originalException && originalException.statusCode && originalException.statusCode < 500) {
          return null; // Ignore operational 4xx errors
        }

        if (event.request && event.request.headers) {
          delete event.request.headers['cookie'];
          delete event.request.headers['authorization'];
        }
        return event;
      }
    });

    logger.info(`Sentry initialized for service: ${serviceName}`);
  } catch (error) {
    logger.error('Failed to initialize Sentry', error);
  }
};

module.exports = {
  initSentry,
  Sentry,
};
