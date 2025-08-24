const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');
const { protect, authorize, checkCourseOwnership } = require('../middleware/auth');

router.get('/courses/:courseId/assignments', protect, assignmentController.getAssignments);
router.post('/courses/:courseId/assignments', protect, authorize('teacher', 'admin'), assignmentController.createAssignment);

router.get('/:id', protect, assignmentController.getAssignment);
router.put('/:id', protect, authorize('teacher', 'admin'), assignmentController.updateAssignment);
router.delete('/:id', protect, authorize('teacher', 'admin'), assignmentController.deleteAssignment);

router.post('/:id/submit', protect, authorize('student'), assignmentController.submitAssignment);
router.post('/:id/grade', protect, authorize('teacher', 'admin'), assignmentController.gradeAssignment);
router.get('/:id/submissions', protect, authorize('teacher', 'admin'), assignmentController.getSubmissions);
router.put('/:id/publish', protect, authorize('teacher', 'admin'), assignmentController.publishAssignment);

module.exports = router;