const StudyMaterial = require('../models/StudyMaterial');
const Class = require('../models/Class');
const { createUploader, generateSignedUrl, deleteFile, streamFile, FILE_TYPES, MATERIAL_CATEGORIES } = require('../config/storage.config');
const path = require('path');
const NotificationService = require('../services/notificationService');

// Helper function to get file type from mimetype
const getFileType = (mimetype) => {
  for (const [type, config] of Object.entries(FILE_TYPES)) {
    if (config.mimeTypes.includes(mimetype)) {
      return type;
    }
  }
  return 'other';
};

// Create uploader instance
const upload = createUploader();

// Upload study material
exports.uploadMaterial = async (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    try {
      const {
        title,
        description,
        type,
        classId,
        module,
        tags,
        visibility,
        fileUrl
      } = req.body;

      // Verify class exists and teacher has access
      const classItem = await Class.findById(classId);
      if (!classItem) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      if (classItem.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to upload materials for this class'
        });
      }

      // Prepare material data
      const materialData = {
        title,
        description,
        type,
        class: classId,
        uploadedBy: req.user._id,
        module,
        category: req.body.category || 'general',
        tags: tags ? JSON.parse(tags) : [],
        visibility: visibility || 'enrolled'
      };

      // Handle file or URL
      if (type === 'link') {
        materialData.fileUrl = fileUrl;
      } else if (req.file) {
        // Store the full S3 key or local file path
        if (req.file.key) {
          // S3 storage - store the key
          materialData.fileUrl = req.file.key;
        } else {
          // Local storage - construct path with category
          const category = req.body.category || 'general';
          const fileType = getFileType(req.file.mimetype);
          const typeFolder = FILE_TYPES[fileType]?.folder || 'other';
          materialData.fileUrl = `study-materials/${category}/${typeFolder}/${req.file.filename}`;
        }
        materialData.fileName = req.file.originalname;
        materialData.fileSize = req.file.size;
        materialData.mimeType = req.file.mimetype;
      } else {
        return res.status(400).json({
          success: false,
          message: 'File is required for non-link materials'
        });
      }

      const material = await StudyMaterial.create(materialData);
      
      await material.populate([
        { path: 'class', select: 'title subject' },
        { path: 'uploadedBy', select: 'name email' }
      ]);

      // Send notification to enrolled students
      await NotificationService.notifyMaterialUploaded(
        material._id,
        material.class,
        req.user.id,
        material.title
      );

      res.status(201).json({
        success: true,
        message: 'Study material uploaded successfully',
        data: material
      });
    } catch (error) {
      console.error('Upload material error:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading study material'
      });
    }
  });
};

// Get all materials for a teacher
exports.getTeacherMaterials = async (req, res) => {
  try {
    const materials = await StudyMaterial.find({
      uploadedBy: req.user._id,
      isActive: true
    })
    .populate('class', 'title subject')
    .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: materials
    });
  } catch (error) {
    console.error('Get teacher materials error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching materials'
    });
  }
};

// Get materials for a specific class
exports.getClassMaterials = async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Check if user has access to this class
    const query = {
      class: classId,
      isActive: true
    };

    // Students can only see public or enrolled materials
    if (req.user.role === 'student') {
      query.$or = [
        { visibility: 'public' },
        { visibility: 'enrolled' }
      ];
    }

    const materials = await StudyMaterial.find(query)
      .populate('uploadedBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: materials
    });
  } catch (error) {
    console.error('Get class materials error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching materials'
    });
  }
};

// Get single material
exports.getMaterial = async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id)
      .populate('class', 'title subject')
      .populate('uploadedBy', 'name email');

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    // Check access permissions
    if (material.visibility === 'private' && 
        material.uploadedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Increment view count
    await material.incrementViews(req.user._id);

    res.status(200).json({
      success: true,
      data: material
    });
  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching material'
    });
  }
};

// Update material
exports.updateMaterial = async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    // Check ownership
    if (material.uploadedBy.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this material'
      });
    }

    const updates = {
      title: req.body.title || material.title,
      description: req.body.description || material.description,
      module: req.body.module || material.module,
      tags: req.body.tags || material.tags,
      visibility: req.body.visibility || material.visibility,
      lastModified: Date.now()
    };

    Object.assign(material, updates);
    await material.save();

    await material.populate([
      { path: 'class', select: 'title subject' },
      { path: 'uploadedBy', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Material updated successfully',
      data: material
    });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating material'
    });
  }
};

// Delete material
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    // Check ownership
    if (material.uploadedBy.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this material'
      });
    }

    // Soft delete
    material.isActive = false;
    await material.save();

    res.status(200).json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting material'
    });
  }
};

// Download material
exports.downloadMaterial = async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    // Check access
    if (material.visibility === 'private' && 
        material.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Increment download count
    await material.incrementDownloads(req.user._id);

    // For links, redirect
    if (material.type === 'link') {
      return res.redirect(material.fileUrl);
    }

    // For files, use storage system to stream/download
    try {
      await streamFile(material.fileUrl, res);
    } catch (streamError) {
      // Fallback to old method for existing files
      const filePath = path.join(__dirname, '../..', 'uploads', material.fileUrl);
      res.download(filePath, material.fileName);
    }
  } catch (error) {
    console.error('Download material error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading material'
    });
  }
};

// Get statistics for teacher's materials
exports.getMaterialStats = async (req, res) => {
  try {
    const materials = await StudyMaterial.find({
      uploadedBy: req.user._id,
      isActive: true
    });

    const stats = {
      total: materials.length,
      totalDownloads: materials.reduce((sum, m) => sum + m.downloads, 0),
      totalViews: materials.reduce((sum, m) => sum + m.views, 0),
      byType: {},
      byClass: {}
    };

    // Count by type
    materials.forEach(m => {
      stats.byType[m.type] = (stats.byType[m.type] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get material stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
};

// Get material categories
exports.getCategories = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: MATERIAL_CATEGORIES
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
};