const express = require('express');
const authenticate = require('../../common/middlewares/authenticate');
const validate = require('../../common/middlewares/validate');
const categoryValidation = require('./category.validation');
const categoryController = require('./category.controller');

const router = express.Router();

router.use(authenticate);

router
  .route('/')
  .post(validate(categoryValidation.createCategorySchema), categoryController.createCategory)
  .get(validate(categoryValidation.listCategoriesSchema), categoryController.getCategories);

router
  .route('/:id')
  .patch(validate(categoryValidation.updateCategorySchema), categoryController.updateCategory)
  .delete(validate(categoryValidation.deleteCategorySchema), categoryController.deleteCategory);

module.exports = router;
