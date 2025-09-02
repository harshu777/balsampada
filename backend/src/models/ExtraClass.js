/**
 * ExtraClass Model
 * 
 * For managing extra/additional classes outside regular schedule
 * Teachers can schedule extra sessions for doubt clearing, makeup classes, etc.
 */

const mongoose = require('mongoose');

const extraClassSchema = new mongoose.Schema({
  // Reference to main class
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  
  // Teacher conducting the session
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Session details
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Schedule
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String, // Format: "HH:MM" (24-hour)
    required: true
  },
  endTime: {
    type: String, // Format: "HH:MM" (24-hour)
    required: true
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 90,
    min: 30,
    max: 180
  },
  
  // Type of extra session
  type: {
    type: String,
    enum: ['extra', 'makeup', 'doubt-clearing', 'test', 'revision', 'special'],
    default: 'extra',
    required: true
  },
  
  // Meeting details
  meetingDetails: {
    platform: {
      type: String,
      enum: ['zoom', 'googlemeet', 'teams', 'jitsi', 'custom'],
      default: 'googlemeet'
    },
    meetingUrl: {
      type: String,
      required: true
    },
    meetingId: String,
    password: String,
    waitingRoomEnabled: {
      type: Boolean,
      default: false
    }
  },
  
  // Target students (if empty, all enrolled students)
  targetStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Attendance tracking
  attendees: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: Date,
    leftAt: Date,
    duration: Number, // in minutes
    attendance: {
      type: String,
      enum: ['present', 'absent', 'late'],
      default: 'absent'
    }
  }],
  
  // Additional settings
  reason: {
    type: String, // Why this extra class was scheduled
    trim: true
  },
  isOptional: {
    type: Boolean,
    default: false
  },
  isRecorded: {
    type: Boolean,
    default: false
  },
  recordingUrl: String,
  maxAttendees: {
    type: Number,
    min: 1
  },
  
  // Notification settings
  notificationSent: {
    type: Boolean,
    default: false
  },
  notificationSentAt: Date,
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: Date,
  
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled',
    required: true
  },
  cancellationReason: String,
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Feedback
  studentFeedback: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  }],
  
  // Timezone
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
extraClassSchema.index({ class: 1, date: 1 });
extraClassSchema.index({ teacher: 1, date: 1 });
extraClassSchema.index({ status: 1, scheduledAt: 1 });
extraClassSchema.index({ 'targetStudents': 1 });

// Virtual to check if session is live
extraClassSchema.virtual('isLive').get(function() {
  const now = new Date();
  const sessionDate = new Date(this.date);
  
  // Parse time strings
  const [startHour, startMinute] = this.startTime.split(':').map(Number);
  const [endHour, endMinute] = this.endTime.split(':').map(Number);
  
  const startDateTime = new Date(sessionDate);
  startDateTime.setHours(startHour, startMinute, 0, 0);
  
  const endDateTime = new Date(sessionDate);
  endDateTime.setHours(endHour, endMinute, 0, 0);
  
  return now >= startDateTime && now <= endDateTime && this.status !== 'cancelled';
});

// Virtual to check if session is upcoming
extraClassSchema.virtual('isUpcoming').get(function() {
  const now = new Date();
  const sessionDate = new Date(this.date);
  const [startHour, startMinute] = this.startTime.split(':').map(Number);
  
  const startDateTime = new Date(sessionDate);
  startDateTime.setHours(startHour, startMinute, 0, 0);
  
  return startDateTime > now && this.status === 'scheduled';
});

// Method to mark attendance
extraClassSchema.methods.markAttendance = function(studentId, status = 'present') {
  const attendeeIndex = this.attendees.findIndex(
    a => a.student.toString() === studentId.toString()
  );
  
  if (attendeeIndex > -1) {
    this.attendees[attendeeIndex].attendance = status;
    if (status === 'present') {
      this.attendees[attendeeIndex].joinedAt = new Date();
    }
  } else {
    this.attendees.push({
      student: studentId,
      attendance: status,
      joinedAt: status === 'present' ? new Date() : null
    });
  }
  
  return this.save();
};

// Method to update status
extraClassSchema.methods.updateStatus = async function(newStatus) {
  const validTransitions = {
    'scheduled': ['live', 'cancelled'],
    'live': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': []
  };
  
  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }
  
  this.status = newStatus;
  
  if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
  }
  
  return this.save();
};

// Pre-save middleware
extraClassSchema.pre('save', function(next) {
  // Set scheduledAt based on date and startTime
  if (this.date && this.startTime) {
    const [hour, minute] = this.startTime.split(':').map(Number);
    const scheduledAt = new Date(this.date);
    scheduledAt.setHours(hour, minute, 0, 0);
    this.scheduledAt = scheduledAt;
  }
  
  // Calculate duration if not set
  if (this.startTime && this.endTime && !this.duration) {
    const [startHour, startMinute] = this.startTime.split(':').map(Number);
    const [endHour, endMinute] = this.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    this.duration = endMinutes - startMinutes;
  }
  
  next();
});

module.exports = mongoose.model('ExtraClass', extraClassSchema);