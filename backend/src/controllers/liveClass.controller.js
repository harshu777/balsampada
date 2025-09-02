const LiveClass = require('../models/LiveClass');
const Class = require('../models/Class');
const { validationResult } = require('express-validator');

// Create a new live class
exports.createLiveClass = async (req, res) => {
  try {
    console.log('Live class creation request:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
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

    // Check if classId is provided
    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'Class ID is required'
      });
    }

    // Check if class exists and teacher owns it
    const classItem = await Class.findOne({
      _id: classId,
      organization: req.organizationId
    });
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

    // Use provided meeting URL or generate a default one
    let finalMeetingUrl = req.body.meetingUrl;
    let meetingId = '';
    let password = '';
    
    if (!finalMeetingUrl) {
      // Generate default meeting URL if not provided
      // For development, use Google Meet or generate a placeholder
      meetingId = `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Use Jitsi Meet - FREE and works instantly without any setup!
      // The meeting room is created automatically when someone clicks the link
      finalMeetingUrl = `https://meet.jit.si/balsampada-${meetingId}`;
      
      // Alternative: Google Meet (teachers must manually create and provide links)
      // finalMeetingUrl = `https://meet.google.com/abc-defg-hij`; // Requires real Google Meet link
      
      // Alternative: Custom local solution
      // finalMeetingUrl = `http://localhost:3001/meeting/${meetingId}`;
      
      password = Math.random().toString(36).substr(2, 8);
    } else {
      // Extract meeting ID from provided URL if possible
      const urlParts = finalMeetingUrl.split('/');
      meetingId = urlParts[urlParts.length - 1] || `custom_${Date.now()}`;
    }

    const liveClass = await LiveClass.create({
      title,
      description,
      class: classId,
      teacher: req.user.id,
      organization: req.organizationId,
      scheduledAt,
      duration: duration || 60,
      meetingUrl: finalMeetingUrl,
      meetingId,
      password,
      maxAttendees: maxAttendees || 100,
      isRecurring,
      recurringPattern
    });

    await liveClass.populate('teacher', 'name email');
    await liveClass.populate('class', 'title');

    // Generate recurring classes if needed
    let allClasses = [liveClass];
    if (isRecurring && recurringPattern) {
      const recurringClasses = await generateRecurringClasses(liveClass, recurringPattern);
      allClasses = [liveClass, ...recurringClasses];
    }

    res.status(201).json({
      success: true,
      data: liveClass,
      recurringClassesCount: allClasses.length - 1
    });
  } catch (error) {
    console.error('Error creating live class:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error creating live class',
      error: error.message
    });
  }
};

// Get all live classes (with filters)
exports.getLiveClasses = async (req, res) => {
  try {
    const { classId, status, upcoming } = req.query;
    const query = { organization: req.organizationId };

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
      // Get enrolled classes for student from Enrollment model
      const Enrollment = require('../models/Enrollment');
      const enrollments = await Enrollment.find({ 
        student: req.user.id,
        organization: req.organizationId,
        status: { $in: ['active', 'enrolled'] }
      }).select('class');
      
      console.log(`Student ${req.user.name} (${req.user.id}) enrollments:`, enrollments.length);
      console.log('Enrollment details:', enrollments);
      
      const enrolledClassIds = enrollments.map(e => e.class);
      console.log('Enrolled class IDs:', enrolledClassIds);
      
      // Only filter by enrolled classes if student has enrollments
      if (enrolledClassIds.length > 0) {
        query.class = { $in: enrolledClassIds };
      } else {
        // Return empty array if no enrollments
        console.log('No enrollments found for student');
        return res.json({
          success: true,
          data: []
        });
      }
    }

    const liveClasses = await LiveClass.find(query)
      .populate('teacher', 'name email')
      .populate('class', 'title')
      .sort({ scheduledAt: 1 });

    console.log('Query used for live classes:', query);
    console.log(`Found ${liveClasses.length} live classes for student`);
    if (liveClasses.length > 0) {
      console.log('Sample live class:', {
        title: liveClasses[0].title,
        class: liveClasses[0].class,
        status: liveClasses[0].status
      });
    }

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
    const liveClass = await LiveClass.findOne({
      _id: req.params.id,
      organization: req.organizationId
    })
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
    const liveClass = await LiveClass.findOne({
      _id: req.params.id,
      organization: req.organizationId
    });

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

    const allowedUpdates = ['title', 'description', 'scheduledAt', 'duration', 'maxAttendees', 'meetingUrl'];
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
    const liveClass = await LiveClass.findOne({
      _id: req.params.id,
      organization: req.organizationId
    });

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
    const liveClass = await LiveClass.findOne({
      _id: req.params.id,
      organization: req.organizationId
    });

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
    const liveClass = await LiveClass.findOne({
      _id: req.params.id,
      organization: req.organizationId
    });

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
      const user = await req.user.populate('enrolledClasses');
      const isEnrolled = user.enrolledClasses.some(
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
    const liveClass = await LiveClass.findOne({
      _id: req.params.id,
      organization: req.organizationId
    });

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

// Bulk delete scheduled live classes
exports.deleteSelectedClasses = async (req, res) => {
  try {
    const { classIds } = req.body;

    if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select classes to delete'
      });
    }

    // Find all classes to verify ownership
    const classesToDelete = await LiveClass.find({
      _id: { $in: classIds },
      teacher: req.user.id,
      organization: req.organizationId,
      status: 'scheduled'
    });

    if (classesToDelete.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No scheduled classes found that you can delete'
      });
    }

    // Delete the selected classes
    const result = await LiveClass.deleteMany({
      _id: { $in: classesToDelete.map(c => c._id) }
    });

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} selected classes`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting selected classes:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting selected classes'
    });
  }
};

// Delete live class
exports.deleteLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findOne({
      _id: req.params.id,
      organization: req.organizationId
    });

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
    const liveClass = await LiveClass.findOne({
      _id: req.params.id,
      organization: req.organizationId
    })
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

// Helper function to generate recurring classes
const generateRecurringClasses = async (originalClass, pattern) => {
  const recurringClasses = [];
  const startDate = new Date(originalClass.scheduledAt);
  const maxRecurrences = 52; // Maximum 1 year for weekly, adjust as needed
  
  for (let i = 1; i < maxRecurrences; i++) {
    const nextDate = new Date(startDate);
    
    switch (pattern) {
      case 'daily':
        nextDate.setDate(startDate.getDate() + i);
        break;
      case 'weekly':
        nextDate.setDate(startDate.getDate() + (i * 7));
        break;
      case 'monthly':
        nextDate.setMonth(startDate.getMonth() + i);
        break;
      default:
        return recurringClasses;
    }
    
    // Stop if we're scheduling too far into the future (1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (nextDate > oneYearFromNow) break;
    
    // Generate unique meeting details for each class
    const meetingId = `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`;
    const meetingUrl = `https://meet.balsampada.com/${meetingId}`;
    const password = Math.random().toString(36).substr(2, 8);
    
    const recurringClass = await LiveClass.create({
      title: `${originalClass.title} - Session ${i + 1}`,
      description: originalClass.description,
      class: originalClass.class,
      teacher: originalClass.teacher,
      organization: originalClass.organization,
      scheduledAt: nextDate,
      duration: originalClass.duration,
      meetingUrl,
      meetingId,
      password,
      maxAttendees: originalClass.maxAttendees,
      isRecurring: true,
      recurringPattern: pattern
    });
    
    recurringClasses.push(recurringClass);
  }
  
  return recurringClasses;
};