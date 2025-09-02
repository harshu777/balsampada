const Grade = require('../models/Grade');
const Subject = require('../models/Subject');
const { validationResult } = require('express-validator');

// Create a new grade
exports.createGrade = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, board, academicYear, medium, description, enrollmentPrice, discountPrice, maxStudents } = req.body;

    // Check if grade already exists for this board and academic year
    const existingGrade = await Grade.findOne({ name, board, academicYear });
    if (existingGrade) {
      return res.status(400).json({
        success: false,
        message: `${name} grade for ${board} in ${academicYear} already exists`
      });
    }

    const grade = await Grade.create({
      name,
      board,
      academicYear: academicYear || undefined, // Use default if not provided
      medium,
      description,
      enrollmentPrice,
      discountPrice,
      maxStudents,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: grade
    });
  } catch (error) {
    console.error('Error creating grade:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating grade'
    });
  }
};

// Get all grades
exports.getGrades = async (req, res) => {
  try {
    const { board, academicYear, isActive } = req.query;
    const query = {};

    if (board) query.board = board;
    if (academicYear) query.academicYear = academicYear;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const grades = await Grade.find(query)
      .populate('subjects', 'name code teachers')
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: grades
    });
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching grades'
    });
  }
};

// Get single grade with subjects
exports.getGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id)
      .populate({
        path: 'subjects',
        populate: {
          path: 'teachers.teacher',
          select: 'name email'
        }
      })
      .populate('enrolledStudents', 'name email')
      .populate('createdBy', 'name email');

    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }

    res.json({
      success: true,
      data: grade
    });
  } catch (error) {
    console.error('Error fetching grade:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching grade'
    });
  }
};

// Update grade
exports.updateGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);

    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }

    // Check authorization (admin or creator)
    if (req.user.role !== 'admin' && grade.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this grade'
      });
    }

    const allowedUpdates = ['description', 'enrollmentPrice', 'discountPrice', 'maxStudents', 'isActive'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(grade, updates);
    await grade.save();

    res.json({
      success: true,
      data: grade
    });
  } catch (error) {
    console.error('Error updating grade:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating grade'
    });
  }
};

// Delete grade
exports.deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);

    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }

    // Check authorization (admin only)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete grades'
      });
    }

    // Check if grade has enrolled students
    if (grade.enrolledStudents && grade.enrolledStudents.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete grade with enrolled students'
      });
    }

    // Delete all subjects in this grade first
    await Subject.deleteMany({ grade: req.params.id });

    await grade.deleteOne();

    res.json({
      success: true,
      message: 'Grade deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting grade:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting grade'
    });
  }
};

// Enroll student in grade
exports.enrollStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    const grade = await Grade.findById(req.params.id);

    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }

    // Check if student is already enrolled
    if (grade.enrolledStudents.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this grade'
      });
    }

    // Check if grade is full
    if (grade.enrolledStudents.length >= grade.maxStudents) {
      return res.status(400).json({
        success: false,
        message: 'Grade is full'
      });
    }

    grade.enrolledStudents.push(studentId);
    await grade.save();

    res.json({
      success: true,
      message: 'Student enrolled successfully',
      data: grade
    });
  } catch (error) {
    console.error('Error enrolling student:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling student'
    });
  }
};

// Get grades by board for dropdown
exports.getGradesByBoard = async (req, res) => {
  try {
    const { board } = req.params;
    
    const grades = await Grade.find({ 
      board, 
      isActive: true 
    }).select('name displayName').sort({ name: 1 });

    res.json({
      success: true,
      data: grades
    });
  } catch (error) {
    console.error('Error fetching grades by board:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching grades'
    });
  }
};