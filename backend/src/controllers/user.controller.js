const User = require('../models/User');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id || req.user.id)
      .select('-password')
      .populate('enrolledClasses')
      .populate('teachingClasses');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowedUpdates = [
      'name', 'phone', 'bio', 'address', 
      'qualification', 'specialization', 'experience'
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      {
        new: true,
        runValidators: true,
        select: '-password'
      }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      {
        new: true,
        select: '-password'
      }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading avatar'
    });
  }
};

exports.getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      enrollments,
      recentActivity,
      upcomingAssignments,
      progress,
      pendingAssignmentsCount,
      newMaterialsCount,
      unreadNotificationsCount
    ] = await Promise.all([
      Enrollment.find({ student: userId, status: 'active' })
        .populate('class', 'title thumbnail teacher category')
        .populate({
          path: 'class',
          populate: {
            path: 'teacher',
            select: 'name'
          }
        })
        .limit(6),
      getRecentActivity(userId),
      getUpcomingAssignments(userId),
      getOverallProgress(userId),
      getPendingAssignmentsCount(userId),
      getNewMaterialsCount(userId),
      getUnreadNotificationsCount(userId)
    ]);

    res.status(200).json({
      success: true,
      data: {
        enrollments,
        recentActivity,
        upcomingAssignments,
        progress,
        pendingAssignmentsCount,
        newMaterialsCount,
        unreadNotificationsCount
      }
    });
  } catch (error) {
    console.error('Get student dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
};

exports.getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const [
      classes,
      totalStudents,
      recentSubmissions,
      upcomingClasses,
      earnings,
      studyMaterialsCount,
      totalAssignments,
      pendingPayments
    ] = await Promise.all([
      Class.find({ teacher: teacherId })
        .select('title enrolledStudents status averageRating')
        .limit(6),
      getTotalStudents(teacherId),
      getRecentSubmissions(teacherId),
      getUpcomingClasses(teacherId),
      getTeacherEarnings(teacherId),
      getStudyMaterialsCount(teacherId),
      getTotalAssignments(teacherId),
      getPendingPaymentsCount(teacherId)
    ]);

    res.status(200).json({
      success: true,
      data: {
        classes,
        totalStudents,
        recentSubmissions,
        upcomingClasses,
        earnings,
        studyMaterialsCount,
        totalAssignments,
        pendingPayments
      }
    });
  } catch (error) {
    console.error('Get teacher dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
};

async function getRecentActivity(userId) {
  const enrollments = await Enrollment.find({ student: userId })
    .populate('class', 'title')
    .sort('-progress.lastAccessedAt')
    .limit(5);

  return enrollments.map(e => ({
    classTitle: e.class.title,
    lastAccessed: e.progress?.lastAccessedAt || new Date().toISOString(),
    progress: e.progress?.percentageComplete || 0
  }));
}

async function getUpcomingAssignments(userId) {
  const Assignment = require('../models/Assignment');
  const enrollments = await Enrollment.find({ student: userId }).select('class');
  const classIds = enrollments.map(e => e.class);

  const assignments = await Assignment.find({
    class: { $in: classIds },
    dueDate: { $gte: new Date() },
    isPublished: true
  })
  .populate('class', 'title')
  .sort('dueDate')
  .limit(5);

  return assignments;
}

async function getOverallProgress(userId) {
  const enrollments = await Enrollment.find({ 
    student: userId, 
    status: 'active' 
  });

  if (enrollments.length === 0) {
    return {
      averageProgress: 0,
      completedClasses: 0,
      activeClasses: 0
    };
  }

  const totalProgress = enrollments.reduce((acc, e) => 
    acc + e.progress.percentageComplete, 0
  );

  return {
    averageProgress: Math.round(totalProgress / enrollments.length),
    completedClasses: enrollments.filter(e => e.status === 'completed').length,
    activeClasses: enrollments.filter(e => e.status === 'active').length
  };
}

async function getTotalStudents(teacherId) {
  const classes = await Class.find({ teacher: teacherId });
  const totalStudents = classes.reduce((acc, classItem) => 
    acc + classItem.enrolledStudents.length, 0
  );
  return totalStudents;
}

async function getRecentSubmissions(teacherId) {
  const Assignment = require('../models/Assignment');
  const assignments = await Assignment.find({ createdBy: teacherId })
    .populate('submissions.student', 'name email')
    .sort('-createdAt')
    .limit(20);

  const recentSubmissions = [];
  assignments.forEach(assignment => {
    assignment.submissions.forEach(submission => {
      if (submission.status === 'submitted') {
        recentSubmissions.push({
          assignmentId: assignment._id,
          assignmentTitle: assignment.title,
          studentId: submission.student._id,
          studentName: submission.student.name,
          studentEmail: submission.student.email,
          submittedAt: submission.submittedAt,
          isGraded: !!submission.grade,
          grade: submission.grade,
          status: submission.grade ? 'graded' : 'pending_review'
        });
      }
    });
  });

  // Sort by submission time and return latest 5
  recentSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  return recentSubmissions.slice(0, 5);
}

async function getUpcomingClasses(teacherId) {
  const classes = await Class.find({ 
    teacher: teacherId,
    status: 'published',
    startDate: { $gte: new Date() }
  })
  .select('title startDate')
  .sort('startDate')
  .limit(5);

  return classes;
}

async function getTeacherEarnings(teacherId) {
  const classes = await Class.find({ teacher: teacherId }).select('_id');
  const classIds = classes.map(c => c._id);

  const enrollments = await Enrollment.find({ 
    class: { $in: classIds } 
  }).populate('class', 'price');

  let total = 0;
  let thisMonth = 0;
  let totalTransactions = 0;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  enrollments.forEach(enrollment => {
    if (enrollment.payment && enrollment.payment.status === 'paid') {
      const amount = enrollment.payment.amount || enrollment.class.price;
      total += amount;
      totalTransactions++;

      const paymentDate = enrollment.payment.paymentDate || enrollment.createdAt;
      const paymentMonth = new Date(paymentDate);
      if (paymentMonth.getMonth() === currentMonth && paymentMonth.getFullYear() === currentYear) {
        thisMonth += amount;
      }
    }
  });

  return {
    total,
    thisMonth,
    totalTransactions
  };
}

async function getStudyMaterialsCount(teacherId) {
  const StudyMaterial = require('../models/StudyMaterial');
  const classes = await Class.find({ teacher: teacherId }).select('_id');
  const classIds = classes.map(c => c._id);
  
  const count = await StudyMaterial.countDocuments({ 
    class: { $in: classIds } 
  });
  
  return count;
}

async function getTotalAssignments(teacherId) {
  const Assignment = require('../models/Assignment');
  const count = await Assignment.countDocuments({ createdBy: teacherId });
  return count;
}

async function getPendingPaymentsCount(teacherId) {
  const classes = await Class.find({ teacher: teacherId }).select('_id');
  const classIds = classes.map(c => c._id);

  const count = await Enrollment.countDocuments({
    class: { $in: classIds },
    'payment.status': 'pending'
  });

  return count;
}

async function getPendingAssignmentsCount(userId) {
  const Assignment = require('../models/Assignment');
  const enrollments = await Enrollment.find({ student: userId, status: 'active' }).select('class');
  const classIds = enrollments.map(e => e.class);
  
  const assignments = await Assignment.find({
    class: { $in: classIds },
    isPublished: true,
    dueDate: { $gte: new Date() }
  });
  
  let pendingCount = 0;
  assignments.forEach(assignment => {
    const submission = assignment.submissions.find(s => 
      s.student && s.student.toString() === userId.toString()
    );
    if (!submission || submission.status !== 'submitted') {
      pendingCount++;
    }
  });
  
  return pendingCount;
}

async function getNewMaterialsCount(userId) {
  const StudyMaterial = require('../models/StudyMaterial');
  const enrollments = await Enrollment.find({ student: userId, status: 'active' }).select('class');
  const classIds = enrollments.map(e => e.class);
  
  // Consider materials uploaded in last 7 days as "new"
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const count = await StudyMaterial.countDocuments({
    class: { $in: classIds },
    uploadedAt: { $gte: sevenDaysAgo }
  });
  
  return count;
}

async function getUnreadNotificationsCount(userId) {
  const count = await Notification.countDocuments({
    recipient: userId,
    isRead: false
  });
  
  return count;
}

exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, unreadOnly = false } = req.query;
    const userId = req.user.id;

    const filter = { recipient: userId };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .populate('sender', 'name avatar')
      .populate('data.classId', 'title')
      .populate('data.assignmentId', 'title')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalNotifications = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalNotifications / limit),
          totalNotifications,
          hasNextPage: page * limit < totalNotifications
        },
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Mark notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification'
    });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { query, role } = req.query;

    const searchQuery = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    };

    if (role) {
      searchQuery.role = role;
    }

    const users = await User.find(searchQuery)
      .select('name email avatar role')
      .limit(10);

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users'
    });
  }
};