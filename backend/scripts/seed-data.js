const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Enrollment = require('../src/models/Enrollment');

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/balsampada-lms');
    console.log('Connected to MongoDB');

    // Create sample teachers
    const teacher1 = await User.create({
      name: 'Dr. Rajesh Kumar',
      email: 'teacher1@demo.com',
      password: 'Demo@123',
      role: 'teacher',
      phone: '9876543210',
      bio: 'Experienced mathematics teacher with 10 years of experience.',
      qualification: 'PhD in Mathematics',
      specialization: ['Mathematics', 'Statistics'],
      experience: 10,
      isEmailVerified: true,
      isActive: true
    });

    const teacher2 = await User.create({
      name: 'Prof. Priya Sharma',
      email: 'teacher2@demo.com',
      password: 'Demo@123',
      role: 'teacher',
      phone: '9876543211',
      bio: 'Computer Science expert specializing in web development.',
      qualification: 'M.Tech Computer Science',
      specialization: ['Programming', 'Web Development'],
      experience: 8,
      isEmailVerified: true,
      isActive: true
    });

    // Create sample students
    const student1 = await User.create({
      name: 'Rahul Patel',
      email: 'student1@demo.com',
      password: 'Demo@123',
      role: 'student',
      phone: '9876543212',
      qualification: 'B.Tech',
      isEmailVerified: true,
      isActive: true
    });

    const student2 = await User.create({
      name: 'Sneha Gupta',
      email: 'student2@demo.com',
      password: 'Demo@123',
      role: 'student',
      phone: '9876543213',
      qualification: 'BCA',
      isEmailVerified: true,
      isActive: true
    });

    const student3 = await User.create({
      name: 'Amit Singh',
      email: 'student3@demo.com',
      password: 'Demo@123',
      role: 'student',
      phone: '9876543214',
      qualification: 'B.Sc',
      isEmailVerified: true,
      isActive: true
    });

    // Create sample courses
    const course1 = await Course.create({
      title: 'Complete Mathematics for Engineering',
      description: 'Comprehensive mathematics course covering calculus, algebra, and statistics for engineering students.',
      teacher: teacher1._id,
      category: 'Mathematics',
      level: 'Intermediate',
      price: 2999,
      discountPrice: 1999,
      duration: 120,
      language: 'English',
      prerequisites: ['Basic Algebra', 'Trigonometry'],
      learningObjectives: [
        'Master calculus concepts',
        'Understand linear algebra',
        'Apply statistical methods'
      ],
      modules: [
        {
          title: 'Introduction to Calculus',
          description: 'Basic concepts of differential and integral calculus',
          order: 1,
          lessons: [
            {
              title: 'Limits and Continuity',
              description: 'Understanding limits and continuous functions',
              type: 'video',
              content: {
                url: 'https://example.com/video1.mp4',
                duration: 45
              },
              order: 1
            },
            {
              title: 'Derivatives',
              description: 'Introduction to derivatives and their applications',
              type: 'video',
              content: {
                url: 'https://example.com/video2.mp4',
                duration: 60
              },
              order: 2
            }
          ]
        },
        {
          title: 'Linear Algebra',
          description: 'Matrices, vectors, and linear transformations',
          order: 2,
          lessons: [
            {
              title: 'Introduction to Matrices',
              description: 'Basic matrix operations',
              type: 'video',
              content: {
                url: 'https://example.com/video3.mp4',
                duration: 50
              },
              order: 1
            }
          ]
        }
      ],
      status: 'published',
      publishedAt: new Date(),
      totalLectures: 3,
      tags: ['mathematics', 'engineering', 'calculus'],
      certificateAvailable: true
    });

    const course2 = await Course.create({
      title: 'Full Stack Web Development',
      description: 'Learn modern web development with React, Node.js, and MongoDB.',
      teacher: teacher2._id,
      category: 'Programming',
      level: 'Beginner',
      price: 4999,
      discountPrice: 2999,
      duration: 200,
      language: 'English',
      prerequisites: ['Basic HTML/CSS', 'JavaScript fundamentals'],
      learningObjectives: [
        'Build complete web applications',
        'Master React and Node.js',
        'Understand database design'
      ],
      modules: [
        {
          title: 'Frontend Development',
          description: 'React.js fundamentals and advanced concepts',
          order: 1,
          lessons: [
            {
              title: 'Introduction to React',
              description: 'Getting started with React components',
              type: 'video',
              content: {
                url: 'https://example.com/react1.mp4',
                duration: 90
              },
              order: 1,
              isPreview: true
            },
            {
              title: 'State Management',
              description: 'Managing state in React applications',
              type: 'video',
              content: {
                url: 'https://example.com/react2.mp4',
                duration: 75
              },
              order: 2
            }
          ]
        },
        {
          title: 'Backend Development',
          description: 'Node.js and Express server development',
          order: 2,
          lessons: [
            {
              title: 'Node.js Basics',
              description: 'Understanding Node.js runtime',
              type: 'video',
              content: {
                url: 'https://example.com/node1.mp4',
                duration: 60
              },
              order: 1
            }
          ]
        }
      ],
      status: 'published',
      publishedAt: new Date(),
      totalLectures: 3,
      tags: ['web development', 'react', 'nodejs', 'full stack'],
      certificateAvailable: true
    });

    // Create enrollments
    await Enrollment.create({
      student: student1._id,
      course: course1._id,
      enrollmentDate: new Date(),
      status: 'active',
      progress: {
        completedLessons: [],
        percentageComplete: 0,
        lastAccessedAt: new Date()
      },
      payment: {
        status: 'paid',
        amount: 1999,
        paidAmount: 1999,
        paymentDate: new Date(),
        transactionId: 'TXN001',
        paymentMethod: 'razorpay'
      }
    });

    await Enrollment.create({
      student: student1._id,
      course: course2._id,
      enrollmentDate: new Date(),
      status: 'active',
      progress: {
        completedLessons: [],
        percentageComplete: 25,
        lastAccessedAt: new Date()
      },
      payment: {
        status: 'paid',
        amount: 2999,
        paidAmount: 2999,
        paymentDate: new Date(),
        transactionId: 'TXN002',
        paymentMethod: 'razorpay'
      }
    });

    await Enrollment.create({
      student: student2._id,
      course: course2._id,
      enrollmentDate: new Date(),
      status: 'active',
      progress: {
        completedLessons: [],
        percentageComplete: 50,
        lastAccessedAt: new Date()
      },
      payment: {
        status: 'paid',
        amount: 2999,
        paidAmount: 2999,
        paymentDate: new Date(),
        transactionId: 'TXN003',
        paymentMethod: 'razorpay'
      }
    });

    // Update course enrollment counts
    course1.enrolledStudents.push(student1._id);
    course2.enrolledStudents.push(student1._id, student2._id);
    
    await course1.save();
    await course2.save();

    // Update user enrolled courses
    student1.enrolledCourses.push(course1._id, course2._id);
    student2.enrolledCourses.push(course2._id);
    
    await student1.save();
    await student2.save();

    // Update teacher teaching courses
    teacher1.teachingCourses.push(course1._id);
    teacher2.teachingCourses.push(course2._id);
    
    await teacher1.save();
    await teacher2.save();

    console.log('✅ Sample data created successfully!');
    console.log('');
    console.log('Demo Accounts Created:');
    console.log('Teachers:');
    console.log('  - teacher1@demo.com / Demo@123 (Dr. Rajesh Kumar)');
    console.log('  - teacher2@demo.com / Demo@123 (Prof. Priya Sharma)');
    console.log('');
    console.log('Students:');
    console.log('  - student1@demo.com / Demo@123 (Rahul Patel)');
    console.log('  - student2@demo.com / Demo@123 (Sneha Gupta)');
    console.log('  - student3@demo.com / Demo@123 (Amit Singh)');
    console.log('');
    console.log('Courses Created:');
    console.log('  - Complete Mathematics for Engineering');
    console.log('  - Full Stack Web Development');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();