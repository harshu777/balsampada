const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/models/User');

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/balsampada-lms');
    console.log('Connected to MongoDB');

    // Test teacher login
    const teacher = await User.findOne({ email: 'teacher1@demo.com' }).select('+password');
    if (teacher) {
      console.log('Teacher found:', teacher.name);
      const isMatch = await teacher.matchPassword('Demo@123');
      console.log('Password match for teacher:', isMatch);
      
      // Test manual bcrypt compare
      const manualCheck = await bcrypt.compare('Demo@123', teacher.password);
      console.log('Manual bcrypt check:', manualCheck);
    } else {
      console.log('Teacher not found');
    }

    // Test student login
    const student = await User.findOne({ email: 'student1@demo.com' }).select('+password');
    if (student) {
      console.log('Student found:', student.name);
      const isMatch = await student.matchPassword('Demo@123');
      console.log('Password match for student:', isMatch);
    } else {
      console.log('Student not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testLogin();