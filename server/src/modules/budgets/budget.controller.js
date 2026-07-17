const budgetService = require('./budget.service');

exports.createBudget = async (req, res, next) => {
  try {
    const budget = await budgetService.createBudget(req.user.id, req.body);
    res.status(201).json({ success: true, data: { budget } });
  } catch (error) {
    next(error);
  }
};

exports.getBudgets = async (req, res, next) => {
  try {
    const budgets = await budgetService.getBudgets(req.user.id);
    res.status(200).json({ success: true, data: { budgets } });
  } catch (error) {
    next(error);
  }
};

exports.updateBudget = async (req, res, next) => {
  try {
    const budget = await budgetService.updateBudget(req.user.id, req.params.id, req.body);
    res.status(200).json({ success: true, data: { budget } });
  } catch (error) {
    next(error);
  }
};

exports.deleteBudget = async (req, res, next) => {
  try {
    await budgetService.deleteBudget(req.user.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
