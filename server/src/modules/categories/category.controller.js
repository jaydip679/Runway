const catchAsync = require('../../common/utils/catchAsync');
const apiResponse = require('../../common/utils/apiResponse');
const categoryService = require('./category.service');

exports.createCategory = catchAsync(async (req, res) => {
  const category = await categoryService.createCategory(req.user.id, req.body);
  apiResponse.sendSuccess(res, category, null, 201);
});

exports.getCategories = catchAsync(async (req, res) => {
  const { page, limit, type } = req.query;
  const result = await categoryService.getCategories(req.user.id, page, limit, type);
  apiResponse.sendSuccess(res, result.categories, { total: result.total, page: result.page, limit: result.limit });
});

exports.updateCategory = catchAsync(async (req, res) => {
  const category = await categoryService.updateCategory(req.user.id, req.params.id, req.body);
  apiResponse.sendSuccess(res, category);
});

exports.deleteCategory = catchAsync(async (req, res) => {
  await categoryService.deleteCategory(req.user.id, req.params.id);
  apiResponse.sendSuccess(res, null, null, 204);
});
