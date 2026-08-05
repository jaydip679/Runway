const jwt = require('jsonwebtoken');
const AppError = require('../errors/AppError');
const errorCodes = require('../errors/errorCodes');
const prisma = require('../../config/db');
const { Sentry } = require('../../config/sentry');

const authenticate = async (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return next(new AppError('Authentication required', 401, errorCodes.AUTH_UNAUTHORIZED));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      return next(new AppError('Account deactivated', 401, errorCodes.AUTH_UNAUTHORIZED));
    }

    req.user = { id: user.id, role: user.role };
    
    // Attach to Sentry if initialized
    if (Sentry && typeof Sentry.setUser === 'function') {
      Sentry.setUser({ id: user.id, role: user.role });
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401, errorCodes.AUTH_TOKEN_EXPIRED));
    }
    return next(new AppError('Invalid token', 401, errorCodes.AUTH_TOKEN_INVALID));
  }
};

module.exports = authenticate;
