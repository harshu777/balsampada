const mongoose = require('mongoose');
const Assignment = require('../src/models/Assignment');
const Enrollment = require('../src/models/Enrollment');
const Class = require('../src/models/Class');
const User = require('../src/models/User');
require('dotenv').config({ path: '../.env' });

async function checkAssignments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check all assignments
    const assignments = await Assignment.find()
      .populate('class', 'title')
      .populate('createdBy', 'name email')
      .populate('specificStudents', 'name email');
    
    console.log('\n=== All Assignments ===');
    console.log(`Total assignments: ${assignments.length}`);
    
    for (const assignment of assignments) {
      console.log('\n---');
      console.log(`Title: ${assignment.title}`);
      console.log(`Class: ${assignment.class?.title || 'N/A'}`);
      console.log(`Created By: ${assignment.createdBy?.name || 'N/A'}`);
      console.log(`Is Published: ${assignment.isPublished}`);
      console.log(`Visibility: ${assignment.visibility}`);
      console.log(`Specific Students: ${assignment.specificStudents?.length || 0}`);
      console.log(`Due Date: ${assignment.dueDate}`);
      console.log(`Total Marks: ${assignment.totalMarks}`);
      console.log(`Submissions: ${assignment.submissions?.length || 0}`);
    }

    // Find a student user
    const student = await User.findOne({ role: 'student' });
    if (student) {
      console.log('\n=== Checking for Student:', student.name, '===');
      
      // Check enrollments
      const enrollments = await Enrollment.find({ 
        student: student._id,
        status: { $in: ['enrolled', 'active'] }
      }).populate('class', 'title');
      
      console.log(`\nStudent is enrolled in ${enrollments.length} classes:`);
      const classIds = [];
      for (const enrollment of enrollments) {
        console.log(`- ${enrollment.class?.title} (Status: ${enrollment.status})`);
        classIds.push(enrollment.class._id);
      }

      // Check what assignments should be visible to this student
      const visibleAssignments = await Assignment.find({
        class: { $in: classIds },
        isPublished: true,
        $or: [
          { visibility: 'enrolled' },
          { visibility: { $ne: 'specific' } },
          { 
            visibility: 'specific',
            specificStudents: student._id 
          }
        ]
      }).populate('class', 'title');

      console.log(`\n${visibleAssignments.length} assignments should be visible to this student:`);
      for (const assignment of visibleAssignments) {
        console.log(`- ${assignment.title} in ${assignment.class?.title}`);
      }
    }

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAssignments();