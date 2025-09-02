const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Class title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Class description is required'],
    maxlength: 2000
  },
  thumbnail: {
    type: String,
    default: null
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Board-based Education Fields
  board: {
    type: String,
    required: true,
    enum: ['CBSE', 'ICSE', 'State Board', 'IB', 'Cambridge', 'NIOS', 'Other']
  },
  standard: {
    type: String,
    required: true,
    enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'UG', 'PG']
  },
  subject: {
    type: String,
    required: true,
    enum: [
      // Primary subjects
      'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Environmental Studies',
      // Secondary subjects  
      'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Geography', 'Civics',
      'Economics', 'Accountancy', 'Business Studies', 'Sanskrit', 'French', 'German',
      // Additional
      'General Knowledge', 'Reasoning', 'Other'
    ]
  },
  batch: {
    type: String,
    default: 'A',
    enum: ['A', 'B', 'C', 'D', 'E', 'Morning', 'Evening', 'Weekend']
  },
  academicYear: {
    type: String,
    required: true,
    default: () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      // Academic year starts in April
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
  classType: {
    type: String,
    required: true,
    enum: ['Regular', 'Crash Course', 'Revision', 'Test Series', 'Doubt Clearing'],
    default: 'Regular'
  },
  // Deprecated - keeping for backward compatibility
  category: {
    type: String,
    required: false,
    enum: ['Programming', 'Mathematics', 'Science', 'Language', 'Business', 'Arts', 'Other'],
    default: 'Other'
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountPrice: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  duration: {
    type: Number,
    required: true
  },
  totalLectures: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    default: 'English'
  },
  prerequisites: [{
    type: String
  }],
  learningObjectives: [{
    type: String
  }],
  syllabus: [{
    week: Number,
    title: String,
    description: String,
    topics: [String]
  }],
  // Simple syllabus description for initial creation
  syllabusDescription: {
    type: String,
    maxlength: 5000
  },
  modules: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    order: Number,
    lessons: [{
      title: {
        type: String,
        required: true
      },
      description: String,
      type: {
        type: String,
        enum: ['video', 'document', 'quiz', 'assignment'],
        required: true
      },
      content: {
        url: String,
        duration: Number,
        fileSize: Number
      },
      order: Number,
      isPreview: {
        type: Boolean,
        default: false
      },
      resources: [{
        title: String,
        url: String,
        type: String
      }]
    }]
  }],
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  ratings: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: Date,
  tags: [{
    type: String
  }],
  certificateAvailable: {
    type: Boolean,
    default: true
  },
  maxStudents: {
    type: Number,
    default: null
  },
  enrollmentDeadline: Date,
  startDate: Date,
  endDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  announcements: [{
    title: String,
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  faqs: [{
    question: String,
    answer: String
  }]
}, {
  timestamps: true
});

classSchema.index({ title: 'text', description: 'text', tags: 'text' });
classSchema.index({ teacher: 1, status: 1 });
classSchema.index({ category: 1, level: 1, status: 1 });

classSchema.methods.calculateAverageRating = function() {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalReviews = 0;
  } else {
    const sum = this.ratings.reduce((acc, item) => acc + item.rating, 0);
    this.averageRating = (sum / this.ratings.length).toFixed(1);
    this.totalReviews = this.ratings.length;
  }
  return this.save();
};

classSchema.methods.canEnroll = function() {
  if (!this.isActive || this.status !== 'published') {
    return false;
  }
  if (this.maxStudents && this.enrolledStudents.length >= this.maxStudents) {
    return false;
  }
  if (this.enrollmentDeadline && new Date() > this.enrollmentDeadline) {
    return false;
  }
  return true;
};

module.exports = mongoose.model('Class', classSchema);