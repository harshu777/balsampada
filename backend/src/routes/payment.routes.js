const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect, authorize } = require('../middleware/auth');

router.post('/create-order', protect, paymentController.createOrder);
router.post('/verify', protect, paymentController.verifyPayment);
router.get('/history', protect, paymentController.getPaymentHistory);
router.get('/:id', protect, paymentController.getPaymentDetails);

router.post('/refund', protect, authorize('admin'), paymentController.initiateRefund);
router.get('/', protect, authorize('admin'), paymentController.getAllPayments);

module.exports = router;