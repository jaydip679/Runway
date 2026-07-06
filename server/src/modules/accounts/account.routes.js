const express = require('express');
const authenticate = require('../../common/middlewares/authenticate');
const validate = require('../../common/middlewares/validate');
const accountValidation = require('./account.validation');
const accountController = require('./account.controller');

const router = express.Router();

router.use(authenticate);

router
  .route('/')
  .post(validate(accountValidation.createAccountSchema), accountController.createAccount)
  .get(validate(accountValidation.listAccountsSchema), accountController.getAccounts);

router
  .route('/:id')
  .get(validate(accountValidation.getAccountSchema), accountController.getAccount)
  .patch(validate(accountValidation.updateAccountSchema), accountController.updateAccount)
  .delete(validate(accountValidation.deleteAccountSchema), accountController.deleteAccount);

module.exports = router;
