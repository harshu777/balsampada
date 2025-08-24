'use client';

import { motion } from 'framer-motion';
import Lottie from 'lottie-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
  variant?: 'spinner' | 'dots' | 'pulse' | 'book';
}

export default function LoadingSpinner({
  size = 'md',
  text,
  fullScreen = false,
  variant = 'spinner'
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const containerClass = fullScreen 
    ? 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center'
    : 'flex flex-col items-center justify-center p-8';

  const spinnerVariants = {
    spinner: (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizes[size]} border-4 border-blue-600 border-t-transparent rounded-full`}
      />
    ),
    dots: (
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -12, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
            className="w-3 h-3 bg-blue-600 rounded-full"
          />
        ))}
      </div>
    ),
    pulse: (
      <div className="relative">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
          className={`${sizes[size]} bg-blue-600 rounded-full`}
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
          className={`absolute inset-0 ${sizes[size]} bg-blue-600 rounded-full`}
        />
      </div>
    ),
    book: (
      <motion.div
        animate={{
          rotateY: [0, 180, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`${sizes[size]} flex items-center justify-center`}
      >
        <svg
          className="w-full h-full text-blue-600"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
        </svg>
      </motion.div>
    ),
  };

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center">
        {spinnerVariants[variant]}
        {text && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-gray-600 font-medium"
          >
            {text}
          </motion.p>
        )}
      </div>
    </div>
  );
}