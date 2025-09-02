'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  InboxIcon,
  CheckIcon,
  TrashIcon,
  BookOpenIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
  MegaphoneIcon,
  AcademicCapIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import Cookies from 'js-cookie';

interface Notification {
  id: string;
  type: 'class' | 'assignment' | 'announcement' | 'enrollment' | 'grade' | 'meeting' | 'system' | 'group_assignment';
  title: string;
  message: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  timestamp: string;
  actionUrl?: string;
  actionText?: string;
  sender?: {
    name: string;
    role: string;
  };
  metadata?: {
    classId?: string;
    className?: string;
    assignmentId?: string;
    meetingLink?: string;
    groupName?: string;
    isGroupAssignment?: boolean;
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const userStr = Cookies.get('user');
  const userCookie = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated && user === null) {
      router.push('/login');
    } else if (user) {
      fetchNotifications();
    }
  }, [isAuthenticated, user, router]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with API call
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'class',
          title: 'Live Class Starting Soon',
          message: 'Mathematics Grade 10 class will start in 15 minutes',
          read: false,
          priority: 'high',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          actionUrl: '/classes/1',
          actionText: 'Join Class',
          sender: { name: 'Dr. Smith', role: 'teacher' },
          metadata: { classId: '1', className: 'Mathematics Grade 10', meetingLink: 'https://meet.google.com/abc-defg-hij' }
        },
        {
          id: '2',
          type: 'assignment',
          title: 'New Assignment Posted',
          message: 'Chapter 5 Problem Set has been posted for Physics Grade 11',
          read: false,
          priority: 'medium',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          actionUrl: '/assignments',
          actionText: 'View Assignment',
          sender: { name: 'Prof. Johnson', role: 'teacher' },
          metadata: { classId: '2', assignmentId: 'a1' }
        },
        {
          id: '3',
          type: 'announcement',
          title: 'Schedule Change',
          message: 'Tomorrow\'s Chemistry lab session has been rescheduled to 3:00 PM',
          read: true,
          priority: 'high',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          sender: { name: 'Dr. Wilson', role: 'teacher' },
          metadata: { classId: '3' }
        },
        {
          id: '4',
          type: 'grade',
          title: 'Assignment Graded',
          message: 'Your Lab Report 2 has been graded. Score: 92/100',
          read: true,
          priority: 'low',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          actionUrl: '/assignments',
          actionText: 'View Grade',
          sender: { name: 'Dr. Wilson', role: 'teacher' }
        },
        {
          id: '5',
          type: 'enrollment',
          title: 'Successfully Enrolled',
          message: 'You have been successfully enrolled in English Literature',
          read: true,
          priority: 'medium',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          actionUrl: '/my-classes',
          actionText: 'View Class',
          metadata: { classId: '4', className: 'English Literature' }
        },
        {
          id: '6',
          type: 'group_assignment',
          title: 'Group Assignment Posted',
          message: 'New group assignment "Advanced Math Project" has been assigned to your group',
          read: false,
          priority: 'high',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          actionUrl: '/assignments',
          actionText: 'View Assignment',
          sender: { name: 'Dr. Smith', role: 'teacher' },
          metadata: { 
            classId: '1', 
            assignmentId: 'ga1',
            groupName: 'Advanced Math Group',
            isGroupAssignment: true
          }
        },
        {
          id: '7',
          type: 'meeting',
          title: 'Extra Class Scheduled',
          message: 'An extra doubt clearing session has been scheduled for Saturday 4:00 PM',
          read: false,
          priority: 'medium',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          actionUrl: '/schedule',
          actionText: 'View Schedule',
          sender: { name: 'Dr. Smith', role: 'teacher' },
          metadata: { meetingLink: 'https://meet.google.com/xyz-abcd-efg' }
        },
        {
          id: '7',
          type: 'system',
          title: 'Profile Update Reminder',
          message: 'Please complete your profile to access all features',
          read: false,
          priority: 'low',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          actionUrl: '/profile',
          actionText: 'Update Profile'
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // API call to mark as read
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      // API call to mark all as read
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotifications = async () => {
    try {
      // API call to delete selected notifications
      setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.id)));
      setSelectedNotifications(new Set());
      setShowDeleteConfirm(false);
      toast.success('Notifications deleted');
    } catch (error) {
      toast.error('Failed to delete notifications');
    }
  };

  const toggleSelectNotification = (id: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  const selectAll = () => {
    const filtered = getFilteredNotifications();
    if (selectedNotifications.size === filtered.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filtered.map(n => n.id)));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'class': return BookOpenIcon;
      case 'assignment': return DocumentTextIcon;
      case 'group_assignment': return UserGroupIcon;
      case 'announcement': return MegaphoneIcon;
      case 'enrollment': return AcademicCapIcon;
      case 'grade': return CheckCircleIcon;
      case 'meeting': return CalendarIcon;
      case 'system': return InformationCircleIcon;
      default: return BellIcon;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return '#DA528C';
    switch (type) {
      case 'class': return '#82993D';
      case 'assignment': return '#AC6CA1';
      case 'group_assignment': return '#8B5CF6';
      case 'announcement': return '#E18DB7';
      case 'enrollment': return '#6C4225';
      default: return '#718096';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;
    
    // Filter by read status
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.read);
    }
    
    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{borderColor: '#82993D'}}></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="mt-2 text-gray-600">
                Stay updated with your classes and activities
              </p>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center px-3 py-1 rounded-full" 
                style={{backgroundColor: '#82993D20'}}>
                <BellIconSolid className="h-5 w-5 mr-2" style={{color: '#82993D'}} />
                <span className="font-medium" style={{color: '#82993D'}}>
                  {unreadCount} unread
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="class">Classes</option>
              <option value="assignment">Assignments</option>
              <option value="announcement">Announcements</option>
              <option value="enrollment">Enrollments</option>
              <option value="grade">Grades</option>
              <option value="meeting">Meetings</option>
              <option value="system">System</option>
            </select>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                onChange={selectAll}
                className="rounded text-blue-600"
              />
              <span className="text-sm text-gray-600">
                {selectedNotifications.size > 0 
                  ? `${selectedNotifications.size} selected`
                  : 'Select all'}
              </span>
            </div>
            
            <div className="flex gap-2">
              {selectedNotifications.size > 0 && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition flex items-center"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete Selected
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-3 py-1.5 text-sm hover:bg-gray-100 rounded-lg transition flex items-center"
                  style={{color: '#82993D'}}
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Mark All as Read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <InboxIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No notifications
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'No notifications match your search'
                : filter === 'unread' 
                ? 'You\'re all caught up!'
                : 'Your notifications will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.type);
                const color = getNotificationColor(notification.type, notification.priority);
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow ${
                      !notification.read ? 'border-l-4' : ''
                    }`}
                    style={{
                      borderLeftColor: !notification.read ? color : undefined
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedNotifications.has(notification.id)}
                        onChange={() => toggleSelectNotification(notification.id)}
                        className="mt-1 rounded text-blue-600"
                      />

                      {/* Icon */}
                      <div 
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: `${color}20`,
                          color: color
                        }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                              {notification.priority === 'high' && (
                                <ExclamationCircleIcon className="inline-block h-4 w-4 ml-2 text-red-500" />
                              )}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            {notification.sender && (
                              <p className="text-xs text-gray-500 mt-2">
                                From: {notification.sender.name} ({notification.sender.role})
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-3">
                          {notification.actionUrl && (
                            <button
                              onClick={() => {
                                markAsRead(notification.id);
                                router.push(notification.actionUrl!);
                              }}
                              className="text-sm font-medium hover:underline"
                              style={{color: '#82993D'}}
                            >
                              {notification.actionText || 'View'}
                            </button>
                          )}
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              Mark as read
                            </button>
                          )}
                          {notification.metadata?.meetingLink && (
                            <a
                              href={notification.metadata.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium hover:underline"
                              style={{color: '#AC6CA1'}}
                            >
                              Join Meeting
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-xl p-6 max-w-sm mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete Notifications
                </h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete {selectedNotifications.size} selected notification(s)?
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteNotifications}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}