const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    enum: [
      // Primary subjects
      'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Environmental Studies',
      // Secondary subjects  
      'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Geography', 'Civics',
      'Economics', 'Accountancy', 'Business Studies', 'Sanskrit', 'French', 'German',
      // Additional
      'General Knowledge', 'Reasoning', 'Physical Education', 'Arts', 'Music', 'Other'
    ]
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  grade: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grade',
    required: true
  },
  teachers: [{
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    specialization: String // e.g., "Algebra", "Organic Chemistry", etc.
  }],
  schedule: [{
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    startTime: {
      type: String, // Format: "HH:MM"
      required: true
    },
    endTime: {
      type: String, // Format: "HH:MM"
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  syllabus: [{
    topic: {
      type: String,
      required: true
    },
    description: String,
    order: {
      type: Number,
      default: 0
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  resources: [{
    title: String,
    type: {
      type: String,
      enum: ['pdf', 'video', 'link', 'document', 'image'],
      required: true
    },
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  totalClasses: {
    type: Number,
    default: 0
  },
  completedClasses: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
subjectSchema.index({ grade: 1, name: 1 });
subjectSchema.index({ 'teachers.teacher': 1 });
subjectSchema.index({ isActive: 1 });

// Virtual for progress percentage
subjectSchema.virtual('progressPercentage').get(function() {
  if (this.totalClasses === 0) return 0;
  return Math.round((this.completedClasses / this.totalClasses) * 100);
});

// Virtual for primary teacher
subjectSchema.virtual('primaryTeacher').get(function() {
  return this.teachers.find(t => t.isPrimary) || this.teachers[0];
});

// Method to add teacher
subjectSchema.methods.addTeacher = function(teacherId, isPrimary = false, specialization = '') {
  // If setting as primary, remove primary from others
  if (isPrimary) {
    this.teachers.forEach(t => t.isPrimary = false);
  }
  
  this.teachers.push({
    teacher: teacherId,
    isPrimary,
    specialization
  });
  
  return this.save();
};

// Method to remove teacher
subjectSchema.methods.removeTeacher = function(teacherId) {
  this.teachers = this.teachers.filter(t => t.teacher.toString() !== teacherId.toString());
  return this.save();
};

module.exports = mongoose.model('Subject', subjectSchema);