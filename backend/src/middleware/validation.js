const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const userValidation = {
  register: [
    body('name').trim().notEmpty().withMessage('Name is required')
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').trim().isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
      .matches(/\d/).withMessage('Password must contain at least one number'),
    body('role').optional().isIn(['student', 'teacher', 'admin']).withMessage('Invalid role'),
    handleValidationErrors
  ],
  
  login: [
    body('email').trim().isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
  ],
  
  updateProfile: [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').optional().trim().isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('bio').optional().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
    handleValidationErrors
  ],
  
  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
      .matches(/\d/).withMessage('Password must contain at least one number'),
    handleValidationErrors
  ]
};

// Class validation rules
const classValidation = {
  create: [
    body('title').trim().notEmpty().withMessage('Title is required')
      .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
    body('description').trim().notEmpty().withMessage('Description is required')
      .isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('level').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid level'),
    body('price').optional().isNumeric().withMessage('Price must be a number')
      .custom((value) => value >= 0).withMessage('Price cannot be negative'),
    body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
    body('maxStudents').optional().isInt({ min: 1, max: 1000 }).withMessage('Max students must be between 1 and 1000'),
    handleValidationErrors
  ],
  
  update: [
    param('id').isMongoId().withMessage('Invalid class ID'),
    body('title').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
    body('description').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
    body('level').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid level'),
    body('price').optional().isNumeric().withMessage('Price must be a number')
      .custom((value) => value >= 0).withMessage('Price cannot be negative'),
    handleValidationErrors
  ]
};

// Assignment validation rules
const assignmentValidation = {
  create: [
    body('title').trim().notEmpty().withMessage('Title is required')
      .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('dueDate').optional().isISO8601().withMessage('Invalid due date format'),
    body('maxScore').optional().isInt({ min: 0 }).withMessage('Max score must be a positive number'),
    body('visibility').optional().isIn(['enrolled', 'specific']).withMessage('Invalid visibility'),
    body('specificStudents').optional().isArray().withMessage('Specific students must be an array'),
    handleValidationErrors
  ],
  
  submit: [
    param('id').isMongoId().withMessage('Invalid assignment ID'),
    body('content').optional().trim().notEmpty().withMessage('Content is required'),
    body('files').optional().isArray().withMessage('Files must be an array'),
    handleValidationErrors
  ],
  
  grade: [
    param('id').isMongoId().withMessage('Invalid assignment ID'),
    body('studentId').isMongoId().withMessage('Invalid student ID'),
    body('score').isNumeric().withMessage('Score must be a number')
      .custom((value) => value >= 0).withMessage('Score cannot be negative'),
    body('feedback').optional().isString().withMessage('Feedback must be a string'),
    handleValidationErrors
  ]
};

// Enrollment validation rules
const enrollmentValidation = {
  enroll: [
    body('classId').isMongoId().withMessage('Invalid class ID'),
    handleValidationErrors
  ],
  
  updateStatus: [
    param('id').isMongoId().withMessage('Invalid enrollment ID'),
    body('status').isIn(['active', 'completed', 'dropped', 'suspended']).withMessage('Invalid status'),
    handleValidationErrors
  ]
};

// Group validation rules
const groupValidation = {
  create: [
    body('name').trim().notEmpty().withMessage('Group name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Group name must be between 2 and 50 characters'),
    body('description').optional().trim().isLength({ max: 200 }).withMessage('Description must be less than 200 characters'),
    body('classId').isMongoId().withMessage('Invalid class ID'),
    body('students').optional().isArray().withMessage('Students must be an array'),
    body('students.*').optional().isMongoId().withMessage('Invalid student ID'),
    handleValidationErrors
  ],
  
  update: [
    param('id').isMongoId().withMessage('Invalid group ID'),
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Group name must be between 2 and 50 characters'),
    body('description').optional().trim().isLength({ max: 200 }).withMessage('Description must be less than 200 characters'),
    handleValidationErrors
  ],
  
  addStudents: [
    param('id').isMongoId().withMessage('Invalid group ID'),
    body('students').isArray({ min: 1 }).withMessage('Students array is required'),
    body('students.*').isMongoId().withMessage('Invalid student ID'),
    handleValidationErrors
  ],
  
  removeStudent: [
    param('id').isMongoId().withMessage('Invalid group ID'),
    param('studentId').isMongoId().withMessage('Invalid student ID'),
    handleValidationErrors
  ]
};

// Common validation rules
const commonValidation = {
  mongoId: (paramName = 'id') => [
    param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
    handleValidationErrors
  ],
  
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sort').optional().isString().withMessage('Sort must be a string'),
    handleValidationErrors
  ]
};

module.exports = {
  userValidation,
  classValidation,
  assignmentValidation,
  enrollmentValidation,
  groupValidation,
  commonValidation,
  handleValidationErrors
};