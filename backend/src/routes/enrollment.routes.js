const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollment.controller');
const { protect, authorize, checkClassOwnership } = require('../middleware/auth');

router.post('/classes/:classId/enroll', protect, enrollmentController.enrollInClass);
router.get('/my-enrollments', protect, enrollmentController.getMyEnrollments);
router.get('/:id', protect, enrollmentController.getEnrollment);

router.put('/classes/:classId/progress', protect, enrollmentController.updateProgress);
router.get('/classes/:classId/attendance', protect, enrollmentController.getAttendance);
router.post('/classes/:classId/attendance', protect, authorize('teacher', 'admin'), enrollmentController.markAttendance);

router.get('/classes/:classId/students', protect, authorize('teacher', 'admin'), enrollmentController.getClassEnrollments);

router.post('/classes/:classId/drop', protect, enrollmentController.dropClass);
router.post('/classes/:classId/certificate', protect, enrollmentController.generateCertificate);

module.exports = router;