const AppError = require('../errors/AppError');
const { sendError } = require('../utils/apiResponse');
const logger = require('../../config/logger');
const env = require('../../config/env');
const errorCodes = require('../errors/errorCodes');
const { ZodError } = require('zod');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Prisma Errors
  if (err.code === 'P2002') {
    error = new AppError('Duplicate field value entered', 409, errorCodes.CONFLICT);
  } else if (err.code === 'P2025') {
    error = new AppError('Record not found', 404, errorCodes.NOT_FOUND);
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const message = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    error = new AppError(message, 400, errorCodes.VALIDATION_ERROR);
  }

  // Fallback for non-AppErrors
  if (!(error instanceof AppError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new AppError(message, statusCode, errorCodes.INTERNAL_ERROR, false);
  }

  // Log error
  if (!error.isOperational || error.statusCode >= 500) {
    logger.error('Unexpected Error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.warn('Operational Error:', {
      message: error.message,
      code: error.errorCode,
      path: req.path,
    });
  }

  // Hide detailed errors in production for 500s
  if (env.NODE_ENV === 'production' && !error.isOperational) {
    error.message = 'Something went wrong';
  }

  sendError(res, error.statusCode, error.errorCode, error.message);
};

module.exports = errorHandler;
