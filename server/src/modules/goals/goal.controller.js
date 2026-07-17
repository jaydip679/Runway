const goalService = require('./goal.service');

exports.createGoal = async (req, res, next) => {
  try {
    const goal = await goalService.createGoal(req.user.id, req.body);
    res.status(201).json({ success: true, data: { goal } });
  } catch (error) {
    next(error);
  }
};

exports.getGoals = async (req, res, next) => {
  try {
    const goals = await goalService.getGoals(req.user.id);
    res.status(200).json({ success: true, data: { goals } });
  } catch (error) {
    next(error);
  }
};

exports.updateGoal = async (req, res, next) => {
  try {
    const goal = await goalService.updateGoal(req.user.id, req.params.id, req.body);
    res.status(200).json({ success: true, data: { goal } });
  } catch (error) {
    next(error);
  }
};

exports.deleteGoal = async (req, res, next) => {
  try {
    await goalService.deleteGoal(req.user.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
