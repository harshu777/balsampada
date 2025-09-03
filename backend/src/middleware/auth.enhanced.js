/**
 * Enhanced Authentication Middleware with JWT Best Practices
 */

const { getTokenService } = require('../services/TokenService');
const User = require('../models/User');

/**
 * Main authentication middleware
 */
exports.authenticate = async (req, res, next) => {
  try {
    const tokenService = getTokenService();
    let token = null;

    // Extract token from multiple sources
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }

    // Verify token
    const decoded = await tokenService.verifyAccessToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.user.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Check if user is locked
    if (user.isLocked) {
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Attach user and token info to request
    req.user = user;
    req.token = token;
    req.tokenData = decoded;

    next();
  } catch (error) {
    if (error.message === 'Access token expired') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.message === 'Token has been revoked') {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Refresh token middleware
 */
exports.refreshToken = async (req, res) => {
  try {
    const tokenService = getTokenService();
    const { refreshToken } = req.body;

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

    // Set cookies if using cookies
    if (req.cookies) {
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });
    }

    res.json({
      success: true,
      ...tokens
    });
  } catch (error) {
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

/**
 * Logout middleware
 */
exports.logout = async (req, res) => {
  try {
    const tokenService = getTokenService();
    
    // Blacklist current access token
    if (req.token) {
      await tokenService.blacklistToken(req.token);
    }

    // Revoke refresh token if provided
    if (req.body.refreshToken) {
      try {
        const decoded = await tokenService.verifyRefreshToken(req.body.refreshToken);
        await tokenService.revokeRefreshToken(decoded.user.id, decoded.tokenId);
      } catch (error) {
        // Ignore refresh token errors during logout
      }
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
};

/**
 * Logout from all devices
 */
exports.logoutAllDevices = async (req, res) => {
  try {
    const tokenService = getTokenService();
    
    // Revoke all user tokens
    await tokenService.revokeAllUserTokens(req.user.id);

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

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

/**
 * Get active sessions
 */
exports.getSessions = async (req, res) => {
  try {
    const tokenService = getTokenService();
    const sessions = await tokenService.getUserSessions(req.user.id);

    res.json({
      success: true,
      sessions: sessions.map(session => ({
        id: session.tokenId,
        createdAt: session.createdAt,
        lastUsed: session.lastUsed,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress
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

/**
 * Revoke specific session
 */
exports.revokeSession = async (req, res) => {
  try {
    const tokenService = getTokenService();
    const { sessionId } = req.params;

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

/**
 * Role-based authorization middleware
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized for this resource`,
        code: 'INSUFFICIENT_PRIVILEGES'
      });
    }

    next();
  };
};

/**
 * Optional authentication (doesn't fail if no token)
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const tokenService = getTokenService();
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = await tokenService.verifyAccessToken(token);
      const user = await User.findById(decoded.user.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
        req.token = token;
        req.tokenData = decoded;
      }
    }
  } catch (error) {
    // Ignore errors for optional auth
  }

  next();
};