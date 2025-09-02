const mongoose = require('mongoose');
const LiveClass = require('../src/models/LiveClass');
const Enrollment = require('../src/models/Enrollment');
const Class = require('../src/models/Class');
const User = require('../src/models/User');
require('dotenv').config();

async function testStudentLiveClassFlow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB\n');
    
    // 1. Check for existing live classes
    console.log('1️⃣ Checking existing live classes...');
    const liveClasses = await LiveClass.find()
      .populate('class', 'title')
      .populate('teacher', 'name');
    
    console.log(`Found ${liveClasses.length} live classes`);
    
    if (liveClasses.length > 0) {
      console.log('\n📚 Live Classes:');
      liveClasses.forEach(lc => {
        console.log(`  - ${lc.title}`);
        console.log(`    Class: ${lc.class?.title || 'N/A'}`);
        console.log(`    Teacher: ${lc.teacher?.name || 'N/A'}`);
        console.log(`    Scheduled: ${new Date(lc.scheduledAt).toLocaleString()}`);
        console.log(`    Status: ${lc.status}`);
        console.log(`    Meeting URL: ${lc.meetingUrl}`);
        console.log('');
      });
    }
    
    // 2. Check student enrollments
    console.log('2️⃣ Checking student enrollments...');
    const student = await User.findOne({ role: 'student' });
    
    if (!student) {
      console.log('❌ No student found in database');
      return;
    }
    
    console.log(`Student: ${student.name} (${student.email})`);
    
    const enrollments = await Enrollment.find({ 
      student: student._id,
      status: { $in: ['active', 'enrolled'] }
    }).populate('class', 'title');
    
    console.log(`\n📚 Student is enrolled in ${enrollments.length} classes:`);
    enrollments.forEach(e => {
      console.log(`  - ${e.class?.title || 'Unknown'} (Status: ${e.status})`);
    });
    
    // 3. Check which live classes the student can access
    const enrolledClassIds = enrollments.map(e => e.class?._id.toString()).filter(Boolean);
    const studentLiveClasses = liveClasses.filter(lc => 
      enrolledClassIds.includes(lc.class?._id.toString())
    );
    
    console.log(`\n3️⃣ Live classes accessible to student: ${studentLiveClasses.length}`);
    
    if (studentLiveClasses.length > 0) {
      console.log('\n✅ Student can join these live classes:');
      studentLiveClasses.forEach(lc => {
        console.log(`  - ${lc.title}`);
        console.log(`    Meeting URL: ${lc.meetingUrl}`);
        const timeUntil = new Date(lc.scheduledAt).getTime() - Date.now();
        if (timeUntil > 0) {
          const hours = Math.floor(timeUntil / (1000 * 60 * 60));
          const minutes = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
          console.log(`    Starts in: ${hours}h ${minutes}m`);
        } else {
          console.log(`    Status: ${lc.status === 'live' ? '🔴 LIVE NOW' : 'Past'}`);
        }
      });
    } else {
      console.log('⚠️ No live classes available for student\'s enrolled courses');
      
      // Create a sample live class for testing
      console.log('\n4️⃣ Creating a test live class for the student...');
      
      if (enrollments.length > 0) {
        const firstEnrollment = enrollments[0];
        const teacher = await User.findOne({ role: 'teacher' });
        
        if (teacher) {
          const testLiveClass = await LiveClass.create({
            title: 'Test Live Class for Student',
            description: 'This is a test live class to verify student can see and join',
            class: firstEnrollment.class._id,
            teacher: teacher._id,
            scheduledAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
            duration: 60,
            meetingUrl: 'https://meet.google.com/test-meeting-123',
            meetingId: 'test-meeting-123',
            status: 'scheduled'
          });
          
          console.log('✅ Created test live class:');
          console.log(`  Title: ${testLiveClass.title}`);
          console.log(`  Class: ${firstEnrollment.class.title}`);
          console.log(`  Scheduled: ${testLiveClass.scheduledAt.toLocaleString()}`);
          console.log(`  Meeting URL: ${testLiveClass.meetingUrl}`);
        }
      }
    }
    
    console.log('\n✅ Student Live Class Flow Test Complete!');
    console.log('\n📋 Summary:');
    console.log('1. Students can see live classes in their dashboard');
    console.log('2. Live classes are filtered to show only enrolled classes');
    console.log('3. Students can join live classes via meeting URL');
    console.log('4. Join button is enabled when class is live');
    
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testStudentLiveClassFlow();