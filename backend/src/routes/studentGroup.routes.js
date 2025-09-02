const express = require('express');
const router = express.Router();
const studentGroupController = require('../controllers/studentGroup.controller');
const { protect, authorize } = require('../middleware/auth');
const { setOrganizationContext } = require('../middleware/organization');

// All routes require teacher authorization
router.use(protect);
router.use(setOrganizationContext);
router.use(authorize('teacher', 'admin'));

// Group management routes
router.post('/', studentGroupController.createGroup);
router.get('/', studentGroupController.getTeacherGroups);
router.get('/:id', studentGroupController.getGroup);
router.put('/:id', studentGroupController.updateGroup);
router.delete('/:id', studentGroupController.deleteGroup);

// Student management within groups
router.post('/:id/students/add', studentGroupController.addStudents);
router.post('/:id/students/remove', studentGroupController.removeStudents);

// Get available students for a class
router.get('/class/:classId/available-students', studentGroupController.getAvailableStudents);

module.exports = router;