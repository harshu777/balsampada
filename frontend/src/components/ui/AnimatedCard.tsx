'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  gradient?: boolean;
  gradientColors?: string;
}

export default function AnimatedCard({
  children,
  className = '',
  delay = 0,
  hover = true,
  gradient = false,
  gradientColors = 'from-blue-400 to-purple-600'
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay,
        type: "spring",
        stiffness: 100
      }}
      whileHover={hover ? { 
        y: -8,
        transition: { duration: 0.2 }
      } : {}}
      className={`relative group ${className}`}
    >
      {gradient && (
        <div 
          className={`absolute inset-0 bg-gradient-to-r ${gradientColors} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl blur-xl`}
        />
      )}
      <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
}