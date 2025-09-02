const User = require('../models/User');
const Grade = require('../models/Grade');
const Subject = require('../models/Subject');
const Enrollment = require('../models/Enrollment');
const { validationResult } = require('express-validator');

// Student onboarding - auto-enroll in grade based on board+standard
exports.onboardStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (user.onboardingStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Student already onboarded'
      });
    }

    const { board, standard, medium } = user.academicProfile || {};

    // If student doesn't have academic profile, use defaults
    const studentBoard = board || 'CBSE';
    const studentStandard = standard || 'Class 10';
    const studentMedium = medium || 'English';
    
    // Update user's academic profile with defaults if needed
    if (!board || !standard) {
      user.academicProfile = user.academicProfile || {};
      user.academicProfile.board = studentBoard;
      user.academicProfile.standard = studentStandard;
      user.academicProfile.medium = studentMedium;
    }

    // Find matching grade
    let grade = await Grade.findOne({ 
      name: studentStandard, 
      board: studentBoard, 
      medium: studentMedium,
      isActive: true 
    }).populate('subjects');

    // If grade doesn't exist, create it automatically
    if (!grade) {
      grade = await Grade.create({
        name: studentStandard,
        board: studentBoard,
        medium: studentMedium,
        description: `Auto-created grade for ${studentStandard} ${studentBoard} students`,
        enrollmentPrice: 0,
        maxStudents: 1000,
        createdBy: req.user.id
      });

      // Create default subjects for this grade
      const defaultSubjects = getDefaultSubjectsForGrade(studentStandard);
      for (const subjectName of defaultSubjects) {
        const subject = await Subject.create({
          name: subjectName,
          code: `${subjectName.substring(0, 3).toUpperCase()}${studentStandard.substring(0, 2)}`,
          grade: grade._id,
          createdBy: req.user.id
        });
        grade.subjects.push(subject._id);
      }
      await grade.save();
    }

    // Auto-enroll student in the grade
    if (!grade.enrolledStudents.includes(userId)) {
      grade.enrolledStudents.push(userId);
      await grade.save();
    }

    // Update user's enrolled grades
    if (!user.enrolledGrades.includes(grade._id)) {
      user.enrolledGrades.push(grade._id);
    }

    // Create individual enrollments for each subject
    const enrollments = [];
    for (const subject of grade.subjects) {
      const existingEnrollment = await Enrollment.findOne({
        student: userId,
        // We'll link to the subject via the grade for now
        class: null // This will be null for new structure
      });

      if (!existingEnrollment) {
        const enrollment = await Enrollment.create({
          student: userId,
          class: null, // New structure doesn't use class
          enrollmentDate: new Date(),
          status: 'active',
          payment: {
            status: grade.enrollmentPrice > 0 ? 'pending' : 'paid',
            amount: grade.enrollmentPrice
          }
        });
        enrollments.push(enrollment);
        user.enrolledClasses.push(enrollment._id);
      }
    }

    // Update onboarding status
    user.onboardingStatus = 'completed';
    user.onboardingCompletedAt = new Date();
    user.approvedBy = req.user.id;
    user.approvedAt = new Date();

    await user.save();

    await user.populate([
      { path: 'enrolledGrades', populate: { path: 'subjects' } },
      { path: 'enrolledClasses' }
    ]);

    res.json({
      success: true,
      message: 'Student onboarded successfully',
      data: {
        user,
        enrolledGrade: grade,
        enrollmentsCreated: enrollments.length
      }
    });
  } catch (error) {
    console.error('Error onboarding student:', error);
    res.status(500).json({
      success: false,
      message: 'Error onboarding student'
    });
  }
};

// Teacher onboarding - auto-assign to subjects based on preferences
exports.onboardTeacher = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'teacher') {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    if (user.onboardingStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Teacher already onboarded'
      });
    }

    const { canTeachBoards, canTeachStandards, canTeachSubjects } = user.academicProfile || {};

    // If teacher doesn't have preferences set, use defaults
    const teacherBoards = canTeachBoards && canTeachBoards.length > 0 ? canTeachBoards : ['CBSE'];
    const teacherStandards = canTeachStandards && canTeachStandards.length > 0 ? canTeachStandards : ['Class 9', 'Class 10'];
    const teacherSubjects = canTeachSubjects && canTeachSubjects.length > 0 ? canTeachSubjects : [
      { subject: 'Mathematics', isPrimary: true },
      { subject: 'Science', isPrimary: false }
    ];
    
    // Update user's academic profile with defaults if needed
    if (!canTeachBoards || canTeachBoards.length === 0) {
      user.academicProfile.canTeachBoards = teacherBoards;
      user.academicProfile.canTeachStandards = teacherStandards;
      user.academicProfile.canTeachSubjects = teacherSubjects;
    }

    const assignedSubjects = [];
    
    // Find all grades that match teacher's preferences
    const matchingGrades = await Grade.find({
      name: { $in: teacherStandards },
      board: { $in: teacherBoards },
      isActive: true
    }).populate('subjects');

    for (const grade of matchingGrades) {
      for (const subjectId of grade.subjects) {
        const subject = await Subject.findById(subjectId);
        if (!subject) continue;

        // Check if teacher can teach this subject
        const canTeachSubject = teacherSubjects.find(
          ts => ts.subject === subject.name
        );

        if (canTeachSubject) {
          // Check if teacher is already assigned
          const isAlreadyAssigned = subject.teachers.some(
            t => t.teacher.toString() === userId
          );

          if (!isAlreadyAssigned) {
            // Auto-assign teacher to subject
            subject.teachers.push({
              teacher: userId,
              isPrimary: canTeachSubject.isPrimary || false,
              specialization: canTeachSubject.specialization || '',
              assignedAt: new Date()
            });

            await subject.save();
            assignedSubjects.push(subject);

            // Add to user's assigned subjects
            if (!user.assignedSubjects.includes(subjectId)) {
              user.assignedSubjects.push(subjectId);
            }
          }
        }
      }
    }

    // If no matching grades exist, create them
    if (matchingGrades.length === 0) {
      for (const board of teacherBoards) {
        for (const standard of teacherStandards) {
          // Create grade if it doesn't exist
          let grade = await Grade.findOne({ name: standard, board });
          if (!grade) {
            grade = await Grade.create({
              name: standard,
              board,
              description: `Auto-created for teacher onboarding`,
              enrollmentPrice: 0,
              maxStudents: 1000,
              createdBy: req.user.id
            });
          }

          // Create subjects for this teacher
          for (const teachingSubject of teacherSubjects) {
            let subject = await Subject.findOne({
              name: teachingSubject.subject,
              grade: grade._id
            });

            if (!subject) {
              subject = await Subject.create({
                name: teachingSubject.subject,
                code: `${teachingSubject.subject.substring(0, 3).toUpperCase()}${standard.substring(0, 2)}`,
                grade: grade._id,
                teachers: [{
                  teacher: userId,
                  isPrimary: teachingSubject.isPrimary || true,
                  specialization: teachingSubject.specialization || ''
                }],
                createdBy: req.user.id
              });

              grade.subjects.push(subject._id);
              user.assignedSubjects.push(subject._id);
              assignedSubjects.push(subject);
            }
          }

          await grade.save();
        }
      }
    }

    // Update onboarding status
    user.onboardingStatus = 'completed';
    user.onboardingCompletedAt = new Date();
    user.approvedBy = req.user.id;
    user.approvedAt = new Date();

    await user.save();

    await user.populate([
      { 
        path: 'assignedSubjects', 
        populate: [
          { path: 'grade', select: 'name board displayName' },
          { path: 'teachers.teacher', select: 'name email' }
        ]
      }
    ]);

    res.json({
      success: true,
      message: 'Teacher onboarded successfully',
      data: {
        user,
        assignedSubjectsCount: assignedSubjects.length,
        assignedSubjects: assignedSubjects.map(s => ({
          _id: s._id,
          name: s.name,
          grade: s.grade
        }))
      }
    });
  } catch (error) {
    console.error('Error onboarding teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Error onboarding teacher'
    });
  }
};

// Bulk onboarding for admin
exports.bulkOnboardUsers = async (req, res) => {
  try {
    const { userIds, action } = req.body; // action: 'approve', 'reject'

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    const users = await User.find({ 
      _id: { $in: userIds },
      onboardingStatus: 'pending'
    });

    const results = {
      success: [],
      failed: []
    };

    for (const user of users) {
      try {
        if (action === 'approve') {
          if (user.role === 'student') {
            await this.onboardStudent({ params: { userId: user._id }, user: req.user }, null);
          } else if (user.role === 'teacher') {
            await this.onboardTeacher({ params: { userId: user._id }, user: req.user }, null);
          }
          results.success.push({ userId: user._id, name: user.name });
        } else if (action === 'reject') {
          user.onboardingStatus = 'rejected';
          user.approvedBy = req.user.id;
          user.approvedAt = new Date();
          await user.save();
          results.success.push({ userId: user._id, name: user.name });
        }
      } catch (error) {
        results.failed.push({ 
          userId: user._id, 
          name: user.name, 
          error: error.message 
        });
      }
    }

    res.json({
      success: true,
      message: `Bulk ${action} completed`,
      data: results
    });
  } catch (error) {
    console.error('Error in bulk onboarding:', error);
    res.status(500).json({
      success: false,
      message: 'Error in bulk operation'
    });
  }
};

// Get pending onboarding requests
exports.getPendingOnboarding = async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const query = { onboardingStatus: 'pending' };
    
    if (role && ['student', 'teacher'].includes(role)) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('name email role academicProfile onboardingStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: users.length,
          totalCount: total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching pending onboarding:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending requests'
    });
  }
};

// Helper function to get default subjects for a grade
function getDefaultSubjectsForGrade(standard) {
  const gradeNumber = parseInt(standard.replace(/\D/g, ''));
  
  if (gradeNumber <= 5) {
    return ['Mathematics', 'Science', 'English', 'Hindi', 'Environmental Studies'];
  } else if (gradeNumber <= 8) {
    return ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer Science'];
  } else if (gradeNumber <= 10) {
    return ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Social Studies'];
  } else {
    return ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science', 'Economics'];
  }
}

// Get onboarding statistics
exports.getOnboardingStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: {
            role: '$role',
            status: '$onboardingStatus'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.role',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          },
          totalCount: { $sum: '$count' }
        }
      }
    ]);

    const formattedStats = {
      students: { pending: 0, completed: 0, rejected: 0, total: 0 },
      teachers: { pending: 0, completed: 0, rejected: 0, total: 0 },
      totalPending: 0
    };

    stats.forEach(roleData => {
      if (roleData._id === 'student' || roleData._id === 'teacher') {
        roleData.statuses.forEach(status => {
          formattedStats[roleData._id + 's'][status.status] = status.count;
          if (status.status === 'pending') {
            formattedStats.totalPending += status.count;
          }
        });
        formattedStats[roleData._id + 's'].total = roleData.totalCount;
      }
    });

    res.json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    console.error('Error fetching onboarding stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
};