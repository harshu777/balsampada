const mongoose = require('mongoose');
const Organization = require('../src/models/Organization');
const User = require('../src/models/User');
const Class = require('../src/models/Class');
const Assignment = require('../src/models/Assignment');
const LiveClass = require('../src/models/LiveClass');
const Enrollment = require('../src/models/Enrollment');
const StudentGroup = require('../src/models/StudentGroup');
const Grade = require('../src/models/Grade');
const Subject = require('../src/models/Subject');
require('dotenv').config();

async function migrateToOrganizations() {
  try {
    console.log('🔄 Starting migration to organization structure...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Check if migration is needed
    const existingOrg = await Organization.findOne();
    if (existingOrg) {
      console.log('⚠️  Organizations already exist. Skipping migration.');
      await mongoose.connection.close();
      return;
    }

    // Step 2: Create default organization
    console.log('\n📦 Creating default organization...');
    
    // Find an admin or the first teacher to be the owner
    let owner = await User.findOne({ role: 'admin' });
    if (!owner) {
      owner = await User.findOne({ role: 'teacher' });
    }
    
    if (!owner) {
      console.log('❌ No admin or teacher found. Creating default owner...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      owner = await User.create({
        name: 'Default Admin',
        email: 'admin@default.com',
        password: hashedPassword,
        role: 'owner',
        isEmailVerified: true
      });
    } else {
      // Update existing user to owner role
      owner.role = 'owner';
      await owner.save();
    }

    const defaultOrg = await Organization.create({
      name: 'Default Organization',
      subdomain: 'default',
      owner: owner._id,
      plan: 'free',
      status: 'active',
      subscription: {
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 day trial
      },
      limits: {
        maxStudents: 1000,
        maxTeachers: 100,
        maxStorage: 10 * 1024 * 1024 * 1024, // 10GB
        maxLiveClassHours: 1000
      }
    });

    console.log(`✅ Created default organization: ${defaultOrg.name}`);
    console.log(`   Owner: ${owner.email}`);
    console.log(`   Subdomain: ${defaultOrg.subdomain}`);

    // Step 3: Update all users with organization
    console.log('\n👥 Migrating users...');
    const userUpdateResult = await User.updateMany(
      { organization: { $exists: false } },
      { $set: { organization: defaultOrg._id } }
    );
    console.log(`   ✅ Updated ${userUpdateResult.modifiedCount} users`);

    // Count users by role for usage tracking
    const studentCount = await User.countDocuments({ role: 'student', organization: defaultOrg._id });
    const teacherCount = await User.countDocuments({ role: 'teacher', organization: defaultOrg._id });
    
    // Update organization usage
    await Organization.findByIdAndUpdate(defaultOrg._id, {
      'usage.currentStudents': studentCount,
      'usage.currentTeachers': teacherCount
    });

    // Step 4: Update all models with organization
    const modelsToUpdate = [
      { model: Class, name: 'Classes' },
      { model: Assignment, name: 'Assignments' },
      { model: LiveClass, name: 'LiveClasses' },
      { model: Enrollment, name: 'Enrollments' },
      { model: StudentGroup, name: 'StudentGroups' },
      { model: Grade, name: 'Grades' },
      { model: Subject, name: 'Subjects' }
    ];

    for (const { model, name } of modelsToUpdate) {
      console.log(`\n📝 Migrating ${name}...`);
      
      // Check if model has organization field
      const sampleDoc = await model.findOne();
      if (sampleDoc && sampleDoc.schema.paths.organization) {
        const updateResult = await model.updateMany(
          { organization: { $exists: false } },
          { $set: { organization: defaultOrg._id } }
        );
        console.log(`   ✅ Updated ${updateResult.modifiedCount} ${name.toLowerCase()}`);
      } else {
        console.log(`   ⚠️  ${name} model doesn't have organization field or no documents exist`);
      }
    }

    // Step 5: Create indexes for better performance
    console.log('\n🔧 Creating indexes...');
    await Class.collection.createIndex({ organization: 1, teacher: 1 });
    await Assignment.collection.createIndex({ organization: 1, class: 1 });
    await LiveClass.collection.createIndex({ organization: 1, teacher: 1 });
    await Enrollment.collection.createIndex({ organization: 1, student: 1 });
    console.log('   ✅ Indexes created');

    // Step 6: Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   Organization: ${defaultOrg.name}`);
    console.log(`   Subdomain: ${defaultOrg.subdomain}`);
    console.log(`   Owner: ${owner.email}`);
    console.log(`   Students: ${studentCount}`);
    console.log(`   Teachers: ${teacherCount}`);
    console.log(`   Plan: ${defaultOrg.plan}`);
    console.log('\n⚠️  Important Next Steps:');
    console.log('   1. Update environment variables if needed');
    console.log('   2. Test the application with organization context');
    console.log('   3. Update frontend to handle organization');
    console.log('   4. Consider implementing subdomain routing');
    
    if (owner.email === 'admin@default.com') {
      console.log('\n🔐 Default Admin Credentials:');
      console.log('   Email: admin@default.com');
      console.log('   Password: admin123');
      console.log('   ⚠️  Please change this password immediately!');
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run migration
migrateToOrganizations();