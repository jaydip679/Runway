const express = require('express');
const authenticate = require('../../common/middlewares/authenticate');
const validate = require('../../common/middlewares/validate');
const { createRecurringSchema, updateRecurringSchema, confirmDismissSchema } = require('./recurring.schema');
const recurringController = require('./recurring.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', recurringController.getRecurringList);
router.post('/', validate(createRecurringSchema), recurringController.createRecurring);
router.patch('/:id', validate(updateRecurringSchema), recurringController.updateRecurring);
router.delete('/:id', recurringController.deleteRecurring);

router.post('/:id/confirm', validate(confirmDismissSchema), recurringController.confirmRecurring);
router.post('/:id/dismiss', validate(confirmDismissSchema), recurringController.dismissRecurring);

router.get('/occurrences/pending', recurringController.getPendingOccurrences);
router.post('/occurrences/:id/resolve', recurringController.resolveOccurrence);

module.exports = router;
