const express = require('express');
const router = express.Router();
const exportController = require('./export.controller');
const authenticate = require('../../common/middlewares/authenticate');
const createRateLimiter = require('../../common/middlewares/rateLimiter');

const exportLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 5, keyBy: 'user', prefix: 'rl_export:' });

router.post('/pdf', authenticate, exportLimiter, exportController.requestExport);
router.get('/download/:documentId', authenticate, exportController.getDocument);

module.exports = router;
