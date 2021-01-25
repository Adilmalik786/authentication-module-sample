const express = require("express");
const router = express.Router();
const userController = require('../controller/userController');
const authController = require('../controller/authController');
const passport = require("passport");

//Authentication Routes
router.post('/sign-up', authController.createUser);
router.post('/sign-in', authController.login);

router.post('/auth/google', authController.googleLogin);

// Password Related Routes
router.route('/forget-password').post(authController.forgetPassword)
router.route('/reset-password/:token').patch(authController.resetPassword)
router.route('/update-password').patch(authController.protect, authController.updatePassword)



module.exports = router;
