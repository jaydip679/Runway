const express = require('express');
const router = express.Router();
const validate = require('../../common/middlewares/validate');
const { updateUserSchema } = require('./user.validation');
const userController = require('./user.controller');
const authenticate = require('../../common/middlewares/authenticate');
const upload = require('../../common/middlewares/upload');

// All /users routes require authentication
router.use(authenticate);

router.get('/me', userController.getMe);
router.patch('/me', validate(updateUserSchema), userController.updateMe);
router.post('/me/avatar', upload.single('avatar'), userController.uploadAvatar);

module.exports = router;
