const transactionService = require('./transaction.service');
const { sendSuccess } = require('../../common/utils/apiResponse');

const createTransaction = async (req, res) => {
  const transaction = await transactionService.createTransaction(req.user.id, req.body);
  sendSuccess(res, transaction, null, 201);
};

const getTransactions = async (req, res) => {
  const result = await transactionService.getTransactions(req.user.id, req.query);
  sendSuccess(res, result.data, { nextCursor: result.nextCursor });
};

const updateTransaction = async (req, res) => {
  const transaction = await transactionService.updateTransaction(req.user.id, req.params.id, req.body);
  sendSuccess(res, transaction);
};

const deleteTransaction = async (req, res) => {
  await transactionService.deleteTransaction(req.user.id, req.params.id);
  sendSuccess(res, null, null, 204);
};

const aggregateTransactions = async (req, res) => {
  const data = await transactionService.aggregateTransactions(req.user.id, req.query);
  sendSuccess(res, data);
};

const uploadReceipt = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' } });
  }
  const receiptUrl = `/uploads/receipts/${req.file.filename}`;
  const transaction = await transactionService.uploadReceipt(req.user.id, req.params.id, receiptUrl);
  sendSuccess(res, transaction);
};

const importCsv = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'No CSV file uploaded' } });
  }
  const { accountId } = req.body;
  if (!accountId) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'accountId is required' } });
  }

  const job = await transactionService.importCsv(req.user.id, accountId, req.file.path);
  sendSuccess(res, { jobId: job.id }, null, 202);
};

const getImportJobStatus = async (req, res) => {
  const job = await transactionService.getImportJobStatus(req.user.id, req.params.jobId);
  sendSuccess(res, job);
};

module.exports = {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  aggregateTransactions,
  uploadReceipt,
  importCsv,
  getImportJobStatus
};
