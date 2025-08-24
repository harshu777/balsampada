const User = require('../models/User');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');

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
      progress
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
      getOverallProgress(userId)
    ]);

    res.status(200).json({
      success: true,
      data: {
        enrollments,
        recentActivity,
        upcomingAssignments,
        progress
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
      earnings
    ] = await Promise.all([
      Class.find({ teacher: teacherId })
        .select('title enrolledStudents status averageRating')
        .limit(6),
      getTotalStudents(teacherId),
      getRecentSubmissions(teacherId),
      getUpcomingClasses(teacherId),
      getTeacherEarnings(teacherId)
    ]);

    res.status(200).json({
      success: true,
      data: {
        classes,
        totalStudents,
        recentSubmissions,
        upcomingClasses,
        earnings
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
    .populate('submissions.student', 'name')
    .sort('-submissions.submittedAt')
    .limit(10);

  const recentSubmissions = [];
  assignments.forEach(assignment => {
    assignment.submissions.forEach(submission => {
      if (submission.status === 'submitted' && !submission.grade) {
        recentSubmissions.push({
          assignmentTitle: assignment.title,
          studentName: submission.student.name,
          submittedAt: submission.submittedAt
        });
      }
    });
  });

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
  const Payment = require('../models/Payment');
  const classes = await Class.find({ teacher: teacherId }).select('_id price');
  const classIds = classes.map(c => c._id);

  const payments = await Payment.aggregate([
    { $match: { 
      class: { $in: classIds },
      status: 'completed'
    }},
    { $group: {
      _id: null,
      total: { $sum: '$amount' },
      count: { $sum: 1 }
    }}
  ]);

  const thisMonth = await Payment.aggregate([
    { $match: { 
      class: { $in: classIds },
      status: 'completed',
      createdAt: { 
        $gte: new Date(new Date().setDate(1))
      }
    }},
    { $group: {
      _id: null,
      total: { $sum: '$amount' }
    }}
  ]);

  return {
    total: payments[0]?.total || 0,
    thisMonth: thisMonth[0]?.total || 0,
    totalTransactions: payments[0]?.count || 0
  };
}

exports.getNotifications = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: []
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
    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
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