# Balsampada LMS - Database Schema Design

## Overview
This document outlines the complete database schema for Balsampada LMS, a multi-teacher tuition platform designed for Indian education boards.

## Collections/Tables

### 1. **Users Collection**
Stores all users (students, teachers, admins) with role-specific fields.

```javascript
{
  _id: ObjectId,
  
  // Basic Information
  name: String (required),
  email: String (required, unique, indexed),
  password: String (hashed, required),
  phone: String (required),
  role: String (enum: ['student', 'teacher', 'admin']),
  avatar: String (URL),
  
  // Profile Information
  bio: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String (default: 'India')
  },
  dateOfBirth: Date,
  gender: String (enum: ['male', 'female', 'other']),
  
  // Student-Specific Fields
  parentInfo: {
    fatherName: String,
    motherName: String,
    parentPhone: String,
    parentEmail: String
  },
  board: String (enum: ['CBSE', 'ICSE', 'State Board', etc.]),
  standard: String (current class),
  school: String,
  enrolledClasses: [ObjectId] (ref: 'Class'),
  
  // Teacher-Specific Fields
  qualification: String,
  specialization: [String],
  experience: Number (years),
  subjects: [String] (subjects they teach),
  boards: [String] (boards they're qualified for),
  teachingClasses: [ObjectId] (ref: 'Class'),
  bankDetails: {
    accountNumber: String (encrypted),
    ifscCode: String,
    bankName: String,
    accountHolderName: String
  },
  
  // Common Fields
  isActive: Boolean (default: true),
  isEmailVerified: Boolean (default: false),
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // Security
  loginAttempts: Number (default: 0),
  lockUntil: Date,
  lastLogin: Date,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### 2. **Classes Collection**
Stores all classes created by teachers.

```javascript
{
  _id: ObjectId,
  
  // Basic Information
  title: String (auto-generated or custom),
  description: String (required),
  thumbnail: String (URL),
  
  // Teacher Reference
  teacher: ObjectId (ref: 'User', required, indexed),
  
  // Board Education Fields
  board: String (enum: ['CBSE', 'ICSE', 'State Board', 'IB', 'Cambridge', 'NIOS', 'Other']),
  standard: String (enum: ['1'-'12', 'UG', 'PG']),
  subject: String (enum: based on standard),
  batch: String (enum: ['A', 'B', 'C', 'Morning', 'Evening', 'Weekend']),
  academicYear: String (e.g., '2024-2025'),
  medium: String (enum: ['English', 'Hindi', 'Regional', 'Bilingual']),
  classType: String (enum: ['Regular', 'Crash Course', 'Revision', 'Test Series', 'Doubt Clearing']),
  
  // Schedule Information
  startDate: Date,
  endDate: Date,
  duration: Number (total weeks),
  schedule: String (e.g., 'Mon, Wed, Fri - 4:00 PM to 5:30 PM'),
  classesPerWeek: Number,
  classDuration: Number (minutes per class),
  totalClasses: Number,
  completedClasses: Number (default: 0),
  
  // Pricing
  price: Number (required),
  discountPrice: Number,
  currency: String (default: 'INR'),
  paymentFrequency: String (enum: ['one-time', 'monthly', 'quarterly']),
  
  // Capacity
  maxStudents: Number (default: 30),
  minStudents: Number (default: 5),
  enrolledStudents: [ObjectId] (ref: 'User'),
  enrollmentCount: Number (default: 0),
  
  // Content
  syllabus: String,
  prerequisites: String,
  learningOutcomes: String,
  modules: [{
    title: String,
    description: String,
    topics: [String],
    duration: Number,
    order: Number,
    materials: [{
      type: String (enum: ['video', 'pdf', 'assignment']),
      title: String,
      url: String,
      duration: Number
    }]
  }],
  
  // Status & Publishing
  status: String (enum: ['draft', 'pending', 'published', 'archived']),
  publishedAt: Date,
  reviewedBy: ObjectId (ref: 'User' - admin who approved),
  reviewedAt: Date,
  reviewComments: String,
  
  // Analytics
  totalRevenue: Number (default: 0),
  averageRating: Number (default: 0),
  totalReviews: Number (default: 0),
  completionRate: Number (percentage),
  
  // Search Optimization
  tags: [String],
  searchKeywords: [String],
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### 3. **Enrollments Collection**
Tracks student enrollments in classes.

```javascript
{
  _id: ObjectId,
  
  // References
  student: ObjectId (ref: 'User', required, indexed),
  class: ObjectId (ref: 'Class', required, indexed),
  teacher: ObjectId (ref: 'User'),
  
  // Enrollment Details
  enrollmentDate: Date (default: now),
  enrollmentType: String (enum: ['paid', 'trial', 'scholarship']),
  status: String (enum: ['active', 'completed', 'dropped', 'suspended']),
  
  // Payment Reference
  payment: ObjectId (ref: 'Payment'),
  paidAmount: Number,
  paymentStatus: String (enum: ['pending', 'partial', 'completed']),
  
  // Progress Tracking
  progress: {
    completedModules: [ObjectId],
    completedLessons: [ObjectId],
    lastAccessedModule: ObjectId,
    lastAccessedAt: Date,
    percentageComplete: Number (default: 0),
    totalStudyTime: Number (minutes)
  },
  
  // Attendance
  attendance: [{
    date: Date,
    status: String (enum: ['present', 'absent', 'late']),
    duration: Number (minutes attended),
    remarks: String
  }],
  attendancePercentage: Number,
  
  // Performance
  grades: {
    assignments: Number,
    tests: Number,
    participation: Number,
    finalGrade: String,
    gradePercentage: Number
  },
  
  // Completion
  completedAt: Date,
  certificate: {
    issued: Boolean (default: false),
    issuedAt: Date,
    certificateUrl: String,
    certificateNumber: String
  },
  
  // Feedback
  studentFeedback: {
    rating: Number (1-5),
    review: String,
    submittedAt: Date
  },
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### 4. **Payments Collection**
Handles all payment transactions.

```javascript
{
  _id: ObjectId,
  
  // References
  student: ObjectId (ref: 'User', required, indexed),
  class: ObjectId (ref: 'Class', required),
  enrollment: ObjectId (ref: 'Enrollment'),
  teacher: ObjectId (ref: 'User'),
  
  // Payment Details
  amount: Number (required),
  currency: String (default: 'INR'),
  paymentMethod: String (enum: ['card', 'upi', 'netbanking', 'wallet', 'cash']),
  paymentType: String (enum: ['enrollment', 'installment', 'penalty']),
  
  // Transaction Details
  transactionId: String (unique),
  gatewayOrderId: String,
  gatewayPaymentId: String,
  gateway: String (enum: ['razorpay', 'paytm', 'phonepe', 'offline']),
  
  // Status
  status: String (enum: ['pending', 'processing', 'completed', 'failed', 'refunded']),
  failureReason: String,
  
  // Installment Information (if applicable)
  isInstallment: Boolean,
  installmentNumber: Number,
  totalInstallments: Number,
  dueDate: Date,
  
  // Refund Information
  refundAmount: Number,
  refundReason: String,
  refundedAt: Date,
  refundTransactionId: String,
  
  // Commission & Settlement
  platformFee: Number,
  teacherEarning: Number,
  settlementStatus: String (enum: ['pending', 'processed', 'settled']),
  settledAt: Date,
  
  // Receipt
  receiptNumber: String (unique),
  receiptUrl: String,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### 5. **Assignments Collection**
Manages assignments and submissions.

```javascript
{
  _id: ObjectId,
  
  // References
  class: ObjectId (ref: 'Class', required, indexed),
  teacher: ObjectId (ref: 'User', required),
  module: ObjectId,
  
  // Assignment Details
  title: String (required),
  description: String,
  instructions: String,
  type: String (enum: ['homework', 'project', 'test', 'quiz']),
  
  // Files & Resources
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  referenceLinks: [String],
  
  // Timing
  assignedDate: Date,
  dueDate: Date (required),
  duration: Number (minutes, for timed assignments),
  
  // Scoring
  totalMarks: Number,
  passingMarks: Number,
  weightage: Number (percentage of final grade),
  
  // Settings
  allowLateSubmission: Boolean,
  latePenalty: Number (percentage),
  maxAttempts: Number (default: 1),
  
  // Questions (for quiz/test)
  questions: [{
    question: String,
    type: String (enum: ['mcq', 'short', 'long', 'true-false']),
    options: [String],
    correctAnswer: String,
    marks: Number,
    explanation: String
  }],
  
  // Submissions
  submissions: [{
    student: ObjectId (ref: 'User'),
    submittedAt: Date,
    files: [{
      name: String,
      url: String
    }],
    answers: [{
      questionId: ObjectId,
      answer: String
    }],
    marks: Number,
    feedback: String,
    gradedBy: ObjectId (ref: 'User'),
    gradedAt: Date,
    status: String (enum: ['submitted', 'graded', 'returned'])
  }],
  
  // Statistics
  submissionCount: Number (default: 0),
  averageScore: Number,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### 6. **LiveClasses Collection**
Manages live/online classes.

```javascript
{
  _id: ObjectId,
  
  // References
  class: ObjectId (ref: 'Class', required, indexed),
  teacher: ObjectId (ref: 'User', required),
  
  // Class Details
  title: String (required),
  description: String,
  topic: String,
  
  // Schedule
  scheduledAt: Date (required),
  duration: Number (minutes),
  actualStartTime: Date,
  actualEndTime: Date,
  
  // Meeting Details
  meetingUrl: String,
  meetingId: String,
  password: String,
  platform: String (enum: ['zoom', 'googlemeet', 'teams', 'custom']),
  
  // Recurring
  isRecurring: Boolean,
  recurringPattern: {
    frequency: String (enum: ['daily', 'weekly', 'monthly']),
    daysOfWeek: [Number],
    endDate: Date,
    occurrences: Number
  },
  parentSession: ObjectId (ref: 'LiveClass'),
  
  // Capacity
  maxAttendees: Number,
  
  // Attendance
  attendees: [{
    student: ObjectId (ref: 'User'),
    joinedAt: Date,
    leftAt: Date,
    duration: Number (minutes),
    attendance: Boolean
  }],
  attendanceCount: Number,
  
  // Recording
  isRecorded: Boolean,
  recordingUrl: String,
  recordingDuration: Number,
  recordingAvailableUntil: Date,
  
  // Status
  status: String (enum: ['scheduled', 'live', 'completed', 'cancelled']),
  cancellationReason: String,
  
  // Resources
  materials: [{
    title: String,
    url: String,
    type: String
  }],
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### 7. **Notifications Collection**
Handles all system notifications.

```javascript
{
  _id: ObjectId,
  
  // Recipients
  recipient: ObjectId (ref: 'User', indexed),
  sender: ObjectId (ref: 'User'),
  
  // Notification Details
  title: String (required),
  message: String (required),
  type: String (enum: ['enrollment', 'payment', 'assignment', 'class', 'announcement', 'reminder']),
  priority: String (enum: ['low', 'medium', 'high', 'urgent']),
  
  // References
  relatedClass: ObjectId (ref: 'Class'),
  relatedAssignment: ObjectId (ref: 'Assignment'),
  relatedPayment: ObjectId (ref: 'Payment'),
  
  // Action
  actionUrl: String,
  actionText: String,
  
  // Status
  isRead: Boolean (default: false),
  readAt: Date,
  
  // Delivery
  channels: [String] (enum: ['in-app', 'email', 'sms', 'push']),
  emailSent: Boolean,
  smsSent: Boolean,
  pushSent: Boolean,
  
  // Timestamps
  createdAt: Date,
  expiresAt: Date
}
```

### 8. **Reviews Collection**
Student reviews and ratings for classes.

```javascript
{
  _id: ObjectId,
  
  // References
  student: ObjectId (ref: 'User', required, indexed),
  class: ObjectId (ref: 'Class', required, indexed),
  teacher: ObjectId (ref: 'User', indexed),
  enrollment: ObjectId (ref: 'Enrollment'),
  
  // Review
  rating: Number (1-5, required),
  title: String,
  review: String (required),
  
  // Detailed Ratings
  contentQuality: Number (1-5),
  teachingQuality: Number (1-5),
  communication: Number (1-5),
  valueForMoney: Number (1-5),
  
  // Verification
  isVerified: Boolean (completed the class),
  
  // Moderation
  status: String (enum: ['pending', 'approved', 'rejected']),
  moderatedBy: ObjectId (ref: 'User'),
  moderatedAt: Date,
  moderationReason: String,
  
  // Interaction
  helpful: Number (default: 0),
  unhelpful: Number (default: 0),
  helpfulVoters: [ObjectId] (ref: 'User'),
  
  // Teacher Response
  teacherResponse: String,
  teacherRespondedAt: Date,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### 9. **Messages Collection**
Direct messaging between users.

```javascript
{
  _id: ObjectId,
  
  // Participants
  sender: ObjectId (ref: 'User', required, indexed),
  recipient: ObjectId (ref: 'User', required, indexed),
  
  // Message
  subject: String,
  message: String (required),
  
  // Context
  relatedClass: ObjectId (ref: 'Class'),
  relatedAssignment: ObjectId (ref: 'Assignment'),
  
  // Attachments
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  
  // Thread
  parentMessage: ObjectId (ref: 'Message'),
  threadId: String,
  
  // Status
  isRead: Boolean (default: false),
  readAt: Date,
  isDeleted: Boolean (default: false),
  deletedBy: ObjectId (ref: 'User'),
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### 10. **Announcements Collection**
System-wide or class-specific announcements.

```javascript
{
  _id: ObjectId,
  
  // Author
  author: ObjectId (ref: 'User', required),
  
  // Announcement Details
  title: String (required),
  content: String (required),
  type: String (enum: ['system', 'class', 'urgent']),
  
  // Target Audience
  targetAudience: String (enum: ['all', 'students', 'teachers', 'class']),
  targetClass: ObjectId (ref: 'Class'),
  targetStandards: [String],
  targetBoards: [String],
  
  // Display
  isPinned: Boolean (default: false),
  priority: String (enum: ['low', 'medium', 'high']),
  
  // Validity
  publishAt: Date,
  expiresAt: Date,
  
  // Tracking
  viewCount: Number (default: 0),
  viewedBy: [ObjectId] (ref: 'User'),
  
  // Status
  status: String (enum: ['draft', 'published', 'archived']),
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

## Indexes

### Performance Indexes
```javascript
// Users
- email: unique index
- role: index
- board + standard: compound index (for students)

// Classes
- teacher: index
- board + standard + subject: compound index
- status: index
- createdAt: descending index

// Enrollments
- student: index
- class: index
- student + class: unique compound index

// Payments
- student: index
- transactionId: unique index
- status: index

// Assignments
- class: index
- dueDate: index

// LiveClasses
- class: index
- scheduledAt: index
- status: index

// Notifications
- recipient: index
- isRead: index
- createdAt: descending index

// Reviews
- class: index
- teacher: index
- student + class: unique compound index
```

## Relationships

### User Relationships
- **Student** → has many → Enrollments
- **Student** → has many → Payments
- **Student** → has many → Reviews
- **Teacher** → has many → Classes
- **Teacher** → has many → LiveClasses
- **Teacher** → has many → Assignments

### Class Relationships
- **Class** → belongs to → Teacher (User)
- **Class** → has many → Enrollments
- **Class** → has many → Assignments
- **Class** → has many → LiveClasses
- **Class** → has many → Reviews

### Enrollment Relationships
- **Enrollment** → belongs to → Student (User)
- **Enrollment** → belongs to → Class
- **Enrollment** → has one → Payment
- **Enrollment** → has many → Assignment Submissions

## Data Integrity Rules

1. **User Deletion**: Soft delete - set isActive to false
2. **Class Deletion**: Only if no active enrollments
3. **Enrollment**: Unique per student-class combination
4. **Payment**: Cannot be deleted, only refunded
5. **Reviews**: One review per student per class
6. **Attendance**: Cannot exceed class duration

## Security Considerations

1. **Sensitive Data Encryption**:
   - User passwords (bcrypt)
   - Bank account details
   - Payment information

2. **Access Control**:
   - Students: Can only access enrolled classes
   - Teachers: Can only modify their own classes
   - Admin: Full access with audit logging

3. **Data Privacy**:
   - Parent information visible only to admin
   - Payment details visible only to payer and admin
   - Teacher earnings visible only to teacher and admin

## Backup Strategy

1. **Daily Backups**: Full database backup
2. **Hourly Backups**: Critical collections (Users, Payments, Enrollments)
3. **Real-time Replication**: For high availability
4. **Point-in-time Recovery**: 30-day retention

## Migration Considerations

1. **Version Control**: Schema versioning for migrations
2. **Backward Compatibility**: Maintain for 2 versions
3. **Data Validation**: Pre and post-migration checks
4. **Rollback Plan**: Automated rollback on failure