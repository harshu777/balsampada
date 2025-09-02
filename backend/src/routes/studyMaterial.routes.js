const express = require('express');
const router = express.Router();
const studyMaterialController = require('../controllers/studyMaterial.controller');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Teacher routes
router.post('/upload', authorize('teacher', 'admin'), studyMaterialController.uploadMaterial);
router.get('/teacher', authorize('teacher', 'admin'), studyMaterialController.getTeacherMaterials);
router.get('/stats', authorize('teacher', 'admin'), studyMaterialController.getMaterialStats);
router.get('/categories', studyMaterialController.getCategories);

// General routes
router.get('/class/:classId', studyMaterialController.getClassMaterials);
router.get('/:id', studyMaterialController.getMaterial);
router.put('/:id', authorize('teacher', 'admin'), studyMaterialController.updateMaterial);
router.delete('/:id', authorize('teacher', 'admin'), studyMaterialController.deleteMaterial);
router.get('/:id/download', studyMaterialController.downloadMaterial);

module.exports = router;