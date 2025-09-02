const express = require('express');
const router = express.Router();
const liveClassController = require('../controllers/liveClass.controller');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { setOrganizationContext } = require('../middleware/organization');

// Validation middleware
const validateLiveClass = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('classId').isMongoId().withMessage('Valid class ID is required'),
  body('scheduledAt').isISO8601().withMessage('Valid scheduled date is required'),
  body('duration').optional().isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes')
];

// Routes
router.get('/', protect, setOrganizationContext, liveClassController.getLiveClasses);
router.get('/:id', protect, setOrganizationContext, liveClassController.getLiveClass);
router.get('/:id/attendance', protect, setOrganizationContext, liveClassController.getAttendanceReport);

router.post(
  '/',
  protect,
  setOrganizationContext,
  authorize('teacher', 'admin'),
  validateLiveClass,
  liveClassController.createLiveClass
);

router.put(
  '/:id',
  protect,
  setOrganizationContext,
  authorize('teacher', 'admin'),
  liveClassController.updateLiveClass
);

router.post(
  '/:id/start',
  protect,
  setOrganizationContext,
  authorize('teacher', 'admin'),
  liveClassController.startLiveClass
);

router.post(
  '/:id/end',
  protect,
  setOrganizationContext,
  authorize('teacher', 'admin'),
  liveClassController.endLiveClass
);

router.post('/:id/join', protect, setOrganizationContext, liveClassController.joinLiveClass);
router.post('/:id/leave', protect, setOrganizationContext, liveClassController.leaveLiveClass);

router.post(
  '/delete-selected',
  protect,
  setOrganizationContext,
  authorize('teacher', 'admin'),
  liveClassController.deleteSelectedClasses
);

router.delete(
  '/:id',
  protect,
  setOrganizationContext,
  authorize('teacher', 'admin'),
  liveClassController.deleteLiveClass
);

module.exports = router;