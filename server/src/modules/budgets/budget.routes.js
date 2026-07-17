const express = require('express');
const router = express.Router();
const budgetController = require('./budget.controller');
const validate = require('../../common/middlewares/validate');
const { createBudgetSchema, updateBudgetSchema } = require('./budget.schema');
const authenticate = require('../../common/middlewares/authenticate');

router.use(authenticate);

router.post('/', validate(createBudgetSchema), budgetController.createBudget);
router.get('/', budgetController.getBudgets);
router.put('/:id', validate(updateBudgetSchema), budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;
