const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: function() {
      // Password not required if user signed up with Google
      return !this.googleId;
    },
    minlength: 6,
    select: false
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  profileIncomplete: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin', 'owner'],
    default: 'student'
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: false // Will be required for non-owners
  },
  phone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please provide a valid phone number']
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },
  qualification: {
    type: String
  },
  specialization: [{
    type: String
  }],
  experience: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  // Academic Information (for both students and teachers)
  academicProfile: {
    // Student-specific
    board: {
      type: String,
      enum: ['CBSE', 'ICSE', 'State Board', 'IB', 'Cambridge', 'NIOS', 'Other']
    },
    standard: {
      type: String,
      enum: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']
    },
    medium: {
      type: String,
      enum: ['English', 'Hindi', 'Regional', 'Bilingual']
    },
    school: String,
    
    // Parent Information (for students)
    parentName: String,
    parentPhone: String,
    parentEmail: String,
    
    // Teacher-specific
    canTeachBoards: [{
      type: String,
      enum: ['CBSE', 'ICSE', 'State Board', 'IB', 'Cambridge', 'NIOS', 'Other']
    }],
    canTeachStandards: [{
      type: String,
      enum: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']
    }],
    canTeachSubjects: [{
      subject: {
        type: String,
        enum: [
          'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Environmental Studies',
          'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Geography', 'Civics',
          'Economics', 'Accountancy', 'Business Studies', 'Sanskrit', 'French', 'German',
          'General Knowledge', 'Reasoning', 'Physical Education', 'Arts', 'Music', 'Other'
        ]
      },
      isPrimary: {
        type: Boolean,
        default: false
      },
      experienceYears: {
        type: Number,
        default: 0
      },
      specialization: String
    }],
    
    // Professional details for teachers
    currentOccupation: String,
    institutionAffiliation: String,
    teachingExperience: {
      type: Number,
      default: 0
    },
    preferredTimings: [{
      type: String,
      enum: ['Morning', 'Afternoon', 'Evening', 'Weekend']
    }],
    availability: {
      days: [{
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      }],
      timeSlots: [{
        start: String, // HH:MM format
        end: String   // HH:MM format
      }]
    }
  },

  // Onboarding Status
  onboardingStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending'
  },
  onboardingCompletedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  
  // Auto-assigned relationships
  enrolledGrades: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grade'
  }],
  assignedSubjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  
  // Legacy fields (keep for backward compatibility)
  enrolledClasses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment'
  }],
  teachingClasses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

userSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000;
  
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

module.exports = mongoose.model('User', userSchema);