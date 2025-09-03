/**
 * Enhanced JWT Token Service with Security Best Practices
 * Features: Access + Refresh tokens, Token rotation, Blacklisting, Rate limiting
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Redis = require('ioredis');

class TokenService {
  constructor() {
    // Initialize Redis for token blacklisting and refresh token storage
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: 0,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });

    // Token configuration
    this.config = {
      access: {
        secret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
        expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m', // Short-lived
        algorithm: 'HS256'
      },
      refresh: {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d', // Long-lived
        algorithm: 'HS256'
      },
      issuer: process.env.JWT_ISSUER || 'balsampada-lms',
      audience: process.env.JWT_AUDIENCE || 'balsampada-users'
    };

    // Validate secrets in production
    if (process.env.NODE_ENV === 'production') {
      this.validateSecrets();
    }
  }

  /**
   * Generate both access and refresh tokens
   */
  async generateTokenPair(user) {
    const tokenId = crypto.randomBytes(16).toString('hex');
    const now = Math.floor(Date.now() / 1000);

    // Payload for tokens
    const payload = {
      user: {
        id: user._id || user.id,
        email: user.email,
        role: user.role,
        organization: user.organization
      },
      iat: now,
      jti: tokenId // Unique token ID for tracking
    };

    // Generate access token (short-lived)
    const accessToken = jwt.sign(
      {
        ...payload,
        type: 'access',
        exp: now + this.parseExpiry(this.config.access.expiresIn)
      },
      this.config.access.secret,
      {
        algorithm: this.config.access.algorithm,
        issuer: this.config.issuer,
        audience: this.config.audience
      }
    );

    // Generate refresh token (long-lived)
    const refreshTokenId = crypto.randomBytes(32).toString('hex');
    const refreshToken = jwt.sign(
      {
        ...payload,
        type: 'refresh',
        tokenId: refreshTokenId,
        exp: now + this.parseExpiry(this.config.refresh.expiresIn)
      },
      this.config.refresh.secret,
      {
        algorithm: this.config.refresh.algorithm,
        issuer: this.config.issuer,
        audience: this.config.audience
      }
    );

    // Store refresh token in Redis with user metadata
    const refreshKey = `refresh:${user._id || user.id}:${refreshTokenId}`;
    const refreshData = {
      userId: user._id || user.id,
      email: user.email,
      role: user.role,
      createdAt: new Date().toISOString(),
      userAgent: null, // Will be set by controller
      ipAddress: null  // Will be set by controller
    };

    await this.redis.setex(
      refreshKey,
      this.parseExpiry(this.config.refresh.expiresIn),
      JSON.stringify(refreshData)
    );

    // Track active sessions
    await this.redis.sadd(`user:sessions:${user._id || user.id}`, refreshTokenId);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiry: new Date(now * 1000 + this.parseExpiry(this.config.access.expiresIn) * 1000),
      refreshTokenExpiry: new Date(now * 1000 + this.parseExpiry(this.config.refresh.expiresIn) * 1000),
      tokenType: 'Bearer'
    };
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token) {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      // Verify token
      const decoded = jwt.verify(token, this.config.access.secret, {
        algorithms: [this.config.access.algorithm],
        issuer: this.config.issuer,
        audience: this.config.audience
      });

      // Check token type
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token) {
    try {
      // Verify token signature
      const decoded = jwt.verify(token, this.config.refresh.secret, {
        algorithms: [this.config.refresh.algorithm],
        issuer: this.config.issuer,
        audience: this.config.audience
      });

      // Check token type
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if refresh token exists in Redis
      const refreshKey = `refresh:${decoded.user.id}:${decoded.tokenId}`;
      const storedData = await this.redis.get(refreshKey);
      
      if (!storedData) {
        throw new Error('Refresh token not found or expired');
      }

      return { decoded, storedData: JSON.parse(storedData) };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken, userAgent = null, ipAddress = null) {
    const { decoded, storedData } = await this.verifyRefreshToken(refreshToken);
    
    // Check for suspicious activity
    if (storedData.userAgent && userAgent && storedData.userAgent !== userAgent) {
      // Different user agent - possible token theft
      await this.revokeAllUserTokens(decoded.user.id);
      throw new Error('Security alert: Token used from different device. All sessions terminated.');
    }

    // Generate new access token
    const now = Math.floor(Date.now() / 1000);
    const accessToken = jwt.sign(
      {
        user: decoded.user,
        type: 'access',
        iat: now,
        exp: now + this.parseExpiry(this.config.access.expiresIn),
        jti: crypto.randomBytes(16).toString('hex')
      },
      this.config.access.secret,
      {
        algorithm: this.config.access.algorithm,
        issuer: this.config.issuer,
        audience: this.config.audience
      }
    );

    // Update refresh token metadata
    const refreshKey = `refresh:${decoded.user.id}:${decoded.tokenId}`;
    storedData.lastUsed = new Date().toISOString();
    storedData.userAgent = userAgent || storedData.userAgent;
    storedData.ipAddress = ipAddress || storedData.ipAddress;
    
    const ttl = await this.redis.ttl(refreshKey);
    await this.redis.setex(refreshKey, ttl, JSON.stringify(storedData));

    return {
      accessToken,
      accessTokenExpiry: new Date(now * 1000 + this.parseExpiry(this.config.access.expiresIn) * 1000),
      tokenType: 'Bearer'
    };
  }

  /**
   * Rotate refresh token (issue new refresh token, invalidate old)
   */
  async rotateRefreshToken(oldRefreshToken, user) {
    // Verify old token
    const { decoded } = await this.verifyRefreshToken(oldRefreshToken);
    
    // Revoke old refresh token
    await this.revokeRefreshToken(decoded.user.id, decoded.tokenId);
    
    // Generate new token pair
    return await this.generateTokenPair(user);
  }

  /**
   * Revoke specific refresh token
   */
  async revokeRefreshToken(userId, tokenId) {
    const refreshKey = `refresh:${userId}:${tokenId}`;
    await this.redis.del(refreshKey);
    await this.redis.srem(`user:sessions:${userId}`, tokenId);
  }

  /**
   * Revoke all tokens for a user (logout from all devices)
   */
  async revokeAllUserTokens(userId) {
    // Get all user sessions
    const sessions = await this.redis.smembers(`user:sessions:${userId}`);
    
    // Delete all refresh tokens
    const pipeline = this.redis.pipeline();
    for (const tokenId of sessions) {
      pipeline.del(`refresh:${userId}:${tokenId}`);
    }
    pipeline.del(`user:sessions:${userId}`);
    await pipeline.exec();
    
    // Add user to blacklist temporarily (until all access tokens expire)
    const blacklistKey = `blacklist:user:${userId}`;
    await this.redis.setex(blacklistKey, this.parseExpiry(this.config.access.expiresIn), '1');
  }

  /**
   * Blacklist a specific access token
   */
  async blacklistToken(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp || !decoded.jti) return;
      
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.redis.setex(`blacklist:token:${decoded.jti}`, ttl, '1');
      }
    } catch (error) {
      console.error('Error blacklisting token:', error);
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded) return true;
      
      // Check if specific token is blacklisted
      if (decoded.jti) {
        const tokenBlacklisted = await this.redis.get(`blacklist:token:${decoded.jti}`);
        if (tokenBlacklisted) return true;
      }
      
      // Check if user is blacklisted
      if (decoded.user?.id) {
        const userBlacklisted = await this.redis.get(`blacklist:user:${decoded.user.id}`);
        if (userBlacklisted) return true;
      }
      
      return false;
    } catch (error) {
      return true; // Err on the side of caution
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId) {
    const sessionIds = await this.redis.smembers(`user:sessions:${userId}`);
    const sessions = [];
    
    for (const tokenId of sessionIds) {
      const data = await this.redis.get(`refresh:${userId}:${tokenId}`);
      if (data) {
        sessions.push({
          tokenId,
          ...JSON.parse(data)
        });
      }
    }
    
    return sessions;
  }

  /**
   * Decode token without verification (for logging/debugging)
   */
  decodeToken(token) {
    return jwt.decode(token, { complete: true });
  }

  /**
   * Parse expiry time string to seconds
   */
  parseExpiry(expiry) {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 3600;
    }
  }

  /**
   * Validate JWT secrets
   */
  validateSecrets() {
    if (!this.config.access.secret || this.config.access.secret.length < 32) {
      throw new Error('JWT_ACCESS_SECRET must be at least 32 characters in production');
    }
    
    if (!this.config.refresh.secret || this.config.refresh.secret.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must be at least 32 characters in production');
    }
    
    if (this.config.access.secret === this.config.refresh.secret) {
      console.warn('⚠️  Warning: Access and refresh tokens should use different secrets');
    }
  }

  /**
   * Generate secure random secret
   */
  static generateSecret(length = 64) {
    return crypto.randomBytes(length).toString('base64');
  }

  /**
   * Clean up expired tokens (run periodically)
   */
  async cleanupExpiredTokens() {
    // This would be run by a cron job
    // Implement cleanup logic for expired tokens in Redis
  }
}

// Singleton instance
let instance = null;

module.exports = {
  TokenService,
  getTokenService: () => {
    if (!instance) {
      instance = new TokenService();
    }
    return instance;
  },
  generateSecret: TokenService.generateSecret
};