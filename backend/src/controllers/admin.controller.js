const User = require('../models/User');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const Assignment = require('../models/Assignment');

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalEnrollments,
      totalRevenue,
      recentEnrollments,
      topClasses,
      monthlyRevenue
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Class.countDocuments({ status: 'published' }),
      Enrollment.countDocuments({ status: 'active' }),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Enrollment.find()
        .populate('student', 'name email')
        .populate('class', 'title')
        .sort('-enrollmentDate')
        .limit(10),
      Class.aggregate([
        { $match: { status: 'published' } },
        { $project: {
          title: 1,
          enrollmentCount: { $size: '$enrolledStudents' },
          averageRating: 1,
          price: 1
        }},
        { $sort: { enrollmentCount: -1 } },
        { $limit: 5 }
      ]),
      Payment.aggregate([
        { $match: { 
          status: 'completed',
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }},
        { $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }},
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    const activeStudents = await User.countDocuments({ 
      role: 'student', 
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    const pendingClasses = await Class.countDocuments({ status: 'pending' });
    
    const completionRate = await Enrollment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalStudents,
          totalTeachers,
          totalClasses,
          totalEnrollments,
          totalRevenue: totalRevenue[0]?.total || 0,
          activeStudents,
          pendingClasses,
          completionRate: completionRate[0]?.count || 0
        },
        recentEnrollments,
        topClasses,
        monthlyRevenue,
        growthRate: {
          students: await calculateGrowthRate('User', { role: 'student' }),
          classes: await calculateGrowthRate('Class'),
          revenue: await calculateRevenueGrowth()
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
};

async function calculateGrowthRate(model, filter = {}) {
  const Model = model === 'User' ? User : Class;
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  
  const lastMonth = new Date(currentMonth);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const [currentCount, lastCount] = await Promise.all([
    Model.countDocuments({ ...filter, createdAt: { $gte: currentMonth } }),
    Model.countDocuments({ 
      ...filter, 
      createdAt: { $gte: lastMonth, $lt: currentMonth } 
    })
  ]);
  
  if (lastCount === 0) return currentCount > 0 ? 100 : 0;
  return Math.round(((currentCount - lastCount) / lastCount) * 100);
}

async function calculateRevenueGrowth() {
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  
  const lastMonth = new Date(currentMonth);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const [currentRevenue, lastRevenue] = await Promise.all([
    Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: currentMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Payment.aggregate([
      { $match: { 
        status: 'completed', 
        createdAt: { $gte: lastMonth, $lt: currentMonth } 
      }},
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);
  
  const current = currentRevenue[0]?.total || 0;
  const last = lastRevenue[0]?.total || 0;
  
  if (last === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - last) / last) * 100);
}

exports.getAllUsers = async (req, res) => {
  try {
    const { 
      role, 
      status, 
      search, 
      page = 1, 
      limit = 10,
      sort = '-createdAt' 
    } = req.query;

    const query = {};
    
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true, select: '-password' }
    );

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
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status'
    });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, select: '-password' }
    );

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
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user role'
    });
  }
};

exports.approveClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { status, feedback } = req.body;

    if (!['published', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const classItem = await Class.findByIdAndUpdate(
      classId,
      { 
        status,
        publishedAt: status === 'published' ? Date.now() : undefined
      },
      { new: true }
    );

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.status(200).json({
      success: true,
      data: classItem
    });
  } catch (error) {
    console.error('Approve class error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving class'
    });
  }
};

exports.getSystemLogs = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        message: 'System logs endpoint - implement based on logging solution'
      }
    });
  } catch (error) {
    console.error('Get system logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system logs'
    });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    let reportData;

    switch (type) {
      case 'revenue':
        reportData = await generateRevenueReport(startDate, endDate);
        break;
      case 'enrollment':
        reportData = await generateEnrollmentReport(startDate, endDate);
        break;
      case 'performance':
        reportData = await generatePerformanceReport(startDate, endDate);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    res.status(200).json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating report'
    });
  }
};

async function generateRevenueReport(startDate, endDate) {
  const query = { status: 'completed' };
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const [totalRevenue, paymentsByMethod, revenueByClass] = await Promise.all([
    Payment.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    Payment.aggregate([
      { $match: query },
      { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    Payment.aggregate([
      { $match: query },
      { $group: { _id: '$class', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: {
        from: 'classes',
        localField: '_id',
        foreignField: '_id',
        as: 'classInfo'
      }},
      { $unwind: '$classInfo' },
      { $project: {
        classTitle: '$classInfo.title',
        total: 1,
        count: 1
      }},
      { $sort: { total: -1 } },
      { $limit: 10 }
    ])
  ]);

  return {
    totalRevenue: totalRevenue[0] || { total: 0, count: 0 },
    paymentsByMethod,
    revenueByClass
  };
}

async function generateEnrollmentReport(startDate, endDate) {
  const query = {};
  if (startDate || endDate) {
    query.enrollmentDate = {};
    if (startDate) query.enrollmentDate.$gte = new Date(startDate);
    if (endDate) query.enrollmentDate.$lte = new Date(endDate);
  }

  const [totalEnrollments, enrollmentsByStatus, enrollmentsByClass] = await Promise.all([
    Enrollment.countDocuments(query),
    Enrollment.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Enrollment.aggregate([
      { $match: query },
      { $group: { _id: '$class', count: { $sum: 1 } } },
      { $lookup: {
        from: 'classes',
        localField: '_id',
        foreignField: '_id',
        as: 'classInfo'
      }},
      { $unwind: '$classInfo' },
      { $project: {
        classTitle: '$classInfo.title',
        count: 1
      }},
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  ]);

  return {
    totalEnrollments,
    enrollmentsByStatus,
    enrollmentsByClass
  };
}

async function generatePerformanceReport(startDate, endDate) {
  const [averageProgress, completionRates, gradeDistribution] = await Promise.all([
    Enrollment.aggregate([
      { $match: { status: 'active' } },
      { $group: { 
        _id: null, 
        avgProgress: { $avg: '$progress.percentageComplete' }
      }}
    ]),
    Enrollment.aggregate([
      { $group: { 
        _id: '$status', 
        count: { $sum: 1 }
      }}
    ]),
    Enrollment.aggregate([
      { $match: { 'grades.finalGrade': { $ne: null } } },
      { $group: { 
        _id: '$grades.finalGrade', 
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ])
  ]);

  return {
    averageProgress: averageProgress[0]?.avgProgress || 0,
    completionRates,
    gradeDistribution
  };
}

exports.sendAnnouncement = async (req, res) => {
  try {
    const { title, content, targetAudience, classId } = req.body;

    let recipients = [];

    if (targetAudience === 'all') {
      recipients = await User.find({ isActive: true }).select('email');
    } else if (targetAudience === 'students') {
      recipients = await User.find({ role: 'student', isActive: true }).select('email');
    } else if (targetAudience === 'teachers') {
      recipients = await User.find({ role: 'teacher', isActive: true }).select('email');
    } else if (targetAudience === 'class' && classId) {
      const classItem = await Class.findById(classId).populate('enrolledStudents', 'email');
      recipients = classItem.enrolledStudents;
    }

    res.status(200).json({
      success: true,
      message: `Announcement sent to ${recipients.length} recipients`
    });
  } catch (error) {
    console.error('Send announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending announcement'
    });
  }
};