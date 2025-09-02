#!/usr/bin/env node

/**
 * Script to create an admin user
 * Usage: node scripts/create-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/balsampada-lms');
    console.log('Connected to MongoDB');

    // Admin user details
    const adminData = {
      name: 'Admin User',
      email: 'admin@balsampada.com',
      password: 'admin123',
      role: 'admin',
      phone: '9999999999',
      isActive: true,
      isEmailVerified: true
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      // Update existing user to admin
      existingAdmin.role = 'admin';
      existingAdmin.password = adminData.password; // Let the model hash it
      existingAdmin.isActive = true;
      existingAdmin.isEmailVerified = true;
      await existingAdmin.save();
      console.log('✅ Existing user updated to admin:', adminData.email);
    } else {
      // Create new admin user (password will be hashed by the model)
      const admin = new User({
        ...adminData
      });
      
      await admin.save();
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n========================================');
    console.log('Admin Credentials:');
    console.log('========================================');
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    console.log('Role: Admin');
    console.log('========================================');
    console.log('\nYou can now login at http://localhost:3000/login');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();