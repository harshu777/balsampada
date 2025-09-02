const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_here',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_secret_here'
});

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free_plan',
    name: 'Free Plan',
    amount: 0,
    currency: 'INR',
    period: 'monthly',
    interval: 1,
    description: 'Perfect for individual teachers starting out',
    features: {
      maxStudents: 10,
      maxTeachers: 1,
      maxStorage: 1 * 1024 * 1024 * 1024, // 1GB
      maxLiveClassHours: 10
    }
  },
  basic: {
    id: process.env.RAZORPAY_BASIC_PLAN_ID || 'plan_basic_monthly',
    name: 'Basic Plan',
    amount: 999, // ₹999 per month
    currency: 'INR',
    period: 'monthly',
    interval: 1,
    description: 'Great for small coaching centers',
    features: {
      maxStudents: 100,
      maxTeachers: 5,
      maxStorage: 10 * 1024 * 1024 * 1024, // 10GB
      maxLiveClassHours: 100
    }
  },
  pro: {
    id: process.env.RAZORPAY_PRO_PLAN_ID || 'plan_pro_monthly',
    name: 'Professional Plan',
    amount: 2999, // ₹2,999 per month
    currency: 'INR',
    period: 'monthly',
    interval: 1,
    description: 'Ideal for established institutes',
    features: {
      maxStudents: 500,
      maxTeachers: 20,
      maxStorage: 50 * 1024 * 1024 * 1024, // 50GB
      maxLiveClassHours: 500
    }
  },
  enterprise: {
    id: process.env.RAZORPAY_ENTERPRISE_PLAN_ID || 'plan_enterprise_monthly',
    name: 'Enterprise Plan',
    amount: 9999, // ₹9,999 per month
    currency: 'INR',
    period: 'monthly',
    interval: 1,
    description: 'For large educational institutions',
    features: {
      maxStudents: -1, // Unlimited
      maxTeachers: -1, // Unlimited
      maxStorage: -1, // Unlimited
      maxLiveClassHours: -1 // Unlimited
    }
  }
};

class RazorpayService {
  /**
   * Create a new customer in Razorpay
   */
  static async createCustomer(email, name, contact) {
    try {
      const customer = await razorpay.customers.create({
        email,
        name,
        contact,
        notes: {
          source: 'balsampada_lms'
        }
      });
      return customer;
    } catch (error) {
      console.error('Error creating Razorpay customer:', error);
      throw error;
    }
  }

  /**
   * Create a subscription plan in Razorpay (run once during setup)
   */
  static async createPlan(planKey) {
    try {
      const planConfig = SUBSCRIPTION_PLANS[planKey];
      if (!planConfig || planConfig.amount === 0) {
        throw new Error('Invalid plan or free plan selected');
      }

      const plan = await razorpay.plans.create({
        period: planConfig.period,
        interval: planConfig.interval,
        item: {
          name: planConfig.name,
          amount: planConfig.amount * 100, // Convert to paise
          currency: planConfig.currency,
          description: planConfig.description
        },
        notes: {
          plan_type: planKey,
          source: 'balsampada_lms'
        }
      });

      console.log(`Created Razorpay plan: ${plan.id} for ${planKey}`);
      return plan;
    } catch (error) {
      console.error('Error creating Razorpay plan:', error);
      throw error;
    }
  }

  /**
   * Create a subscription for a customer
   */
  static async createSubscription(customerId, planId, options = {}) {
    try {
      const subscriptionData = {
        plan_id: planId,
        customer_id: customerId,
        total_count: options.totalCount || 120, // 10 years by default
        quantity: 1,
        customer_notify: 1,
        notes: {
          source: 'balsampada_lms',
          organization_id: options.organizationId
        }
      };

      // Add trial period if specified
      if (options.trialDays) {
        subscriptionData.start_at = Math.floor(Date.now() / 1000) + (options.trialDays * 86400);
      }

      const subscription = await razorpay.subscriptions.create(subscriptionData);
      return subscription;
    } catch (error) {
      console.error('Error creating Razorpay subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(subscriptionId, cancelAtEnd = true) {
    try {
      const subscription = await razorpay.subscriptions.cancel(subscriptionId, {
        cancel_at_cycle_end: cancelAtEnd
      });
      return subscription;
    } catch (error) {
      console.error('Error cancelling Razorpay subscription:', error);
      throw error;
    }
  }

  /**
   * Pause a subscription
   */
  static async pauseSubscription(subscriptionId) {
    try {
      const subscription = await razorpay.subscriptions.pause(subscriptionId, {
        pause_at: 'now'
      });
      return subscription;
    } catch (error) {
      console.error('Error pausing Razorpay subscription:', error);
      throw error;
    }
  }

  /**
   * Resume a paused subscription
   */
  static async resumeSubscription(subscriptionId) {
    try {
      const subscription = await razorpay.subscriptions.resume(subscriptionId, {
        resume_at: 'now'
      });
      return subscription;
    } catch (error) {
      console.error('Error resuming Razorpay subscription:', error);
      throw error;
    }
  }

  /**
   * Update subscription (upgrade/downgrade plan)
   */
  static async updateSubscription(subscriptionId, newPlanId, scheduleChangeAt = 'cycle_end') {
    try {
      const subscription = await razorpay.subscriptions.update(subscriptionId, {
        plan_id: newPlanId,
        quantity: 1,
        schedule_change_at: scheduleChangeAt
      });
      return subscription;
    } catch (error) {
      console.error('Error updating Razorpay subscription:', error);
      throw error;
    }
  }

  /**
   * Fetch subscription details
   */
  static async getSubscription(subscriptionId) {
    try {
      const subscription = await razorpay.subscriptions.fetch(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error fetching Razorpay subscription:', error);
      throw error;
    }
  }

  /**
   * Create a payment link for one-time payment
   */
  static async createPaymentLink(amount, description, customerData, options = {}) {
    try {
      const paymentLink = await razorpay.paymentLinks.create({
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        description,
        customer: {
          name: customerData.name,
          email: customerData.email,
          contact: customerData.contact
        },
        notify: {
          sms: true,
          email: true
        },
        reminder_enable: true,
        notes: {
          source: 'balsampada_lms',
          organization_id: options.organizationId
        },
        callback_url: options.callbackUrl || `${process.env.CLIENT_URL}/payment/success`,
        callback_method: 'get'
      });
      return paymentLink;
    } catch (error) {
      console.error('Error creating payment link:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(body, signature, secret) {
    const expectedSignature = crypto
      .createHmac('sha256', secret || process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');
    
    return expectedSignature === signature;
  }

  /**
   * Verify payment signature (for frontend payment verification)
   */
  static verifyPaymentSignature(orderId, paymentId, signature) {
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(orderId + '|' + paymentId)
      .digest('hex');
    
    return generatedSignature === signature;
  }

  /**
   * Get plan details by key
   */
  static getPlanDetails(planKey) {
    return SUBSCRIPTION_PLANS[planKey];
  }

  /**
   * Get all available plans
   */
  static getAllPlans() {
    return Object.keys(SUBSCRIPTION_PLANS).map(key => ({
      key,
      ...SUBSCRIPTION_PLANS[key]
    }));
  }

  /**
   * Calculate prorated amount for plan change
   */
  static calculateProratedAmount(currentPlan, newPlan, daysRemaining) {
    const currentDailyRate = SUBSCRIPTION_PLANS[currentPlan].amount / 30;
    const newDailyRate = SUBSCRIPTION_PLANS[newPlan].amount / 30;
    const difference = (newDailyRate - currentDailyRate) * daysRemaining;
    return Math.max(0, Math.round(difference));
  }
}

module.exports = RazorpayService;