'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  Calendar,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  DollarSign,
  BarChart,
  Award,
  Video,
  PlusCircle,
  GraduationCap,
  ClipboardList
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  roles?: string[];
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    roles: ['student', 'teacher', 'admin']
  },
  {
    label: 'My Classes',
    href: '/classes/enrolled',
    icon: BookOpen,
    roles: ['student']
  },
  {
    label: 'Browse Classes',
    href: '/classes',
    icon: GraduationCap,
    roles: ['student']
  },
  {
    label: 'Assignments',
    href: '/assignments',
    icon: FileText,
    roles: ['student']
  },
  {
    label: 'Schedule',
    href: '/schedule',
    icon: Calendar,
    roles: ['student', 'teacher']
  },
  {
    label: 'My Classes',
    href: '/teacher/classes',
    icon: BookOpen,
    roles: ['teacher']
  },
  {
    label: 'Create Class',
    href: '/teacher/classes/create',
    icon: PlusCircle,
    roles: ['teacher']
  },
  {
    label: 'Assignments',
    href: '/teacher/assignments',
    icon: ClipboardList,
    roles: ['teacher']
  },
  {
    label: 'Students',
    href: '/teacher/students',
    icon: Users,
    roles: ['teacher']
  },
  {
    label: 'Analytics',
    href: '/teacher/analytics',
    icon: BarChart,
    roles: ['teacher']
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
    roles: ['admin']
  },
  {
    label: 'Classes',
    href: '/admin/classes',
    icon: BookOpen,
    roles: ['admin']
  },
  {
    label: 'Payments',
    href: '/admin/payments',
    icon: DollarSign,
    roles: ['admin']
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart,
    roles: ['admin']
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['student', 'teacher', 'admin']
  }
];

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const filteredNavItems = navigationItems.filter(
    item => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center justify-between px-4 border-b">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <GraduationCap className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Balsampada</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t p-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="bg-white shadow-sm border-b">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-6 w-6 text-gray-500" />
              </button>

              <div className="flex-1" />

              <div className="flex items-center space-x-4">
                <button className="relative p-2 text-gray-500 hover:text-gray-700">
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500" />
                </button>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.role}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <User className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}