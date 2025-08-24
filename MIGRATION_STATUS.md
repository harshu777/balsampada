# Database Migration Status

## Current Implementation vs New Schema

### ✅ Already Implemented

#### **Class Model**
- ✅ `board` field (CBSE, ICSE, etc.)
- ✅ `standard` field (1-12, UG, PG)
- ✅ `subject` field 
- ✅ `batch` field (A, B, C, Morning, Evening, Weekend)
- ✅ `academicYear` field
- ✅ `medium` field (English, Hindi, etc.)
- ✅ `classType` field (Regular, Crash Course, etc.)
- ✅ `teacher` reference
- ✅ `enrolledStudents` array

#### **User Model**
- ✅ `enrolledClasses` (for students)
- ✅ `teachingClasses` (for teachers)
- ✅ Basic fields (name, email, password, phone, role)

#### **Enrollment Model**
- ✅ Basic enrollment tracking
- ✅ Student and Class references

#### **Payment Model**
- ✅ Basic payment tracking
- ✅ Transaction details

#### **Assignment Model**
- ✅ Basic assignment structure
- ✅ Submissions tracking

#### **LiveClass Model**
- ✅ Basic live class management
- ✅ Attendance tracking

---

### ❌ NOT Implemented (Need Migration)

#### **User Model - Missing Fields**
```javascript
// Student-specific fields needed:
- parentInfo: {
    fatherName, motherName, 
    parentPhone, parentEmail
  }
- board (student's board)
- standard (student's current class)
- school
- dateOfBirth
- gender
- address

// Teacher-specific fields needed:
- qualification
- specialization
- experience
- subjects (array of subjects they teach)
- boards (boards they're qualified for)
- bankDetails (for payment settlements)
```

#### **Class Model - Missing Fields**
```javascript
// Schedule fields needed:
- startDate
- endDate
- schedule (e.g., "Mon, Wed, Fri - 4:00 PM")
- classesPerWeek
- classDuration (minutes)
- totalClasses
- completedClasses

// Capacity fields needed:
- maxStudents
- minStudents

// Content fields needed:
- syllabus
- prerequisites
- learningOutcomes

// Analytics fields needed:
- totalRevenue
- completionRate
```

#### **Enrollment Model - Missing Fields**
```javascript
// Progress tracking needed:
- progress: {
    completedModules,
    lastAccessedAt,
    percentageComplete,
    totalStudyTime
  }
- attendance array
- attendancePercentage
- grades object
- certificate information
```

#### **Payment Model - Missing Fields**
```javascript
// Commission & Settlement needed:
- platformFee
- teacherEarning
- settlementStatus
- settledAt

// Installment support needed:
- isInstallment
- installmentNumber
- totalInstallments
- dueDate
```

#### **Missing Collections Entirely**
1. **Reviews Collection** - For student reviews and ratings
2. **Notifications Collection** - For system notifications
3. **Messages Collection** - For direct messaging
4. **Announcements Collection** - For system/class announcements

---

## Migration Priority

### Phase 1 - Critical Updates (Do First)
1. **User Model**: Add student/teacher specific fields
2. **Class Model**: Add schedule and capacity fields
3. **Create Reviews Collection**: For ratings system

### Phase 2 - Enhancement Updates
1. **Enrollment Model**: Add progress tracking
2. **Payment Model**: Add commission/settlement fields
3. **Create Notifications Collection**

### Phase 3 - Communication Features
1. **Create Messages Collection**
2. **Create Announcements Collection**
3. Add communication preferences to User model

---

## Migration Commands Needed

### Step 1: Backup Current Database
```bash
mongodump --uri="mongodb://localhost:27017/balsampada-lms" --out=./backup-$(date +%Y%m%d)
```

### Step 2: Run Migration Scripts
```javascript
// Example migration for User model
db.users.updateMany(
  { role: 'student' },
  { 
    $set: {
      parentInfo: {},
      board: '',
      standard: '',
      school: ''
    }
  }
);

db.users.updateMany(
  { role: 'teacher' },
  { 
    $set: {
      qualification: '',
      specialization: [],
      experience: 0,
      subjects: [],
      boards: [],
      bankDetails: {}
    }
  }
);
```

### Step 3: Create New Collections
```javascript
// Create Reviews collection
db.createCollection('reviews');

// Create Notifications collection
db.createCollection('notifications');

// Create Messages collection
db.createCollection('messages');

// Create Announcements collection
db.createCollection('announcements');
```

### Step 4: Add Indexes
```javascript
// Add performance indexes
db.classes.createIndex({ board: 1, standard: 1, subject: 1 });
db.classes.createIndex({ teacher: 1 });
db.enrollments.createIndex({ student: 1, class: 1 }, { unique: true });
db.reviews.createIndex({ class: 1 });
db.reviews.createIndex({ teacher: 1 });
```

---

## Risk Assessment

### Low Risk Updates ✅
- Adding new fields with defaults
- Creating new collections
- Adding indexes

### Medium Risk Updates ⚠️
- Changing field types
- Adding required fields (need defaults)
- Modifying existing data structure

### High Risk Updates ❌
- Removing fields (none planned)
- Changing primary keys (none planned)
- Breaking schema changes (none planned)

---

## Recommendation

1. **Current Status**: The core board-based education fields ARE implemented in the Class model ✅
2. **Missing**: Enhanced user profiles, progress tracking, and communication features
3. **Action**: Can proceed with current implementation, add missing features gradually

The database is partially migrated with the most critical fields for board-based education already in place. The missing fields are mostly enhancements that can be added without breaking existing functionality.