const Subject = require('../models/Subject');
const Grade = require('../models/Grade');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Create a new subject
exports.createSubject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, code, description, gradeId, teachers, schedule, syllabus } = req.body;

    // Verify grade exists
    const grade = await Grade.findById(gradeId);
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }

    // Check if subject already exists in this grade
    const existingSubject = await Subject.findOne({ name, grade: gradeId });
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: `${name} already exists in this grade`
      });
    }

    // Verify teachers exist and are valid
    if (teachers && teachers.length > 0) {
      const teacherIds = teachers.map(t => t.teacher);
      const validTeachers = await User.find({ 
        _id: { $in: teacherIds }, 
        role: 'teacher' 
      });
      
      if (validTeachers.length !== teacherIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more teachers are invalid'
        });
      }
    }

    const subject = await Subject.create({
      name,
      code: code.toUpperCase(),
      description,
      grade: gradeId,
      teachers: teachers || [],
      schedule: schedule || [],
      syllabus: syllabus || [],
      createdBy: req.user.id
    });

    // Add subject to grade
    grade.subjects.push(subject._id);
    await grade.save();

    await subject.populate([
      { path: 'grade', select: 'name board' },
      { path: 'teachers.teacher', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      data: subject
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subject'
    });
  }
};

// Get all subjects
exports.getSubjects = async (req, res) => {
  try {
    const { gradeId, teacherId, isActive } = req.query;
    const query = {};

    if (gradeId) query.grade = gradeId;
    if (teacherId) query['teachers.teacher'] = teacherId;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const subjects = await Subject.find(query)
      .populate('grade', 'name board displayName')
      .populate('teachers.teacher', 'name email')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subjects'
    });
  }
};

// Get single subject
exports.getSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('grade', 'name board displayName enrolledStudents')
      .populate('teachers.teacher', 'name email')
      .populate('createdBy', 'name email');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.json({
      success: true,
      data: subject
    });
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subject'
    });
  }
};

// Update subject
exports.updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check authorization (admin, creator, or assigned teacher)
    const isAssignedTeacher = subject.teachers.some(
      t => t.teacher.toString() === req.user.id
    );
    
    if (req.user.role !== 'admin' && 
        subject.createdBy.toString() !== req.user.id && 
        !isAssignedTeacher) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this subject'
      });
    }

    const allowedUpdates = ['description', 'schedule', 'syllabus', 'totalClasses', 'completedClasses', 'isActive'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(subject, updates);
    await subject.save();

    res.json({
      success: true,
      data: subject
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating subject'
    });
  }
};

// Add teacher to subject
exports.addTeacher = async (req, res) => {
  try {
    const { teacherId, isPrimary, specialization } = req.body;
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if teacher exists and is valid
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Check if teacher is already assigned
    const isAlreadyAssigned = subject.teachers.some(
      t => t.teacher.toString() === teacherId
    );
    
    if (isAlreadyAssigned) {
      return res.status(400).json({
        success: false,
        message: 'Teacher is already assigned to this subject'
      });
    }

    await subject.addTeacher(teacherId, isPrimary, specialization);
    await subject.populate('teachers.teacher', 'name email');

    res.json({
      success: true,
      data: subject,
      message: 'Teacher added successfully'
    });
  } catch (error) {
    console.error('Error adding teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding teacher'
    });
  }
};

// Remove teacher from subject
exports.removeTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    await subject.removeTeacher(teacherId);
    await subject.populate('teachers.teacher', 'name email');

    res.json({
      success: true,
      data: subject,
      message: 'Teacher removed successfully'
    });
  } catch (error) {
    console.error('Error removing teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing teacher'
    });
  }
};

// Get subjects by teacher
exports.getSubjectsByTeacher = async (req, res) => {
  try {
    const teacherId = req.params.teacherId || req.user.id;
    
    const subjects = await Subject.find({
      'teachers.teacher': teacherId,
      isActive: true
    })
    .populate('grade', 'name board displayName')
    .populate('teachers.teacher', 'name email')
    .sort({ 'grade.name': 1, name: 1 });

    res.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    console.error('Error fetching subjects by teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subjects'
    });
  }
};

// Get subjects by grade for student
exports.getSubjectsByGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;
    
    const subjects = await Subject.find({
      grade: gradeId,
      isActive: true
    })
    .populate('teachers.teacher', 'name email')
    .sort({ name: 1 });

    res.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    console.error('Error fetching subjects by grade:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subjects'
    });
  }
};

// Delete subject
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check authorization (admin only)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete subjects'
      });
    }

    // Remove subject from grade
    await Grade.findByIdAndUpdate(
      subject.grade,
      { $pull: { subjects: subject._id } }
    );

    await subject.deleteOne();

    res.json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting subject'
    });
  }
};