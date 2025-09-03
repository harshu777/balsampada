const crypto = require('crypto');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/sendEmail');
const { getTokenService } = require('../services/TokenService');

/**
 * Send token response with both access and refresh tokens
 */
const sendTokenResponse = async (user, statusCode, res, req) => {
  try {
    const tokenService = getTokenService();
    
    // Generate token pair
    const tokens = await tokenService.generateTokenPair(user);
    
    // Cookie options
    const accessCookieOptions = {
      expires: new Date(tokens.accessTokenExpiry),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };
    
    const refreshCookieOptions = {
      expires: new Date(tokens.refreshTokenExpiry),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };
    
    // Store device info with refresh token
    if (req) {
      const refreshKey = `refresh:${user._id}:*`;
      // This is handled in TokenService, but we can add user agent here
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.connection.remoteAddress;
      // Update the refresh token metadata
      // This would be done in a more sophisticated way in production
    }
    
    res
      .status(statusCode)
      .cookie('accessToken', tokens.accessToken, accessCookieOptions)
      .cookie('refreshToken', tokens.refreshToken, refreshCookieOptions)
      .json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        },
        tokens: {
          access: {
            token: tokens.accessToken,
            expiresAt: tokens.accessTokenExpiry
          },
          refresh: {
            token: tokens.refreshToken,
            expiresAt: tokens.refreshTokenExpiry
          },
          tokenType: tokens.tokenType
        }
      });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating authentication tokens'
    });
  }
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password, role = 'student', phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone
    });

    const verifyToken = crypto.randomBytes(20).toString('hex');
    user.emailVerificationToken = crypto
      .createHash('sha256')
      .update(verifyToken)
      .digest('hex');
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Email Verification - Balsampada LMS',
        message: `Welcome to Balsampada LMS! Please verify your email by clicking: ${verifyUrl}`
      });
    } catch (err) {
      console.error('Email send error:', err);
    }

    await sendTokenResponse(user, 201, res, req);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user account'
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is locked due to too many failed login attempts'
      });
    }

    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    await user.resetLoginAttempts();
    user.lastLogin = Date.now();
    await user.save();

    await sendTokenResponse(user, 200, res, req);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login'
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const tokenService = getTokenService();
    const { refreshToken } = req.body;

    if (!refreshToken && req.cookies.refreshToken) {
      refreshToken = req.cookies.refreshToken;
    }

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Get user agent and IP for security checks
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Refresh the access token
    const tokens = await tokenService.refreshAccessToken(refreshToken, userAgent, ipAddress);

    // Set new access token cookie
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.json({
      success: true,
      accessToken: tokens.accessToken,
      accessTokenExpiry: tokens.accessTokenExpiry,
      tokenType: tokens.tokenType
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error.message.includes('Security alert')) {
      return res.status(401).json({
        success: false,
        message: error.message,
        code: 'SECURITY_ALERT'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const tokenService = getTokenService();
    
    // Get tokens from cookies or body
    const accessToken = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    
    // Blacklist current access token
    if (accessToken) {
      await tokenService.blacklistToken(accessToken);
    }

    // Revoke refresh token if provided
    if (refreshToken && req.user) {
      try {
        const decoded = await tokenService.verifyRefreshToken(refreshToken);
        await tokenService.revokeRefreshToken(req.user.id, decoded.tokenId);
      } catch (error) {
        // Ignore refresh token errors during logout
      }
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('token'); // Clear old token cookie if exists

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear cookies even if there's an error
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('token');
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
};

exports.logoutAllDevices = async (req, res) => {
  try {
    const tokenService = getTokenService();
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Revoke all user tokens
    await tokenService.revokeAllUserTokens(req.user.id);

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('token');

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const tokenService = getTokenService();
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const sessions = await tokenService.getUserSessions(req.user.id);

    res.json({
      success: true,
      sessions: sessions.map(session => ({
        id: session.tokenId,
        createdAt: session.createdAt,
        lastUsed: session.lastUsed,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        current: false // Could be determined by comparing with current token
      }))
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sessions'
    });
  }
};

exports.revokeSession = async (req, res) => {
  try {
    const tokenService = getTokenService();
    const { sessionId } = req.params;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    await tokenService.revokeRefreshToken(req.user.id, sessionId);

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error revoking session'
    });
  }
};

exports.getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email'
      });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you have requested a password reset. Please click on the following link to reset your password: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Token',
        message
      });

      res.status(200).json({
        success: true,
        message: 'Email sent successfully'
      });
    } catch (err) {
      console.error('Email send error:', err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Revoke all existing tokens for security
    const tokenService = getTokenService();
    await tokenService.revokeAllUserTokens(user._id);

    await sendTokenResponse(user, 200, res, req);
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Add missing methods from original controller
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
      bio: req.body.bio,
      avatar: req.body.avatar
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    
    const isPasswordMatch = await user.matchPassword(req.body.currentPassword);
    
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    // Revoke all tokens for security
    const tokenService = getTokenService();
    await tokenService.revokeAllUserTokens(user._id);

    await sendTokenResponse(user, 200, res, req);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating password'
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying email'
    });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    const verifyToken = crypto.randomBytes(20).toString('hex');
    user.emailVerificationToken = crypto
      .createHash('sha256')
      .update(verifyToken)
      .digest('hex');
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Email Verification - Balsampada LMS',
        message: `Please verify your email by clicking: ${verifyUrl}`
      });
      
      res.status(200).json({
        success: true,
        message: 'Verification email sent'
      });
    } catch (err) {
      console.error('Email send error:', err);
      res.status(500).json({
        success: false,
        message: 'Error sending verification email'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resending verification'
    });
  }
};

exports.googleCallback = async (req, res) => {
  try {
    await sendTokenResponse(req.user, 200, res, req);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};

exports.completeProfile = async (req, res) => {
  try {
    const { role, phone, organization } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        role,
        phone,
        organization,
        profileIncomplete: false
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completing profile'
    });
  }
};

module.exports = exports;