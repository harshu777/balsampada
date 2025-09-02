const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollment.controller');
const { protect, authorize, checkClassOwnership } = require('../middleware/auth');
const { setOrganizationContext } = require('../middleware/organization');

router.post('/classes/:classId/enroll', protect, setOrganizationContext, enrollmentController.enrollInClass);
router.get('/my-enrollments', protect, setOrganizationContext, enrollmentController.getMyEnrollments);
router.get('/:id', protect, setOrganizationContext, enrollmentController.getEnrollment);

router.put('/classes/:classId/progress', protect, setOrganizationContext, enrollmentController.updateProgress);
router.get('/classes/:classId/attendance', protect, setOrganizationContext, enrollmentController.getAttendance);
router.post('/classes/:classId/attendance', protect, setOrganizationContext, authorize('teacher', 'admin'), enrollmentController.markAttendance);

router.get('/classes/:classId/students', protect, setOrganizationContext, authorize('teacher', 'admin'), enrollmentController.getClassEnrollments);
router.get('/teacher/students', protect, setOrganizationContext, authorize('teacher', 'admin'), enrollmentController.getTeacherStudents);

router.post('/classes/:classId/drop', protect, setOrganizationContext, enrollmentController.dropClass);
router.post('/classes/:classId/certificate', protect, setOrganizationContext, enrollmentController.generateCertificate);

// Payment management routes
router.put('/:enrollmentId/payment', protect, setOrganizationContext, authorize('teacher', 'admin'), enrollmentController.updatePaymentStatus);
router.get('/payments/pending', protect, setOrganizationContext, authorize('teacher', 'admin'), enrollmentController.getPendingPayments);

module.exports = router;