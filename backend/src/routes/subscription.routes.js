const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const subscriptionController = require('../controllers/subscription.controller');
const { protect, authorize } = require('../middleware/auth');
const { setOrganizationContext } = require('../middleware/organization');

// Validation rules
const createSubscriptionValidation = [
  body('planKey')
    .notEmpty().withMessage('Plan is required')
    .isIn(['free', 'basic', 'pro', 'enterprise']).withMessage('Invalid plan selected')
];

// Public routes
router.get('/plans', subscriptionController.getPlans);

// Webhook endpoint (no auth required, uses signature verification)
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);

// Protected routes - require authentication and organization context
router.use(protect);
router.use(setOrganizationContext);

// Get current subscription
router.get('/current', subscriptionController.getCurrentSubscription);

// Subscription management (owner/admin only)
router.post(
  '/create',
  authorize('owner', 'admin'),
  createSubscriptionValidation,
  subscriptionController.createSubscription
);

router.post(
  '/cancel',
  authorize('owner', 'admin'),
  subscriptionController.cancelSubscription
);

router.post(
  '/pause',
  authorize('owner', 'admin'),
  subscriptionController.pauseSubscription
);

router.post(
  '/resume',
  authorize('owner', 'admin'),
  subscriptionController.resumeSubscription
);

module.exports = router;