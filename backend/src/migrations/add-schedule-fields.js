/**
 * Migration: Add Schedule Fields to Class Model
 * 
 * This migration adds new fields to support:
 * - Daily recurring classes (Mon-Fri at specific times)
 * - Schedule patterns
 * - Meeting links
 * - Extra class sessions
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Migration script
async function up() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/balsampada');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Update Class collection
    const classCollection = db.collection('classes');
    
    // Add new fields to all existing classes
    const updateResult = await classCollection.updateMany(
      {},
      {
        $set: {
          // Schedule pattern fields
          'schedule': null, // Will be set by teachers, e.g., "Mon, Wed, Fri - 4:00 PM to 5:30 PM"
          'schedulePattern': {
            pattern: 'weekly',
            daysOfWeek: [],
            timeSlots: [],
            frequency: 'weekly',
            exceptions: []
          },
          'classesPerWeek': 3,
          'classDuration': 90, // in minutes
          'meetingLink': null,
          'autoGenerateMeeting': false,
          
          // Enhanced date fields
          'endDate': null, // Course end date for duration
          
          // Meeting settings
          'defaultMeetingSettings': {
            platform: 'googlemeet',
            autoGenerateLink: true,
            recordByDefault: false
          },
          
          // Timezone support
          'timezone': 'Asia/Kolkata',
          
          // Updated timestamp
          'schemaUpdatedAt': new Date()
        }
      }
    );
    
    console.log(`Updated ${updateResult.modifiedCount} classes with new schedule fields`);

    // Create indexes for better query performance
    await classCollection.createIndex({ 'startDate': 1, 'endDate': 1 });
    await classCollection.createIndex({ 'schedulePattern.daysOfWeek': 1 });
    await classCollection.createIndex({ 'teacher': 1, 'startDate': 1 });
    console.log('Created indexes for schedule queries');

    // Update LiveClass collection
    const liveClassCollection = db.collection('liveclasses');
    
    await liveClassCollection.updateMany(
      {},
      {
        $set: {
          'sessionType': 'regular', // regular, extra, makeup, test, doubt-clearing
          'timezone': 'Asia/Kolkata',
          'parentClass': null, // Reference to main class
          'autoJoinSettings': {
            studentsCanJoinEarly: 10, // minutes before
            maxWaitTime: 15 // minutes after
          }
        }
      }
    );
    
    console.log('Updated LiveClass collection with new fields');

    // Create ExtraClass collection if it doesn't exist
    const collections = await db.listCollections({ name: 'extraclasses' }).toArray();
    if (collections.length === 0) {
      await db.createCollection('extraclasses');
      console.log('Created ExtraClass collection');
      
      // Create indexes
      const extraClassCollection = db.collection('extraclasses');
      await extraClassCollection.createIndex({ 'class': 1, 'scheduledAt': 1 });
      await extraClassCollection.createIndex({ 'teacher': 1, 'scheduledAt': 1 });
      await extraClassCollection.createIndex({ 'status': 1 });
      console.log('Created indexes for ExtraClass collection');
    }

    // Create ClassSchedule collection if it doesn't exist
    const scheduleCollections = await db.listCollections({ name: 'classschedules' }).toArray();
    if (scheduleCollections.length === 0) {
      await db.createCollection('classschedules');
      console.log('Created ClassSchedule collection');
      
      // Create indexes
      const scheduleCollection = db.collection('classschedules');
      await scheduleCollection.createIndex({ 'class': 1 });
      await scheduleCollection.createIndex({ 'teacher': 1 });
      await scheduleCollection.createIndex({ 'effectiveFrom': 1, 'effectiveUntil': 1 });
      console.log('Created indexes for ClassSchedule collection');
    }

    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

// Rollback function
async function down() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/balsampada');
    console.log('Connected to MongoDB for rollback');

    const db = mongoose.connection.db;
    
    // Remove added fields from Class collection
    const classCollection = db.collection('classes');
    await classCollection.updateMany(
      {},
      {
        $unset: {
          'schedule': '',
          'schedulePattern': '',
          'classesPerWeek': '',
          'classDuration': '',
          'meetingLink': '',
          'autoGenerateMeeting': '',
          'endDate': '',
          'defaultMeetingSettings': '',
          'timezone': '',
          'schemaUpdatedAt': ''
        }
      }
    );
    
    console.log('Rolled back Class collection changes');

    // Remove added fields from LiveClass collection
    const liveClassCollection = db.collection('liveclasses');
    await liveClassCollection.updateMany(
      {},
      {
        $unset: {
          'sessionType': '',
          'timezone': '',
          'parentClass': '',
          'autoJoinSettings': ''
        }
      }
    );
    
    console.log('Rolled back LiveClass collection changes');

    // Drop new collections
    await db.dropCollection('extraclasses').catch(() => {});
    await db.dropCollection('classschedules').catch(() => {});
    
    console.log('Rollback completed successfully!');
    
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration based on command line argument
const command = process.argv[2];

if (command === 'up') {
  up().then(() => process.exit(0)).catch(() => process.exit(1));
} else if (command === 'down') {
  down().then(() => process.exit(0)).catch(() => process.exit(1));
} else {
  console.log('Usage: node add-schedule-fields.js [up|down]');
  console.log('  up   - Run the migration');
  console.log('  down - Rollback the migration');
  process.exit(1);
}