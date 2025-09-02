const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    maxlength: [100, 'Organization name cannot exceed 100 characters']
  },
  subdomain: {
    type: String,
    required: [true, 'Subdomain is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'],
    minlength: [3, 'Subdomain must be at least 3 characters'],
    maxlength: [30, 'Subdomain cannot exceed 30 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'pro', 'enterprise'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'cancelled'],
    default: 'active'
  },
  subscription: {
    razorpayCustomerId: String,
    razorpaySubscriptionId: String,
    razorpayPlanId: String,
    currentPeriodEnd: Date,
    trialEndsAt: Date,
    paymentMethod: String,
    lastPaymentId: String,
    lastPaymentAmount: Number,
    lastPaymentDate: Date
  },
  limits: {
    maxStudents: {
      type: Number,
      default: 10 // Free plan default
    },
    maxTeachers: {
      type: Number,
      default: 1 // Free plan default
    },
    maxStorage: {
      type: Number,
      default: 1024 * 1024 * 1024 // 1GB in bytes
    },
    maxLiveClassHours: {
      type: Number,
      default: 10 // Hours per month
    }
  },
  usage: {
    currentStudents: {
      type: Number,
      default: 0
    },
    currentTeachers: {
      type: Number,
      default: 0
    },
    currentStorage: {
      type: Number,
      default: 0
    },
    liveClassHoursThisMonth: {
      type: Number,
      default: 0
    }
  },
  settings: {
    logo: String,
    primaryColor: {
      type: String,
      default: '#3B82F6'
    },
    secondaryColor: {
      type: String,
      default: '#10B981'
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    language: {
      type: String,
      default: 'en'
    },
    features: {
      assignments: {
        type: Boolean,
        default: true
      },
      liveClasses: {
        type: Boolean,
        default: true
      },
      studentGroups: {
        type: Boolean,
        default: true
      },
      parentPortal: {
        type: Boolean,
        default: false
      },
      advancedAnalytics: {
        type: Boolean,
        default: false
      },
      customBranding: {
        type: Boolean,
        default: false
      }
    }
  },
  billing: {
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    },
    taxId: String,
    invoiceEmails: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
// Index already created by unique: true on subdomain field
// organizationSchema.index({ subdomain: 1 });
organizationSchema.index({ owner: 1 });
organizationSchema.index({ status: 1 });
organizationSchema.index({ 'subscription.currentPeriodEnd': 1 });

// Plan limits configuration
const PLAN_LIMITS = {
  free: {
    maxStudents: 10,
    maxTeachers: 1,
    maxStorage: 1024 * 1024 * 1024, // 1GB
    maxLiveClassHours: 10,
    features: {
      assignments: true,
      liveClasses: true,
      studentGroups: true,
      parentPortal: false,
      advancedAnalytics: false,
      customBranding: false
    }
  },
  basic: {
    maxStudents: 50,
    maxTeachers: 3,
    maxStorage: 5 * 1024 * 1024 * 1024, // 5GB
    maxLiveClassHours: 50,
    features: {
      assignments: true,
      liveClasses: true,
      studentGroups: true,
      parentPortal: true,
      advancedAnalytics: false,
      customBranding: false
    }
  },
  pro: {
    maxStudents: 200,
    maxTeachers: 10,
    maxStorage: 20 * 1024 * 1024 * 1024, // 20GB
    maxLiveClassHours: 200,
    features: {
      assignments: true,
      liveClasses: true,
      studentGroups: true,
      parentPortal: true,
      advancedAnalytics: true,
      customBranding: true
    }
  },
  enterprise: {
    maxStudents: -1, // Unlimited
    maxTeachers: -1, // Unlimited
    maxStorage: -1, // Unlimited
    maxLiveClassHours: -1, // Unlimited
    features: {
      assignments: true,
      liveClasses: true,
      studentGroups: true,
      parentPortal: true,
      advancedAnalytics: true,
      customBranding: true
    }
  }
};

// Update limits when plan changes
organizationSchema.pre('save', function(next) {
  if (this.isModified('plan')) {
    const planLimits = PLAN_LIMITS[this.plan];
    this.limits = { ...planLimits };
    this.settings.features = { ...planLimits.features };
  }
  next();
});

// Instance methods
organizationSchema.methods.canAddStudent = function() {
  if (this.limits.maxStudents === -1) return true;
  return this.usage.currentStudents < this.limits.maxStudents;
};

organizationSchema.methods.canAddTeacher = function() {
  if (this.limits.maxTeachers === -1) return true;
  return this.usage.currentTeachers < this.limits.maxTeachers;
};

organizationSchema.methods.hasFeature = function(feature) {
  return this.settings.features[feature] === true;
};

organizationSchema.methods.isTrialActive = function() {
  if (!this.subscription.trialEndsAt) return false;
  return new Date() < this.subscription.trialEndsAt;
};

organizationSchema.methods.isSubscriptionActive = function() {
  if (this.plan === 'free') return true;
  if (this.isTrialActive()) return true;
  if (!this.subscription.currentPeriodEnd) return false;
  return new Date() < this.subscription.currentPeriodEnd;
};

// Static methods
organizationSchema.statics.findBySubdomain = function(subdomain) {
  return this.findOne({ subdomain: subdomain.toLowerCase(), status: 'active' });
};

organizationSchema.statics.incrementUsage = async function(organizationId, field, amount = 1) {
  return this.findByIdAndUpdate(
    organizationId,
    { $inc: { [`usage.${field}`]: amount } },
    { new: true }
  );
};

organizationSchema.statics.decrementUsage = async function(organizationId, field, amount = 1) {
  return this.findByIdAndUpdate(
    organizationId,
    { $inc: { [`usage.${field}`]: -amount } },
    { new: true }
  );
};

module.exports = mongoose.model('Organization', organizationSchema);