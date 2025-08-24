'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedBadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  pulse?: boolean;
  icon?: ReactNode;
  rounded?: boolean;
}

export default function AnimatedBadge({
  children,
  variant = 'primary',
  size = 'md',
  animated = true,
  pulse = false,
  icon,
  rounded = true
}: AnimatedBadgeProps) {
  const variants = {
    primary: 'bg-blue-100 text-blue-800 border-blue-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-purple-100 text-purple-800 border-purple-200',
    gradient: 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  const roundedClass = rounded ? 'rounded-full' : 'rounded-md';

  return (
    <motion.span
      initial={animated ? { scale: 0, opacity: 0 } : {}}
      animate={animated ? { scale: 1, opacity: 1 } : {}}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      className={`
        inline-flex items-center font-medium border
        ${variants[variant]}
        ${sizes[size]}
        ${roundedClass}
        ${pulse ? 'animate-pulse' : ''}
      `}
    >
      {icon && (
        <motion.span
          initial={{ rotate: -180 }}
          animate={{ rotate: 0 }}
          transition={{ delay: 0.2 }}
          className="mr-1.5"
        >
          {icon}
        </motion.span>
      )}
      {children}
    </motion.span>
  );
}