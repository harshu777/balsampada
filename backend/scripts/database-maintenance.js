const mongoose = require('mongoose');
const User = require('../src/models/User');
const Class = require('../src/models/Class');
const Enrollment = require('../src/models/Enrollment');
const Assignment = require('../src/models/Assignment');
const StudyMaterial = require('../src/models/StudyMaterial');
const StudentGroup = require('../src/models/StudentGroup');
require('dotenv').config({ path: '../.env' });

async function runMaintenance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔧 Database Maintenance Started\n');

    // 1. Standardize enrollment statuses
    console.log('📊 Standardizing enrollment statuses...');
    const enrolledToActive = await Enrollment.updateMany(
      { status: 'enrolled' },
      { status: 'active' }
    );
    console.log(`✅ Updated ${enrolledToActive.modifiedCount} enrollments from 'enrolled' to 'active'`);

    // 2. Remove orphaned enrollments (class doesn't exist)
    console.log('\n🧹 Cleaning orphaned enrollments...');
    const validClassIds = await Class.find().distinct('_id');
    const orphanedEnrollments = await Enrollment.deleteMany({
      class: { $nin: validClassIds }
    });
    console.log(`✅ Removed ${orphanedEnrollments.deletedCount} orphaned enrollments`);

    // 3. Remove orphaned assignments
    console.log('\n🧹 Cleaning orphaned assignments...');
    const orphanedAssignments = await Assignment.deleteMany({
      class: { $nin: validClassIds }
    });
    console.log(`✅ Removed ${orphanedAssignments.deletedCount} orphaned assignments`);

    // 4. Remove orphaned study materials
    console.log('\n🧹 Cleaning orphaned study materials...');
    const orphanedMaterials = await StudyMaterial.deleteMany({
      class: { $nin: validClassIds }
    });
    console.log(`✅ Removed ${orphanedMaterials.deletedCount} orphaned study materials`);

    // 5. Remove orphaned student groups
    console.log('\n🧹 Cleaning orphaned student groups...');
    const orphanedGroups = await StudentGroup.deleteMany({
      class: { $nin: validClassIds }
    });
    console.log(`✅ Removed ${orphanedGroups.deletedCount} orphaned student groups`);

    // 6. Clean up invalid user references in enrollments
    console.log('\n🧹 Cleaning invalid user references...');
    const validUserIds = await User.find().distinct('_id');
    const invalidUserEnrollments = await Enrollment.deleteMany({
      student: { $nin: validUserIds }
    });
    console.log(`✅ Removed ${invalidUserEnrollments.deletedCount} enrollments with invalid users`);

    // 7. Update classes with correct enrolled student counts
    console.log('\n📊 Updating class enrollment counts...');
    const classes = await Class.find();
    for (const cls of classes) {
      const enrollments = await Enrollment.find({
        class: cls._id,
        status: { $in: ['active', 'completed'] }
      }).distinct('student');
      
      cls.enrolledStudents = enrollments;
      await cls.save();
    }
    console.log(`✅ Updated ${classes.length} classes with correct enrollment counts`);

    // 8. Fix payment status inconsistencies
    console.log('\n💰 Fixing payment status inconsistencies...');
    const fixedPayments = await Enrollment.updateMany(
      { 'payment.paidAmount': { $gt: 0 }, 'payment.status': 'pending' },
      { 'payment.status': 'partial' }
    );
    console.log(`✅ Fixed ${fixedPayments.modifiedCount} payment statuses`);

    // 9. Set default values for missing required fields
    console.log('\n🔧 Setting default values for missing fields...');
    
    // Set default progress for enrollments without it
    await Enrollment.updateMany(
      { 'progress.percentageComplete': null },
      { 'progress.percentageComplete': 0 }
    );
    
    // Set default isActive for classes without it
    await Class.updateMany(
      { isActive: null },
      { isActive: true }
    );
    
    // Set default isPublished for assignments without it
    await Assignment.updateMany(
      { isPublished: null },
      { isPublished: false }
    );
    
    console.log('✅ Default values set');

    // 10. Database statistics
    console.log('\n📈 Database Statistics:');
    const stats = {
      users: await User.countDocuments(),
      teachers: await User.countDocuments({ role: 'teacher' }),
      students: await User.countDocuments({ role: 'student' }),
      classes: await Class.countDocuments(),
      activeClasses: await Class.countDocuments({ status: 'published', isActive: true }),
      enrollments: await Enrollment.countDocuments(),
      activeEnrollments: await Enrollment.countDocuments({ status: 'active' }),
      assignments: await Assignment.countDocuments(),
      studyMaterials: await StudyMaterial.countDocuments(),
      studentGroups: await StudentGroup.countDocuments()
    };
    
    console.table(stats);

    // 11. Check for potential issues
    console.log('\n⚠️  Potential Issues:');
    
    // Classes without teachers
    const classesWithoutTeacher = await Class.countDocuments({ teacher: null });
    if (classesWithoutTeacher > 0) {
      console.log(`❗ ${classesWithoutTeacher} classes without teachers`);
    }
    
    // Users without email
    const usersWithoutEmail = await User.countDocuments({ email: null });
    if (usersWithoutEmail > 0) {
      console.log(`❗ ${usersWithoutEmail} users without email`);
    }
    
    // Duplicate enrollments (shouldn't exist due to unique index)
    const duplicateCheck = await Enrollment.aggregate([
      { $group: { 
        _id: { student: '$student', class: '$class' },
        count: { $sum: 1 }
      }},
      { $match: { count: { $gt: 1 } } }
    ]);
    if (duplicateCheck.length > 0) {
      console.log(`❗ ${duplicateCheck.length} duplicate enrollment combinations found`);
    }

    console.log('\n✅ Database maintenance completed successfully!');
    
    await mongoose.connection.close();
    console.log('🔒 Database connection closed');
  } catch (error) {
    console.error('❌ Error during maintenance:', error);
    process.exit(1);
  }
}

// Run with confirmation
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  DATABASE MAINTENANCE SCRIPT');
console.log('This script will:');
console.log('1. Standardize enrollment statuses');
console.log('2. Remove orphaned data');
console.log('3. Fix data inconsistencies');
console.log('4. Update statistics\n');

rl.question('Do you want to proceed? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    rl.close();
    runMaintenance();
  } else {
    console.log('Maintenance cancelled');
    rl.close();
    process.exit(0);
  }
});