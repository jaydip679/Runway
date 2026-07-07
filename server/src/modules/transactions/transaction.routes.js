const express = require('express');
const router = express.Router();
const transactionController = require('./transaction.controller');
const validate = require('../../common/middlewares/validate');
const authenticate = require('../../common/middlewares/authenticate');
const upload = require('../../common/middlewares/upload');
const { createTransactionSchema, updateTransactionSchema, getTransactionsSchema } = require('./transaction.validation');

router.use(authenticate);

router.post('/', validate(createTransactionSchema), transactionController.createTransaction);
router.get('/', validate(getTransactionsSchema), transactionController.getTransactions);
router.get('/aggregate', transactionController.aggregateTransactions);
router.patch('/:id', validate(updateTransactionSchema), transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

router.post('/:id/receipt', upload.single('receipt'), transactionController.uploadReceipt);
router.post('/import', upload.single('file'), transactionController.importCsv);
router.get('/import/:jobId', transactionController.getImportJobStatus);

module.exports = router;
