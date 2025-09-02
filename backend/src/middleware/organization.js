const Organization = require('../models/Organization');
const User = require('../models/User');

// Middleware to set organization context
exports.setOrganizationContext = async (req, res, next) => {
  try {
    // Skip for auth routes
    if (req.path.includes('/auth/')) {
      return next();
    }

    if (!req.user) {
      return next();
    }

    // Get user with organization
    const user = await User.findById(req.user.id).populate('organization');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // For owners, get their organization
    if (user.role === 'owner') {
      const organization = await Organization.findOne({ owner: user._id });
      if (!organization) {
        return res.status(400).json({
          success: false,
          message: 'Organization not found for owner'
        });
      }
      req.organization = organization;
      req.organizationId = organization._id;
    } else if (user.organization) {
      // For other users, use their assigned organization
      req.organization = user.organization;
      req.organizationId = user.organization._id;
    } else {
      // User has no organization
      return res.status(400).json({
        success: false,
        message: 'User is not associated with any organization'
      });
    }

    // Check if organization is active
    if (req.organization.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Organization is not active'
      });
    }

    // Check subscription status
    if (!req.organization.isSubscriptionActive()) {
      return res.status(403).json({
        success: false,
        message: 'Organization subscription has expired'
      });
    }

    next();
  } catch (error) {
    console.error('Organization context error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting organization context'
    });
  }
};

// Middleware to check organization limits
exports.checkOrganizationLimits = (resource) => {
  return async (req, res, next) => {
    try {
      if (!req.organization) {
        return res.status(400).json({
          success: false,
          message: 'Organization context not set'
        });
      }

      const org = req.organization;

      switch(resource) {
        case 'student':
          if (!org.canAddStudent()) {
            return res.status(403).json({
              success: false,
              message: `Student limit reached. Upgrade to add more students. Current limit: ${org.limits.maxStudents}`
            });
          }
          break;

        case 'teacher':
          if (!org.canAddTeacher()) {
            return res.status(403).json({
              success: false,
              message: `Teacher limit reached. Upgrade to add more teachers. Current limit: ${org.limits.maxTeachers}`
            });
          }
          break;

        case 'storage':
          // Check storage limit
          if (org.limits.maxStorage !== -1 && org.usage.currentStorage >= org.limits.maxStorage) {
            return res.status(403).json({
              success: false,
              message: 'Storage limit reached. Please upgrade your plan.'
            });
          }
          break;

        case 'liveClass':
          // Check live class hours limit
          if (org.limits.maxLiveClassHours !== -1 && 
              org.usage.liveClassHoursThisMonth >= org.limits.maxLiveClassHours) {
            return res.status(403).json({
              success: false,
              message: `Monthly live class hours limit reached (${org.limits.maxLiveClassHours} hours). Please upgrade your plan.`
            });
          }
          break;
      }

      next();
    } catch (error) {
      console.error('Limit check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking organization limits'
      });
    }
  };
};

// Middleware to check feature access
exports.requireFeature = (feature) => {
  return (req, res, next) => {
    if (!req.organization) {
      return res.status(400).json({
        success: false,
        message: 'Organization context not set'
      });
    }

    if (!req.organization.hasFeature(feature)) {
      return res.status(403).json({
        success: false,
        message: `This feature (${feature}) is not available in your current plan. Please upgrade to access this feature.`
      });
    }

    next();
  };
};

// Extract organization from subdomain
exports.extractOrganizationFromSubdomain = async (req, res, next) => {
  try {
    // Get subdomain from host
    const host = req.get('host');
    const subdomain = host.split('.')[0];

    // Skip for localhost or main domain
    if (subdomain === 'localhost' || subdomain === 'www' || subdomain === 'balsampada') {
      return next();
    }

    // Find organization by subdomain
    const organization = await Organization.findBySubdomain(subdomain);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    req.organizationFromSubdomain = organization;
    next();
  } catch (error) {
    console.error('Subdomain extraction error:', error);
    next(); // Continue without subdomain organization
  }
};