const express = require('express');
const router = express.Router();
const multer = require('multer');
const assignmentController = require('../controllers/assignment.controller');
const { protect, authorize, checkCourseOwnership } = require('../middleware/auth');
const { setOrganizationContext } = require('../middleware/organization');

// Configure multer for memory storage (files will be in req.files)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Teacher and student specific routes
router.get('/teacher', protect, setOrganizationContext, authorize('teacher', 'admin'), assignmentController.getTeacherAssignments);
router.get('/student', protect, setOrganizationContext, authorize('student'), assignmentController.getStudentAssignments);

router.get('/class/:classId', protect, setOrganizationContext, assignmentController.getAssignments);
router.post('/class/:classId', protect, setOrganizationContext, authorize('teacher', 'admin'), upload.any(), assignmentController.createAssignment);

router.get('/:id', protect, setOrganizationContext, assignmentController.getAssignment);
router.put('/:id', protect, setOrganizationContext, authorize('teacher', 'admin'), assignmentController.updateAssignment);
router.delete('/:id', protect, setOrganizationContext, authorize('teacher', 'admin'), assignmentController.deleteAssignment);

router.post('/:id/submit', protect, setOrganizationContext, authorize('student'), assignmentController.submitAssignment);
router.post('/:id/grade', protect, setOrganizationContext, authorize('teacher', 'admin'), assignmentController.gradeAssignment);
router.get('/:id/submissions', protect, setOrganizationContext, authorize('teacher', 'admin'), assignmentController.getSubmissions);
router.put('/:id/publish', protect, setOrganizationContext, authorize('teacher', 'admin'), assignmentController.publishAssignment);

module.exports = router;