const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Enrollment = require('../src/models/Enrollment');
const Class = require('../src/models/Class');
const User = require('../src/models/User');

async function cleanupEnrollments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/balsampada-lms');
    console.log('Connected to MongoDB');

    // Find enrollments with null or invalid class references
    const allEnrollments = await Enrollment.find().populate('class').populate('student', 'name');
    
    console.log(`Total enrollments: ${allEnrollments.length}`);
    
    let invalidCount = 0;
    let validCount = 0;
    
    for (const enrollment of allEnrollments) {
      if (!enrollment.class) {
        console.log(`Removing invalid enrollment: Student ${enrollment.student?.name || 'Unknown'} (ID: ${enrollment._id})`);
        await Enrollment.deleteOne({ _id: enrollment._id });
        invalidCount++;
      } else {
        validCount++;
      }
    }
    
    console.log(`\nCleanup complete:`);
    console.log(`  - Valid enrollments: ${validCount}`);
    console.log(`  - Invalid enrollments removed: ${invalidCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning up enrollments:', error);
    process.exit(1);
  }
}

cleanupEnrollments();