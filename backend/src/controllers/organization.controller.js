const Organization = require('../models/Organization');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// Create new organization (signup flow)
exports.createOrganization = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { 
      organizationName,
      subdomain,
      ownerName,
      ownerEmail,
      ownerPassword,
      plan = 'free'
    } = req.body;

    // Check if subdomain is already taken
    const existingOrg = await Organization.findOne({ subdomain: subdomain.toLowerCase() });
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        message: 'This subdomain is already taken'
      });
    }

    // Check if email is already registered
    const existingUser = await User.findOne({ email: ownerEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(ownerPassword, 10);

    // Create owner user
    const owner = await User.create({
      name: ownerName,
      email: ownerEmail.toLowerCase(),
      password: hashedPassword,
      role: 'owner',
      isEmailVerified: false
    });

    // Create organization
    const organization = await Organization.create({
      name: organizationName,
      subdomain: subdomain.toLowerCase(),
      owner: owner._id,
      plan: plan,
      status: 'active',
      subscription: {
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 day trial
      }
    });

    // Update owner with organization
    owner.organization = organization._id;
    await owner.save();

    // Increment usage
    await Organization.incrementUsage(organization._id, 'currentTeachers', 1);

    // Generate JWT token
    const token = owner.getSignedJwtToken();

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: {
        organization: {
          id: organization._id,
          name: organization.name,
          subdomain: organization.subdomain,
          plan: organization.plan
        },
        owner: {
          id: owner._id,
          name: owner.name,
          email: owner.email,
          role: owner.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Organization creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating organization'
    });
  }
};

// Get organization details
exports.getOrganization = async (req, res) => {
  try {
    const organization = await Organization.findById(req.organizationId)
      .populate('owner', 'name email');

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    res.json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching organization'
    });
  }
};

// Update organization settings
exports.updateOrganization = async (req, res) => {
  try {
    // Only owners can update organization
    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only organization owners can update settings'
      });
    }

    const updates = req.body;
    
    // Prevent updating critical fields
    delete updates.owner;
    delete updates.plan;
    delete updates.subscription;
    delete updates.subdomain;
    delete updates.status;

    const organization = await Organization.findByIdAndUpdate(
      req.organizationId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Organization updated successfully',
      data: organization
    });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating organization'
    });
  }
};

// Get organization statistics
exports.getOrganizationStats = async (req, res) => {
  try {
    const organization = await Organization.findById(req.organizationId);
    
    const stats = {
      plan: organization.plan,
      limits: organization.limits,
      usage: organization.usage,
      subscription: {
        status: organization.isSubscriptionActive() ? 'active' : 'expired',
        trialActive: organization.isTrialActive(),
        trialEndsAt: organization.subscription.trialEndsAt,
        currentPeriodEnd: organization.subscription.currentPeriodEnd
      },
      percentages: {
        students: organization.limits.maxStudents === -1 ? 0 : 
          Math.round((organization.usage.currentStudents / organization.limits.maxStudents) * 100),
        teachers: organization.limits.maxTeachers === -1 ? 0 :
          Math.round((organization.usage.currentTeachers / organization.limits.maxTeachers) * 100),
        storage: organization.limits.maxStorage === -1 ? 0 :
          Math.round((organization.usage.currentStorage / organization.limits.maxStorage) * 100),
        liveClassHours: organization.limits.maxLiveClassHours === -1 ? 0 :
          Math.round((organization.usage.liveClassHoursThisMonth / organization.limits.maxLiveClassHours) * 100)
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
};

// Invite user to organization
exports.inviteUser = async (req, res) => {
  try {
    const { email, name, role } = req.body;

    // Check limits based on role
    if (role === 'teacher') {
      const org = await Organization.findById(req.organizationId);
      if (!org.canAddTeacher()) {
        return res.status(403).json({
          success: false,
          message: `Teacher limit reached. Current limit: ${org.limits.maxTeachers}`
        });
      }
    } else if (role === 'student') {
      const org = await Organization.findById(req.organizationId);
      if (!org.canAddStudent()) {
        return res.status(403).json({
          success: false,
          message: `Student limit reached. Current limit: ${org.limits.maxStudents}`
        });
      }
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      if (user.organization && user.organization.toString() === req.organizationId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'User is already part of this organization'
        });
      }
      
      // Update existing user
      user.organization = req.organizationId;
      await user.save();
    } else {
      // Create new user with temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        organization: req.organizationId,
        isEmailVerified: false
      });

      // Email sending disabled for local development
      // In production, send invitation email with temp password
      console.log(`[LOCAL DEV] Would send invitation email to ${email} with password: ${tempPassword}`);
    }

    // Update organization usage
    if (role === 'teacher') {
      await Organization.incrementUsage(req.organizationId, 'currentTeachers', 1);
    } else if (role === 'student') {
      await Organization.incrementUsage(req.organizationId, 'currentStudents', 1);
    }

    res.json({
      success: true,
      message: `User invited successfully`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error inviting user'
    });
  }
};

// Get organization users
exports.getOrganizationUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    
    const query = { organization: req.organizationId };
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort('-createdAt');

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};

// Remove user from organization
exports.removeUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Cannot remove organization owner'
      });
    }

    // Update usage
    if (user.role === 'teacher') {
      await Organization.decrementUsage(req.organizationId, 'currentTeachers', 1);
    } else if (user.role === 'student') {
      await Organization.decrementUsage(req.organizationId, 'currentStudents', 1);
    }

    // Remove user from organization
    user.organization = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'User removed from organization'
    });
  } catch (error) {
    console.error('Remove user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing user'
    });
  }
};

module.exports = exports;