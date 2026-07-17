const express = require('express');
const authenticate = require('../../common/middlewares/authenticate');
const rateLimiter = require('../../common/middlewares/rateLimiter');
const forecastController = require('./forecast.controller');

const router = express.Router();

router.use(authenticate);

const forecastLimit = rateLimiter({ windowMs: 15 * 60 * 1000, max: 100, keyBy: 'user' });

router.get('/', forecastLimit, forecastController.getForecast);
router.get('/summary', forecastLimit, forecastController.getForecastSummary);
router.get('/evaluate-date', forecastController.evaluateDate);
router.get('/insights', forecastController.getInsights);
router.post('/scenario', forecastController.simulateScenario);

module.exports = router;
