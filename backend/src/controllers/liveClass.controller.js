const LiveClass = require('../models/LiveClass');
const Class = require('../models/Class');
const { validationResult } = require('express-validator');

// Create a new live class
exports.createLiveClass = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { 
      title, 
      description, 
      classId, 
      scheduledAt, 
      duration,
      maxAttendees,
      isRecurring,
      recurringPattern 
    } = req.body;

    // Check if class exists and teacher owns it
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    if (classItem.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to create live classes for this class'
      });
    }

    // Generate meeting URL (in production, integrate with Zoom/Google Meet API)
    const meetingId = `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const meetingUrl = `https://meet.balsampada.com/${meetingId}`;
    const password = Math.random().toString(36).substr(2, 8);

    const liveClass = await LiveClass.create({
      title,
      description,
      class: classId,
      teacher: req.user.id,
      scheduledAt,
      duration: duration || 60,
      meetingUrl,
      meetingId,
      password,
      maxAttendees: maxAttendees || 100,
      isRecurring,
      recurringPattern
    });

    await liveClass.populate('teacher', 'name email');
    await liveClass.populate('class', 'title');

    res.status(201).json({
      success: true,
      data: liveClass
    });
  } catch (error) {
    console.error('Error creating live class:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating live class'
    });
  }
};

// Get all live classes (with filters)
exports.getLiveClasses = async (req, res) => {
  try {
    const { classId, status, upcoming } = req.query;
    const query = {};

    // Filter by class if specified
    if (classId) {
      query.class = classId;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter for upcoming classes
    if (upcoming === 'true') {
      query.scheduledAt = { $gte: new Date() };
      query.status = 'scheduled';
    }

    // Add role-based filtering
    if (req.user.role === 'teacher') {
      query.teacher = req.user.id;
    } else if (req.user.role === 'student') {
      // Get enrolled classs for student
      const user = await req.user.populate('enrolledClasss');
      const enrolledClassIds = user.enrolledClasss.map(c => c._id);
      query.class = { $in: enrolledClassIds };
    }

    const liveClasses = await LiveClass.find(query)
      .populate('teacher', 'name email')
      .populate('class', 'title')
      .sort({ scheduledAt: 1 });

    res.json({
      success: true,
      data: liveClasses
    });
  } catch (error) {
    console.error('Error fetching live classes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching live classes'
    });
  }
};

// Get single live class
exports.getLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('class', 'title')
      .populate('attendees.student', 'name email');

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found'
      });
    }

    res.json({
      success: true,
      data: liveClass
    });
  } catch (error) {
    console.error('Error fetching live class:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching live class'
    });
  }
};

// Update live class
exports.updateLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found'
      });
    }

    // Check authorization
    if (liveClass.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this live class'
      });
    }

    // Prevent updating if class is live or completed
    if (liveClass.status === 'live' || liveClass.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update live or completed classes'
      });
    }

    const allowedUpdates = ['title', 'description', 'scheduledAt', 'duration', 'maxAttendees'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(liveClass, updates);
    await liveClass.save();

    res.json({
      success: true,
      data: liveClass
    });
  } catch (error) {
    console.error('Error updating live class:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating live class'
    });
  }
};

// Start live class
exports.startLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found'
      });
    }

    // Check authorization
    if (liveClass.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the teacher can start the class'
      });
    }

    await liveClass.startClass();

    res.json({
      success: true,
      data: liveClass,
      message: 'Live class started successfully'
    });
  } catch (error) {
    console.error('Error starting live class:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error starting live class'
    });
  }
};

// End live class
exports.endLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found'
      });
    }

    // Check authorization
    if (liveClass.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the teacher can end the class'
      });
    }

    await liveClass.endClass();

    res.json({
      success: true,
      data: liveClass,
      message: 'Live class ended successfully'
    });
  } catch (error) {
    console.error('Error ending live class:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error ending live class'
    });
  }
};

// Join live class
exports.joinLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found'
      });
    }

    // Check if class is live or about to start (within 15 minutes)
    const now = new Date();
    const classTime = new Date(liveClass.scheduledAt);
    const timeDiff = (classTime - now) / (1000 * 60); // difference in minutes

    if (liveClass.status !== 'live' && timeDiff > 15) {
      return res.status(400).json({
        success: false,
        message: 'Class has not started yet. You can join 15 minutes before the scheduled time.'
      });
    }

    if (liveClass.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This class has already ended'
      });
    }

    // Check if student is enrolled in the class
    if (req.user.role === 'student') {
      const user = await req.user.populate('enrolledClasss');
      const isEnrolled = user.enrolledClasss.some(
        c => c._id.toString() === liveClass.class.toString()
      );

      if (!isEnrolled) {
        return res.status(403).json({
          success: false,
          message: 'You must be enrolled in the class to join this class'
        });
      }
    }

    // Add attendee
    await liveClass.addAttendee(req.user.id);

    res.json({
      success: true,
      data: {
        meetingUrl: liveClass.meetingUrl,
        meetingId: liveClass.meetingId,
        password: liveClass.password
      },
      message: 'Successfully joined the live class'
    });
  } catch (error) {
    console.error('Error joining live class:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining live class'
    });
  }
};

// Leave live class
exports.leaveLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found'
      });
    }

    await liveClass.removeAttendee(req.user.id);

    res.json({
      success: true,
      message: 'Successfully left the live class'
    });
  } catch (error) {
    console.error('Error leaving live class:', error);
    res.status(500).json({
      success: false,
      message: 'Error leaving live class'
    });
  }
};

// Delete live class
exports.deleteLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found'
      });
    }

    // Check authorization
    if (liveClass.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this live class'
      });
    }

    // Prevent deleting if class is live
    if (liveClass.status === 'live') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a live class that is currently in session'
      });
    }

    await liveClass.deleteOne();

    res.json({
      success: true,
      message: 'Live class deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting live class:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting live class'
    });
  }
};

// Get attendance report
exports.getAttendanceReport = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id)
      .populate('attendees.student', 'name email');

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found'
      });
    }

    // Check authorization
    if (liveClass.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view attendance report'
      });
    }

    const attendanceReport = liveClass.attendees.map(attendee => ({
      student: attendee.student,
      joinedAt: attendee.joinedAt,
      leftAt: attendee.leftAt,
      attendance: attendee.attendance,
      duration: attendee.leftAt && attendee.joinedAt 
        ? Math.round((attendee.leftAt - attendee.joinedAt) / (1000 * 60)) 
        : null
    }));

    res.json({
      success: true,
      data: {
        classTitle: liveClass.title,
        scheduledAt: liveClass.scheduledAt,
        totalAttendees: attendanceReport.filter(a => a.attendance).length,
        attendanceReport
      }
    });
  } catch (error) {
    console.error('Error fetching attendance report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance report'
    });
  }
};