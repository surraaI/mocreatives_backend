const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { authenticate, restrictTo } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/fileUploadMiddleware');

// Public routes
router.get('/', blogController.getAllBlogs);
router.get('/:id', blogController.getBlog);

// Protected routes (Admin/SuperAdmin only)
router.post(
  '/',
  authenticate,
  restrictTo(['admin', 'superadmin']),
  upload.single('image'),
  blogController.createBlog
);

router.patch(
  '/:id',
  authenticate,
  restrictTo(['admin', 'superadmin']),
  upload.single('image'),
  blogController.updateBlog
);

router.delete(
  '/:id',
  authenticate,
  restrictTo(['admin', 'superadmin']),
  blogController.deleteBlog
);

module.exports = router;