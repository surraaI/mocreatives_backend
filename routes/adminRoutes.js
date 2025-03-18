const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, restrictTo } = require('../middleware/authMiddleware');


// Update Admin profile
router.patch('/:id',
  authenticate,
  restrictTo('admin', 'superadmin'),
  adminController.updateAdmin
);

// Add other admin routes
module.exports = router;