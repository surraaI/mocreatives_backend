const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, restrictTo } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/fileUploadMiddleware');

// Update Admin profile (with photo upload)
router.patch(
  '/:id',
  authenticate,
  restrictTo('admin', 'superadmin'),
  upload.single('profilePhoto'), 
  adminController.updateAdmin
);

// Delete admin (superadmin only)
router.delete(
  '/:id',
  authenticate,
  restrictTo(['superadmin']),
  adminController.deleteAdmin
);

module.exports = router;