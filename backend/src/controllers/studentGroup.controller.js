const StudentGroup = require('../models/StudentGroup');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');

// Create a new student group
exports.createGroup = async (req, res) => {
  try {
    const { name, description, classId, students, type, color } = req.body;

    // Verify the teacher owns this class
    const classDoc = await Class.findOne({
      _id: classId,
      teacher: req.user.id,
      organization: req.organizationId
    });

    if (!classDoc) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to create groups for this class'
      });
    }

    // Verify all students are enrolled in the class
    if (students && students.length > 0) {
      const enrollments = await Enrollment.find({
        class: classId,
        student: { $in: students },
        organization: req.organizationId,
        status: { $in: ['enrolled', 'active'] }
      });

      if (enrollments.length !== students.length) {
        return res.status(400).json({
          success: false,
          message: 'Some students are not enrolled in this class'
        });
      }
    }

    const group = await StudentGroup.create({
      name,
      description,
      class: classId,
      teacher: req.user.id,
      organization: req.organizationId,
      students: students || [],
      type,
      color
    });

    await group.populate(['students', 'class']);

    res.status(201).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating student group'
    });
  }
};

// Get all groups for a teacher
exports.getTeacherGroups = async (req, res) => {
  try {
    const { classId } = req.query;
    
    const query = { 
      teacher: req.user.id,
      organization: req.organizationId
    };
    if (classId) {
      query.class = classId;
    }

    const groups = await StudentGroup.find(query)
      .populate('students', 'name email')
      .populate('class', 'title')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: groups
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching groups'
    });
  }
};

// Get a single group
exports.getGroup = async (req, res) => {
  try {
    const group = await StudentGroup.findOne({
      _id: req.params.id,
      teacher: req.user.id,
      organization: req.organizationId
    })
      .populate('students', 'name email phone')
      .populate('class', 'title');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Get group statistics
    await group.getGroupStats();

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching group'
    });
  }
};

// Update a group
exports.updateGroup = async (req, res) => {
  try {
    const { name, description, type, color, isActive } = req.body;

    const group = await StudentGroup.findOne({
      _id: req.params.id,
      teacher: req.user.id,
      organization: req.organizationId
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Update fields
    if (name !== undefined) group.name = name;
    if (description !== undefined) group.description = description;
    if (type !== undefined) group.type = type;
    if (color !== undefined) group.color = color;
    if (isActive !== undefined) group.isActive = isActive;

    await group.save();
    await group.populate(['students', 'class']);

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating group'
    });
  }
};

// Add students to a group
exports.addStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;

    const group = await StudentGroup.findOne({
      _id: req.params.id,
      teacher: req.user.id,
      organization: req.organizationId
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Verify students are enrolled in the class
    const enrollments = await Enrollment.find({
      class: group.class,
      student: { $in: studentIds },
      organization: req.organizationId,
      status: { $in: ['enrolled', 'active'] }
    });

    if (enrollments.length !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some students are not enrolled in this class'
      });
    }

    await group.addStudents(studentIds);
    await group.populate(['students', 'class']);

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Add students error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding students to group'
    });
  }
};

// Remove students from a group
exports.removeStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;

    const group = await StudentGroup.findOne({
      _id: req.params.id,
      teacher: req.user.id,
      organization: req.organizationId
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    await group.removeStudents(studentIds);
    await group.populate(['students', 'class']);

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Remove students error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing students from group'
    });
  }
};

// Delete a group
exports.deleteGroup = async (req, res) => {
  try {
    const group = await StudentGroup.findOne({
      _id: req.params.id,
      teacher: req.user.id,
      organization: req.organizationId
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    await group.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting group'
    });
  }
};

// Get students available for grouping (enrolled but not in any group for a class)
exports.getAvailableStudents = async (req, res) => {
  try {
    const { classId } = req.params;

    // Verify teacher owns this class
    const classDoc = await Class.findOne({
      _id: classId,
      teacher: req.user.id,
      organization: req.organizationId
    });

    if (!classDoc) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view students for this class'
      });
    }

    // Get all enrolled students (both 'enrolled' and 'active' statuses)
    const enrollments = await Enrollment.find({
      class: classId,
      organization: req.organizationId,
      status: { $in: ['enrolled', 'active'] }
    }).populate('student', 'name email');

    const enrolledStudents = enrollments.map(e => e.student);

    // Get all groups for this class
    const groups = await StudentGroup.find({
      class: classId,
      teacher: req.user.id,
      organization: req.organizationId,
      isActive: true
    });

    // Get students already in groups
    const groupedStudentIds = new Set();
    groups.forEach(group => {
      group.students.forEach(studentId => {
        groupedStudentIds.add(studentId.toString());
      });
    });

    // Filter out grouped students
    const availableStudents = enrolledStudents.filter(
      student => !groupedStudentIds.has(student._id.toString())
    );

    res.status(200).json({
      success: true,
      data: {
        available: availableStudents,
        grouped: Array.from(groupedStudentIds),
        total: enrolledStudents.length
      }
    });
  } catch (error) {
    console.error('Get available students error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available students'
    });
  }
};