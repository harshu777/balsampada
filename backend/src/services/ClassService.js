const BaseService = require('./BaseService');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

/**
 * Class Service - Business logic for class management
 * Extends BaseService for common CRUD operations
 */
class ClassService extends BaseService {
  constructor(cacheService = null) {
    super(Class, cacheService);
    this.enrollmentModel = Enrollment;
    this.userModel = User;
  }

  /**
   * Get classes with enrollment count and teacher details
   */
  async getAllWithDetails(options = {}) {
    const { userId, role, ...baseOptions } = options;
    
    // Add role-based filtering
    const filter = { ...baseOptions.filter };
    
    if (role === 'teacher') {
      filter.teacher = userId;
    } else if (role === 'student') {
      filter.status = 'published';
      filter.isActive = true;
    }

    // Use populate for teacher details
    const result = await this.getAll({
      ...baseOptions,
      filter,
      populate: 'teacher organization',
      select: '-__v'
    });

    // Add enrollment count for each class
    const classIds = result.data.map(c => c._id);
    const enrollmentCounts = await this.getEnrollmentCounts(classIds);
    
    result.data = result.data.map(classItem => {
      const classObj = classItem.toObject();
      classObj.enrollmentCount = enrollmentCounts[classItem._id] || 0;
      return classObj;
    });

    return result;
  }

  /**
   * Create a new class with validation
   */
  async createClass(data, teacherId) {
    return this.withTransaction(async (session) => {
      // Validate teacher exists and is active
      const teacher = await this.userModel.findById(teacherId).session(session);
      
      if (!teacher || teacher.role !== 'teacher') {
        const error = new Error('Invalid teacher');
        error.statusCode = 400;
        throw error;
      }

      // Check if teacher has reached class limit
      const classCount = await this.model.countDocuments({ 
        teacher: teacherId,
        isActive: true 
      }).session(session);
      
      const maxClasses = process.env.MAX_CLASSES_PER_TEACHER || 10;
      if (classCount >= maxClasses) {
        const error = new Error(`Teacher has reached maximum class limit (${maxClasses})`);
        error.statusCode = 400;
        throw error;
      }

      // Create the class
      const classData = {
        ...data,
        teacher: teacherId,
        organization: teacher.organization,
        status: 'draft'
      };

      const newClass = await this.create(classData, { session });

      // Create initial materials structure
      await this.createInitialMaterials(newClass._id, session);

      return newClass;
    });
  }

  /**
   * Publish a class
   */
  async publishClass(classId, userId) {
    const classItem = await this.getById(classId);
    
    // Check ownership
    if (classItem.teacher.toString() !== userId) {
      const error = new Error('Not authorized to publish this class');
      error.statusCode = 403;
      throw error;
    }

    // Validate class is ready for publishing
    const validationErrors = this.validateForPublishing(classItem);
    if (validationErrors.length > 0) {
      const error = new Error(`Class not ready for publishing: ${validationErrors.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    // Update status
    const updated = await this.update(classId, { 
      status: 'published',
      publishedAt: new Date()
    });

    // Send notifications to interested students
    await this.notifyInterestedStudents(classId);

    return updated;
  }

  /**
   * Enroll a student in a class
   */
  async enrollStudent(classId, studentId, paymentInfo = null) {
    return this.withTransaction(async (session) => {
      // Get class and student
      const [classItem, student] = await Promise.all([
        this.model.findById(classId).session(session),
        this.userModel.findById(studentId).session(session)
      ]);

      if (!classItem || !classItem.isActive || classItem.status !== 'published') {
        const error = new Error('Class not available for enrollment');
        error.statusCode = 400;
        throw error;
      }

      if (!student || student.role !== 'student') {
        const error = new Error('Invalid student');
        error.statusCode = 400;
        throw error;
      }

      // Check if already enrolled
      const existingEnrollment = await this.enrollmentModel.findOne({
        class: classId,
        student: studentId
      }).session(session);

      if (existingEnrollment) {
        const error = new Error('Student already enrolled in this class');
        error.statusCode = 409;
        throw error;
      }

      // Check class capacity
      const enrollmentCount = await this.enrollmentModel.countDocuments({
        class: classId,
        status: 'active'
      }).session(session);

      if (classItem.maxStudents && enrollmentCount >= classItem.maxStudents) {
        const error = new Error('Class is full');
        error.statusCode = 400;
        throw error;
      }

      // Check prerequisites
      if (classItem.prerequisites?.length > 0) {
        const hasPrerequisites = await this.checkPrerequisites(
          studentId,
          classItem.prerequisites,
          session
        );
        
        if (!hasPrerequisites) {
          const error = new Error('Prerequisites not met');
          error.statusCode = 400;
          throw error;
        }
      }

      // Create enrollment
      const enrollment = await this.enrollmentModel.create([{
        class: classId,
        student: studentId,
        enrolledAt: new Date(),
        status: 'active',
        paymentInfo
      }], { session });

      // Update class enrollment count
      await this.model.findByIdAndUpdate(
        classId,
        { $inc: { enrollmentCount: 1 } },
        { session }
      );

      // Send confirmation email
      await this.sendEnrollmentConfirmation(student, classItem);

      return enrollment[0];
    });
  }

  /**
   * Get class statistics
   */
  async getClassStats(classId, teacherId) {
    const classItem = await this.getById(classId);
    
    // Check ownership
    if (classItem.teacher.toString() !== teacherId) {
      const error = new Error('Not authorized to view class statistics');
      error.statusCode = 403;
      throw error;
    }

    const [
      enrollments,
      assignments,
      averageGrade,
      completionRate
    ] = await Promise.all([
      this.enrollmentModel.countDocuments({ class: classId, status: 'active' }),
      this.getAssignmentStats(classId),
      this.getAverageGrade(classId),
      this.getCompletionRate(classId)
    ]);

    return {
      enrollments,
      assignments,
      averageGrade,
      completionRate,
      revenue: classItem.price * enrollments
    };
  }

  /**
   * Search classes with filters
   */
  async searchClasses(searchParams) {
    const {
      query,
      category,
      level,
      priceMin,
      priceMax,
      rating,
      page = 1,
      limit = 10,
      sort = '-createdAt'
    } = searchParams;

    const filter = {
      status: 'published',
      isActive: true
    };

    // Text search
    if (query) {
      filter.$text = { $search: query };
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Level filter
    if (level) {
      filter.level = level;
    }

    // Price range filter
    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = priceMin;
      if (priceMax) filter.price.$lte = priceMax;
    }

    // Rating filter (requires aggregation)
    if (rating) {
      return this.searchWithRating(filter, rating, { page, limit, sort });
    }

    return this.getAll({ filter, page, limit, sort, populate: 'teacher' });
  }

  /**
   * Helper methods
   */
  async getEnrollmentCounts(classIds) {
    const counts = await this.enrollmentModel.aggregate([
      { $match: { class: { $in: classIds }, status: 'active' } },
      { $group: { _id: '$class', count: { $sum: 1 } } }
    ]);

    return counts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
  }

  validateForPublishing(classItem) {
    const errors = [];
    
    if (!classItem.title || classItem.title.length < 5) {
      errors.push('Title must be at least 5 characters');
    }
    
    if (!classItem.description || classItem.description.length < 50) {
      errors.push('Description must be at least 50 characters');
    }
    
    if (!classItem.syllabus || classItem.syllabus.length === 0) {
      errors.push('Syllabus is required');
    }
    
    if (!classItem.schedule || !classItem.schedule.startDate) {
      errors.push('Schedule is required');
    }
    
    return errors;
  }

  async checkPrerequisites(studentId, prerequisites, session) {
    const completedClasses = await this.enrollmentModel.find({
      student: studentId,
      class: { $in: prerequisites },
      status: 'completed'
    }).session(session);

    return completedClasses.length === prerequisites.length;
  }

  async createInitialMaterials(classId, session) {
    // Create default folders/structure for class materials
    // Implementation depends on your materials system
  }

  async notifyInterestedStudents(classId) {
    // Send notifications to students who showed interest
    // Implementation depends on your notification system
  }

  async sendEnrollmentConfirmation(student, classItem) {
    // Send email confirmation
    // Implementation depends on your email service
  }

  async getAssignmentStats(classId) {
    // Get assignment statistics
    return {
      total: 0,
      submitted: 0,
      graded: 0
    };
  }

  async getAverageGrade(classId) {
    // Calculate average grade for the class
    return 0;
  }

  async getCompletionRate(classId) {
    // Calculate completion rate
    return 0;
  }

  async searchWithRating(filter, minRating, options) {
    // Complex aggregation for rating-based search
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'class',
          as: 'reviews'
        }
      },
      {
        $addFields: {
          averageRating: { $avg: '$reviews.rating' }
        }
      },
      {
        $match: {
          averageRating: { $gte: minRating }
        }
      },
      {
        $skip: (options.page - 1) * options.limit
      },
      {
        $limit: options.limit
      }
    ];

    const results = await this.aggregate(pipeline);
    
    return {
      data: results,
      pagination: {
        page: options.page,
        limit: options.limit
      }
    };
  }
}

module.exports = ClassService;