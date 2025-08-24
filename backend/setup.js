const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/models/User');

async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/balsampada-lms');
    
    const adminEmail = 'admin@balsampada.com';
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }
    
    const admin = await User.create({
      name: 'Admin User',
      email: adminEmail,
      password: 'Admin@123',
      role: 'admin',
      isEmailVerified: true,
      isActive: true
    });
    
    console.log('Admin user created successfully:');
    console.log('Email:', adminEmail);
    console.log('Password: Admin@123');
    console.log('Please change the password after first login');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();