'use client';

import Link from 'next/link';
import { Check, X, Star, TrendingUp, Shield, Zap } from 'lucide-react';

const FEATURES = [
  { name: 'Student Management', free: true, basic: true, pro: true, enterprise: true },
  { name: 'Class Management', free: true, basic: true, pro: true, enterprise: true },
  { name: 'Assignment Management', free: true, basic: true, pro: true, enterprise: true },
  { name: 'Live Classes', free: '10 hrs/month', basic: '100 hrs/month', pro: '500 hrs/month', enterprise: 'Unlimited' },
  { name: 'Storage Space', free: '1 GB', basic: '10 GB', pro: '50 GB', enterprise: 'Unlimited' },
  { name: 'Number of Students', free: '10', basic: '100', pro: '500', enterprise: 'Unlimited' },
  { name: 'Number of Teachers', free: '1', basic: '5', pro: '20', enterprise: 'Unlimited' },
  { name: 'Email Support', free: false, basic: true, pro: true, enterprise: true },
  { name: 'Phone Support', free: false, basic: false, pro: true, enterprise: true },
  { name: 'Priority Support', free: false, basic: false, pro: false, enterprise: true },
  { name: 'Custom Branding', free: false, basic: false, pro: true, enterprise: true },
  { name: 'API Access', free: false, basic: false, pro: false, enterprise: true },
  { name: 'Analytics Dashboard', free: false, basic: true, pro: true, enterprise: true },
  { name: 'Data Export', free: false, basic: true, pro: true, enterprise: true },
  { name: 'Custom Domain', free: false, basic: false, pro: true, enterprise: true },
];

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Perfect for individual teachers starting out',
    buttonText: 'Start Free',
    buttonStyle: 'bg-gray-600 hover:bg-gray-700',
    popular: false,
  },
  {
    name: 'Basic',
    price: '₹999',
    period: 'per month',
    description: 'Great for small coaching centers',
    buttonText: 'Start 14-day Trial',
    buttonStyle: 'bg-blue-600 hover:bg-blue-700',
    popular: true,
  },
  {
    name: 'Professional',
    price: '₹2,999',
    period: 'per month',
    description: 'Ideal for established institutes',
    buttonText: 'Start 14-day Trial',
    buttonStyle: 'bg-blue-600 hover:bg-blue-700',
    popular: false,
  },
  {
    name: 'Enterprise',
    price: '₹9,999',
    period: 'per month',
    description: 'For large educational institutions',
    buttonText: 'Contact Sales',
    buttonStyle: 'bg-purple-600 hover:bg-purple-700',
    popular: false,
  },
];

export default function PricingPage() {
  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) {
      return <Check className="w-5 h-5 text-green-500 mx-auto" />;
    } else if (value === false) {
      return <X className="w-5 h-5 text-gray-300 mx-auto" />;
    } else {
      return <span className="text-sm text-gray-700">{value}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="py-6 px-4 bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Balsampada LMS
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
            <Link href="/features" className="text-gray-600 hover:text-gray-900">Features</Link>
            <Link href="/pricing" className="font-semibold text-gray-900">Pricing</Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
            <Link
              href="/organization-signup"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Choose the perfect plan for your educational institute. All plans include a 14-day free trial.
          </p>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-gray-700">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-gray-700">Instant Setup</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="text-gray-700">Scale Anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {PLANS.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-xl p-8 ${
                  plan.popular ? 'ring-2 ring-blue-600 transform scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <Link
                  href="/organization-signup"
                  className={`block w-full py-3 px-6 text-center text-white font-semibold rounded-lg ${plan.buttonStyle} transition-colors`}
                >
                  {plan.buttonText}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Detailed Feature Comparison
          </h2>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Features</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Free</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900">
                      <div className="flex flex-col items-center">
                        <span>Basic</span>
                        <span className="text-sm font-normal text-gray-600">₹999/mo</span>
                      </div>
                    </th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900">
                      <div className="flex flex-col items-center">
                        <span>Professional</span>
                        <span className="text-sm font-normal text-gray-600">₹2,999/mo</span>
                      </div>
                    </th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900">
                      <div className="flex flex-col items-center">
                        <span>Enterprise</span>
                        <span className="text-sm font-normal text-gray-600">₹9,999/mo</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map((feature, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-4 px-6 text-gray-700 font-medium">{feature.name}</td>
                      <td className="py-4 px-6 text-center">{renderFeatureValue(feature.free)}</td>
                      <td className="py-4 px-6 text-center">{renderFeatureValue(feature.basic)}</td>
                      <td className="py-4 px-6 text-center">{renderFeatureValue(feature.pro)}</td>
                      <td className="py-4 px-6 text-center">{renderFeatureValue(feature.enterprise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change my plan later?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we&apos;ll prorate any charges or credits.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards, debit cards, UPI, and net banking through Razorpay - India&apos;s leading payment gateway.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a setup fee?
              </h3>
              <p className="text-gray-600">
                No! There are no setup fees or hidden charges. You only pay the monthly subscription amount for your chosen plan.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens after my trial ends?
              </h3>
              <p className="text-gray-600">
                After your 14-day trial, you&apos;ll be automatically charged for your selected plan unless you cancel. You can cancel anytime during the trial period.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Teaching?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of educators who are already using Balsampada LMS to manage their classes effectively.
          </p>
          <Link
            href="/organization-signup"
            className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-lg"
          >
            Start Your 14-Day Free Trial
          </Link>
          <p className="text-sm text-blue-100 mt-4">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400">
        <div className="container mx-auto text-center">
          <p>&copy; 2025 Balsampada LMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}