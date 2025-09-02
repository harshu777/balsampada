const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['homework', 'project', 'lab', 'presentation', 'essay'],
    default: 'homework'
  },
  instructions: {
    type: String,
    required: true
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number
  }],
  maxScore: {
    type: Number,
    required: true,
    default: 100
  },
  passingScore: {
    type: Number,
    default: 40
  },
  dueDate: {
    type: Date,
    required: true
  },
  availableFrom: {
    type: Date,
    default: Date.now
  },
  allowLateSubmission: {
    type: Boolean,
    default: true
  },
  latePenalty: {
    type: Number,
    default: 10
  },
  maxAttempts: {
    type: Number,
    default: 1
  },
  rubric: [{
    criterion: String,
    description: String,
    maxPoints: Number
  }],
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    attempt: {
      type: Number,
      default: 1
    },
    content: String,
    files: [{
      fileName: String,
      fileUrl: String,
      fileType: String,
      fileSize: Number
    }],
    status: {
      type: String,
      enum: ['submitted', 'late', 'graded', 'returned', 'resubmitted'],
      default: 'submitted'
    },
    grade: {
      score: Number,
      feedback: String,
      gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      gradedAt: Date,
      rubricScores: [{
        criterion: String,
        score: Number,
        comments: String
      }]
    },
    isLate: {
      type: Boolean,
      default: false
    },
    comments: [{
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      content: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  visibility: {
    type: String,
    enum: ['all', 'enrolled', 'specific'],
    default: 'enrolled'
  },
  specificStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  statistics: {
    totalSubmissions: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    highestScore: {
      type: Number,
      default: 0
    },
    lowestScore: {
      type: Number,
      default: 0
    },
    onTimeSubmissions: {
      type: Number,
      default: 0
    },
    lateSubmissions: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

assignmentSchema.index({ course: 1, dueDate: 1 });
assignmentSchema.index({ createdBy: 1, isPublished: 1 });

assignmentSchema.methods.submitAssignment = async function(studentId, submissionData) {
  const existingSubmission = this.submissions.find(
    sub => sub.student.toString() === studentId.toString()
  );
  
  const isLate = new Date() > this.dueDate;
  
  if (existingSubmission) {
    if (existingSubmission.attempt >= this.maxAttempts) {
      throw new Error('Maximum attempts reached');
    }
    existingSubmission.attempt += 1;
    existingSubmission.submittedAt = Date.now();
    existingSubmission.content = submissionData.content;
    existingSubmission.files = submissionData.files;
    existingSubmission.status = isLate ? 'late' : 'resubmitted';
    existingSubmission.isLate = isLate;
  } else {
    this.submissions.push({
      student: studentId,
      ...submissionData,
      status: isLate ? 'late' : 'submitted',
      isLate
    });
  }
  
  await this.updateStatistics();
  return this.save();
};

assignmentSchema.methods.gradeSubmission = async function(studentId, gradeData) {
  const submission = this.submissions.find(
    sub => sub.student.toString() === studentId.toString()
  );
  
  if (!submission) {
    throw new Error('Submission not found');
  }
  
  submission.grade = {
    ...gradeData,
    gradedAt: Date.now()
  };
  submission.status = 'graded';
  
  if (submission.isLate && this.latePenalty > 0) {
    submission.grade.score = Math.max(
      0, 
      submission.grade.score - (this.maxScore * this.latePenalty / 100)
    );
  }
  
  await this.updateStatistics();
  return this.save();
};

assignmentSchema.methods.updateStatistics = function() {
  const gradedSubmissions = this.submissions.filter(sub => sub.grade);
  
  if (gradedSubmissions.length > 0) {
    const scores = gradedSubmissions.map(sub => sub.grade.score);
    this.statistics.totalSubmissions = this.submissions.length;
    this.statistics.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    this.statistics.highestScore = Math.max(...scores);
    this.statistics.lowestScore = Math.min(...scores);
    this.statistics.onTimeSubmissions = this.submissions.filter(sub => !sub.isLate).length;
    this.statistics.lateSubmissions = this.submissions.filter(sub => sub.isLate).length;
  }
};

module.exports = mongoose.model('Assignment', assignmentSchema);