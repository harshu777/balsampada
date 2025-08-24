const Assignment = require('../models/Assignment');
const Enrollment = require('../models/Enrollment');

exports.createAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.create({
      ...req.body,
      class: req.params.classId,
      createdBy: req.user.id
    });

    await assignment.populate('createdBy', 'name email');

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
    const query = { class: classId };

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
    const assignment = await Assignment.findById(req.params.id)
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
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
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
    const assignment = await Assignment.findById(req.params.id);

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
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      class: assignment.class,
      status: 'active'
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
    const assignment = await Assignment.findById(req.params.id);

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
    const assignment = await Assignment.findById(req.params.id)
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
    const assignment = await Assignment.findById(req.params.id);

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