const catchAsync = require('../../common/utils/catchAsync');
const { sendSuccess } = require('../../common/utils/apiResponse');
const recurringService = require('./recurring.service');

const getRecurringList = catchAsync(async (req, res) => {
  const commitments = await recurringService.listRecurring(req.user.id);
  sendSuccess(res, commitments);
});

const createRecurring = catchAsync(async (req, res) => {
  const commitment = await recurringService.createRecurring(req.user.id, req.body);
  sendSuccess(res, commitment, null, 201);
});

const updateRecurring = catchAsync(async (req, res) => {
  const commitment = await recurringService.updateRecurring(req.user.id, req.params.id, req.body);
  sendSuccess(res, commitment);
});

const confirmRecurring = catchAsync(async (req, res) => {
  const commitment = await recurringService.confirmRecurring(req.user.id, req.params.id);
  sendSuccess(res, commitment);
});

const dismissRecurring = catchAsync(async (req, res) => {
  const result = await recurringService.dismissRecurring(req.user.id, req.params.id);
  return sendSuccess(res, result);
});

const deleteRecurring = catchAsync(async (req, res) => {
  await recurringService.deleteRecurring(req.user.id, req.params.id);
  res.status(204).send();
});

const getPendingOccurrences = catchAsync(async (req, res) => {
  const result = await recurringService.getPendingOccurrences(req.user.id);
  return sendSuccess(res, result);
});

const resolveOccurrence = catchAsync(async (req, res) => {
  const { action } = req.body;
  if (!['COMPLETE', 'SKIP'].includes(action)) {
    return res.status(400).json({ success: false, error: { message: 'Invalid action' } });
  }
  const result = await recurringService.resolveOccurrence(req.user.id, req.params.id, action);
  return sendSuccess(res, result);
});

module.exports = {
  getRecurringList,
  createRecurring,
  updateRecurring,
  confirmRecurring,
  dismissRecurring,
  deleteRecurring,
  getPendingOccurrences,
  resolveOccurrence
};
