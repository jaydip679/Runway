const express = require('express');
const router = express.Router();
const goalController = require('./goal.controller');
const validate = require('../../common/middlewares/validate');
const { createGoalSchema, updateGoalSchema } = require('./goal.schema');
const authenticate = require('../../common/middlewares/authenticate');

router.use(authenticate);

router.post('/', validate(createGoalSchema), goalController.createGoal);
router.get('/', goalController.getGoals);
router.put('/:id', validate(updateGoalSchema), goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);

module.exports = router;
