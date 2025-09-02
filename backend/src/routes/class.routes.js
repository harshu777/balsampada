const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const classController = require('../controllers/class.controller');
const { protect, authorize, checkClassOwnership, optionalAuth } = require('../middleware/auth');
const { setOrganizationContext } = require('../middleware/organization');

const validateClass = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('price').isNumeric().withMessage('Valid price is required'),
  body('duration').isNumeric().withMessage('Duration is required')
];

// Public route - needs organization context if user is authenticated
router.get('/', optionalAuth, async (req, res, next) => {
  if (req.user) {
    await setOrganizationContext(req, res, next);
  } else {
    next();
  }
}, classController.getClasses);
router.get('/teacher', protect, setOrganizationContext, authorize('teacher', 'admin'), classController.getTeacherClasses);
router.get('/:id', optionalAuth, async (req, res, next) => {
  if (req.user) {
    await setOrganizationContext(req, res, next);
  } else {
    next();
  }
}, classController.getClass);

router.post('/', protect, setOrganizationContext, authorize('teacher', 'admin'), validateClass, classController.createClass);
router.put('/:id', protect, setOrganizationContext, checkClassOwnership, classController.updateClass);
router.delete('/:id', protect, setOrganizationContext, checkClassOwnership, classController.deleteClass);

router.put('/:id/publish', protect, setOrganizationContext, checkClassOwnership, classController.publishClass);

router.post('/:id/modules', protect, setOrganizationContext, checkClassOwnership, classController.addModule);
router.put('/:id/modules/:moduleId', protect, setOrganizationContext, checkClassOwnership, classController.updateModule);
router.delete('/:id/modules/:moduleId', protect, setOrganizationContext, checkClassOwnership, classController.deleteModule);

router.post('/:id/modules/:moduleId/lessons', protect, setOrganizationContext, checkClassOwnership, classController.addLesson);

router.post('/:id/rate', protect, setOrganizationContext, classController.rateClass);

module.exports = router;