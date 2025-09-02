const mongoose = require('mongoose');
const Assignment = require('../src/models/Assignment');
const User = require('../src/models/User');
const StudentGroup = require('../src/models/StudentGroup');
require('dotenv').config({ path: '../.env' });

async function createTestAssignment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the teacher (Harshal Baviskar teacher account)
    const teacher = await User.findOne({ 
      name: 'Harshal Baviskar',
      role: 'teacher'
    });
    
    if (!teacher) {
      console.log('Teacher not found');
      process.exit(1);
    }
    
    console.log(`\nFound teacher: ${teacher.name} (${teacher._id})`);

    // Find the class
    const classId = '68a8d326a7f97441f0d6a309'; // Class 9 Math SBSE
    
    // Find the student group if exists
    const group = await StudentGroup.findOne({ 
      class: classId,
      teacher: teacher._id 
    });
    
    if (group) {
      console.log(`Found group: ${group.name} with ${group.students.length} students`);
    }

    // Create assignment data
    const assignmentData = {
      title: 'Chapter 5 - Algebra Practice Problems',
      description: 'Complete the algebra problems from Chapter 5. Show all your work for full credit.',
      class: classId,
      createdBy: teacher._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
      totalMarks: 100,
      maxScore: 100,
      instructions: `Complete all problems from Chapter 5:
- Problem Set A (Questions 1-10): 50 marks
- Problem Set B (Questions 1-5): 30 marks  
- Word Problems (Questions 1-4): 20 marks

Remember to:
1. Show all your work
2. Double-check your answers
3. Submit before the deadline`,
      questions: [
        {
          question: 'Solve for x: 2x + 5 = 15',
          type: 'text',
          marks: 10
        },
        {
          question: 'Simplify: (3x + 2)(x - 4)',
          type: 'text',
          marks: 15
        },
        {
          question: 'Factor completely: x² - 9x + 18',
          type: 'text',
          marks: 15
        }
      ],
      isPublished: true,
      visibility: group ? 'specific' : 'enrolled',
      specificStudents: group ? group.students : [],
      allowLateSubmission: true,
      latePenalty: 10,
      status: 'active'
    };

    // Create the assignment
    const assignment = await Assignment.create(assignmentData);
    
    console.log('\n=== Assignment Created Successfully ===');
    console.log(`Title: ${assignment.title}`);
    console.log(`ID: ${assignment._id}`);
    console.log(`Due Date: ${assignment.dueDate}`);
    console.log(`Published: ${assignment.isPublished}`);
    console.log(`Visibility: ${assignment.visibility}`);
    if (assignment.specificStudents.length > 0) {
      console.log(`Assigned to ${assignment.specificStudents.length} specific students`);
    }

    // Verify it's accessible
    const found = await Assignment.findById(assignment._id)
      .populate('class', 'title')
      .populate('createdBy', 'name');
    
    console.log('\n=== Verification ===');
    console.log(`Assignment found: ${found.title}`);
    console.log(`In class: ${found.class.title}`);
    console.log(`Created by: ${found.createdBy.name}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    console.log('\n✅ Test assignment created successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestAssignment();