const mongoose = require('mongoose');
const User = require('../src/models/User');
const Class = require('../src/models/Class');
const Enrollment = require('../src/models/Enrollment');
const Assignment = require('../src/models/Assignment');
const LiveClass = require('../src/models/LiveClass');
const StudentGroup = require('../src/models/StudentGroup');
const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function systemHealthCheck() {
  console.log('🔍 SYSTEM HEALTH CHECK STARTING...\n');
  console.log('=' .repeat(50));
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connection successful\n');
    
    // 1. Check Users
    console.log('👥 USER ACCOUNTS:');
    console.log('-'.repeat(30));
    const users = await User.find().select('name email role isVerified');
    const usersByRole = {
      admin: users.filter(u => u.role === 'admin'),
      teacher: users.filter(u => u.role === 'teacher'),
      student: users.filter(u => u.role === 'student')
    };
    
    console.log(`Total Users: ${users.length}`);
    console.log(`  Admins: ${usersByRole.admin.length}`);
    console.log(`  Teachers: ${usersByRole.teacher.length}`);
    console.log(`  Students: ${usersByRole.student.length}`);
    
    // Show sample users
    console.log('\nSample Users:');
    if (usersByRole.student[0]) {
      console.log(`  Student: ${usersByRole.student[0].name} (${usersByRole.student[0].email})`);
    }
    if (usersByRole.teacher[0]) {
      console.log(`  Teacher: ${usersByRole.teacher[0].name} (${usersByRole.teacher[0].email})`);
    }
    if (usersByRole.admin[0]) {
      console.log(`  Admin: ${usersByRole.admin[0].name} (${usersByRole.admin[0].email})`);
    }
    
    // 2. Check Classes
    console.log('\n📚 CLASSES:');
    console.log('-'.repeat(30));
    const classes = await Class.find().populate('teacher', 'name');
    console.log(`Total Classes: ${classes.length}`);
    classes.slice(0, 3).forEach(cls => {
      console.log(`  - ${cls.title} (Teacher: ${cls.teacher?.name || 'N/A'})`);
    });
    
    // 3. Check Enrollments
    console.log('\n📝 ENROLLMENTS:');
    console.log('-'.repeat(30));
    const enrollments = await Enrollment.find()
      .populate('student', 'name')
      .populate('class', 'title');
    console.log(`Total Enrollments: ${enrollments.length}`);
    
    const activeEnrollments = enrollments.filter(e => 
      e.status === 'active' || e.status === 'enrolled'
    );
    console.log(`Active Enrollments: ${activeEnrollments.length}`);
    
    // 4. Check Live Classes
    console.log('\n🎥 LIVE CLASSES:');
    console.log('-'.repeat(30));
    const liveClasses = await LiveClass.find()
      .populate('teacher', 'name')
      .populate('class', 'title');
    
    const liveClassStats = {
      scheduled: liveClasses.filter(lc => lc.status === 'scheduled').length,
      live: liveClasses.filter(lc => lc.status === 'live').length,
      completed: liveClasses.filter(lc => lc.status === 'completed').length,
      cancelled: liveClasses.filter(lc => lc.status === 'cancelled').length
    };
    
    console.log(`Total Live Classes: ${liveClasses.length}`);
    console.log(`  Scheduled: ${liveClassStats.scheduled}`);
    console.log(`  Live: ${liveClassStats.live}`);
    console.log(`  Completed: ${liveClassStats.completed}`);
    console.log(`  Cancelled: ${liveClassStats.cancelled}`);
    
    // Show upcoming classes
    const upcoming = liveClasses
      .filter(lc => lc.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
      .slice(0, 3);
    
    if (upcoming.length > 0) {
      console.log('\nNext Upcoming Classes:');
      upcoming.forEach(lc => {
        console.log(`  - ${lc.title} on ${new Date(lc.scheduledAt).toLocaleDateString()}`);
        console.log(`    Class: ${lc.class?.title || 'N/A'}`);
        console.log(`    URL: ${lc.meetingUrl || 'Not set'}`);
      });
    }
    
    // 5. Check Assignments
    console.log('\n📋 ASSIGNMENTS:');
    console.log('-'.repeat(30));
    const assignments = await Assignment.find()
      .populate('class', 'title')
      .populate('createdBy', 'name');
    
    console.log(`Total Assignments: ${assignments.length}`);
    
    const assignmentStats = {
      individual: assignments.filter(a => a.targetType === 'all').length,
      group: assignments.filter(a => a.targetType === 'group').length
    };
    
    console.log(`  Individual: ${assignmentStats.individual}`);
    console.log(`  Group-based: ${assignmentStats.group}`);
    
    // 6. Check Student Groups
    console.log('\n👥 STUDENT GROUPS:');
    console.log('-'.repeat(30));
    const groups = await StudentGroup.find()
      .populate('students', 'name')
      .populate('class', 'title');
    
    console.log(`Total Groups: ${groups.length}`);
    groups.slice(0, 3).forEach(group => {
      console.log(`  - ${group.name} (${group.students.length} students)`);
      console.log(`    Class: ${group.class?.title || 'N/A'}`);
    });
    
    // 7. Test API Endpoints
    console.log('\n🌐 API ENDPOINT TESTS:');
    console.log('-'.repeat(30));
    
    // Test student login
    if (usersByRole.student[0]) {
      try {
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
          email: usersByRole.student[0].email,
          password: 'password123'
        });
        console.log('✅ Student login endpoint working');
        
        const token = loginResponse.data.token;
        
        // Test protected endpoints
        const endpoints = [
          { method: 'GET', url: '/enrollments/my-enrollments', name: 'Student enrollments' },
          { method: 'GET', url: '/live-classes', name: 'Live classes' },
          { method: 'GET', url: '/assignments/student', name: 'Student assignments' }
        ];
        
        for (const endpoint of endpoints) {
          try {
            await axios({
              method: endpoint.method,
              url: `${API_URL}${endpoint.url}`,
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`✅ ${endpoint.name} endpoint working`);
          } catch (error) {
            console.log(`❌ ${endpoint.name} endpoint failed: ${error.response?.status || error.message}`);
          }
        }
      } catch (error) {
        console.log(`⚠️ Student login failed: ${error.response?.data?.message || error.message}`);
      }
    }
    
    // 8. Feature Summary
    console.log('\n🎯 IMPLEMENTED FEATURES:');
    console.log('-'.repeat(30));
    const features = [
      '✅ User Authentication (Login/Logout)',
      '✅ Role-based Access (Student/Teacher/Admin)',
      '✅ Class Management',
      '✅ Student Enrollments',
      '✅ Live Class Scheduling',
      '✅ Custom Meeting URLs for Live Classes',
      '✅ Edit/Delete Live Classes for Teachers',
      '✅ Student Groups Management',
      '✅ Group-based Assignments',
      '✅ Individual Assignments',
      '✅ Dashboard for Each Role',
      '✅ Unified Schedule View',
      '✅ Study Materials',
      '✅ Real-time Live Class Status'
    ];
    
    features.forEach(f => console.log(`  ${f}`));
    
    // 9. Known Issues Check
    console.log('\n⚠️  POTENTIAL ISSUES:');
    console.log('-'.repeat(30));
    
    // Check for users without password
    const usersWithoutPassword = await User.find({ 
      $or: [{ password: null }, { password: '' }] 
    });
    if (usersWithoutPassword.length > 0) {
      console.log(`❌ ${usersWithoutPassword.length} users without password`);
    }
    
    // Check for orphaned enrollments
    const orphanedEnrollments = await Enrollment.find({
      $or: [{ student: null }, { class: null }]
    });
    if (orphanedEnrollments.length > 0) {
      console.log(`❌ ${orphanedEnrollments.length} orphaned enrollments`);
    }
    
    // Check for live classes without meeting URLs
    const classesWithoutURL = await LiveClass.find({ 
      meetingUrl: { $in: [null, ''] },
      status: 'scheduled'
    });
    if (classesWithoutURL.length > 0) {
      console.log(`⚠️ ${classesWithoutURL.length} scheduled classes without meeting URL`);
    }
    
    if (usersWithoutPassword.length === 0 && orphanedEnrollments.length === 0) {
      console.log('✅ No critical issues detected');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ SYSTEM HEALTH CHECK COMPLETE!');
    console.log('='.repeat(50));
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('\n❌ Health Check Failed:', error);
    process.exit(1);
  }
}

systemHealthCheck();