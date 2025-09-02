const Organization = require('../models/Organization');
const User = require('../models/User');
const RazorpayService = require('../services/razorpayService');
const { validationResult } = require('express-validator');

// Get available subscription plans
exports.getPlans = (req, res) => {
  try {
    const plans = RazorpayService.getAllPlans();
    
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription plans'
    });
  }
};

// Get current subscription details
exports.getCurrentSubscription = async (req, res) => {
  try {
    const organization = await Organization.findById(req.organizationId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    let subscriptionDetails = null;
    if (organization.subscription.razorpaySubscriptionId) {
      try {
        subscriptionDetails = await RazorpayService.getSubscription(
          organization.subscription.razorpaySubscriptionId
        );
      } catch (error) {
        console.log('Could not fetch Razorpay subscription:', error.message);
      }
    }

    const planDetails = RazorpayService.getPlanDetails(organization.plan);

    res.json({
      success: true,
      data: {
        plan: organization.plan,
        planDetails: planDetails,
        subscription: {
          status: organization.status,
          trialEndsAt: organization.subscription.trialEndsAt,
          currentPeriodEnd: organization.subscription.currentPeriodEnd,
          isTrialActive: organization.isTrialActive(),
          isSubscriptionActive: organization.isSubscriptionActive(),
          razorpayDetails: subscriptionDetails
        },
        usage: organization.usage,
        limits: organization.limits
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription details'
    });
  }
};

// Create or update subscription
exports.createSubscription = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { planKey } = req.body;
    const organization = await Organization.findById(req.organizationId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Check if user is owner or admin
    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only organization owners can manage subscriptions'
      });
    }

    const planDetails = RazorpayService.getPlanDetails(planKey);
    if (!planDetails) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected'
      });
    }

    // If it's a free plan, just update the organization
    if (planKey === 'free') {
      organization.plan = 'free';
      organization.limits = planDetails.features;
      await organization.save();
      
      return res.json({
        success: true,
        message: 'Switched to free plan',
        data: { plan: 'free' }
      });
    }

    // Create or get Razorpay customer
    let customerId = organization.subscription.razorpayCustomerId;
    if (!customerId) {
      const owner = await User.findById(organization.owner);
      const customer = await RazorpayService.createCustomer(
        owner.email,
        owner.name,
        owner.phone || '+91' + '0000000000'
      );
      customerId = customer.id;
      organization.subscription.razorpayCustomerId = customerId;
    }

    // Handle subscription creation or update
    if (organization.subscription.razorpaySubscriptionId) {
      // Update existing subscription
      const subscription = await RazorpayService.updateSubscription(
        organization.subscription.razorpaySubscriptionId,
        planDetails.id
      );
      
      organization.subscription.razorpayPlanId = planDetails.id;
      await organization.save();
      
      res.json({
        success: true,
        message: 'Subscription updated successfully',
        data: {
          subscriptionId: subscription.id,
          status: subscription.status
        }
      });
    } else {
      // Create new subscription
      const trialDays = organization.isTrialActive() ? 
        Math.ceil((organization.subscription.trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
      
      const subscription = await RazorpayService.createSubscription(
        customerId,
        planDetails.id,
        {
          organizationId: organization._id,
          trialDays: Math.max(0, trialDays)
        }
      );
      
      organization.subscription.razorpaySubscriptionId = subscription.id;
      organization.subscription.razorpayPlanId = planDetails.id;
      organization.plan = planKey;
      organization.limits = planDetails.features;
      await organization.save();
      
      res.json({
        success: true,
        message: 'Subscription created successfully',
        data: {
          subscriptionId: subscription.id,
          status: subscription.status,
          shortUrl: subscription.short_url // Razorpay payment link
        }
      });
    }
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subscription'
    });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const { immediately } = req.body;
    const organization = await Organization.findById(req.organizationId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    if (!organization.subscription.razorpaySubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    const subscription = await RazorpayService.cancelSubscription(
      organization.subscription.razorpaySubscriptionId,
      !immediately
    );

    if (immediately) {
      organization.plan = 'free';
      organization.limits = RazorpayService.getPlanDetails('free').features;
      organization.subscription.razorpaySubscriptionId = null;
      organization.subscription.razorpayPlanId = null;
    } else {
      // Will cancel at the end of the billing period
      organization.status = 'cancelled';
    }
    
    await organization.save();

    res.json({
      success: true,
      message: immediately ? 
        'Subscription cancelled immediately' : 
        'Subscription will be cancelled at the end of the billing period',
      data: {
        status: subscription.status,
        endsAt: subscription.end_at
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription'
    });
  }
};

// Pause subscription
exports.pauseSubscription = async (req, res) => {
  try {
    const organization = await Organization.findById(req.organizationId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    if (!organization.subscription.razorpaySubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    const subscription = await RazorpayService.pauseSubscription(
      organization.subscription.razorpaySubscriptionId
    );

    organization.status = 'suspended';
    await organization.save();

    res.json({
      success: true,
      message: 'Subscription paused successfully',
      data: {
        status: subscription.status
      }
    });
  } catch (error) {
    console.error('Pause subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error pausing subscription'
    });
  }
};

// Resume subscription
exports.resumeSubscription = async (req, res) => {
  try {
    const organization = await Organization.findById(req.organizationId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    if (!organization.subscription.razorpaySubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No subscription found to resume'
      });
    }

    const subscription = await RazorpayService.resumeSubscription(
      organization.subscription.razorpaySubscriptionId
    );

    organization.status = 'active';
    await organization.save();

    res.json({
      success: true,
      message: 'Subscription resumed successfully',
      data: {
        status: subscription.status
      }
    });
  } catch (error) {
    console.error('Resume subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resuming subscription'
    });
  }
};

// Handle Razorpay webhook events
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const isValid = RazorpayService.verifyWebhookSignature(
      req.body,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const { event, payload } = req.body;
    console.log(`Received Razorpay webhook: ${event}`);

    switch (event) {
      case 'subscription.activated':
        await handleSubscriptionActivated(payload.subscription);
        break;
      
      case 'subscription.charged':
        await handleSubscriptionCharged(payload.subscription, payload.payment);
        break;
      
      case 'subscription.completed':
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload.subscription);
        break;
      
      case 'subscription.paused':
        await handleSubscriptionPaused(payload.subscription);
        break;
      
      case 'subscription.resumed':
        await handleSubscriptionResumed(payload.subscription);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(payload.payment);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing webhook'
    });
  }
};

// Helper functions for webhook events
async function handleSubscriptionActivated(subscription) {
  const org = await Organization.findOne({
    'subscription.razorpaySubscriptionId': subscription.id
  });
  
  if (org) {
    org.status = 'active';
    org.subscription.currentPeriodEnd = new Date(subscription.current_end * 1000);
    await org.save();
    console.log(`Subscription activated for org: ${org._id}`);
  }
}

async function handleSubscriptionCharged(subscription, payment) {
  const org = await Organization.findOne({
    'subscription.razorpaySubscriptionId': subscription.id
  });
  
  if (org) {
    org.subscription.lastPaymentId = payment.id;
    org.subscription.lastPaymentAmount = payment.amount / 100;
    org.subscription.lastPaymentDate = new Date();
    org.subscription.currentPeriodEnd = new Date(subscription.current_end * 1000);
    await org.save();
    console.log(`Payment received for org: ${org._id}, amount: ₹${payment.amount / 100}`);
  }
}

async function handleSubscriptionCancelled(subscription) {
  const org = await Organization.findOne({
    'subscription.razorpaySubscriptionId': subscription.id
  });
  
  if (org) {
    org.status = 'cancelled';
    org.plan = 'free';
    org.limits = RazorpayService.getPlanDetails('free').features;
    org.subscription.razorpaySubscriptionId = null;
    org.subscription.razorpayPlanId = null;
    await org.save();
    console.log(`Subscription cancelled for org: ${org._id}`);
  }
}

async function handleSubscriptionPaused(subscription) {
  const org = await Organization.findOne({
    'subscription.razorpaySubscriptionId': subscription.id
  });
  
  if (org) {
    org.status = 'suspended';
    await org.save();
    console.log(`Subscription paused for org: ${org._id}`);
  }
}

async function handleSubscriptionResumed(subscription) {
  const org = await Organization.findOne({
    'subscription.razorpaySubscriptionId': subscription.id
  });
  
  if (org) {
    org.status = 'active';
    await org.save();
    console.log(`Subscription resumed for org: ${org._id}`);
  }
}

async function handlePaymentFailed(payment) {
  // Find organization by customer ID
  const org = await Organization.findOne({
    'subscription.razorpayCustomerId': payment.customer_id
  });
  
  if (org) {
    // Send notification email to owner
    const owner = await User.findById(org.owner);
    console.log(`Payment failed for org: ${org._id}, owner: ${owner.email}`);
    // Email notification disabled for local development
    // In production, send email notification to owner about failed payment
    console.log(`[LOCAL DEV] Would send payment failure notification to ${owner.email}`);
  }
}

module.exports = exports;