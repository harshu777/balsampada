require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../src/models/User');
const Class = require('../src/models/Class');
const Enrollment = require('../src/models/Enrollment');
const Assignment = require('../src/models/Assignment');
const Payment = require('../src/models/Payment');
const Notification = require('../src/models/Notification');
const StudyMaterial = require('../src/models/StudyMaterial');
const LiveClass = require('../src/models/LiveClass');
const Grade = require('../src/models/Grade');
const Subject = require('../src/models/Subject');

async function createIndexSafely(collection, index, options = {}) {
  try {
    await collection.createIndex(index, options);
    console.log(`  ✓ Index created: ${JSON.stringify(index)}`);
  } catch (error) {
    if (error.code === 85 || error.code === 86) {
      console.log(`  ⚠ Index already exists: ${JSON.stringify(index)}`);
    } else {
      console.log(`  ✗ Failed to create index ${JSON.stringify(index)}: ${error.message}`);
    }
  }
}

async function addIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // User indexes
    console.log('\nAdding User indexes...');
    await createIndexSafely(User.collection, { email: 1 }, { unique: true });
    await createIndexSafely(User.collection, { role: 1 });
    await createIndexSafely(User.collection, { 'academicProfile.board': 1, 'academicProfile.standard': 1 });
    await createIndexSafely(User.collection, { 'academicProfile.canTeachBoards': 1 });
    await createIndexSafely(User.collection, { 'onboardingStatus.status': 1 });
    await createIndexSafely(User.collection, { createdAt: -1 });

    // Class indexes
    console.log('\nAdding Class indexes...');
    await createIndexSafely(Class.collection, { teacher: 1 });
    await createIndexSafely(Class.collection, { status: 1 });
    await createIndexSafely(Class.collection, { category: 1 });
    await createIndexSafely(Class.collection, { board: 1, standard: 1 });
    await createIndexSafely(Class.collection, { price: 1 });
    await createIndexSafely(Class.collection, { startDate: 1 });
    await createIndexSafely(Class.collection, { createdAt: -1 });

    // Enrollment indexes
    console.log('\nAdding Enrollment indexes...');
    await createIndexSafely(Enrollment.collection, { student: 1, class: 1 }, { unique: true });
    await createIndexSafely(Enrollment.collection, { student: 1, status: 1 });
    await createIndexSafely(Enrollment.collection, { class: 1, status: 1 });
    await createIndexSafely(Enrollment.collection, { enrollmentDate: -1 });
    await createIndexSafely(Enrollment.collection, { 'progress.percentageComplete': 1 });

    // Assignment indexes
    console.log('\nAdding Assignment indexes...');
    await createIndexSafely(Assignment.collection, { class: 1, isPublished: 1 });
    await createIndexSafely(Assignment.collection, { createdBy: 1 });
    await createIndexSafely(Assignment.collection, { dueDate: 1 });
    await createIndexSafely(Assignment.collection, { 'submissions.student': 1 });
    await createIndexSafely(Assignment.collection, { 'submissions.status': 1 });
    await createIndexSafely(Assignment.collection, { createdAt: -1 });

    // Payment indexes
    console.log('\nAdding Payment indexes...');
    await createIndexSafely(Payment.collection, { student: 1, status: 1 });
    await createIndexSafely(Payment.collection, { class: 1, status: 1 });
    await createIndexSafely(Payment.collection, { orderId: 1 }, { unique: true });
    await createIndexSafely(Payment.collection, { createdAt: -1 });

    // Notification indexes
    console.log('\nAdding Notification indexes...');
    await createIndexSafely(Notification.collection, { recipient: 1, createdAt: -1 });
    await createIndexSafely(Notification.collection, { recipient: 1, isRead: 1 });
    await createIndexSafely(Notification.collection, { type: 1, createdAt: -1 });
    // TTL index for auto-expiry
    await createIndexSafely(Notification.collection, { createdAt: 1 }, { expireAfterSeconds: 7776000 });

    // StudyMaterial indexes
    console.log('\nAdding StudyMaterial indexes...');
    await createIndexSafely(StudyMaterial.collection, { class: 1 });
    await createIndexSafely(StudyMaterial.collection, { uploadedBy: 1 });
    await createIndexSafely(StudyMaterial.collection, { type: 1 });
    await createIndexSafely(StudyMaterial.collection, { category: 1 });
    await createIndexSafely(StudyMaterial.collection, { uploadedAt: -1 });

    // LiveClass indexes
    console.log('\nAdding LiveClass indexes...');
    await createIndexSafely(LiveClass.collection, { class: 1, scheduledAt: 1 });
    await createIndexSafely(LiveClass.collection, { teacher: 1, scheduledAt: 1 });
    await createIndexSafely(LiveClass.collection, { status: 1 });
    await createIndexSafely(LiveClass.collection, { scheduledAt: 1 });
    await createIndexSafely(LiveClass.collection, { grade: 1, subject: 1 });

    // Grade indexes
    console.log('\nAdding Grade indexes...');
    await createIndexSafely(Grade.collection, { name: 1, board: 1, medium: 1 }, { unique: true });
    await createIndexSafely(Grade.collection, { board: 1 });
    await createIndexSafely(Grade.collection, { enrolledStudents: 1 });
    await createIndexSafely(Grade.collection, { academicYear: 1 });

    // Subject indexes
    console.log('\nAdding Subject indexes...');
    await createIndexSafely(Subject.collection, { code: 1 }, { unique: true });
    await createIndexSafely(Subject.collection, { grade: 1 });
    await createIndexSafely(Subject.collection, { 'teachers.teacher': 1 });

    console.log('\n✅ All indexes processing complete!');
    
    // List all indexes for verification
    console.log('\n📊 Verifying indexes...');
    const collections = [
      'users', 'classes', 'enrollments', 'assignments', 
      'payments', 'notifications', 'studymaterials', 
      'liveclasses', 'grades', 'subjects'
    ];
    
    for (const collName of collections) {
      try {
        const indexes = await mongoose.connection.db.collection(collName).indexes();
        console.log(`  ${collName}: ${indexes.length} indexes`);
      } catch (error) {
        console.log(`  ${collName}: Collection may not exist`);
      }
    }

  } catch (error) {
    console.error('Error in main process:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

addIndexes();