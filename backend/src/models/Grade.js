const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    enum: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']
  },
  board: {
    type: String,
    required: true,
    enum: ['CBSE', 'ICSE', 'State Board', 'IB', 'Cambridge', 'NIOS', 'Other']
  },
  academicYear: {
    type: String,
    required: true,
    default: () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      if (month >= 3) {
        return `${year}-${year + 1}`;
      } else {
        return `${year - 1}-${year}`;
      }
    }
  },
  medium: {
    type: String,
    required: true,
    enum: ['English', 'Hindi', 'Regional', 'Bilingual'],
    default: 'English'
  },
  description: {
    type: String,
    maxlength: 1000
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  enrollmentPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  discountPrice: {
    type: Number,
    min: 0
  },
  maxStudents: {
    type: Number,
    default: 100
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
gradeSchema.index({ name: 1, board: 1, academicYear: 1 }, { unique: true });
gradeSchema.index({ isActive: 1 });

// Virtual for enrolled student count
gradeSchema.virtual('enrolledCount').get(function() {
  return this.enrolledStudents ? this.enrolledStudents.length : 0;
});

gradeSchema.virtual('displayName').get(function() {
  return `${this.name} - ${this.board} (${this.academicYear})`;
});

module.exports = mongoose.model('Grade', gradeSchema);