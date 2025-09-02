const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    required: true,
    enum: ['pdf', 'video', 'document', 'presentation', 'link'],
    default: 'document'
  },
  fileUrl: {
    type: String,
    required: function() {
      return this.type === 'link' || this.file;
    }
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number // in bytes
  },
  mimeType: {
    type: String
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  module: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['lectures', 'assignments', 'notes', 'references', 'exams', 'projects', 'labs', 'resources', 'general'],
    default: 'general',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  visibility: {
    type: String,
    enum: ['public', 'enrolled', 'private'],
    default: 'enrolled'
  },
  downloads: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  downloadHistory: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    downloadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  viewHistory: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
studyMaterialSchema.index({ class: 1, uploadedBy: 1 });
studyMaterialSchema.index({ tags: 1 });
studyMaterialSchema.index({ type: 1 });
studyMaterialSchema.index({ category: 1 });
studyMaterialSchema.index({ visibility: 1 });
studyMaterialSchema.index({ title: 'text', description: 'text' });

// Virtual for formatted file size
studyMaterialSchema.virtual('formattedFileSize').get(function() {
  if (!this.fileSize) return 'N/A';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
  return Math.round(this.fileSize / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Method to increment download count
studyMaterialSchema.methods.incrementDownloads = async function(userId) {
  this.downloads += 1;
  if (userId) {
    this.downloadHistory.push({ user: userId });
    // Keep only last 100 download records
    if (this.downloadHistory.length > 100) {
      this.downloadHistory = this.downloadHistory.slice(-100);
    }
  }
  return this.save();
};

// Method to increment view count
studyMaterialSchema.methods.incrementViews = async function(userId) {
  this.views += 1;
  if (userId) {
    // Check if user already viewed in last 24 hours
    const lastView = this.viewHistory.find(v => 
      v.user.toString() === userId.toString() && 
      new Date() - v.viewedAt < 24 * 60 * 60 * 1000
    );
    
    if (!lastView) {
      this.viewHistory.push({ user: userId });
      // Keep only last 100 view records
      if (this.viewHistory.length > 100) {
        this.viewHistory = this.viewHistory.slice(-100);
      }
    }
  }
  return this.save();
};

// Static method to get materials by class
studyMaterialSchema.statics.getByClass = function(classId, userId) {
  return this.find({ 
    class: classId,
    isActive: true,
    $or: [
      { visibility: 'public' },
      { visibility: 'enrolled' },
      { uploadedBy: userId }
    ]
  })
  .populate('uploadedBy', 'name email')
  .sort('-uploadedAt');
};

// Static method to get teacher's materials
studyMaterialSchema.statics.getTeacherMaterials = function(teacherId) {
  return this.find({ 
    uploadedBy: teacherId,
    isActive: true
  })
  .populate('class', 'title subject')
  .sort('-uploadedAt');
};

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);