const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth');

router.post('/local', 
  protect, 
  uploadController.uploadSingle, 
  uploadController.uploadLocal
);

router.post('/s3', 
  protect, 
  uploadController.uploadSingle, 
  uploadController.uploadToS3
);

router.post('/cloudinary', 
  protect, 
  uploadController.uploadSingle, 
  uploadController.uploadToCloudinary
);

router.post('/multiple', 
  protect, 
  uploadController.uploadMultiple, 
  uploadController.uploadMultipleFiles
);

router.delete('/s3', protect, uploadController.deleteFromS3);
router.delete('/cloudinary', protect, uploadController.deleteFromCloudinary);

module.exports = router;