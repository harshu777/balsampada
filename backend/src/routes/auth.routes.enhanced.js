const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Import the enhanced auth controller
const authController = require('../controllers/auth.controller.enhanced');

// Import the enhanced auth middleware
const { 
  authenticate, 
  authorize, 
  optionalAuth 
} = require('../middleware/auth.enhanced');

const { setOrganizationContext } = require('../middleware/organization');
const passport = require('../config/passport');

// Import rate limiters from security config
const { authLimiter, strictLimiter } = require('../config/security');

// Validation middleware
const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase and number'),
  body('role').optional().isIn(['student', 'teacher']).withMessage('Invalid role')
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const validatePasswordReset = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase and number')
];

// ===== Authentication Routes =====

// Register new user
router.post('/register', authLimiter, validateRegister, authController.register);

// Login
router.post('/login', authLimiter, validateLogin, authController.login);

// Refresh access token
router.post('/refresh', authController.refreshToken);

// Logout (single device)
router.post('/logout', authenticate, authController.logout);

// Logout from all devices
router.post('/logout-all', authenticate, authController.logoutAllDevices);

// ===== Session Management Routes =====

// Get all active sessions
router.get('/sessions', authenticate, authController.getSessions);

// Revoke specific session
router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);

// ===== User Profile Routes =====

// Get current user
router.get('/me', authenticate, setOrganizationContext, authController.getMe);

// Update profile
router.put('/updateprofile', authenticate, authController.updateProfile);

// Update password
router.put('/updatepassword', 
  authenticate, 
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase and number'),
  authController.updatePassword
);

// ===== Password Reset Routes =====

// Request password reset
router.post('/forgotpassword', 
  strictLimiter, 
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  authController.forgotPassword
);

// Reset password with token
router.put('/resetpassword/:resettoken', 
  strictLimiter,
  validatePasswordReset, 
  authController.resetPassword
);

// ===== Email Verification Routes =====

// Verify email with token
router.get('/verify-email/:token', authController.verifyEmail);

// Resend verification email
router.post('/resend-verification', 
  strictLimiter,
  authenticate, 
  authController.resendVerification
);

// ===== OAuth Routes =====

// Google OAuth (only if properly configured)
if (process.env.GOOGLE_CLIENT_ID && 
    process.env.GOOGLE_CLIENT_SECRET && 
    process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here') {
  
  // Initiate Google OAuth
  router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  // Google OAuth callback
  router.get('/google/callback',
    passport.authenticate('google', { 
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` 
    }),
    authController.googleCallback
  );

  // Complete profile after OAuth
  router.post('/complete-profile', 
    authenticate, 
    setOrganizationContext, 
    authController.completeProfile
  );
}

// ===== Security Check Routes =====

// Check if email is available
router.post('/check-email',
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  async (req, res) => {
    const { email } = req.body;
    const User = require('../models/User');
    const exists = await User.exists({ email });
    res.json({ 
      success: true, 
      available: !exists 
    });
  }
);

// Validate current token
router.get('/validate', authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user,
    tokenData: req.tokenData
  });
});

// Get security settings
router.get('/security', authenticate, async (req, res) => {
  const tokenService = require('../services/TokenService').getTokenService();
  const sessions = await tokenService.getUserSessions(req.user.id);
  
  res.json({
    success: true,
    security: {
      twoFactorEnabled: req.user.twoFactorEnabled || false,
      sessions: sessions.length,
      lastPasswordChange: req.user.passwordChangedAt,
      accountCreated: req.user.createdAt
    }
  });
});

module.exports = router;