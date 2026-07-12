const express = require('express');
const { createHandler } = require('graphql-http/lib/use/express');
const authenticate = require('../common/middlewares/authenticate');
const schema = require('./schema');
const dashboardResolver = require('./resolvers/dashboard.resolver');
const AppError = require('../common/errors/AppError');

const router = express.Router();

router.use(authenticate);

// We define a simple custom format error to match REST if needed, 
// but graphql-http handles the spec. We'll use formatError if required by graphql-http setup.
router.all(
  '/',
  createHandler({
    schema,
    rootValue: {
      ...dashboardResolver
    },
    context: (req) => {
      // req is passed as context by default, but we can return it to be explicit
      return req;
    },
    formatError: (err) => {
      // If it's an AppError, preserve the status/code in extensions
      if (err.originalError instanceof AppError) {
        return {
          message: err.message,
          extensions: {
            code: err.originalError.errorCode || 'INTERNAL_SERVER_ERROR',
            status: err.originalError.statusCode
          }
        };
      }
      return err;
    }
  })
);

module.exports = router;
