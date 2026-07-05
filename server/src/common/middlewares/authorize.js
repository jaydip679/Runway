const AppError = require('../errors/AppError');
const errorCodes = require('../errors/errorCodes');

/**
 * Middleware to restrict access to specific roles.
 * Must be used AFTER the authenticate middleware.
 * @param  {...string} roles - Allowed roles (e.g., 'ADMIN', 'USER')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new AppError('Not authenticated', 401, errorCodes.AUTH_UNAUTHORIZED));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403, errorCodes.AUTH_FORBIDDEN));
    }

    next();
  };
};

module.exports = authorize;
