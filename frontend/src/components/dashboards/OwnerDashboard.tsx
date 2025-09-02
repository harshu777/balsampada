'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  BookOpen,
  CreditCard,
  TrendingUp,
  Activity,
  Award,
  ChevronRight,
  AlertCircle,
  Clock,
  Database,
  Shield,
  Settings,
  UserPlus,
  Building
} from 'lucide-react';
import api from '@/lib/api';

interface OrganizationStats {
  plan: string;
  limits: {
    maxStudents: number;
    maxTeachers: number;
    maxStorage: number;
    maxLiveClassHours: number;
  };
  usage: {
    currentStudents: number;
    currentTeachers: number;
    currentStorage: number;
    liveClassHoursThisMonth: number;
  };
  subscription: {
    status: string;
    trialActive: boolean;
    trialEndsAt: string;
    currentPeriodEnd?: string;
  };
  percentages: {
    students: number;
    teachers: number;
    storage: number;
    liveClassHours: number;
  };
}

interface OrganizationInfo {
  name: string;
  subdomain: string;
  status: string;
  createdAt: string;
}

export default function OwnerDashboard() {
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, orgRes] = await Promise.all([
        api.get('/organizations/stats'),
        api.get('/organizations')
      ]);
      
      setStats(statsRes.data.data);
      setOrganization(orgRes.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const getDaysRemaining = (date: string) => {
    const end = new Date(date);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getPlanColor = (plan: string) => {
    switch(plan.toLowerCase()) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'pro': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Organization Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Building className="w-10 h-10 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{organization?.name}</h1>
              <p className="text-gray-500">
                Subdomain: <span className="font-medium">{organization?.subdomain}.balsampada.com</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(stats?.plan || '')}`}>
              {stats?.plan?.toUpperCase()} Plan
            </span>
            {stats?.subscription?.trialActive && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                Trial: {getDaysRemaining(stats.subscription.trialEndsAt)} days left
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/users/invite" className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <UserPlus className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Invite User</p>
              <p className="font-semibold text-gray-900">Add Teacher/Student</p>
            </div>
          </div>
        </Link>
        
        <Link href="/billing" className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Billing</p>
              <p className="font-semibold text-gray-900">Manage Subscription</p>
            </div>
          </div>
        </Link>
        
        <Link href="/settings" className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Settings</p>
              <p className="font-semibold text-gray-900">Organization Setup</p>
            </div>
          </div>
        </Link>
        
        <Link href="/support" className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Support</p>
              <p className="font-semibold text-gray-900">Get Help</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Students Usage */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Students</h3>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getUsageColor(stats?.percentages?.students || 0)}`}>
              {stats?.percentages?.students || 0}%
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Used</span>
              <span className="font-medium">{stats?.usage?.currentStudents || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Limit</span>
              <span className="font-medium">
                {stats?.limits?.maxStudents === -1 ? 'Unlimited' : stats?.limits?.maxStudents}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(stats?.percentages?.students || 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Teachers Usage */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Teachers</h3>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getUsageColor(stats?.percentages?.teachers || 0)}`}>
              {stats?.percentages?.teachers || 0}%
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Used</span>
              <span className="font-medium">{stats?.usage?.currentTeachers || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Limit</span>
              <span className="font-medium">
                {stats?.limits?.maxTeachers === -1 ? 'Unlimited' : stats?.limits?.maxTeachers}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(stats?.percentages?.teachers || 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Storage Usage */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Storage</h3>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getUsageColor(stats?.percentages?.storage || 0)}`}>
              {stats?.percentages?.storage || 0}%
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Used</span>
              <span className="font-medium">{formatBytes(stats?.usage?.currentStorage || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Limit</span>
              <span className="font-medium">
                {stats?.limits?.maxStorage === -1 ? 'Unlimited' : formatBytes(stats?.limits?.maxStorage || 0)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(stats?.percentages?.storage || 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Live Class Hours */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Live Hours</h3>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getUsageColor(stats?.percentages?.liveClassHours || 0)}`}>
              {stats?.percentages?.liveClassHours || 0}%
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Used</span>
              <span className="font-medium">{stats?.usage?.liveClassHoursThisMonth || 0} hrs</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monthly Limit</span>
              <span className="font-medium">
                {stats?.limits?.maxLiveClassHours === -1 ? 'Unlimited' : `${stats?.limits?.maxLiveClassHours} hrs`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(stats?.percentages?.liveClassHours || 0, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade CTA if on Free or Basic plan */}
      {(stats?.plan === 'free' || stats?.plan === 'basic') && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Upgrade Your Plan</h2>
              <p className="text-blue-100">
                Unlock more features and remove limits by upgrading to a higher plan.
              </p>
            </div>
            <Link 
              href="/billing/upgrade" 
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              View Plans
            </Link>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600">✓</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Organization Created</p>
              <p className="text-sm text-gray-600">Your organization is set up and ready</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className={`w-8 h-8 ${stats?.usage?.currentTeachers && stats.usage.currentTeachers > 1 ? 'bg-green-100' : 'bg-gray-100'} rounded-full flex items-center justify-center`}>
              {stats?.usage?.currentTeachers && stats.usage.currentTeachers > 1 ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-gray-400">2</span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Invite Teachers</p>
              <p className="text-sm text-gray-600">Add teachers to help manage classes</p>
            </div>
            {(!stats?.usage?.currentTeachers || stats.usage.currentTeachers <= 1) && (
              <Link href="/users/invite" className="text-blue-600 hover:text-blue-700">
                <ChevronRight className="w-5 h-5" />
              </Link>
            )}
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className={`w-8 h-8 ${stats?.usage?.currentStudents && stats.usage.currentStudents > 0 ? 'bg-green-100' : 'bg-gray-100'} rounded-full flex items-center justify-center`}>
              {stats?.usage?.currentStudents && stats.usage.currentStudents > 0 ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-gray-400">3</span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Add Students</p>
              <p className="text-sm text-gray-600">Start enrolling students in your organization</p>
            </div>
            {(!stats?.usage?.currentStudents || stats.usage.currentStudents === 0) && (
              <Link href="/users/invite" className="text-blue-600 hover:text-blue-700">
                <ChevronRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}