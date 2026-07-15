const express = require('express');
const router = express.Router();
const validate = require('../../common/middlewares/validate');
const { registerSchema, verifyOtpSchema, resendOtpSchema, loginSchema, googleCallbackSchema, forgotPasswordSchema, resetPasswordSchema } = require('./auth.validation');
const authController = require('./auth.controller');
const createRateLimiter = require('../../common/middlewares/rateLimiter');

// Auth tier: 10 requests / 15 min / IP
const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100, keyBy: 'ip', prefix: 'rl_auth:' });

// Refresh tier: 30 requests / 15 min / IP
const refreshLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100, keyBy: 'ip', prefix: 'rl_refresh:' });

const authenticate = require('../../common/middlewares/authenticate');

// Rate limiter for forgot-password: 3 requests / 1 hour / IP
const forgotLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 100, keyBy: 'ip', prefix: 'rl_forgot:' });

// Rate limiter for reset-password: 5 requests / 15 min / IP
const resetLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100, keyBy: 'ip', prefix: 'rl_reset:' });

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/resend-otp', validate(resendOtpSchema), authController.resendOtp);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authenticate, authController.logout);

router.post('/forgot-password', forgotLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', resetLimiter, validate(resetPasswordSchema), authController.resetPassword);

router.get('/google', authController.googleAuthUrl);
router.get('/google/callback', validate(googleCallbackSchema), authController.googleCallback);

module.exports = router;
