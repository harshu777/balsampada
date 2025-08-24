const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const classController = require('../controllers/class.controller');
const { protect, authorize, checkClassOwnership, optionalAuth } = require('../middleware/auth');

const validateClass = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('price').isNumeric().withMessage('Valid price is required'),
  body('duration').isNumeric().withMessage('Duration is required')
];

router.get('/', optionalAuth, classController.getClasses);
router.get('/teacher', protect, authorize('teacher', 'admin'), classController.getTeacherClasses);
router.get('/:id', optionalAuth, classController.getClass);

router.post('/', protect, authorize('teacher', 'admin'), validateClass, classController.createClass);
router.put('/:id', protect, checkClassOwnership, classController.updateClass);
router.delete('/:id', protect, checkClassOwnership, classController.deleteClass);

router.put('/:id/publish', protect, checkClassOwnership, classController.publishClass);

router.post('/:id/modules', protect, checkClassOwnership, classController.addModule);
router.put('/:id/modules/:moduleId', protect, checkClassOwnership, classController.updateModule);
router.delete('/:id/modules/:moduleId', protect, checkClassOwnership, classController.deleteModule);

router.post('/:id/modules/:moduleId/lessons', protect, checkClassOwnership, classController.addLesson);

router.post('/:id/rate', protect, classController.rateClass);

module.exports = router;