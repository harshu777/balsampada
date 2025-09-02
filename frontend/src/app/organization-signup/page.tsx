'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Building2, Check, ArrowRight, Users, GraduationCap, Clock, HardDrive } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: '₹0',
    period: '/month',
    description: 'Perfect for individual teachers',
    features: [
      { icon: Users, text: 'Up to 10 students' },
      { icon: GraduationCap, text: '1 teacher account' },
      { icon: HardDrive, text: '1 GB storage' },
      { icon: Clock, text: '10 live class hours/month' }
    ],
    recommended: false
  },
  {
    key: 'basic',
    name: 'Basic',
    price: '₹999',
    period: '/month',
    description: 'Great for small coaching centers',
    features: [
      { icon: Users, text: 'Up to 100 students' },
      { icon: GraduationCap, text: '5 teacher accounts' },
      { icon: HardDrive, text: '10 GB storage' },
      { icon: Clock, text: '100 live class hours/month' }
    ],
    recommended: true
  },
  {
    key: 'pro',
    name: 'Professional',
    price: '₹2,999',
    period: '/month',
    description: 'Ideal for established institutes',
    features: [
      { icon: Users, text: 'Up to 500 students' },
      { icon: GraduationCap, text: '20 teacher accounts' },
      { icon: HardDrive, text: '50 GB storage' },
      { icon: Clock, text: '500 live class hours/month' }
    ],
    recommended: false
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: '₹9,999',
    period: '/month',
    description: 'For large institutions',
    features: [
      { icon: Users, text: 'Unlimited students' },
      { icon: GraduationCap, text: 'Unlimited teachers' },
      { icon: HardDrive, text: 'Unlimited storage' },
      { icon: Clock, text: 'Unlimited live classes' }
    ],
    recommended: false
  }
];

export default function OrganizationSignup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  
  const [formData, setFormData] = useState({
    organizationName: '',
    subdomain: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    confirmPassword: '',
    ownerPhone: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-generate subdomain from organization name
    if (name === 'organizationName') {
      const subdomain = value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({
        ...prev,
        subdomain
      }));
    }
  };

  const validateStep1 = () => {
    const newErrors: any = {};
    
    if (!formData.organizationName) {
      newErrors.organizationName = 'Organization name is required';
    }
    
    if (!formData.subdomain) {
      newErrors.subdomain = 'Subdomain is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
      newErrors.subdomain = 'Subdomain can only contain lowercase letters, numbers, and hyphens';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: any = {};
    
    if (!formData.ownerName) {
      newErrors.ownerName = 'Name is required';
    }
    
    if (!formData.ownerEmail) {
      newErrors.ownerEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) {
      newErrors.ownerEmail = 'Invalid email format';
    }
    
    if (!formData.ownerPassword) {
      newErrors.ownerPassword = 'Password is required';
    } else if (formData.ownerPassword.length < 6) {
      newErrors.ownerPassword = 'Password must be at least 6 characters';
    }
    
    if (formData.ownerPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    setErrors({});

    try {
      // Step 1: Create organization and owner account
      const signupResponse = await axios.post(`${API_URL}/organizations/signup`, {
        organizationName: formData.organizationName,
        subdomain: formData.subdomain,
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        ownerPassword: formData.ownerPassword,
        plan: selectedPlan
      });

      const { token, organization } = signupResponse.data.data;
      
      // Store token
      localStorage.setItem('token', token);
      localStorage.setItem('organization', JSON.stringify(organization));

      // Step 2: If paid plan selected, create subscription
      if (selectedPlan !== 'free') {
        try {
          const subscriptionResponse = await axios.post(
            `${API_URL}/subscriptions/create`,
            { planKey: selectedPlan },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          // If subscription has a payment URL, redirect to it
          if (subscriptionResponse.data.data.shortUrl) {
            window.location.href = subscriptionResponse.data.data.shortUrl;
            return;
          }
        } catch (subError) {
          console.error('Subscription creation error:', subError);
          // Continue to dashboard even if subscription fails
        }
      }

      // Redirect to dashboard
      router.push('/dashboard');
      
    } catch (error: any) {
      console.error('Signup error:', error);
      setErrors({
        submit: error.response?.data?.message || 'Failed to create organization. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900">
            <Building2 className="w-6 h-6" />
            <span className="font-semibold text-xl">Balsampada LMS</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Start Your 14-Day Free Trial
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create your educational institute account and transform how you teach
          </p>
        </div>

        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {['Organization', 'Account', 'Plan'].map((label, index) => (
              <div key={index} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${step > index + 1 ? 'bg-green-500 text-white' : 
                    step === index + 1 ? 'bg-blue-600 text-white' : 
                    'bg-gray-200 text-gray-500'}
                `}>
                  {step > index + 1 ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                <span className={`ml-2 ${step >= index + 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                  {label}
                </span>
                {index < 2 && (
                  <div className={`w-20 md:w-32 h-0.5 mx-4 ${
                    step > index + 1 ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Steps */}
        <div className="max-w-5xl mx-auto">
          {/* Step 1: Organization Details */}
          {step === 1 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Organization Details</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleChange}
                    placeholder="ABC Coaching Center"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.organizationName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.organizationName && (
                    <p className="mt-1 text-sm text-red-600">{errors.organizationName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subdomain
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      name="subdomain"
                      value={formData.subdomain}
                      onChange={handleChange}
                      placeholder="abc-coaching"
                      className={`flex-1 px-4 py-3 border-t border-b border-l rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.subdomain ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <span className="px-4 py-3 bg-gray-100 border-t border-b border-r border-gray-300 rounded-r-lg text-gray-600">
                      .balsampada.com
                    </span>
                  </div>
                  {errors.subdomain && (
                    <p className="mt-1 text-sm text-red-600">{errors.subdomain}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    This will be your unique URL for accessing the platform
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Account Details */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Account Details</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.ownerName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.ownerName && (
                    <p className="mt-1 text-sm text-red-600">{errors.ownerName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="ownerEmail"
                    value={formData.ownerEmail}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.ownerEmail ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.ownerEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.ownerEmail}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="ownerPassword"
                    value={formData.ownerPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.ownerPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.ownerPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.ownerPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    name="ownerPhone"
                    value={formData.ownerPhone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 text-gray-600 hover:text-gray-900"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Choose Plan */}
          {step === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-3">Choose Your Plan</h2>
                <p className="text-gray-600">Start with a 14-day free trial of any plan</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {PLANS.map((plan) => (
                  <div
                    key={plan.key}
                    onClick={() => setSelectedPlan(plan.key)}
                    className={`
                      bg-white rounded-xl p-6 cursor-pointer transition-all duration-200
                      ${selectedPlan === plan.key ? 
                        'ring-2 ring-blue-600 shadow-xl transform scale-105' : 
                        'shadow-lg hover:shadow-xl'}
                      ${plan.recommended ? 'relative' : ''}
                    `}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Recommended
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                        <span className="text-gray-600">{plan.period}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                    </div>

                    <div className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <feature.icon className="w-5 h-5 text-green-500 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature.text}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6">
                      <div className={`
                        w-full py-2 rounded-lg text-center font-semibold transition-colors
                        ${selectedPlan === plan.key ? 
                          'bg-blue-600 text-white' : 
                          'bg-gray-100 text-gray-700'}
                      `}>
                        {selectedPlan === plan.key ? 'Selected' : 'Select Plan'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {errors.submit}
                </div>
              )}

              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex justify-between items-center">
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 text-gray-600 hover:text-gray-900"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSignup}
                    disabled={loading}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? 'Creating Account...' : 'Complete Signup'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600">
          <p>Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
}