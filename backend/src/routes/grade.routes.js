const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/grade.controller');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation middleware
const validateGrade = [
  body('name').notEmpty().withMessage('Grade name is required'),
  body('board').notEmpty().withMessage('Board is required'),
  body('medium').optional().isIn(['English', 'Hindi', 'Regional', 'Bilingual']).withMessage('Invalid medium'),
  body('enrollmentPrice').optional().isFloat({ min: 0 }).withMessage('Enrollment price must be a positive number'),
  body('maxStudents').optional().isInt({ min: 1 }).withMessage('Max students must be at least 1')
];

// Routes
router.get('/', protect, gradeController.getGrades);
router.get('/board/:board', protect, gradeController.getGradesByBoard);
router.get('/:id', protect, gradeController.getGrade);

router.post(
  '/',
  protect,
  authorize('admin'),
  validateGrade,
  gradeController.createGrade
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  gradeController.updateGrade
);

router.post(
  '/:id/enroll',
  protect,
  authorize('admin', 'teacher'),
  gradeController.enrollStudent
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  gradeController.deleteGrade
);

module.exports = router;