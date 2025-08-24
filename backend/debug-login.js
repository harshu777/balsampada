const axios = require('axios');

async function testLoginAPI() {
  try {
    console.log('Testing teacher login...');
    const teacherResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'teacher1@demo.com',
      password: 'Demo@123'
    });
    console.log('Teacher login successful:', teacherResponse.data.user.name);
  } catch (error) {
    console.log('Teacher login failed:', error.response?.data || error.message);
  }

  try {
    console.log('Testing student login...');
    const studentResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'student1@demo.com',
      password: 'Demo@123'
    });
    console.log('Student login successful:', studentResponse.data.user.name);
  } catch (error) {
    console.log('Student login failed:', error.response?.data || error.message);
  }

  try {
    console.log('Testing admin login...');
    const adminResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@balsampada.com',
      password: 'Admin@123'
    });
    console.log('Admin login successful:', adminResponse.data.user.name);
  } catch (error) {
    console.log('Admin login failed:', error.response?.data || error.message);
  }
}

testLoginAPI();