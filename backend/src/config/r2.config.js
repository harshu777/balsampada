const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Cloudflare R2 Configuration
const r2Config = {
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucketName: process.env.R2_BUCKET_NAME || 'balsampada-lms',
  publicUrl: process.env.R2_PUBLIC_URL, // Optional: Custom domain for public access
};

// Create S3-compatible client for R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.secretAccessKey,
  },
});

// Helper functions for R2 operations
const r2Storage = {
  /**
   * Upload file to R2
   * @param {Buffer|Stream} fileBuffer - File data
   * @param {string} key - File path/key in bucket
   * @param {string} contentType - MIME type
   * @param {Object} metadata - Additional metadata
   */
  async uploadFile(fileBuffer, key, contentType, metadata = {}) {
    try {
      const upload = new Upload({
        client: r2Client,
        params: {
          Bucket: r2Config.bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
          Metadata: metadata,
        },
      });

      const result = await upload.done();
      
      // Return public URL if configured
      const publicUrl = r2Config.publicUrl 
        ? `${r2Config.publicUrl}/${key}`
        : `https://${r2Config.bucketName}.${r2Config.accountId}.r2.cloudflarestorage.com/${key}`;
      
      return {
        success: true,
        key,
        url: publicUrl,
        etag: result.ETag,
        location: result.Location,
      };
    } catch (error) {
      console.error('R2 upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  },

  /**
   * Get signed URL for temporary access
   * @param {string} key - File key in bucket
   * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
   */
  async getSignedUrl(key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: r2Config.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(r2Client, command, { expiresIn });
      
      return {
        success: true,
        url,
        expiresIn,
      };
    } catch (error) {
      console.error('R2 signed URL error:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  },

  /**
   * Delete file from R2
   * @param {string} key - File key to delete
   */
  async deleteFile(key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: r2Config.bucketName,
        Key: key,
      });

      await r2Client.send(command);
      
      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      console.error('R2 delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  },

  /**
   * Generate unique file key with folder structure
   * @param {string} folder - Folder name (e.g., 'assignments', 'materials', 'profiles')
   * @param {string} filename - Original filename
   * @param {string} userId - User ID for organization
   */
  generateFileKey(folder, filename, userId) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Organize by folder/userId/timestamp-random-filename
    return `${folder}/${userId}/${timestamp}-${randomString}-${sanitizedFilename}`;
  },

  /**
   * Upload with automatic key generation
   * @param {Object} params - Upload parameters
   */
  async uploadWithAutoKey({ file, folder, userId, contentType, metadata }) {
    const key = this.generateFileKey(folder, file.originalname || 'file', userId);
    return this.uploadFile(file.buffer, key, contentType, metadata);
  },

  /**
   * Batch upload multiple files
   * @param {Array} files - Array of file objects
   * @param {string} folder - Folder to store files
   * @param {string} userId - User ID
   */
  async batchUpload(files, folder, userId) {
    const uploadPromises = files.map(file => 
      this.uploadWithAutoKey({
        file,
        folder,
        userId,
        contentType: file.mimetype,
        metadata: { originalName: file.originalname }
      })
    );

    try {
      const results = await Promise.all(uploadPromises);
      return {
        success: true,
        uploaded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        files: results,
      };
    } catch (error) {
      console.error('Batch upload error:', error);
      throw new Error(`Batch upload failed: ${error.message}`);
    }
  },

  /**
   * Get file metadata
   * @param {string} key - File key
   */
  async getFileMetadata(key) {
    try {
      const command = new GetObjectCommand({
        Bucket: r2Config.bucketName,
        Key: key,
      });

      const response = await r2Client.send(command);
      
      return {
        success: true,
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch (error) {
      console.error('R2 metadata error:', error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  },
};

// Middleware for file upload with R2
const uploadToR2 = async (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  try {
    const userId = req.user?.id || 'anonymous';
    const folder = req.body.folder || 'general';

    if (req.file) {
      // Single file upload
      const result = await r2Storage.uploadWithAutoKey({
        file: req.file,
        folder,
        userId,
        contentType: req.file.mimetype,
        metadata: {
          originalName: req.file.originalname,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
        },
      });

      req.fileUpload = result;
    } else if (req.files && Array.isArray(req.files)) {
      // Multiple files upload
      const results = await r2Storage.batchUpload(req.files, folder, userId);
      req.fileUploads = results;
    }

    next();
  } catch (error) {
    console.error('R2 middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error.message,
    });
  }
};

module.exports = {
  r2Client,
  r2Config,
  r2Storage,
  uploadToR2,
};