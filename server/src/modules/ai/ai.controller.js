const catchAsync = require('../../common/utils/catchAsync');
const { sendSuccess } = require('../../common/utils/apiResponse');
const aiService = require('./ai.service');

const queryAffordability = catchAsync(async (req, res) => {
  const { question } = req.body;
  const result = await aiService.queryAffordability(req.user.id, question);

  sendSuccess(res, result);
});

const getChatHistory = catchAsync(async (req, res) => {
  const history = await aiService.getChatHistory(req.user.id);
  sendSuccess(res, history);
});

module.exports = {
  queryAffordability,
  getChatHistory,
};
