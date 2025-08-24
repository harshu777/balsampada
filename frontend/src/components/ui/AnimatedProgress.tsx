'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AnimatedProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export default function AnimatedProgress({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'blue',
  size = 'md',
  animated = true
}: AnimatedProgressProps) {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);
  const percentage = Math.min((displayValue / max) * 100, 100);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setDisplayValue(value), 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, animated]);

  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    gradient: 'from-blue-600 via-purple-600 to-pink-600'
  };

  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showPercentage && (
            <motion.span
              key={percentage}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-sm font-bold text-gray-900"
            >
              {Math.round(percentage)}%
            </motion.span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizes[size]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: animated ? 1 : 0,
            ease: "easeOut"
          }}
          className={`h-full bg-gradient-to-r ${colors[color]} rounded-full relative overflow-hidden`}
        >
          {animated && (
            <motion.div
              animate={{
                x: ['0%', '100%'],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute inset-0 bg-white/20 w-1/4 -skew-x-12"
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}