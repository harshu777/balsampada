const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const { validationResult } = require('express-validator');

exports.createClass = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const classItemData = {
      ...req.body,
      teacher: req.user.id
    };

    const classItem = await Class.create(classItemData);

    await classItem.populate('teacher', 'name email avatar');

    res.status(201).json({
      success: true,
      data: classItem
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating class'
    });
  }
};

exports.getClasses = async (req, res) => {
  try {
    const {
      category,
      level,
      search,
      minPrice,
      maxPrice,
      status = 'published',
      page = 1,
      limit = 10,
      sort = '-createdAt'
    } = req.query;

    const query = {};

    if (category) query.category = category;
    if (level) query.level = level;
    if (status) query.status = status;
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (page - 1) * limit;

    const classes = await Class.find(query)
      .populate('teacher', 'name email avatar qualification')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Class.countDocuments(query);

    res.status(200).json({
      success: true,
      data: classes,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching classes'
    });
  }
};

exports.getClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id)
      .populate('teacher', 'name email avatar bio qualification experience')
      .populate('enrolledStudents', 'name avatar');

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    let enrollment = null;
    if (req.user) {
      enrollment = await Enrollment.findOne({
        student: req.user.id,
        class: classItem._id
      });
    }

    res.status(200).json({
      success: true,
      data: classItem,
      enrollment: enrollment
    });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching class'
    });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const classItem = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('teacher', 'name email avatar');

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
    console.error('Update class error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating class'
    });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    if (classItem.enrolledStudents.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete class with enrolled students'
      });
    }

    await classItem.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting class'
    });
  }
};

exports.publishClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    if (classItem.modules.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Class must have at least one module to publish'
      });
    }

    classItem.status = 'published';
    classItem.publishedAt = Date.now();
    await classItem.save();

    res.status(200).json({
      success: true,
      data: classItem
    });
  } catch (error) {
    console.error('Publish class error:', error);
    res.status(500).json({
      success: false,
      message: 'Error publishing class'
    });
  }
};

exports.addModule = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    classItem.modules.push(req.body);
    await classItem.save();

    res.status(200).json({
      success: true,
      data: classItem
    });
  } catch (error) {
    console.error('Add module error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding module'
    });
  }
};

exports.updateModule = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const module = classItem.modules.id(req.params.moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    Object.assign(module, req.body);
    await classItem.save();

    res.status(200).json({
      success: true,
      data: classItem
    });
  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating module'
    });
  }
};

exports.deleteModule = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    classItem.modules.pull(req.params.moduleId);
    await classItem.save();

    res.status(200).json({
      success: true,
      data: classItem
    });
  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting module'
    });
  }
};

exports.addLesson = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const module = classItem.modules.id(req.params.moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    module.lessons.push(req.body);
    classItem.totalLectures = classItem.modules.reduce((acc, mod) => 
      acc + mod.lessons.length, 0
    );
    await classItem.save();

    res.status(200).json({
      success: true,
      data: classItem
    });
  } catch (error) {
    console.error('Add lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding lesson'
    });
  }
};

exports.rateClass = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      class: classItem._id,
      status: { $in: ['active', 'completed'] }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled to rate this class'
      });
    }

    const existingRating = classItem.ratings.find(
      r => r.student.toString() === req.user.id
    );

    if (existingRating) {
      existingRating.rating = rating;
      existingRating.review = review;
      existingRating.createdAt = Date.now();
    } else {
      classItem.ratings.push({
        student: req.user.id,
        rating,
        review
      });
    }

    await classItem.calculateAverageRating();

    res.status(200).json({
      success: true,
      data: classItem
    });
  } catch (error) {
    console.error('Rate class error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rating class'
    });
  }
};

exports.getTeacherClasses = async (req, res) => {
  try {
    const classes = await Class.find({ teacher: req.user.id })
      .populate('enrolledStudents', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher classes'
    });
  }
};