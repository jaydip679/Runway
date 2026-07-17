const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const authenticate = require('../../common/middlewares/authenticate');

router.use(authenticate);

router.get('/cashflow', analyticsController.getCashFlow);
router.get('/categories', analyticsController.getCategoryBreakdown);

module.exports = router;
