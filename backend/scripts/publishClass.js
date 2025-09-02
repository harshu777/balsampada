require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Class = require('../src/models/Class');

async function publishFirstClass() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/balsampada-lms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Find the first class
    const firstClass = await Class.findOne();
    
    if (!firstClass) {
      console.log('No classes found in database');
      process.exit(0);
    }
    
    console.log('Found class:', {
      id: firstClass._id,
      title: firstClass.title,
      currentStatus: firstClass.status,
      isActive: firstClass.isActive
    });
    
    // Update the class to published status
    firstClass.status = 'published';
    firstClass.isActive = true;
    await firstClass.save();
    
    console.log('Class updated successfully!');
    console.log('New status:', {
      id: firstClass._id,
      title: firstClass.title,
      status: firstClass.status,
      isActive: firstClass.isActive
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

publishFirstClass();