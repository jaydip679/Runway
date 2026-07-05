const userService = require('./user.service');
const catchAsync = require('../../common/utils/catchAsync');
const { sendSuccess } = require('../../common/utils/apiResponse');

const getMe = catchAsync(async (req, res) => {
  const user = await userService.getMe(req.user.id);
  sendSuccess(res, user);
});

const updateMe = catchAsync(async (req, res) => {
  const user = await userService.updateMe(req.user.id, req.body);
  sendSuccess(res, user, 'Profile updated successfully');
});

const uploadAvatar = catchAsync(async (req, res) => {
  const user = await userService.uploadAvatar(req.user.id, req.file);
  sendSuccess(res, user, 'Avatar uploaded successfully');
});

module.exports = {
  getMe,
  updateMe,
  uploadAvatar
};
