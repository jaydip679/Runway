const catchAsync = require('../../common/utils/catchAsync');
const apiResponse = require('../../common/utils/apiResponse');
const accountService = require('./account.service');

exports.createAccount = catchAsync(async (req, res) => {
  const account = await accountService.createAccount(req.user.id, req.body);
  apiResponse.sendSuccess(res, account, null, 201);
});

exports.getAccounts = catchAsync(async (req, res) => {
  const { page, limit } = req.query;
  const result = await accountService.getAccounts(req.user.id, page, limit);
  apiResponse.sendSuccess(res, result.accounts, { total: result.total, page: result.page, limit: result.limit });
});

exports.getAccount = catchAsync(async (req, res) => {
  const account = await accountService.getAccountById(req.user.id, req.params.id);
  apiResponse.sendSuccess(res, account);
});

exports.updateAccount = catchAsync(async (req, res) => {
  const account = await accountService.updateAccount(req.user.id, req.params.id, req.body);
  apiResponse.sendSuccess(res, account);
});

exports.deleteAccount = catchAsync(async (req, res) => {
  await accountService.deleteAccount(req.user.id, req.params.id);
  apiResponse.sendSuccess(res, null, null, 204);
});
