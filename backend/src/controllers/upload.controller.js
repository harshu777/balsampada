const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: /jpeg|jpg|png|gif|webp/,
    video: /mp4|avi|mkv|mov|wmv/,
    document: /pdf|doc|docx|ppt|pptx|xls|xlsx|txt/
  };

  const extname = allowedTypes.image.test(path.extname(file.originalname).toLowerCase()) ||
                  allowedTypes.video.test(path.extname(file.originalname).toLowerCase()) ||
                  allowedTypes.document.test(path.extname(file.originalname).toLowerCase());
  
  const mimetype = allowedTypes.image.test(file.mimetype) ||
                   allowedTypes.video.test(file.mimetype) ||
                   allowedTypes.document.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024
  },
  fileFilter: fileFilter
});

exports.uploadSingle = upload.single('file');
exports.uploadMultiple = upload.array('files', 10);

exports.uploadToS3 = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileContent = fs.readFileSync(req.file.path);
    
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${req.user.id}/${Date.now()}-${req.file.originalname}`,
      Body: fileContent,
      ContentType: req.file.mimetype,
      ACL: 'public-read'
    };

    const result = await s3.upload(params).promise();

    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      data: {
        url: result.Location,
        key: result.Key,
        bucket: result.Bucket,
        size: req.file.size,
        mimetype: req.file.mimetype,
        originalName: req.file.originalname
      }
    });
  } catch (error) {
    console.error('S3 upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Error uploading file to S3'
    });
  }
};

exports.uploadToCloudinary = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    let resourceType = 'auto';
    if (req.file.mimetype.startsWith('video')) {
      resourceType = 'video';
    } else if (req.file.mimetype.startsWith('image')) {
      resourceType = 'image';
    } else {
      resourceType = 'raw';
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: resourceType,
      folder: `balsampada/${req.user.id}`,
      use_filename: true,
      unique_filename: true
    });

    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration,
        originalName: req.file.originalname
      }
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Error uploading file to Cloudinary'
    });
  }
};

exports.uploadLocal = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      data: {
        url: fileUrl,
        path: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        originalName: req.file.originalname
      }
    });
  } catch (error) {
    console.error('Local upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Error uploading file'
    });
  }
};

exports.deleteFromS3 = async (req, res) => {
  try {
    const { key } = req.body;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(params).promise();

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('S3 delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file from S3'
    });
  }
};

exports.deleteFromCloudinary = async (req, res) => {
  try {
    const { publicId, resourceType = 'image' } = req.body;

    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file from Cloudinary'
    });
  }
};

exports.uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
      uploadedFiles.push({
        url: fileUrl,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        originalName: file.originalname
      });
    }

    res.status(200).json({
      success: true,
      data: uploadedFiles
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error uploading files'
    });
  }
};