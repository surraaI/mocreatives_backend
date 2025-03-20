const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticate, restrictTo } = require('../middlewares/authMiddleware');
const { sanitizeContactData } = require('../middlewares/authMiddleware');

router.post('/', contactController.submitContactForm);

router.get(
    '/',
    authenticate,
    restrictTo(['admin', 'superadmin']),
    sanitizeContactData,
    contactController.getAllContacts
  );

router.get(
  '/:id',
  authenticate,
  restrictTo(['admin', 'superadmin']),
  contactController.getContact
);

module.exports = router;