const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

router.post('/', subscriptionController.subscribe);
router.get('/verify/:token', subscriptionController.verify);
router.get('/unsubscribe/:token', subscriptionController.unsubscribe);

module.exports = router;