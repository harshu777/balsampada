const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const organizationController = require('../controllers/organization.controller');
const { protect, authorize } = require('../middleware/auth');
const { setOrganizationContext } = require('../middleware/organization');

// Validation rules
const createOrgValidation = [
  body('organizationName')
    .notEmpty().withMessage('Organization name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Organization name must be 3-100 characters'),
  body('subdomain')
    .notEmpty().withMessage('Subdomain is required')
    .matches(/^[a-z0-9-]+$/).withMessage('Subdomain can only contain lowercase letters, numbers, and hyphens')
    .isLength({ min: 3, max: 30 }).withMessage('Subdomain must be 3-30 characters'),
  body('ownerName')
    .notEmpty().withMessage('Owner name is required'),
  body('ownerEmail')
    .isEmail().withMessage('Valid email is required'),
  body('ownerPassword')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const inviteUserValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('role').isIn(['student', 'teacher', 'admin']).withMessage('Valid role is required')
];

// Public routes (no auth required)
router.post('/signup', createOrgValidation, organizationController.createOrganization);

// Protected routes (require authentication and organization context)
router.use(protect);
router.use(setOrganizationContext);

// Organization management
router.get('/current', organizationController.getOrganization);
router.put('/current', authorize('owner', 'admin'), organizationController.updateOrganization);
router.get('/stats', organizationController.getOrganizationStats);

// User management
router.get('/users', authorize('owner', 'admin', 'teacher'), organizationController.getOrganizationUsers);
router.post('/users/invite', authorize('owner', 'admin'), inviteUserValidation, organizationController.inviteUser);
router.delete('/users/:userId', authorize('owner', 'admin'), organizationController.removeUser);

module.exports = router;