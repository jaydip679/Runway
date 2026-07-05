const jwt = require('jsonwebtoken');
const AppError = require('../errors/AppError');
const errorCodes = require('../errors/errorCodes');

const authenticate = (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return next(new AppError('Authentication required', 401, errorCodes.AUTH_UNAUTHORIZED));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401, errorCodes.AUTH_TOKEN_EXPIRED));
    }
    return next(new AppError('Invalid token', 401, errorCodes.AUTH_TOKEN_INVALID));
  }
};

module.exports = authenticate;
