const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progress.controller');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Student progress routes
router.post('/lesson/:classId/:lessonId/complete', authorize('student'), progressController.markLessonCompleted);
router.get('/class/:classId', progressController.getClassProgress);
router.get('/overall', authorize('student'), progressController.getOverallProgress);
router.post('/attendance/:classId', authorize('student'), progressController.markAttendance);

// Teacher progress routes
router.get('/teacher/class/:classId', authorize('teacher', 'admin'), progressController.getTeacherClassProgress);

module.exports = router;