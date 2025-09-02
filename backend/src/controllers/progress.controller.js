const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const StudyMaterial = require('../models/StudyMaterial');
const Assignment = require('../models/Assignment');

// Mark lesson/material as completed
exports.markLessonCompleted = async (req, res) => {
  try {
    const { classId, lessonId } = req.params;
    const userId = req.user.id;
    const { timeSpent } = req.body;

    const enrollment = await Enrollment.findOne({
      student: userId,
      class: classId,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if lesson already completed
    const existingLesson = enrollment.progress.completedLessons.find(
      lesson => lesson.lesson?.toString() === lessonId
    );

    if (!existingLesson) {
      // Add completed lesson
      enrollment.progress.completedLessons.push({
        lesson: lessonId,
        completedAt: new Date(),
        timeSpent: timeSpent || 0
      });

      enrollment.progress.currentLesson = lessonId;
      enrollment.progress.lastAccessedAt = new Date();
    } else {
      // Update existing lesson
      existingLesson.timeSpent = (existingLesson.timeSpent || 0) + (timeSpent || 0);
      enrollment.progress.lastAccessedAt = new Date();
    }

    // Update overall progress percentage
    await enrollment.updateProgress();

    res.status(200).json({
      success: true,
      data: {
        percentageComplete: enrollment.progress.percentageComplete,
        completedLessons: enrollment.progress.completedLessons.length
      }
    });

  } catch (error) {
    console.error('Mark lesson completed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating progress'
    });
  }
};

// Get student progress for a class
exports.getClassProgress = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;

    const enrollment = await Enrollment.findOne({
      student: userId,
      class: classId
    }).populate('class', 'title description');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Get class materials count for progress calculation
    const materialsCount = await StudyMaterial.countDocuments({
      class: classId,
      isActive: true
    });

    // Get assignments count and scores
    const assignments = await Assignment.find({
      class: classId,
      isPublished: true
    });

    const userAssignmentGrades = enrollment.grades.assignments;
    const completedAssignments = userAssignmentGrades.length;
    const avgAssignmentScore = userAssignmentGrades.length > 0
      ? userAssignmentGrades.reduce((sum, grade) => sum + (grade.score / grade.maxScore) * 100, 0) / userAssignmentGrades.length
      : 0;

    // Calculate attendance
    const attendancePercentage = enrollment.calculateAttendancePercentage();

    const progressData = {
      classInfo: enrollment.class,
      progress: {
        percentageComplete: enrollment.progress.percentageComplete,
        completedLessons: enrollment.progress.completedLessons.length,
        totalMaterials: materialsCount,
        lastAccessedAt: enrollment.progress.lastAccessedAt
      },
      grades: {
        assignments: {
          completed: completedAssignments,
          total: assignments.length,
          averageScore: Math.round(avgAssignmentScore)
        },
        finalGrade: enrollment.grades.finalGrade,
        gradePercentage: enrollment.grades.gradePercentage
      },
      attendance: {
        percentage: attendancePercentage,
        totalSessions: enrollment.attendance.length,
        presentSessions: enrollment.attendance.filter(a => 
          a.status === 'present' || a.status === 'late'
        ).length
      },
      status: enrollment.status,
      enrollmentDate: enrollment.enrollmentDate
    };

    res.status(200).json({
      success: true,
      data: progressData
    });

  } catch (error) {
    console.error('Get class progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching progress'
    });
  }
};

// Get overall progress for a student
exports.getOverallProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollments = await Enrollment.find({
      student: userId,
      status: 'active'
    }).populate('class', 'title subject');

    if (enrollments.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalClasses: 0,
          averageProgress: 0,
          completedClasses: 0,
          inProgressClasses: 0,
          totalTimeSpent: 0,
          averageGrade: 0,
          certificatesEarned: 0
        }
      });
    }

    // Calculate overall statistics
    const totalProgress = enrollments.reduce((sum, e) => sum + e.progress.percentageComplete, 0);
    const averageProgress = Math.round(totalProgress / enrollments.length);
    
    const completedClasses = enrollments.filter(e => e.progress.percentageComplete === 100).length;
    const inProgressClasses = enrollments.filter(e => 
      e.progress.percentageComplete > 0 && e.progress.percentageComplete < 100
    ).length;

    // Calculate total time spent
    const totalTimeSpent = enrollments.reduce((sum, enrollment) => {
      const classTime = enrollment.progress.completedLessons.reduce((lessonSum, lesson) => 
        lessonSum + (lesson.timeSpent || 0), 0
      );
      return sum + classTime;
    }, 0);

    // Calculate average grade
    const gradesWithScores = enrollments.filter(e => e.grades.gradePercentage !== undefined);
    const averageGrade = gradesWithScores.length > 0
      ? Math.round(gradesWithScores.reduce((sum, e) => sum + e.grades.gradePercentage, 0) / gradesWithScores.length)
      : 0;

    // Count certificates
    const certificatesEarned = enrollments.filter(e => e.certificate.issued).length;

    const overallProgress = {
      totalClasses: enrollments.length,
      averageProgress,
      completedClasses,
      inProgressClasses,
      totalTimeSpent: Math.round(totalTimeSpent / 60), // Convert to minutes
      averageGrade,
      certificatesEarned,
      recentClasses: enrollments
        .sort((a, b) => new Date(b.progress.lastAccessedAt || 0) - new Date(a.progress.lastAccessedAt || 0))
        .slice(0, 5)
        .map(e => ({
          classId: e.class._id,
          title: e.class.title,
          subject: e.class.subject,
          progress: e.progress.percentageComplete,
          lastAccessed: e.progress.lastAccessedAt
        }))
    };

    res.status(200).json({
      success: true,
      data: overallProgress
    });

  } catch (error) {
    console.error('Get overall progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching overall progress'
    });
  }
};

// Mark attendance for a class session
exports.markAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { status, sessionType, duration, notes } = req.body;
    const userId = req.user.id;

    const enrollment = await Enrollment.findOne({
      student: userId,
      class: classId,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Add attendance record
    enrollment.attendance.push({
      date: new Date(),
      status,
      sessionType: sessionType || 'lecture',
      duration: duration || 60,
      notes: notes || ''
    });

    await enrollment.save();

    // Calculate updated attendance percentage
    const attendancePercentage = enrollment.calculateAttendancePercentage();

    res.status(200).json({
      success: true,
      data: {
        attendancePercentage,
        totalSessions: enrollment.attendance.length
      }
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance'
    });
  }
};

// Get teacher's class progress overview
exports.getTeacherClassProgress = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;

    // Verify teacher owns this class
    const classItem = await Class.findOne({
      _id: classId,
      teacher: teacherId
    });

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found or access denied'
      });
    }

    // Get all enrollments for this class
    const enrollments = await Enrollment.find({
      class: classId,
      status: 'active'
    }).populate('student', 'name email avatar');

    // Calculate class statistics
    const totalStudents = enrollments.length;
    const averageProgress = totalStudents > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress.percentageComplete, 0) / totalStudents)
      : 0;

    const studentsCompleted = enrollments.filter(e => e.progress.percentageComplete === 100).length;
    const studentsInProgress = enrollments.filter(e => 
      e.progress.percentageComplete > 0 && e.progress.percentageComplete < 100
    ).length;
    const studentsNotStarted = enrollments.filter(e => e.progress.percentageComplete === 0).length;

    // Average attendance
    const averageAttendance = totalStudents > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + e.calculateAttendancePercentage(), 0) / totalStudents)
      : 0;

    // Student progress details
    const studentProgress = enrollments.map(enrollment => ({
      student: enrollment.student,
      progress: enrollment.progress.percentageComplete,
      lastAccessed: enrollment.progress.lastAccessedAt,
      attendance: enrollment.calculateAttendancePercentage(),
      grade: enrollment.grades.finalGrade,
      gradePercentage: enrollment.grades.gradePercentage,
      assignmentsCompleted: enrollment.grades.assignments.length,
      status: enrollment.status
    }));

    const progressOverview = {
      classInfo: {
        id: classItem._id,
        title: classItem.title,
        totalStudents
      },
      statistics: {
        averageProgress,
        studentsCompleted,
        studentsInProgress,
        studentsNotStarted,
        averageAttendance
      },
      students: studentProgress.sort((a, b) => b.progress - a.progress)
    };

    res.status(200).json({
      success: true,
      data: progressOverview
    });

  } catch (error) {
    console.error('Get teacher class progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching class progress'
    });
  }
};

module.exports = {
  markLessonCompleted: exports.markLessonCompleted,
  getClassProgress: exports.getClassProgress,
  getOverallProgress: exports.getOverallProgress,
  markAttendance: exports.markAttendance,
  getTeacherClassProgress: exports.getTeacherClassProgress
};