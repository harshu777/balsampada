const mongoose = require('mongoose');
const Organization = require('../src/models/Organization');
const User = require('../src/models/User');
const Class = require('../src/models/Class');
const Assignment = require('../src/models/Assignment');
const LiveClass = require('../src/models/LiveClass');
const Enrollment = require('../src/models/Enrollment');
const StudentGroup = require('../src/models/StudentGroup');
require('dotenv').config();

async function testMultiTenancy() {
  try {
    console.log('🧪 Testing Multi-tenancy Implementation\n');
    console.log('=' .repeat(50));
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Check if organization was created and has data
    console.log('\n1️⃣  Checking organization structure...');
    const organization = await Organization.findOne();
    if (!organization) {
      console.log('❌ No organization found! Run migration first.');
      process.exit(1);
    }
    
    console.log('✅ Organization found:');
    console.log(`   Name: ${organization.name}`);
    console.log(`   Subdomain: ${organization.subdomain}`);
    console.log(`   Plan: ${organization.plan}`);
    console.log(`   Status: ${organization.status}`);
    console.log(`   ID: ${organization._id}`);

    // Step 2: Check if users have organization
    console.log('\n2️⃣  Checking users have organization...');
    const totalUsers = await User.countDocuments();
    const usersWithOrg = await User.countDocuments({ organization: { $exists: true } });
    const usersInThisOrg = await User.countDocuments({ organization: organization._id });
    
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users with organization: ${usersWithOrg}`);
    console.log(`   Users in this organization: ${usersInThisOrg}`);
    
    if (usersWithOrg !== totalUsers) {
      console.log('⚠️  Warning: Not all users have organization assigned');
    } else {
      console.log('✅ All users have organization assigned');
    }

    // Step 3: Check if classes have organization
    console.log('\n3️⃣  Checking classes have organization...');
    const totalClasses = await Class.countDocuments();
    const classesWithOrg = await Class.countDocuments({ organization: { $exists: true } });
    const classesInThisOrg = await Class.countDocuments({ organization: organization._id });
    
    console.log(`   Total classes: ${totalClasses}`);
    console.log(`   Classes with organization: ${classesWithOrg}`);
    console.log(`   Classes in this organization: ${classesInThisOrg}`);
    
    if (totalClasses > 0 && classesWithOrg !== totalClasses) {
      console.log('⚠️  Warning: Not all classes have organization assigned');
    } else {
      console.log('✅ All classes have organization assigned');
    }

    // Step 4: Check if assignments have organization
    console.log('\n4️⃣  Checking assignments have organization...');
    const totalAssignments = await Assignment.countDocuments();
    const assignmentsWithOrg = await Assignment.countDocuments({ organization: { $exists: true } });
    const assignmentsInThisOrg = await Assignment.countDocuments({ organization: organization._id });
    
    console.log(`   Total assignments: ${totalAssignments}`);
    console.log(`   Assignments with organization: ${assignmentsWithOrg}`);
    console.log(`   Assignments in this organization: ${assignmentsInThisOrg}`);
    
    if (totalAssignments > 0 && assignmentsWithOrg !== totalAssignments) {
      console.log('⚠️  Warning: Not all assignments have organization assigned');
    } else {
      console.log('✅ All assignments have organization assigned');
    }

    // Step 5: Check if live classes have organization
    console.log('\n5️⃣  Checking live classes have organization...');
    const totalLiveClasses = await LiveClass.countDocuments();
    const liveClassesWithOrg = await LiveClass.countDocuments({ organization: { $exists: true } });
    const liveClassesInThisOrg = await LiveClass.countDocuments({ organization: organization._id });
    
    console.log(`   Total live classes: ${totalLiveClasses}`);
    console.log(`   Live classes with organization: ${liveClassesWithOrg}`);
    console.log(`   Live classes in this organization: ${liveClassesInThisOrg}`);
    
    if (totalLiveClasses > 0 && liveClassesWithOrg !== totalLiveClasses) {
      console.log('⚠️  Warning: Not all live classes have organization assigned');
    } else {
      console.log('✅ All live classes have organization assigned');
    }

    // Step 6: Check if enrollments have organization
    console.log('\n6️⃣  Checking enrollments have organization...');
    const totalEnrollments = await Enrollment.countDocuments();
    const enrollmentsWithOrg = await Enrollment.countDocuments({ organization: { $exists: true } });
    const enrollmentsInThisOrg = await Enrollment.countDocuments({ organization: organization._id });
    
    console.log(`   Total enrollments: ${totalEnrollments}`);
    console.log(`   Enrollments with organization: ${enrollmentsWithOrg}`);
    console.log(`   Enrollments in this organization: ${enrollmentsInThisOrg}`);
    
    if (totalEnrollments > 0 && enrollmentsWithOrg !== totalEnrollments) {
      console.log('⚠️  Warning: Not all enrollments have organization assigned');
    } else {
      console.log('✅ All enrollments have organization assigned');
    }

    // Step 7: Check if student groups have organization
    console.log('\n7️⃣  Checking student groups have organization...');
    const totalGroups = await StudentGroup.countDocuments();
    const groupsWithOrg = await StudentGroup.countDocuments({ organization: { $exists: true } });
    const groupsInThisOrg = await StudentGroup.countDocuments({ organization: organization._id });
    
    console.log(`   Total groups: ${totalGroups}`);
    console.log(`   Groups with organization: ${groupsWithOrg}`);
    console.log(`   Groups in this organization: ${groupsInThisOrg}`);
    
    if (totalGroups > 0 && groupsWithOrg !== totalGroups) {
      console.log('⚠️  Warning: Not all groups have organization assigned');
    } else {
      console.log('✅ All student groups have organization assigned');
    }

    // Step 8: Check organization usage stats
    console.log('\n8️⃣  Checking organization usage stats...');
    console.log(`   Current students: ${organization.usage.currentStudents}`);
    console.log(`   Current teachers: ${organization.usage.currentTeachers}`);
    console.log(`   Current storage: ${(organization.usage.currentStorage / (1024 * 1024 * 1024)).toFixed(2)} GB`);
    console.log(`   Live class hours this month: ${organization.usage.liveClassHoursThisMonth}`);
    
    // Step 9: Check organization limits
    console.log('\n9️⃣  Checking organization limits...');
    console.log(`   Max students: ${organization.limits.maxStudents === -1 ? 'Unlimited' : organization.limits.maxStudents}`);
    console.log(`   Max teachers: ${organization.limits.maxTeachers === -1 ? 'Unlimited' : organization.limits.maxTeachers}`);
    console.log(`   Max storage: ${organization.limits.maxStorage === -1 ? 'Unlimited' : (organization.limits.maxStorage / (1024 * 1024 * 1024)).toFixed(2) + ' GB'}`);
    console.log(`   Max live class hours: ${organization.limits.maxLiveClassHours === -1 ? 'Unlimited' : organization.limits.maxLiveClassHours}`);

    // Step 10: Check subscription status
    console.log('\n🔟 Checking subscription status...');
    console.log(`   Trial active: ${organization.isTrialActive()}`);
    console.log(`   Trial ends at: ${organization.subscription.trialEndsAt ? new Date(organization.subscription.trialEndsAt).toLocaleDateString() : 'N/A'}`);
    console.log(`   Subscription active: ${organization.isSubscriptionActive()}`);
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ MULTI-TENANCY DATABASE CHECK COMPLETED!');
    console.log('=' .repeat(50));
    
    // Summary
    const allGood = usersWithOrg === totalUsers && 
                   (totalClasses === 0 || classesWithOrg === totalClasses) &&
                   (totalAssignments === 0 || assignmentsWithOrg === totalAssignments) &&
                   (totalLiveClasses === 0 || liveClassesWithOrg === totalLiveClasses) &&
                   (totalEnrollments === 0 || enrollmentsWithOrg === totalEnrollments) &&
                   (totalGroups === 0 || groupsWithOrg === totalGroups);
    
    if (allGood) {
      console.log('\n✨ Summary: All data is properly associated with the organization!');
      console.log('   Multi-tenancy implementation is working correctly.');
    } else {
      console.log('\n⚠️  Summary: Some data needs to be migrated to organization structure.');
      console.log('   Run the migration script again or check the implementation.');
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the test
testMultiTenancy();