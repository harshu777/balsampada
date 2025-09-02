const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped', 'suspended', 'enrolled'], // 'enrolled' added for backward compatibility
    default: 'active'
  },
  progress: {
    completedLessons: [{
      lesson: {
        type: mongoose.Schema.Types.ObjectId
      },
      completedAt: Date,
      timeSpent: Number
    }],
    currentLesson: {
      type: mongoose.Schema.Types.ObjectId
    },
    percentageComplete: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastAccessedAt: Date
  },
  grades: {
    assignments: [{
      assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment'
      },
      score: Number,
      maxScore: Number,
      gradedAt: Date,
      gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      feedback: String
    }],
    quizzes: [{
      quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz'
      },
      score: Number,
      maxScore: Number,
      attempts: Number,
      completedAt: Date
    }],
    finalGrade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', null],
      default: null
    },
    totalScore: {
      type: Number,
      default: 0
    },
    gradePercentage: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  attendance: [{
    date: Date,
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true
    },
    sessionType: {
      type: String,
      enum: ['lecture', 'lab', 'tutorial', 'exam']
    },
    duration: Number,
    notes: String
  }],
  payment: {
    status: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'refunded', 'waived'],
      default: 'pending'
    },
    amount: Number,
    paidAmount: {
      type: Number,
      default: 0
    },
    paymentDate: Date,
    paymentMethod: String,
    transactionId: String,
    installments: [{
      amount: Number,
      dueDate: Date,
      paidDate: Date,
      status: {
        type: String,
        enum: ['pending', 'paid', 'overdue']
      }
    }]
  },
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    issuedDate: Date,
    certificateId: String,
    certificateUrl: String
  },
  notes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  completionDate: Date,
  expiryDate: Date,
  accessDuration: {
    type: Number,
    default: 365
  }
}, {
  timestamps: true
});

// Indexes for better query performance
enrollmentSchema.index({ student: 1, class: 1 }, { unique: true });
enrollmentSchema.index({ status: 1, enrollmentDate: 1 });
enrollmentSchema.index({ 'payment.status': 1 });
enrollmentSchema.index({ 'progress.percentageComplete': 1 });
enrollmentSchema.index({ class: 1, status: 1 }); // For fetching class enrollments

enrollmentSchema.methods.updateProgress = async function() {
  try {
    // Get study materials count for this class as a proxy for total lessons
    const StudyMaterial = require('./StudyMaterial');
    const totalMaterials = await StudyMaterial.countDocuments({
      class: this.class,
      isActive: true
    });
    
    const completedCount = this.progress.completedLessons.length;
    this.progress.percentageComplete = totalMaterials > 0 
      ? Math.round((completedCount / totalMaterials) * 100)
      : 0;
    
    return this.save();
  } catch (error) {
    console.error('Error updating progress:', error);
    return this;
  }
};

enrollmentSchema.methods.calculateFinalGrade = function() {
  const { assignments, quizzes } = this.grades;
  
  let totalScore = 0;
  let totalMaxScore = 0;
  
  assignments.forEach(assignment => {
    totalScore += assignment.score || 0;
    totalMaxScore += assignment.maxScore || 0;
  });
  
  quizzes.forEach(quiz => {
    totalScore += quiz.score || 0;
    totalMaxScore += quiz.maxScore || 0;
  });
  
  if (totalMaxScore > 0) {
    this.grades.gradePercentage = (totalScore / totalMaxScore) * 100;
    this.grades.totalScore = totalScore;
    
    const percentage = this.grades.gradePercentage;
    if (percentage >= 90) this.grades.finalGrade = 'A+';
    else if (percentage >= 80) this.grades.finalGrade = 'A';
    else if (percentage >= 70) this.grades.finalGrade = 'B+';
    else if (percentage >= 60) this.grades.finalGrade = 'B';
    else if (percentage >= 50) this.grades.finalGrade = 'C+';
    else if (percentage >= 40) this.grades.finalGrade = 'C';
    else if (percentage >= 30) this.grades.finalGrade = 'D';
    else this.grades.finalGrade = 'F';
  }
  
  return this.save();
};

enrollmentSchema.methods.calculateAttendancePercentage = function() {
  if (this.attendance.length === 0) return 0;
  
  const presentCount = this.attendance.filter(a => 
    a.status === 'present' || a.status === 'late'
  ).length;
  
  return Math.round((presentCount / this.attendance.length) * 100);
};

enrollmentSchema.methods.isEligibleForCertificate = function() {
  return this.progress.percentageComplete === 100 && 
         this.status === 'completed' &&
         this.grades.gradePercentage >= 40;
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);