const express = require('express');
const authenticate = require('../../common/middlewares/authenticate');
const aiController = require('./ai.controller');
const rateLimiter = require('../../common/middlewares/rateLimiter');

const router = express.Router();

router.use(authenticate);

// 10 requests per 24 hours
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const aiRateLimiter = rateLimiter({
  windowMs: ONE_DAY_MS,
  max: 10,
  keyBy: 'user',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'AI_RATE_LIMIT_EXCEEDED',
        message: 'Daily AI quota exceeded',
        details: {
          resetAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
        }
      }
    });
  }
});

/**
 * @swagger
 * /ai/affordability:
 *   post:
 *     summary: Ask an AI affordability question
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI response
 *       429:
 *         description: Quota exceeded
 */
router.post(
  '/affordability',
  aiRateLimiter,
  aiController.queryAffordability
);

module.exports = router;
