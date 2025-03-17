const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, restrictTo } = require('../middleware/authMiddleware');

// Create Admin (SuperAdmin only)
router.post('/',
  authenticate,
  restrictTo('superadmin'),
  adminController.createAdmin
);

// Update Admin profile
router.patch('/:id',
  authenticate,
  restrictTo('admin', 'superadmin'),
  adminController.updateAdmin
);

// Add other admin routes
module.exports = router;