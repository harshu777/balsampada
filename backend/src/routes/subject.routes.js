const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subject.controller');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation middleware
const validateSubject = [
  body('name').notEmpty().withMessage('Subject name is required'),
  body('code').notEmpty().withMessage('Subject code is required'),
  body('gradeId').isMongoId().withMessage('Valid grade ID is required'),
];

const validateTeacher = [
  body('teacherId').isMongoId().withMessage('Valid teacher ID is required'),
  body('isPrimary').optional().isBoolean().withMessage('isPrimary must be boolean'),
  body('specialization').optional().isString().withMessage('Specialization must be a string')
];

// Routes
router.get('/', protect, subjectController.getSubjects);
router.get('/:id', protect, subjectController.getSubject);
router.get('/teacher/:teacherId?', protect, subjectController.getSubjectsByTeacher);
router.get('/grade/:gradeId/subjects', protect, subjectController.getSubjectsByGrade);

router.post(
  '/',
  protect,
  authorize('admin'),
  validateSubject,
  subjectController.createSubject
);

router.put(
  '/:id',
  protect,
  authorize('admin', 'teacher'),
  subjectController.updateSubject
);

router.post(
  '/:id/teachers',
  protect,
  authorize('admin'),
  validateTeacher,
  subjectController.addTeacher
);

router.delete(
  '/:id/teachers/:teacherId',
  protect,
  authorize('admin'),
  subjectController.removeTeacher
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  subjectController.deleteSubject
);

module.exports = router;