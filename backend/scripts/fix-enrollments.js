const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const User = require('../src/models/User');
const Class = require('../src/models/Class');
const Enrollment = require('../src/models/Enrollment');

async function fixEnrollments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/balsampada-lms');
    console.log('Connected to MongoDB');

    // Find Harshal Baviskar (the student)
    const student = await User.findOne({ 
      name: { $regex: /harshal/i },
      role: 'student' 
    });

    if (!student) {
      console.log('Student "Harshal Baviskar" not found. Creating...');
      // If student doesn't exist, you might want to create one
      // But let's first check all students
      const allStudents = await User.find({ role: 'student' });
      console.log('Found students:', allStudents.map(s => ({ id: s._id, name: s.name, email: s.email })));
      
      if (allStudents.length === 0) {
        console.log('No students found in database');
        process.exit(1);
      }
    } else {
      console.log('Found student:', student.name, student.email);
    }

    // Find all classes
    const classes = await Class.find().populate('teacher', 'name email');
    console.log(`\nFound ${classes.length} classes:`);
    classes.forEach(cls => {
      console.log(`  - ${cls.title} (Teacher: ${cls.teacher?.name || 'Unknown'})`);
    });

    if (classes.length === 0) {
      console.log('\nNo classes found! Creating sample classes...');
      
      // Find a teacher or create one
      let teacher = await User.findOne({ role: 'teacher' });
      
      if (!teacher) {
        console.log('No teacher found. Creating a sample teacher...');
        teacher = await User.create({
          name: 'Dr. Smith',
          email: 'teacher@demo.com',
          password: 'Demo@123',
          role: 'teacher',
          phone: '9876543210',
          isEmailVerified: true,
          isActive: true
        });
        console.log('Created teacher:', teacher.name);
      }

      // Create sample classes
      const mathClass = await Class.create({
        title: 'Mathematics Grade 10',
        description: 'Complete mathematics course for grade 10 students',
        teacher: teacher._id,
        subject: 'Mathematics',
        standard: '10',
        category: 'Mathematics',
        level: 'Intermediate',
        price: 2999,
        duration: 120,
        language: 'English',
        isPublished: true,
        maxStudents: 30
      });

      const scienceClass = await Class.create({
        title: 'Science Grade 10',
        description: 'Physics, Chemistry, and Biology for grade 10',
        teacher: teacher._id,
        subject: 'Science',
        standard: '10',
        category: 'Science',
        level: 'Intermediate',
        price: 3499,
        duration: 150,
        language: 'English',
        isPublished: true,
        maxStudents: 30
      });

      console.log('Created classes:', [mathClass.title, scienceClass.title]);
      classes.push(mathClass, scienceClass);
    }

    // Check existing enrollments
    const existingEnrollments = await Enrollment.find()
      .populate('student', 'name email')
      .populate('class', 'title');
    
    console.log(`\nFound ${existingEnrollments.length} existing enrollments:`);
    existingEnrollments.forEach(enrollment => {
      if (enrollment.student && enrollment.class) {
        console.log(`  - ${enrollment.student.name} enrolled in ${enrollment.class.title}`);
      }
    });

    // Find the student to enroll (Harshal or any available student)
    const studentToEnroll = student || (await User.findOne({ role: 'student' }));
    
    if (!studentToEnroll) {
      console.log('\nNo student found to enroll!');
      process.exit(1);
    }

    // Enroll the student in all available classes if not already enrolled
    console.log(`\nEnrolling ${studentToEnroll.name} in classes...`);
    
    for (const cls of classes) {
      // Check if already enrolled
      const existingEnrollment = await Enrollment.findOne({
        student: studentToEnroll._id,
        class: cls._id
      });

      if (existingEnrollment) {
        console.log(`  - Already enrolled in ${cls.title}`);
        // Update status to ensure it's active
        if (existingEnrollment.status !== 'enrolled' && existingEnrollment.status !== 'active') {
          existingEnrollment.status = 'enrolled';
          await existingEnrollment.save();
          console.log(`    Updated status to 'enrolled'`);
        }
      } else {
        // Create new enrollment
        const enrollment = await Enrollment.create({
          student: studentToEnroll._id,
          class: cls._id,
          enrollmentDate: new Date(),
          status: 'enrolled',
          progress: {
            completedLessons: [],
            percentageComplete: 0,
            lastAccessedAt: new Date()
          }
        });
        console.log(`  - Enrolled in ${cls.title}`);
      }
    }

    // Verify enrollments are accessible
    console.log('\nVerifying enrollments for student groups...');
    const studentEnrollments = await Enrollment.find({
      student: studentToEnroll._id,
      status: { $in: ['enrolled', 'active'] }
    }).populate('class', 'title');

    console.log(`\n${studentToEnroll.name} is enrolled in ${studentEnrollments.length} classes:`);
    studentEnrollments.forEach(enrollment => {
      if (enrollment.class) {
        console.log(`  - ${enrollment.class.title} (Status: ${enrollment.status})`);
      } else {
        console.log(`  - [Class reference missing] (Status: ${enrollment.status})`);
      }
    });

    // Check if the API endpoint will return students correctly
    console.log('\nChecking class enrollments for group availability...');
    for (const cls of classes) {
      const enrollments = await Enrollment.find({
        class: cls._id,
        status: { $in: ['enrolled', 'active'] }
      }).populate('student', 'name email');

      console.log(`\n${cls.title} has ${enrollments.length} enrolled students:`);
      enrollments.forEach(e => {
        console.log(`  - ${e.student.name} (${e.student.email})`);
      });
    }

    console.log('\n✅ Enrollment fix completed successfully!');
    console.log('\nYou should now be able to see students when creating groups.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing enrollments:', error);
    process.exit(1);
  }
}

fixEnrollments();