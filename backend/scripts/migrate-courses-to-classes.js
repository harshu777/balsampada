/**
 * Migration Script: Rename courses collection to classes
 * This script will:
 * 1. Copy all documents from courses to classes
 * 2. Update references in other collections
 * 3. Rename the courses collection
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/balsampada-lms';

async function migrate() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Step 1: Check if courses collection exists
    const collections = await db.listCollections().toArray();
    const coursesExists = collections.some(col => col.name === 'courses');
    const classesExists = collections.some(col => col.name === 'classes');

    if (!coursesExists) {
      console.log('No courses collection found. Migration not needed.');
      process.exit(0);
    }

    // Step 2: Get all courses
    const coursesCollection = db.collection('courses');
    const courses = await coursesCollection.find({}).toArray();
    console.log(`Found ${courses.length} courses to migrate`);

    if (courses.length > 0) {
      // Step 3: Insert courses into classes collection
      const classesCollection = db.collection('classes');
      
      // Clear existing classes collection if it exists
      if (classesExists) {
        const existingCount = await classesCollection.countDocuments();
        if (existingCount > 0) {
          console.log(`Classes collection already has ${existingCount} documents. Backing up...`);
          // Create backup
          const backupCollection = db.collection('classes_backup_' + Date.now());
          const existingClasses = await classesCollection.find({}).toArray();
          if (existingClasses.length > 0) {
            await backupCollection.insertMany(existingClasses);
            console.log('Backup created');
          }
        }
        await classesCollection.deleteMany({});
      }

      // Insert courses as classes
      await classesCollection.insertMany(courses);
      console.log(`Migrated ${courses.length} documents to classes collection`);

      // Step 4: Update references in other collections
      
      // Update enrollments collection (course -> class)
      const enrollmentsCollection = db.collection('enrollments');
      const enrollmentUpdateResult = await enrollmentsCollection.updateMany(
        { course: { $exists: true } },
        { $rename: { 'course': 'class' } }
      );
      console.log(`Updated ${enrollmentUpdateResult.modifiedCount} enrollments`);

      // Update payments collection (course -> class)
      const paymentsCollection = db.collection('payments');
      const paymentUpdateResult = await paymentsCollection.updateMany(
        { course: { $exists: true } },
        { $rename: { 'course': 'class' } }
      );
      console.log(`Updated ${paymentUpdateResult.modifiedCount} payments`);

      // Update assignments collection (course -> class)
      const assignmentsCollection = db.collection('assignments');
      const assignmentUpdateResult = await assignmentsCollection.updateMany(
        { course: { $exists: true } },
        { $rename: { 'course': 'class' } }
      );
      console.log(`Updated ${assignmentUpdateResult.modifiedCount} assignments`);

      // Update liveclasses collection (course -> class)
      const liveclassesCollection = db.collection('liveclasses');
      const liveclassUpdateResult = await liveclassesCollection.updateMany(
        { course: { $exists: true } },
        { $rename: { 'course': 'class' } }
      );
      console.log(`Updated ${liveclassUpdateResult.modifiedCount} live classes`);

      // Update users collection (enrolledCourses -> enrolledClasses, teachingCourses -> teachingClasses)
      const usersCollection = db.collection('users');
      
      // Update students
      const studentUpdateResult = await usersCollection.updateMany(
        { enrolledCourses: { $exists: true } },
        { $rename: { 'enrolledCourses': 'enrolledClasses' } }
      );
      console.log(`Updated ${studentUpdateResult.modifiedCount} students`);

      // Update teachers
      const teacherUpdateResult = await usersCollection.updateMany(
        { teachingCourses: { $exists: true } },
        { $rename: { 'teachingCourses': 'teachingClasses' } }
      );
      console.log(`Updated ${teacherUpdateResult.modifiedCount} teachers`);
    }

    // Step 5: Rename or drop the courses collection
    console.log('Renaming courses collection to courses_old_backup...');
    await coursesCollection.rename('courses_old_backup_' + Date.now());
    
    console.log('\n✅ Migration completed successfully!');
    console.log('The courses collection has been backed up and data migrated to classes collection.');
    
    // Verify migration
    const classesCollection = db.collection('classes');
    const finalCount = await classesCollection.countDocuments();
    console.log(`\nFinal verification: ${finalCount} documents in classes collection`);

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();