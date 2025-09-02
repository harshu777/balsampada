'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  TrashIcon,
  InboxIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  MegaphoneIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolid } from '@heroicons/react/24/solid';
import useNotificationStore from '@/store/notificationStore';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotificationStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'live-class':
        return <VideoCameraIcon className="w-5 h-5 text-red-500" />;
      case 'assignment':
        return <DocumentTextIcon className="w-5 h-5 text-blue-500" />;
      case 'announcement':
        return <MegaphoneIcon className="w-5 h-5 text-purple-500" />;
      case 'warning':
        return <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />;
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XMarkIcon className="w-5 h-5 text-red-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => {
          console.log('Notification button clicked');
          setIsOpen(!isOpen);
        }}
        className="relative p-2 text-gray-500 hover:text-gray-700 transition-all"
      >
        {unreadCount > 0 ? (
          <BellSolid className="w-6 h-6" style={{color: '#DA528C'}} />
        ) : (
          <BellIcon className="w-6 h-6 text-gray-600" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold text-white animate-pulse pointer-events-none" style={{backgroundColor: '#DA528C'}}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100]"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100" style={{background: 'linear-gradient(to right, #E18DB710, #AC6CA110)'}}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold" style={{color: '#6C4225'}}>Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full" style={{backgroundColor: '#DA528C20', color: '#DA528C'}}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <>
                      <button
                        onClick={markAllAsRead}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="Mark all as read"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={clearAll}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="Clear all"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 20, opacity: 0 }}
                      className={`p-4 hover:bg-gray-50 transition cursor-pointer relative ${
                        !notification.read ? 'bg-blue-50/30' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {!notification.read && (
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{backgroundColor: '#82993D'}}></span>
                      )}
                      
                      <div className="flex gap-3 ml-4">
                        <div className="flex-shrink-0 pt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          {notification.link ? (
                            <Link href={notification.link}>
                              <h4 className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition">
                                {notification.title}
                              </h4>
                            </Link>
                          ) : (
                            <h4 className="text-sm font-semibold text-gray-900">
                              {notification.title}
                            </h4>
                          )}
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <InboxIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No notifications</p>
                  <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-100 bg-gray-50">
                <Link
                  href="/notifications"
                  className="block text-center text-sm font-medium transition" 
                  style={{color: '#82993D'}}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#DA528C'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#82993D'}
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}