const mongoose = require('mongoose');

const liveClassSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a title for the live class'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description']
  },
  // Support both old Class model and new Grade/Subject structure
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: false // Made optional for new structure
  },
  grade: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grade',
    required: false
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: false
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledAt: {
    type: Date,
    required: [true, 'Please provide a schedule time']
  },
  duration: {
    type: Number, // in minutes
    required: true,
    default: 60
  },
  meetingUrl: {
    type: String,
    required: true
  },
  meetingId: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  attendees: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: Date,
    leftAt: Date,
    attendance: {
      type: Boolean,
      default: false
    }
  }],
  recording: {
    url: String,
    uploadedAt: Date,
    duration: Number
  },
  maxAttendees: {
    type: Number,
    default: 100
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: function() { return this.isRecurring; }
  },
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['pdf', 'link', 'video', 'document']
    }
  }],
  chat: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
liveClassSchema.index({ class: 1, scheduledAt: 1 });
liveClassSchema.index({ teacher: 1, status: 1 });
liveClassSchema.index({ scheduledAt: 1, status: 1 });

// Virtual for checking if class is upcoming
liveClassSchema.virtual('isUpcoming').get(function() {
  return this.scheduledAt > new Date() && this.status === 'scheduled';
});

// Virtual for checking if class is ongoing
liveClassSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  const endTime = new Date(this.scheduledAt.getTime() + this.duration * 60000);
  return now >= this.scheduledAt && now <= endTime && this.status === 'live';
});

// Method to start live class
liveClassSchema.methods.startClass = async function() {
  if (this.status !== 'scheduled') {
    throw new Error('Class can only be started from scheduled status');
  }
  this.status = 'live';
  await this.save();
  return this;
};

// Method to end live class
liveClassSchema.methods.endClass = async function() {
  if (this.status !== 'live') {
    throw new Error('Class can only be ended from live status');
  }
  this.status = 'completed';
  
  // Mark attendance for students who joined
  this.attendees.forEach(attendee => {
    if (attendee.joinedAt) {
      attendee.attendance = true;
      if (!attendee.leftAt) {
        attendee.leftAt = new Date();
      }
    }
  });
  
  await this.save();
  return this;
};

// Method to add attendee
liveClassSchema.methods.addAttendee = async function(studentId) {
  const existingAttendee = this.attendees.find(
    a => a.student.toString() === studentId.toString()
  );
  
  if (!existingAttendee) {
    this.attendees.push({
      student: studentId,
      joinedAt: new Date()
    });
  } else if (!existingAttendee.joinedAt) {
    existingAttendee.joinedAt = new Date();
  }
  
  await this.save();
  return this;
};

// Method to remove attendee
liveClassSchema.methods.removeAttendee = async function(studentId) {
  const attendee = this.attendees.find(
    a => a.student.toString() === studentId.toString()
  );
  
  if (attendee && attendee.joinedAt) {
    attendee.leftAt = new Date();
  }
  
  await this.save();
  return this;
};

// Pre-save hook to update updatedAt and validate structure
liveClassSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Validate that either old structure (class) or new structure (grade + subject) is provided
  if (!this.class && !(this.grade && this.subject)) {
    return next(new Error('Either class OR both grade and subject must be provided'));
  }
  
  // Don't allow both old and new structure
  if (this.class && (this.grade || this.subject)) {
    return next(new Error('Cannot use both old (class) and new (grade+subject) structure together'));
  }
  
  next();
});

module.exports = mongoose.model('LiveClass', liveClassSchema);