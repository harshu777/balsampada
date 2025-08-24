const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const uploadController = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth');

router.get('/profile/:id?', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.post('/avatar', protect, uploadController.uploadSingle, userController.uploadAvatar);

router.get('/student/dashboard', protect, userController.getStudentDashboard);
router.get('/teacher/dashboard', protect, userController.getTeacherDashboard);

router.get('/notifications', protect, userController.getNotifications);
router.put('/notifications/:id/read', protect, userController.markNotificationRead);

router.get('/search', protect, userController.searchUsers);

module.exports = router;