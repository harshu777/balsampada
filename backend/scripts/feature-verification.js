const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

// Test accounts
const TEST_ACCOUNTS = {
  student: { email: 'hbaviskar1106@gmail.com', password: 'password123', role: 'student' },
  teacher: { email: 'teacher1@demo.com', password: 'password123', role: 'teacher' },
  admin: { email: 'admin@balsampada.com', password: 'password123', role: 'admin' }
};

async function testFeature(name, testFn) {
  try {
    await testFn();
    console.log(`✅ ${name}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return false;
  }
}

async function verifyAllFeatures() {
  console.log('🔍 VERIFYING ALL FEATURES...\n');
  console.log('=' .repeat(60));
  
  let passedTests = 0;
  let totalTests = 0;
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Store tokens for each role
    const tokens = {};
    
    console.log('\n📋 1. AUTHENTICATION & LOGIN');
    console.log('-'.repeat(40));
    
    // Test login for each role
    for (const [role, creds] of Object.entries(TEST_ACCOUNTS)) {
      totalTests++;
      const passed = await testFeature(`${role.toUpperCase()} Login`, async () => {
        const response = await axios.post(`${API_URL}/auth/login`, {
          email: creds.email,
          password: creds.password
        });
        if (!response.data.token) throw new Error('No token received');
        tokens[role] = response.data.token;
        if (response.data.user.role !== creds.role) throw new Error('Role mismatch');
      });
      if (passed) passedTests++;
    }
    
    console.log('\n📋 2. STUDENT FEATURES');
    console.log('-'.repeat(40));
    
    // Test student features
    if (tokens.student) {
      const studentTests = [
        {
          name: 'View Enrollments',
          test: async () => {
            const res = await axios.get(`${API_URL}/enrollments/my-enrollments`, {
              headers: { Authorization: `Bearer ${tokens.student}` }
            });
            if (!Array.isArray(res.data.data)) throw new Error('Invalid response');
          }
        },
        {
          name: 'View Live Classes',
          test: async () => {
            const res = await axios.get(`${API_URL}/live-classes`, {
              headers: { Authorization: `Bearer ${tokens.student}` }
            });
            if (!Array.isArray(res.data.data)) throw new Error('Invalid response');
            if (res.data.data.length === 0) throw new Error('No live classes visible');
          }
        },
        {
          name: 'View Assignments',
          test: async () => {
            const res = await axios.get(`${API_URL}/assignments/student`, {
              headers: { Authorization: `Bearer ${tokens.student}` }
            });
            if (!Array.isArray(res.data.data)) throw new Error('Invalid response');
          }
        },
        {
          name: 'Access Dashboard',
          test: async () => {
            const res = await axios.get(`${API_URL}/users/student/dashboard`, {
              headers: { Authorization: `Bearer ${tokens.student}` }
            });
            if (!res.data.data) throw new Error('Dashboard data missing');
          }
        }
      ];
      
      for (const test of studentTests) {
        totalTests++;
        const passed = await testFeature(test.name, test.test);
        if (passed) passedTests++;
      }
    }
    
    console.log('\n📋 3. TEACHER FEATURES');
    console.log('-'.repeat(40));
    
    // Test teacher features
    if (tokens.teacher) {
      const teacherTests = [
        {
          name: 'View My Classes',
          test: async () => {
            const res = await axios.get(`${API_URL}/classes/teacher`, {
              headers: { Authorization: `Bearer ${tokens.teacher}` }
            });
            if (!Array.isArray(res.data.data)) throw new Error('Invalid response');
          }
        },
        {
          name: 'Create Live Class',
          test: async () => {
            // First get a class ID
            const classRes = await axios.get(`${API_URL}/classes/teacher`, {
              headers: { Authorization: `Bearer ${tokens.teacher}` }
            });
            
            if (classRes.data.data.length > 0) {
              const testClass = {
                title: 'Test Live Class',
                description: 'Testing live class creation',
                classId: classRes.data.data[0]._id,
                scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                duration: 60,
                meetingUrl: 'https://meet.google.com/test-meeting'
              };
              
              const res = await axios.post(`${API_URL}/live-classes`, testClass, {
                headers: { Authorization: `Bearer ${tokens.teacher}` }
              });
              
              if (!res.data.data._id) throw new Error('Live class not created');
              
              // Clean up - delete the test class
              await axios.delete(`${API_URL}/live-classes/${res.data.data._id}`, {
                headers: { Authorization: `Bearer ${tokens.teacher}` }
              });
            }
          }
        },
        {
          name: 'Edit Live Class',
          test: async () => {
            const liveClassRes = await axios.get(`${API_URL}/live-classes`, {
              headers: { Authorization: `Bearer ${tokens.teacher}` }
            });
            
            const teacherClass = liveClassRes.data.data.find(lc => lc.status === 'scheduled');
            if (teacherClass) {
              const updateData = {
                title: teacherClass.title + ' (Updated)',
                meetingUrl: 'https://meet.google.com/updated-meeting'
              };
              
              const res = await axios.put(`${API_URL}/live-classes/${teacherClass._id}`, updateData, {
                headers: { Authorization: `Bearer ${tokens.teacher}` }
              });
              
              if (!res.data.data) throw new Error('Update failed');
              
              // Revert the change
              await axios.put(`${API_URL}/live-classes/${teacherClass._id}`, 
                { title: teacherClass.title, meetingUrl: teacherClass.meetingUrl }, 
                { headers: { Authorization: `Bearer ${tokens.teacher}` }}
              );
            }
          }
        },
        {
          name: 'Manage Student Groups',
          test: async () => {
            const res = await axios.get(`${API_URL}/student-groups`, {
              headers: { Authorization: `Bearer ${tokens.teacher}` }
            });
            if (!Array.isArray(res.data.data)) throw new Error('Invalid response');
          }
        }
      ];
      
      for (const test of teacherTests) {
        totalTests++;
        const passed = await testFeature(test.name, test.test);
        if (passed) passedTests++;
      }
    }
    
    console.log('\n📋 4. ADMIN FEATURES');
    console.log('-'.repeat(40));
    
    // Test admin features
    if (tokens.admin) {
      const adminTests = [
        {
          name: 'View All Users',
          test: async () => {
            const res = await axios.get(`${API_URL}/users`, {
              headers: { Authorization: `Bearer ${tokens.admin}` }
            });
            if (!Array.isArray(res.data.data)) throw new Error('Invalid response');
          }
        },
        {
          name: 'Admin Dashboard Access',
          test: async () => {
            const res = await axios.get(`${API_URL}/users/admin/dashboard`, {
              headers: { Authorization: `Bearer ${tokens.admin}` }
            });
            if (!res.data.data) throw new Error('Dashboard data missing');
          }
        }
      ];
      
      for (const test of adminTests) {
        totalTests++;
        const passed = await testFeature(test.name, test.test);
        if (passed) passedTests++;
      }
    }
    
    console.log('\n📋 5. CROSS-FUNCTIONAL FEATURES');
    console.log('-'.repeat(40));
    
    // Test features that work across roles
    const crossTests = [
      {
        name: 'Live Class Visibility',
        test: async () => {
          // Student should see live classes they're enrolled in
          const studentRes = await axios.get(`${API_URL}/live-classes`, {
            headers: { Authorization: `Bearer ${tokens.student}` }
          });
          
          // Teacher should see their own classes
          const teacherRes = await axios.get(`${API_URL}/live-classes`, {
            headers: { Authorization: `Bearer ${tokens.teacher}` }
          });
          
          if (!studentRes.data.data || !teacherRes.data.data) {
            throw new Error('Live classes not accessible');
          }
        }
      },
      {
        name: 'Meeting URL in Live Classes',
        test: async () => {
          const res = await axios.get(`${API_URL}/live-classes`, {
            headers: { Authorization: `Bearer ${tokens.student}` }
          });
          
          const hasUrls = res.data.data.some(lc => lc.meetingUrl);
          if (!hasUrls) throw new Error('No meeting URLs found');
        }
      }
    ];
    
    for (const test of crossTests) {
      totalTests++;
      const passed = await testFeature(test.name, test.test);
      if (passed) passedTests++;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 RESULTS: ${passedTests}/${totalTests} tests passed`);
    
    const percentage = Math.round((passedTests / totalTests) * 100);
    if (percentage === 100) {
      console.log('🎉 ALL FEATURES WORKING PERFECTLY!');
    } else if (percentage >= 90) {
      console.log('✅ System is mostly functional');
    } else if (percentage >= 70) {
      console.log('⚠️ Some features need attention');
    } else {
      console.log('❌ Critical issues detected');
    }
    
    console.log('='.repeat(60));
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('\n❌ Verification Failed:', error.message);
    process.exit(1);
  }
}

verifyAllFeatures();