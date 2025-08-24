const express = require('express');
const router = express.Router();
const liveClassController = require('../controllers/liveClass.controller');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation middleware
const validateLiveClass = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('courseId').isMongoId().withMessage('Valid course ID is required'),
  body('scheduledAt').isISO8601().withMessage('Valid scheduled date is required'),
  body('duration').optional().isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes')
];

// Routes
router.get('/', protect, liveClassController.getLiveClasses);
router.get('/:id', protect, liveClassController.getLiveClass);
router.get('/:id/attendance', protect, liveClassController.getAttendanceReport);

router.post(
  '/',
  protect,
  authorize('teacher', 'admin'),
  validateLiveClass,
  liveClassController.createLiveClass
);

router.put(
  '/:id',
  protect,
  authorize('teacher', 'admin'),
  liveClassController.updateLiveClass
);

router.post(
  '/:id/start',
  protect,
  authorize('teacher', 'admin'),
  liveClassController.startLiveClass
);

router.post(
  '/:id/end',
  protect,
  authorize('teacher', 'admin'),
  liveClassController.endLiveClass
);

router.post('/:id/join', protect, liveClassController.joinLiveClass);
router.post('/:id/leave', protect, liveClassController.leaveLiveClass);

router.delete(
  '/:id',
  protect,
  authorize('teacher', 'admin'),
  liveClassController.deleteLiveClass
);

module.exports = router;