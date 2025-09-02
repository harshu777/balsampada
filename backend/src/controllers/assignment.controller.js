const Assignment = require('../models/Assignment');
const Enrollment = require('../models/Enrollment');
const NotificationService = require('../services/notificationService');

exports.createAssignment = async (req, res) => {
  try {
    // Parse JSON strings from FormData if needed
    let parsedBody = { ...req.body };
    
    // Parse questions if it's a JSON string
    if (typeof parsedBody.questions === 'string') {
      try {
        parsedBody.questions = JSON.parse(parsedBody.questions);
      } catch (e) {
        console.log('Failed to parse questions:', e);
      }
    }
    
    // Parse specificStudents if it's a JSON string
    if (typeof parsedBody.specificStudents === 'string') {
      try {
        parsedBody.specificStudents = JSON.parse(parsedBody.specificStudents);
      } catch (e) {
        console.log('Failed to parse specificStudents:', e);
      }
    }
    
    const { visibility, groupId, specificStudents, ...assignmentData } = parsedBody;
    
    // If a group is specified, get students from the group
    let targetStudents = specificStudents || [];
    if (groupId) {
      const StudentGroup = require('../models/StudentGroup');
      const group = await StudentGroup.findOne({
        _id: groupId,
        teacher: req.user.id,
        organization: req.organizationId
      });
      
      if (group) {
        targetStudents = group.students.map(s => s.toString());
      }
    }

    const assignment = await Assignment.create({
      ...assignmentData,
      class: req.params.classId,
      createdBy: req.user.id,
      organization: req.organizationId,
      visibility: visibility || 'enrolled',
      specificStudents: visibility === 'specific' ? targetStudents : [],
      isPublished: true // Automatically publish assignments when created
    });

    await assignment.populate('createdBy', 'name email');
    await assignment.populate('specificStudents', 'name email');

    // Send notifications based on visibility
    if (visibility === 'specific' && targetStudents.length > 0) {
      // Notify specific students
      for (const studentId of targetStudents) {
        await NotificationService.notifyAssignmentCreated(
          assignment._id,
          req.params.classId,
          studentId,
          assignment.title
        );
      }
    } else {
      // Notify all enrolled students
      await NotificationService.notifyAssignmentCreated(
        assignment._id,
        req.params.classId,
        req.user.id,
        assignment.title
      );
    }

    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating assignment'
    });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const { classId } = req.params;
    const query = { 
      class: classId,
      organization: req.organizationId
    };

    if (req.user.role === 'student') {
      query.isPublished = true;
    }

    const assignments = await Assignment.find(query)
      .populate('createdBy', 'name email')
      .sort('dueDate');

    res.status(200).json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignments'
    });
  }
};

exports.getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      organization: req.organizationId
    })
      .populate('createdBy', 'name email')
      .populate('submissions.student', 'name email');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    let submission = null;
    if (req.user.role === 'student') {
      submission = assignment.submissions.find(
        sub => sub.student._id.toString() === req.user.id
      );
    }

    res.status(200).json({
      success: true,
      data: {
        assignment,
        submission
      }
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignment'
    });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, organization: req.organizationId },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating assignment'
    });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      organization: req.organizationId
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (assignment.submissions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete assignment with submissions'
      });
    }

    await assignment.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting assignment'
    });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      organization: req.organizationId
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      class: assignment.class,
      status: { $in: ['enrolled', 'active'] }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this class'
      });
    }

    await assignment.submitAssignment(req.user.id, {
      content: req.body.content,
      files: req.body.files
    });

    res.status(200).json({
      success: true,
      message: 'Assignment submitted successfully'
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting assignment'
    });
  }
};

exports.gradeAssignment = async (req, res) => {
  try {
    const { studentId, score, feedback, rubricScores } = req.body;
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      organization: req.organizationId
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    await assignment.gradeSubmission(studentId, {
      score,
      feedback,
      gradedBy: req.user.id,
      rubricScores
    });

    const enrollment = await Enrollment.findOne({
      student: studentId,
      class: assignment.class
    });

    if (enrollment) {
      enrollment.grades.assignments.push({
        assignment: assignment._id,
        score,
        maxScore: assignment.maxScore,
        gradedAt: Date.now(),
        gradedBy: req.user.id,
        feedback
      });
      await enrollment.calculateFinalGrade();
    }

    res.status(200).json({
      success: true,
      message: 'Assignment graded successfully'
    });
  } catch (error) {
    console.error('Grade assignment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error grading assignment'
    });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      organization: req.organizationId
    })
      .populate('submissions.student', 'name email avatar')
      .populate('submissions.grade.gradedBy', 'name');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: assignment.submissions
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submissions'
    });
  }
};

exports.publishAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      organization: req.organizationId
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    assignment.isPublished = true;
    await assignment.save();

    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Publish assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error publishing assignment'
    });
  }
};

// Get all assignments for a teacher
exports.getTeacherAssignments = async (req, res) => {
  try {
    const Class = require('../models/Class');
    
    // Find all classes taught by this teacher
    const classes = await Class.find({ 
      teacher: req.user.id,
      organization: req.organizationId
    });
    const classIds = classes.map(c => c._id);
    
    // Find all assignments for these classes OR created by this teacher
    const assignments = await Assignment.find({
      organization: req.organizationId,
      $or: [
        { class: { $in: classIds } },
        { createdBy: req.user.id }
      ]
    })
      .populate('class', 'title')
      .populate('createdBy', 'name')
      .populate('submissions.student', 'name email')
      .populate('specificStudents', 'name email')
      .sort('-createdAt');

    console.log(`Found ${assignments.length} assignments for teacher ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: assignments || []
    });
  } catch (error) {
    console.error('Get teacher assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher assignments'
    });
  }
};

// Get all assignments for a student
exports.getStudentAssignments = async (req, res) => {
  try {
    const Enrollment = require('../models/Enrollment');
    
    // Find all enrollments for this student (both 'enrolled' and 'active' statuses)
    const enrollments = await Enrollment.find({ 
      student: req.user.id,
      organization: req.organizationId,
      status: { $in: ['enrolled', 'active'] }
    });
    const classIds = enrollments.map(e => e.class);
    
    // Find all published assignments for these classes
    // Consider visibility settings - either for all enrolled or specific students
    const assignments = await Assignment.find({ 
      class: { $in: classIds },
      organization: req.organizationId,
      isPublished: true,
      $or: [
        { visibility: 'enrolled' },
        { visibility: { $ne: 'specific' } }, // Default case
        { 
          visibility: 'specific',
          specificStudents: req.user.id 
        }
      ]
    })
      .populate('class', 'title')
      .populate('submissions.student', 'name')
      .sort('-createdAt');

    // Add submission status for each assignment
    const assignmentsWithStatus = assignments.map(assignment => {
      const submission = assignment.submissions.find(
        sub => sub.student._id.toString() === req.user.id
      );
      
      return {
        ...assignment.toObject(),
        hasSubmitted: !!submission,
        submissionStatus: submission?.status,
        grade: submission?.grade
      };
    });

    res.status(200).json({
      success: true,
      data: assignmentsWithStatus || []
    });
  } catch (error) {
    console.error('Get student assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student assignments'
    });
  }
};