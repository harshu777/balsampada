const mongoose = require('mongoose');

const studentGroupSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  type: {
    type: String,
    enum: ['performance', 'project', 'study', 'custom'],
    default: 'custom'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: '#3B82F6' // Default blue color
  },
  metadata: {
    assignmentsCount: {
      type: Number,
      default: 0
    },
    averagePerformance: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
studentGroupSchema.index({ teacher: 1, class: 1 });
studentGroupSchema.index({ students: 1 });

// Methods
studentGroupSchema.methods.addStudents = async function(studentIds) {
  const uniqueIds = [...new Set([...this.students, ...studentIds])];
  this.students = uniqueIds;
  return this.save();
};

studentGroupSchema.methods.removeStudents = async function(studentIds) {
  this.students = this.students.filter(
    student => !studentIds.includes(student.toString())
  );
  return this.save();
};

studentGroupSchema.methods.getGroupStats = async function() {
  const Assignment = require('./Assignment');
  
  // Get all assignments assigned to this group
  const assignments = await Assignment.find({
    visibility: 'specific',
    specificStudents: { $in: this.students }
  });

  // Calculate average performance
  let totalScore = 0;
  let totalGraded = 0;

  assignments.forEach(assignment => {
    assignment.submissions.forEach(submission => {
      if (submission.grade && this.students.includes(submission.student)) {
        totalScore += (submission.grade.score / assignment.maxScore) * 100;
        totalGraded++;
      }
    });
  });

  this.metadata.assignmentsCount = assignments.length;
  this.metadata.averagePerformance = totalGraded > 0 ? totalScore / totalGraded : 0;
  
  return this.save();
};

module.exports = mongoose.model('StudentGroup', studentGroupSchema);