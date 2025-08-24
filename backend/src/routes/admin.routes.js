const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/status', adminController.updateUserStatus);
router.put('/users/:userId/role', adminController.updateUserRole);

router.put('/classes/:classId/approve', adminController.approveClass);

router.get('/reports', adminController.generateReport);
router.get('/logs', adminController.getSystemLogs);

router.post('/announcement', adminController.sendAnnouncement);

module.exports = router;