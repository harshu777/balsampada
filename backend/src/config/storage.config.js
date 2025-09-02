const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const crypto = require('crypto');

// Storage provider configuration
const STORAGE_PROVIDER = process.env.USE_LOCAL_STORAGE === 'true' ? 'local' : (process.env.STORAGE_PROVIDER || 'local'); // 'local', 's3', 'gcs', 'cloudinary'

// Material categories
const MATERIAL_CATEGORIES = {
  lectures: 'Lectures',
  assignments: 'Assignments',
  notes: 'Study Notes',
  references: 'Reference Materials',
  exams: 'Exams & Tests',
  projects: 'Projects',
  labs: 'Lab Materials',
  resources: 'Additional Resources',
  general: 'General'
};

// AWS S3 Configuration
const s3Config = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1', // Mumbai region for India
  bucket: process.env.AWS_S3_BUCKET || 'balsampada-study-materials'
};

// Initialize S3
const s3 = new AWS.S3(s3Config);

// File type configurations
const FILE_TYPES = {
  pdf: {
    mimeTypes: ['application/pdf'],
    maxSize: 50 * 1024 * 1024, // 50MB
    folder: 'documents/pdf'
  },
  video: {
    mimeTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    maxSize: 500 * 1024 * 1024, // 500MB
    folder: 'videos'
  },
  document: {
    mimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/rtf'
    ],
    maxSize: 20 * 1024 * 1024, // 20MB
    folder: 'documents/word'
  },
  presentation: {
    mimeTypes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    maxSize: 100 * 1024 * 1024, // 100MB
    folder: 'presentations'
  },
  spreadsheet: {
    mimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ],
    maxSize: 20 * 1024 * 1024, // 20MB
    folder: 'spreadsheets'
  },
  image: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    folder: 'images'
  },
  archive: {
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
    maxSize: 100 * 1024 * 1024, // 100MB
    folder: 'archives'
  }
};

// Determine file type from mimetype
const getFileType = (mimetype) => {
  for (const [type, config] of Object.entries(FILE_TYPES)) {
    if (config.mimeTypes.includes(mimetype)) {
      return type;
    }
  }
  return 'other';
};

// Generate unique file key with better categorization
const generateFileKey = (file, userId, classId, category = 'general') => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(6).toString('hex');
  const fileExt = path.extname(file.originalname);
  const fileType = getFileType(file.mimetype);
  const typeFolder = FILE_TYPES[fileType]?.folder || 'other';
  
  // Structure: category/type/classId/userId/timestamp-random.ext
  return `study-materials/${category}/${typeFolder}/${classId}/${userId}/${timestamp}-${randomString}${fileExt}`;
};

// Local storage configuration (fallback)
const localStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const category = req.body.category || 'general';
    const fileType = getFileType(file.mimetype);
    const typeFolder = FILE_TYPES[fileType]?.folder || 'other';
    const uploadDir = path.join(__dirname, `../../uploads/study-materials/${category}/${typeFolder}`);
    const fs = require('fs').promises;
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const category = req.body.category || 'general';
    const key = generateFileKey(file, req.user._id, req.body.classId, category);
    // For local storage, use only the filename part
    const filename = path.basename(key);
    cb(null, filename);
  }
});

// S3 storage configuration
const s3Storage = multerS3({
  s3: s3,
  bucket: s3Config.bucket,
  acl: 'private', // Private by default, use signed URLs
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: (req, file, cb) => {
    cb(null, {
      fieldName: file.fieldname,
      uploadedBy: req.user._id.toString(),
      classId: req.body.classId,
      originalName: file.originalname
    });
  },
  key: (req, file, cb) => {
    const category = req.body.category || 'general';
    const key = generateFileKey(file, req.user._id, req.body.classId, category);
    cb(null, key);
  },
  // Server-side encryption
  serverSideEncryption: 'AES256',
  // Set cache control for CDN
  cacheControl: 'max-age=31536000',
  // Set content disposition for downloads
  contentDisposition: (req, file, cb) => {
    cb(null, `attachment; filename="${file.originalname}"`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const fileType = getFileType(file.mimetype);
  
  if (fileType === 'other') {
    return cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
  
  // Check file size (this is also enforced by multer limits)
  const maxSize = FILE_TYPES[fileType].maxSize;
  if (file.size > maxSize) {
    return cb(new Error(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`), false);
  }
  
  cb(null, true);
};

// Create multer upload instance based on storage provider
const createUploader = () => {
  const storageConfig = STORAGE_PROVIDER === 's3' ? s3Storage : localStorage;
  
  return multer({
    storage: storageConfig,
    fileFilter: fileFilter,
    limits: {
      fileSize: 500 * 1024 * 1024, // 500MB max (will be checked per file type)
      files: 10 // Max 10 files per upload
    }
  });
};

// Generate signed URL for S3 or local path
const generateSignedUrl = async (key, expiresIn = 3600) => {
  if (STORAGE_PROVIDER !== 's3') {
    // For local storage, construct the proper path based on category structure
    // key format: study-materials/category/type/classId/userId/filename
    const pathParts = key.split('/');
    if (pathParts.length >= 6) {
      const [, category, type, classId, userId, filename] = pathParts;
      return `/uploads/study-materials/${category}/${type}/${filename}`;
    }
    // Fallback for old format
    return `/uploads/study-materials/${key.replace(/\//g, '-')}`;
  }
  
  const params = {
    Bucket: s3Config.bucket,
    Key: key,
    Expires: expiresIn, // URL expires in 1 hour by default
    ResponseContentDisposition: 'inline' // Or 'attachment' for download
  };
  
  return s3.getSignedUrlPromise('getObject', params);
};

// Generate upload URL for direct browser uploads
const generateUploadUrl = async (fileName, fileType, fileSize) => {
  if (STORAGE_PROVIDER !== 's3') {
    throw new Error('Direct upload only supported with S3');
  }
  
  const key = `temp-uploads/${Date.now()}-${fileName}`;
  
  const params = {
    Bucket: s3Config.bucket,
    Key: key,
    Expires: 300, // 5 minutes to complete upload
    ContentType: fileType,
    // Conditions to ensure file size limit
    Conditions: [
      ['content-length-range', 0, fileSize],
      ['starts-with', '$Content-Type', fileType]
    ]
  };
  
  const uploadUrl = await s3.createPresignedPost(params);
  
  return {
    uploadUrl: uploadUrl.url,
    fields: uploadUrl.fields,
    key: key
  };
};

// Delete file from storage
const deleteFile = async (key) => {
  if (STORAGE_PROVIDER === 's3') {
    const params = {
      Bucket: s3Config.bucket,
      Key: key
    };
    
    return s3.deleteObject(params).promise();
  } else {
    // Delete from local storage
    const fs = require('fs').promises;
    const filePath = path.join(__dirname, '../../uploads/study-materials', key.replace(/\//g, '-'));
    return fs.unlink(filePath);
  }
};

// Copy file (for versioning)
const copyFile = async (sourceKey, destinationKey) => {
  if (STORAGE_PROVIDER === 's3') {
    const params = {
      Bucket: s3Config.bucket,
      CopySource: `${s3Config.bucket}/${sourceKey}`,
      Key: destinationKey,
      ServerSideEncryption: 'AES256'
    };
    
    return s3.copyObject(params).promise();
  } else {
    // Copy in local storage
    const fs = require('fs').promises;
    const sourcePath = path.join(__dirname, '../../uploads/study-materials', sourceKey.replace(/\//g, '-'));
    const destPath = path.join(__dirname, '../../uploads/study-materials', destinationKey.replace(/\//g, '-'));
    return fs.copyFile(sourcePath, destPath);
  }
};

// Get file metadata
const getFileMetadata = async (key) => {
  if (STORAGE_PROVIDER === 's3') {
    const params = {
      Bucket: s3Config.bucket,
      Key: key
    };
    
    const metadata = await s3.headObject(params).promise();
    
    return {
      size: metadata.ContentLength,
      contentType: metadata.ContentType,
      lastModified: metadata.LastModified,
      etag: metadata.ETag,
      metadata: metadata.Metadata
    };
  } else {
    // Get metadata from local file
    const fs = require('fs').promises;
    const filePath = path.join(__dirname, '../../uploads/study-materials', key.replace(/\//g, '-'));
    const stats = await fs.stat(filePath);
    
    return {
      size: stats.size,
      lastModified: stats.mtime
    };
  }
};

// Stream file for large downloads
const streamFile = async (key, res) => {
  if (STORAGE_PROVIDER === 's3') {
    const params = {
      Bucket: s3Config.bucket,
      Key: key
    };
    
    const stream = s3.getObject(params).createReadStream();
    stream.pipe(res);
    
    return new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });
  } else {
    // Stream from local storage
    const fs = require('fs');
    const filePath = path.join(__dirname, '../../uploads/study-materials', key.replace(/\//g, '-'));
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    
    return new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });
  }
};

// Storage health check
const checkStorageHealth = async () => {
  try {
    if (STORAGE_PROVIDER === 's3') {
      // Check S3 bucket access
      const params = {
        Bucket: s3Config.bucket,
        MaxKeys: 1
      };
      
      await s3.listObjectsV2(params).promise();
      
      return {
        provider: 's3',
        status: 'healthy',
        bucket: s3Config.bucket,
        region: s3Config.region
      };
    } else {
      // Check local storage
      const fs = require('fs').promises;
      const uploadDir = path.join(__dirname, '../../uploads/study-materials');
      await fs.access(uploadDir);
      
      return {
        provider: 'local',
        status: 'healthy',
        path: uploadDir
      };
    }
  } catch (error) {
    return {
      provider: STORAGE_PROVIDER,
      status: 'unhealthy',
      error: error.message
    };
  }
};

module.exports = {
  createUploader,
  generateSignedUrl,
  generateUploadUrl,
  deleteFile,
  copyFile,
  getFileMetadata,
  streamFile,
  checkStorageHealth,
  FILE_TYPES,
  MATERIAL_CATEGORIES,
  STORAGE_PROVIDER
};