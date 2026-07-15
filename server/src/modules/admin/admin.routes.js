const express = require('express');
const adminController = require('./admin.controller');
const authenticate = require('../../common/middlewares/authenticate');
const authorize = require('../../common/middlewares/authorize');

const router = express.Router();

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/users', adminController.getUsers);
router.patch('/users/:id/deactivate', adminController.deactivateUser);
router.patch('/users/:id/reactivate', adminController.reactivateUser);

router.get('/csv-imports', adminController.getCsvImports);

router.get('/metrics', adminController.getMetrics);

module.exports = router;
