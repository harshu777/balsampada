#!/usr/bin/env node

/**
 * Script to create test users (teachers and students)
 * Usage: node scripts/create-users.js
 */

const axios = require('axios');

// API Base URL
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// User data
const users = [
  {
    name: 'Sonal Sharma',
    email: 'sonal@teacher.com',
    password: 'sonal123',
    role: 'teacher',
    phone: '9876543210'
  },
  {
    name: 'Harsh Baviskar',
    email: 'harsh@student.com',
    password: 'harsh123',
    role: 'student',
    phone: '9876543211'
  },
  // Additional test users
  {
    name: 'Priya Patel',
    email: 'priya@teacher.com',
    password: 'priya123',
    role: 'teacher',
    phone: '9876543212'
  },
  {
    name: 'Rahul Kumar',
    email: 'rahul@student.com',
    password: 'rahul123',
    role: 'student',
    phone: '9876543213'
  },
  {
    name: 'Amit Singh',
    email: 'amit@student.com',
    password: 'amit123',
    role: 'student',
    phone: '9876543214'
  }
];

// Function to register a user
async function registerUser(userData) {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    if (response.data.success) {
      console.log(`✅ Successfully registered ${userData.role}: ${userData.name} (${userData.email})`);
      return response.data;
    }
  } catch (error) {
    if (error.response?.data?.message === 'Email already registered') {
      console.log(`⚠️  User already exists: ${userData.email}`);
    } else {
      console.error(`❌ Failed to register ${userData.name}:`, error.response?.data?.message || error.message);
    }
    return null;
  }
}

// Function to login a user
async function loginUser(email, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    if (response.data.success) {
      console.log(`✅ Successfully logged in: ${email}`);
      return response.data;
    }
  } catch (error) {
    console.error(`❌ Failed to login ${email}:`, error.response?.data?.message || error.message);
    return null;
  }
}

// Function to get user profile
async function getUserProfile(token) {
  try {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get profile:', error.response?.data?.message || error.message);
    return null;
  }
}

// Main function
async function main() {
  console.log('🚀 Starting User Registration Script\n');
  console.log('=' .repeat(50));
  
  // Check API health first
  try {
    const health = await axios.get(`${API_URL}/health`);
    console.log(`✅ API is running: ${health.data.message}\n`);
  } catch (error) {
    console.error('❌ API is not accessible. Please make sure the backend server is running.');
    process.exit(1);
  }

  // Register all users
  console.log('📝 Registering Users:');
  console.log('-'.repeat(50));
  
  const registeredUsers = [];
  for (const user of users) {
    const result = await registerUser(user);
    if (result) {
      registeredUsers.push({
        ...user,
        token: result.token,
        id: result.user.id
      });
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(50));
  console.log('🔐 Testing Login:');
  console.log('-'.repeat(50));

  // Test login for main users
  const mainUsers = [
    { email: 'sonal@teacher.com', password: 'sonal123', name: 'Sonal (Teacher)' },
    { email: 'harsh@student.com', password: 'harsh123', name: 'Harsh (Student)' }
  ];

  for (const user of mainUsers) {
    console.log(`\nTesting login for ${user.name}:`);
    const loginResult = await loginUser(user.email, user.password);
    
    if (loginResult) {
      // Get and display profile
      const profile = await getUserProfile(loginResult.token);
      if (profile) {
        console.log(`  Name: ${profile.data.name}`);
        console.log(`  Email: ${profile.data.email}`);
        console.log(`  Role: ${profile.data.role}`);
        console.log(`  ID: ${profile.data._id}`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log('-'.repeat(50));
  
  const teachers = users.filter(u => u.role === 'teacher');
  const students = users.filter(u => u.role === 'student');
  
  console.log(`Total Teachers: ${teachers.length}`);
  teachers.forEach(t => console.log(`  - ${t.name} (${t.email})`));
  
  console.log(`\nTotal Students: ${students.length}`);
  students.forEach(s => console.log(`  - ${s.name} (${s.email})`));
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Script completed successfully!\n');

  // Display quick test commands
  console.log('🧪 Quick Test Commands:');
  console.log('-'.repeat(50));
  console.log('Login via browser: http://localhost:3000/login\n');
  console.log('Test with curl:');
  console.log(`curl -X POST ${API_URL}/auth/login -H "Content-Type: application/json" -d '{"email":"sonal@teacher.com","password":"sonal123"}'`);
  console.log(`curl -X POST ${API_URL}/auth/login -H "Content-Type: application/json" -d '{"email":"harsh@student.com","password":"harsh123"}'`);
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});