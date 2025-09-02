'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  AcademicCapIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Our Teachers', href: '/teachers' },
    { name: 'Testimonials', href: '/testimonials' },
    { name: 'Blog', href: '/blog' },
    { name: 'Careers', href: '/careers' },
  ];

  const classCategories = [
    { name: 'Class 4-5', href: '/classes?standard=4,5' },
    { name: 'Class 6-8', href: '/classes?standard=6,7,8' },
    { name: 'Class 9-10', href: '/classes?standard=9,10' },
    { name: 'Class 11-12', href: '/classes?standard=11,12' },
    { name: 'Competitive Exams', href: '/classes?category=competitive' },
  ];

  const policies = [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms & Conditions', href: '/terms' },
    { name: 'Refund Policy', href: '/refund' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact Us', href: '/contact' },
  ];

  return (
    <footer className="text-gray-300" style={{backgroundColor: '#6C4225'}}>
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="mb-4">
              <Image
                src="/images/logo.png"
                alt="Balsampada Logo"
                width={150}
                height={40}
                className="h-10 w-auto brightness-0 invert"
              />
            </div>
            <p className="text-sm mb-4">
              Empowering students with quality education through live online classes. 
              Expert teachers, personalized attention, and comprehensive curriculum for all boards.
            </p>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <MapPinIcon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{color: '#82993D'}} />
                <span className="text-sm">Mumbai, Maharashtra, India</span>
              </div>
              <div className="flex items-center space-x-2">
                <PhoneIcon className="w-5 h-5" style={{color: '#82993D'}} />
                <span className="text-sm">+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-2">
                <EnvelopeIcon className="w-5 h-5" style={{color: '#82993D'}} />
                <span className="text-sm">info@balsampada.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4" style={{color: '#E18DB7'}}>Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm transition"
                    style={{color: '#E18DB7'}}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#DA528C'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#E18DB7'}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Classes */}
          <div>
            <h3 className="font-semibold mb-4" style={{color: '#E18DB7'}}>Our Classes</h3>
            <ul className="space-y-2">
              {classCategories.map((category) => (
                <li key={category.name}>
                  <Link 
                    href={category.href}
                    className="text-sm transition"
                    style={{color: '#E18DB7'}}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#DA528C'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#E18DB7'}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Policies */}
          <div>
            <h3 className="font-semibold mb-4" style={{color: '#E18DB7'}}>Support</h3>
            <ul className="space-y-2">
              {policies.map((policy) => (
                <li key={policy.name}>
                  <Link 
                    href={policy.href}
                    className="text-sm transition"
                    style={{color: '#E18DB7'}}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#DA528C'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#E18DB7'}
                  >
                    {policy.name}
                  </Link>
                </li>
              ))}
            </ul>
            
            {/* Working Hours */}
            <div className="mt-6">
              <h4 className="font-medium mb-2 flex items-center" style={{color: '#E18DB7'}}>
                <ClockIcon className="w-4 h-4 mr-2" />
                Working Hours
              </h4>
              <p className="text-sm">Mon - Sat: 9:00 AM - 8:00 PM</p>
              <p className="text-sm">Sunday: 10:00 AM - 6:00 PM</p>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-8 pt-8 border-t" style={{borderColor: '#82993D30'}}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="font-semibold mb-2" style={{color: '#E18DB7'}}>Subscribe to our Newsletter</h3>
              <p className="text-sm">Get updates about new classes, study materials, and educational tips.</p>
            </div>
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg text-white placeholder-gray-400 focus:outline-none"
                style={{backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid #82993D50'}}
              />
              <button className="px-6 py-2 text-white font-medium rounded-lg transition hover:opacity-90" style={{background: 'linear-gradient(to right, #82993D, #AC6CA1)'}}>
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-8 pt-8 border-t" style={{borderColor: '#82993D30'}}>
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 transition" onMouseEnter={(e) => e.currentTarget.style.color = '#DA528C'} onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 transition" onMouseEnter={(e) => e.currentTarget.style.color = '#DA528C'} onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 transition" onMouseEnter={(e) => e.currentTarget.style.color = '#DA528C'} onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 transition" onMouseEnter={(e) => e.currentTarget.style.color = '#DA528C'} onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
            
            <div className="text-sm text-center md:text-right">
              <p>&copy; {currentYear} Balsampada LMS. All rights reserved.</p>
              <p className="mt-1">Made with ❤️ for Students</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}