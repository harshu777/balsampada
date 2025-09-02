const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboarding.controller');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation middleware
const validateBulkOperation = [
  body('userIds').isArray().withMessage('User IDs must be an array'),
  body('userIds.*').isMongoId().withMessage('Invalid user ID format'),
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject')
];

// Routes for admin onboarding management
router.get('/pending', protect, authorize('admin'), onboardingController.getPendingOnboarding);
router.get('/stats', protect, authorize('admin'), onboardingController.getOnboardingStats);

router.post('/bulk', protect, authorize('admin'), validateBulkOperation, onboardingController.bulkOnboardUsers);

// Individual onboarding routes
router.post('/student/:userId', protect, authorize('admin'), onboardingController.onboardStudent);
router.post('/teacher/:userId', protect, authorize('admin'), onboardingController.onboardTeacher);

module.exports = router;