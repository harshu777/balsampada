const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const User = require('../models/User');

exports.enrollInClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const studentId = req.user.id;

    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check enrollment eligibility with detailed error messages
    if (classItem.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'This class is not yet published. Please contact the teacher.'
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

    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      class: classId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this class'
      });
    }

    const enrollment = await Enrollment.create({
      student: studentId,
      class: classId,
      payment: {
        amount: classItem.discountPrice || classItem.price,
        status: req.body.paymentStatus || 'pending'
      }
    });

    classItem.enrolledStudents.push(studentId);
    await classItem.save();

    const user = await User.findById(studentId);
    user.enrolledClasses.push(enrollment._id);
    await user.save();

    await enrollment.populate('class', 'title description teacher');
    await enrollment.populate('student', 'name email');

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
      student: req.user.id 
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
    const enrollment = await Enrollment.findById(req.params.id)
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
      class: req.params.classId
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
      class: req.params.classId
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
      class: req.params.classId 
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
      class: req.params.classId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    enrollment.status = 'dropped';
    await enrollment.save();

    const classItem = await Class.findById(req.params.classId);
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