const multer = require('multer');
const path = require('path');

// File type definitions
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg'];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

// Avatar validation
const validateAvatar = (req, file, cb) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed for avatars'), false);
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return cb(new Error('Avatar file size must be less than 5MB'), false);
  }
  cb(null, true);
};

// Study material validation
const validateStudyMaterial = (req, file, cb) => {
  const allowedTypes = [
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_DOCUMENT_TYPES,
    ...ALLOWED_VIDEO_TYPES,
    ...ALLOWED_AUDIO_TYPES
  ];
  
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('File type not supported'), false);
  }
  
  let maxSize = MAX_DOCUMENT_SIZE; // default
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    maxSize = MAX_IMAGE_SIZE;
  } else if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    maxSize = MAX_VIDEO_SIZE;
  } else if (ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
    maxSize = MAX_AUDIO_SIZE;
  }
  
  if (file.size > maxSize) {
    return cb(new Error(`File size exceeds limit of ${maxSize / (1024 * 1024)}MB`), false);
  }
  
  cb(null, true);
};

// Assignment submission validation
const validateAssignmentFile = (req, file, cb) => {
  const allowedTypes = [
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_DOCUMENT_TYPES
  ];
  
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only documents and images are allowed for assignments'), false);
  }
  
  const maxSize = file.mimetype.startsWith('image/') ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
  if (file.size > maxSize) {
    return cb(new Error(`File size exceeds limit of ${maxSize / (1024 * 1024)}MB`), false);
  }
  
  cb(null, true);
};

// Sanitize filename
const sanitizeFilename = (filename) => {
  // Remove dangerous characters and normalize
  const sanitized = filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
  
  // Add timestamp to avoid conflicts
  const timestamp = Date.now();
  const extension = path.extname(sanitized);
  const nameWithoutExt = path.basename(sanitized, extension);
  
  return `${nameWithoutExt}_${timestamp}${extension}`;
};

// Storage configuration for different upload types
const createStorage = (uploadPath, filenamePrefix = '') => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const sanitizedName = sanitizeFilename(file.originalname);
      cb(null, `${filenamePrefix}${sanitizedName}`);
    }
  });
};

// Virus scanning simulation (placeholder for real implementation)
const virusCheck = (req, res, next) => {
  // In production, integrate with ClamAV or similar
  // For now, we'll do basic checks
  
  if (req.file) {
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar'];
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    if (suspiciousExtensions.includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        message: 'File type not allowed for security reasons'
      });
    }
  }
  
  next();
};

// Create upload middleware for different use cases
const createUploadMiddleware = (storageConfig, fileFilter, fieldName = 'file', maxCount = 1) => {
  const upload = multer({
    storage: storageConfig,
    fileFilter: fileFilter,
    limits: {
      fileSize: MAX_VIDEO_SIZE, // Maximum allowed
      files: maxCount
    }
  });
  
  return maxCount === 1 ? upload.single(fieldName) : upload.array(fieldName, maxCount);
};

module.exports = {
  validateAvatar,
  validateStudyMaterial,
  validateAssignmentFile,
  sanitizeFilename,
  createStorage,
  virusCheck,
  createUploadMiddleware,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_AUDIO_TYPES
};