const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');
const { paginate, paginateResponse } = require('../utils/pagination');

exports.enrollInClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const studentId = req.user._id.toString();
    
    console.log('Enrollment attempt:', { 
      classId, 
      studentId, 
      userRole: req.user.role,
      userName: req.user.name 
    });

    const classItem = await Class.findOne({
      _id: classId,
      organization: req.organizationId
    });
    if (!classItem) {
      console.log('Class not found:', classId);
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    console.log('Class found:', { 
      id: classItem._id, 
      status: classItem.status, 
      isActive: classItem.isActive,
      enrolledCount: classItem.enrolledStudents.length,
      maxStudents: classItem.maxStudents
    });

    // Check enrollment eligibility with detailed error messages
    if (classItem.status !== 'published') {
      console.log('Class not published:', classItem.status);
      return res.status(400).json({
        success: false,
        message: `This class is not yet published. Current status: ${classItem.status}. Please contact the teacher.`
      });
    }
    
    if (!classItem.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This class is not currently active.'
      });
    }
    
    if (classItem.maxStudents && classItem.enrolledStudents.length >= classItem.maxStudents) {
      return res.status(400).json({
        success: false,
        message: 'This class is full. Maximum enrollment reached.'
      });
    }
    
    if (classItem.enrollmentDeadline && new Date() > classItem.enrollmentDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Enrollment deadline has passed for this class.'
      });
    }

    // Check if user is a student
    if (req.user.role !== 'student') {
      console.log('User is not a student:', req.user.role);
      return res.status(400).json({
        success: false,
        message: 'Only students can enroll in classes'
      });
    }
    
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      class: classId,
      organization: req.organizationId
    });

    if (existingEnrollment) {
      console.log('Already enrolled:', { studentId, classId });
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this class'
      });
    }

    console.log('Creating enrollment with:', {
      student: studentId,
      class: classId,
      price: classItem.price
    });
    
    const enrollment = await Enrollment.create({
      student: studentId,
      class: classId,
      organization: req.organizationId,
      payment: {
        amount: classItem.discountPrice || classItem.price || 0,
        status: req.body.paymentStatus || 'pending'
      }
    });
    
    console.log('Enrollment created:', enrollment._id);

    // Update class with enrolled student
    if (!classItem.enrolledStudents) {
      classItem.enrolledStudents = [];
    }
    if (!classItem.enrolledStudents.includes(studentId)) {
      classItem.enrolledStudents.push(studentId);
      await classItem.save();
    }

    // Update user with enrolled class
    const user = await User.findById(studentId);
    if (!user.enrolledClasses) {
      user.enrolledClasses = [];
    }
    user.enrolledClasses.push(enrollment._id);
    await user.save();

    await enrollment.populate('class', 'title description teacher');
    await enrollment.populate('student', 'name email');

    // Send notification to teacher about new enrollment
    await NotificationService.notifyClassEnrollment(
      classId,
      studentId,
      classItem.teacher,
      classItem.title,
      user.name
    );

    res.status(201).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in class'
    });
  }
};

exports.getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ 
      student: req.user.id,
      organization: req.organizationId
    })
    .populate('class', 'title description thumbnail teacher category level')
    .populate({
      path: 'class',
      populate: {
        path: 'teacher',
        select: 'name email avatar'
      }
    })
    .sort('-enrollmentDate');

    res.status(200).json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments'
    });
  }
};

exports.getEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      _id: req.params.id,
      organization: req.organizationId
    })
      .populate('class')
      .populate('student', 'name email avatar');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    if (enrollment.student._id.toString() !== req.user.id && 
        req.user.role !== 'teacher' && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this enrollment'
      });
    }

    res.status(200).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Get enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollment'
    });
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const { lessonId, timeSpent } = req.body;
    
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      class: req.params.classId,
      organization: req.organizationId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    const alreadyCompleted = enrollment.progress.completedLessons.find(
      l => l.lesson.toString() === lessonId
    );

    if (!alreadyCompleted) {
      enrollment.progress.completedLessons.push({
        lesson: lessonId,
        completedAt: Date.now(),
        timeSpent: timeSpent || 0
      });
    }

    enrollment.progress.currentLesson = lessonId;
    enrollment.progress.lastAccessedAt = Date.now();

    await enrollment.updateProgress();

    res.status(200).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating progress'
    });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { studentId, status, sessionType, duration, notes } = req.body;
    
    const enrollment = await Enrollment.findOne({
      student: studentId,
      class: req.params.classId,
      organization: req.organizationId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    enrollment.attendance.push({
      date: new Date(),
      status,
      sessionType,
      duration,
      notes
    });

    await enrollment.save();

    res.status(200).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance'
    });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      class: req.params.classId
    }).select('attendance');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    const attendancePercentage = enrollment.calculateAttendancePercentage();

    res.status(200).json({
      success: true,
      data: {
        attendance: enrollment.attendance,
        percentage: attendancePercentage
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance'
    });
  }
};

exports.getClassEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ 
      class: req.params.classId,
      organization: req.organizationId
    })
    .populate('student', 'name email avatar phone')
    .sort('-enrollmentDate');

    res.status(200).json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    console.error('Get class enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching class enrollments'
    });
  }
};

exports.dropClass = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      class: req.params.classId,
      organization: req.organizationId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    enrollment.status = 'dropped';
    await enrollment.save();

    const classItem = await Class.findOne({
      _id: req.params.classId,
      organization: req.organizationId
    });
    classItem.enrolledStudents.pull(req.user.id);
    await classItem.save();

    res.status(200).json({
      success: true,
      message: 'Successfully dropped from class'
    });
  } catch (error) {
    console.error('Drop class error:', error);
    res.status(500).json({
      success: false,
      message: 'Error dropping class'
    });
  }
};

exports.generateCertificate = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      class: req.params.classId
    }).populate('class', 'title');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    if (!enrollment.isEligibleForCertificate()) {
      return res.status(400).json({
        success: false,
        message: 'Not eligible for certificate yet'
      });
    }

    if (!enrollment.certificate.issued) {
      enrollment.certificate = {
        issued: true,
        issuedDate: Date.now(),
        certificateId: `CERT-${Date.now()}-${enrollment._id}`,
        certificateUrl: `/certificates/${enrollment._id}.pdf`
      };
      await enrollment.save();
    }

    res.status(200).json({
      success: true,
      data: enrollment.certificate
    });
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating certificate'
    });
  }
};

// Get all students enrolled in teacher's classes
exports.getTeacherStudents = async (req, res) => {
  try {
    // Find all classes taught by this teacher
    const classes = await Class.find({ 
      teacher: req.user.id,
      organization: req.organizationId
    });
    const classIds = classes.map(c => c._id);

    // Find all enrollments for these classes
    const enrollments = await Enrollment.find({
      class: { $in: classIds },
      organization: req.organizationId,
      status: { $in: ['enrolled', 'active'] }
    })
      .populate('student', 'name email phone avatar lastLogin')
      .populate('class', 'title')
      .sort('-enrollmentDate');

    // Group students and aggregate their data
    const studentMap = new Map();
    
    enrollments.forEach(enrollment => {
      const studentId = enrollment.student._id.toString();
      
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          _id: studentId,
          user: enrollment.student,
          enrolledClasses: [],
          totalProgress: 0,
          totalAssignments: 0,
          totalGradedAssignments: 0,
          totalScore: 0,
          enrollmentDates: []
        });
      }
      
      const studentData = studentMap.get(studentId);
      studentData.enrolledClasses.push({
        _id: enrollment.class._id,
        title: enrollment.class.title,
        progress: enrollment.progress?.percentageComplete || 0
      });
      
      studentData.totalProgress += enrollment.progress?.percentageComplete || 0;
      
      // Aggregate assignment data
      if (enrollment.grades?.assignments) {
        studentData.totalAssignments += enrollment.grades.assignments.length;
        enrollment.grades.assignments.forEach(assignment => {
          if (assignment.score !== undefined) {
            studentData.totalGradedAssignments++;
            studentData.totalScore += (assignment.score / assignment.maxScore) * 100;
          }
        });
      }
      
      studentData.enrollmentDates.push(enrollment.enrollmentDate);
    });

    // Format the response
    const students = Array.from(studentMap.values()).map(student => ({
      _id: student._id,
      user: student.user,
      enrollmentDate: Math.min(...student.enrollmentDates), // Earliest enrollment
      enrolledClasses: student.enrolledClasses,
      progress: {
        percentageComplete: student.enrolledClasses.length > 0 
          ? Math.round(student.totalProgress / student.enrolledClasses.length)
          : 0,
        completedLessons: 0,
        totalLessons: 0
      },
      assignments: {
        submitted: student.totalAssignments,
        graded: student.totalGradedAssignments,
        averageGrade: student.totalGradedAssignments > 0
          ? Math.round(student.totalScore / student.totalGradedAssignments)
          : 0
      },
      lastActivity: student.user.lastLogin
    }));

    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Get teacher students error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students'
    });
  }
};
// Update payment status for an enrollment (Teacher/Admin only)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { status, amount, paymentMethod, transactionId, notes } = req.body;

    // Validate payment status
    const validStatuses = ["pending", "paid", "partial", "refunded", "waived"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment status. Must be one of: ${validStatuses.join(", ")}`
      });
    }

    // Find enrollment and check permissions
    const enrollment = await Enrollment.findById(enrollmentId)
      .populate("class", "teacher title price discountPrice")
      .populate("student", "name email phone");

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found"
      });
    }

    // Check if user is the teacher of this class or admin
    const isTeacher = enrollment.class.teacher.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    
    if (!isTeacher && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update payment status"
      });
    }

    // Update payment information
    enrollment.payment.status = status;
    
    if (status === "paid" || status === "partial") {
      enrollment.payment.paymentDate = new Date();
      enrollment.payment.paidAmount = amount || enrollment.class.discountPrice || enrollment.class.price;
      enrollment.payment.paymentMethod = paymentMethod || "cash";
      enrollment.payment.transactionId = transactionId || `CASH-${Date.now()}`;
    }

    // Add note if provided
    if (notes) {
      enrollment.notes.push({
        content: `Payment ${status}: ${notes}`,
        createdBy: req.user.id,
        createdAt: new Date()
      });
    }

    await enrollment.save();

    // Send notification to student
    if (status === "paid") {
      await NotificationService.createNotification({
        recipient: enrollment.student._id,
        type: "payment",
        title: "Payment Approved",
        message: `Your payment for ${enrollment.class.title} has been approved.`,
        data: {
          enrollmentId: enrollment._id,
          classId: enrollment.class._id
        }
      });
    }

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${status}`,
      data: enrollment
    });
  } catch (error) {
    console.error("Update payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating payment status"
    });
  }
};

// Get enrollments with pending payments (Teacher/Admin only)
exports.getPendingPayments = async (req, res) => {
  try {
    let query = {
      "payment.status": "pending",
      organization: req.organizationId
    };

    // If teacher, only show their class enrollments
    if (req.user.role === "teacher") {
      const teacherClasses = await Class.find({ 
        teacher: req.user.id,
        organization: req.organizationId
      }).select("_id");
      
      const classIds = teacherClasses.map(c => c._id);
      query.class = { $in: classIds };
    }

    const enrollments = await Enrollment.find(query)
      .populate("student", "name email phone")
      .populate("class", "title price discountPrice teacher")
      .sort("-createdAt");

    const pendingPayments = enrollments.map(enrollment => ({
      _id: enrollment._id,
      student: enrollment.student,
      class: {
        _id: enrollment.class._id,
        title: enrollment.class.title,
        price: enrollment.class.discountPrice || enrollment.class.price
      },
      enrollmentDate: enrollment.enrollmentDate,
      payment: enrollment.payment,
      status: enrollment.status
    }));

    res.status(200).json({
      success: true,
      data: pendingPayments
    });
  } catch (error) {
    console.error("Get pending payments error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending payments"
    });
  }
};
