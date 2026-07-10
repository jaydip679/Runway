const express = require('express');
const authenticate = require('../../common/middlewares/authenticate');
const alertsController = require('./alerts.controller');
const rateLimiter = require('../../common/middlewares/rateLimiter');

const router = express.Router();

router.use(authenticate);

// Limit standard list endpoints
router.get(
  '/',
  rateLimiter({ windowMs: 60000, max: 100, keyBy: 'user' }),
  alertsController.getAlerts
);

// Limit mutations
router.patch(
  '/:id/read',
  rateLimiter({ windowMs: 60000, max: 50, keyBy: 'user' }),
  alertsController.markAlertRead
);

module.exports = router;
