const express = require('express');
const router = express.Router();
const exportController = require('./export.controller');
const authenticate = require('../../common/middlewares/authenticate');

router.post('/pdf', authenticate, exportController.requestExport);
router.get('/download/:documentId', authenticate, exportController.getDocument);

module.exports = router;
