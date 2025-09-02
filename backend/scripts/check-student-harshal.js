const mongoose = require('mongoose');
const User = require('../src/models/User');
const Enrollment = require('../src/models/Enrollment');
const Class = require('../src/models/Class');
require('dotenv').config({ path: '../.env' });

async function checkHarshal() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find Harshal Baviskar
    const harshal = await User.findOne({ 
      name: { $regex: /harshal/i },
      role: 'student'
    });
    
    if (harshal) {
      console.log('\n=== Found Student ===');
      console.log(`Name: ${harshal.name}`);
      console.log(`Email: ${harshal.email}`);
      console.log(`ID: ${harshal._id}`);
      console.log(`Role: ${harshal.role}`);
      
      // Check enrollments
      const enrollments = await Enrollment.find({ 
        student: harshal._id 
      }).populate('class', 'title teacher');
      
      console.log(`\n=== Enrollments (${enrollments.length}) ===`);
      for (const enrollment of enrollments) {
        console.log(`\nClass: ${enrollment.class?.title || 'N/A'}`);
        console.log(`Status: ${enrollment.status}`);
        console.log(`Enrollment Date: ${enrollment.enrollmentDate}`);
        console.log(`Class ID: ${enrollment.class?._id}`);
      }
    } else {
      console.log('\nHarshal Baviskar not found as student');
      
      // Check all students
      const students = await User.find({ role: 'student' });
      console.log('\n=== All Students ===');
      for (const student of students) {
        console.log(`- ${student.name} (${student.email})`);
      }
    }

    // Check all classes
    const classes = await Class.find().populate('teacher', 'name');
    console.log(`\n=== All Classes (${classes.length}) ===`);
    for (const cls of classes) {
      console.log(`\n- ${cls.title}`);
      console.log(`  Teacher: ${cls.teacher?.name}`);
      console.log(`  Status: ${cls.status}`);
      console.log(`  Enrolled: ${cls.enrolledStudents?.length || 0} students`);
      console.log(`  ID: ${cls._id}`);
    }

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkHarshal();