const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, restrictTo } = require('../middlewares/authMiddleware');

router.post(
  '/register',
  authenticate,
  restrictTo(['superadmin']),
  authController.registerAdmin
);

router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
router.patch('/update-password', authenticate, authController.updatePassword);

module.exports = router;