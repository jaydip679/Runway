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
  const commitment = await recurringService.dismissRecurring(req.user.id, req.params.id);
  sendSuccess(res, commitment);
});

const deleteRecurring = catchAsync(async (req, res) => {
  await recurringService.deleteRecurring(req.user.id, req.params.id);
  res.status(204).send();
});

module.exports = {
  getRecurringList,
  createRecurring,
  updateRecurring,
  confirmRecurring,
  dismissRecurring,
  deleteRecurring
};
