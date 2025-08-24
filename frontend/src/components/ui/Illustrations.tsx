'use client';

import { motion } from 'framer-motion';

export const StudyingIllustration = ({ className = "w-64 h-64" }) => (
  <motion.svg
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className={className}
    viewBox="0 0 400 300"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <motion.path
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2, ease: "easeInOut" }}
      d="M100 150 Q 200 100 300 150"
      stroke="#3B82F6"
      strokeWidth="3"
      fill="none"
    />
    <motion.circle
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.5 }}
      cx="200"
      cy="150"
      r="80"
      fill="#DBEAFE"
    />
    <motion.rect
      initial={{ x: -50 }}
      animate={{ x: 0 }}
      transition={{ delay: 0.7 }}
      x="160"
      y="130"
      width="80"
      height="60"
      fill="#3B82F6"
      rx="5"
    />
    <motion.text
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      x="200"
      y="165"
      textAnchor="middle"
      fill="white"
      fontSize="14"
      fontWeight="bold"
    >
      LEARN
    </motion.text>
  </motion.svg>
);

export const NoDataIllustration = ({ className = "w-64 h-64" }) => (
  <motion.svg
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={className}
    viewBox="0 0 400 300"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <motion.g
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      <rect x="120" y="100" width="160" height="120" fill="#F3F4F6" rx="10" />
      <rect x="140" y="120" width="120" height="10" fill="#E5E7EB" rx="5" />
      <rect x="140" y="140" width="80" height="10" fill="#E5E7EB" rx="5" />
      <rect x="140" y="160" width="100" height="10" fill="#E5E7EB" rx="5" />
      <circle cx="200" cy="190" r="15" fill="#9CA3AF" />
    </motion.g>
    <motion.path
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.5, delay: 0.5 }}
      d="M150 250 Q 200 230 250 250"
      stroke="#6B7280"
      strokeWidth="2"
      strokeDasharray="5 5"
    />
  </motion.svg>
);

export const SuccessIllustration = ({ className = "w-64 h-64" }) => (
  <motion.svg
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: "spring", stiffness: 100 }}
    className={className}
    viewBox="0 0 400 300"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <motion.circle
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2 }}
      cx="200"
      cy="150"
      r="100"
      fill="#D1FAE5"
    />
    <motion.path
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      d="M150 150 L180 180 L250 120"
      stroke="#10B981"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
    >
      {[...Array(6)].map((_, i) => (
        <motion.circle
          key={i}
          animate={{
            scale: [0, 1, 0],
            opacity: [1, 0.5, 0],
          }}
          transition={{
            duration: 2,
            delay: 1.2 + i * 0.1,
            repeat: Infinity,
          }}
          cx={200 + Math.cos(i * 60 * Math.PI / 180) * 130}
          cy={150 + Math.sin(i * 60 * Math.PI / 180) * 130}
          r="5"
          fill="#34D399"
        />
      ))}
    </motion.g>
  </motion.svg>
);

export const LearningIllustration = ({ className = "w-full h-full" }) => (
  <motion.svg
    className={className}
    viewBox="0 0 500 400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Books */}
    <motion.g
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <rect x="50" y="250" width="60" height="80" fill="#3B82F6" rx="3" />
      <rect x="55" y="260" width="50" height="5" fill="#DBEAFE" />
      <rect x="55" y="270" width="40" height="3" fill="#DBEAFE" />
    </motion.g>

    {/* Laptop */}
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring" }}
    >
      <rect x="150" y="200" width="200" height="120" fill="#1F2937" rx="5" />
      <rect x="160" y="210" width="180" height="100" fill="#60A5FA" rx="3" />
      <rect x="140" y="320" width="220" height="10" fill="#4B5563" rx="2" />
    </motion.g>

    {/* Floating Elements */}
    <motion.g
      animate={{ y: [0, -20, 0] }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      <circle cx="380" cy="100" r="30" fill="#FBBF24" opacity="0.8" />
      <path
        d="M380 85 L380 105 M370 95 L390 95"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </motion.g>

    {/* Graduation Cap */}
    <motion.g
      initial={{ rotate: -180, opacity: 0 }}
      animate={{ rotate: 0, opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.8 }}
    >
      <path
        d="M250 50 L200 80 L250 110 L300 80 Z"
        fill="#7C3AED"
      />
      <path
        d="M200 80 L200 120 L250 150 L300 120 L300 80"
        stroke="#7C3AED"
        strokeWidth="3"
        fill="none"
      />
    </motion.g>

    {/* Sparkles */}
    {[...Array(5)].map((_, i) => (
      <motion.circle
        key={i}
        initial={{ scale: 0 }}
        animate={{
          scale: [0, 1, 0],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 2,
          delay: 0.8 + i * 0.2,
          repeat: Infinity,
          repeatDelay: 1,
        }}
        cx={100 + i * 80}
        cy={50 + (i % 2) * 30}
        r="3"
        fill="#FBBF24"
      />
    ))}
  </motion.svg>
);

export const TrophyIllustration = ({ className = "w-32 h-32" }) => (
  <motion.svg
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: "spring", stiffness: 100 }}
    className={className}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <motion.path
      d="M100 40 L100 40 Q 60 40 60 80 Q 60 120 100 120 Q 140 120 140 80 Q 140 40 100 40"
      fill="#FCD34D"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1 }}
    />
    <rect x="90" y="120" width="20" height="40" fill="#F59E0B" />
    <rect x="70" y="160" width="60" height="20" fill="#92400E" rx="3" />
    <motion.path
      d="M60 60 L40 60 Q 20 60 20 80 Q 20 100 40 100 L60 100"
      stroke="#FCD34D"
      strokeWidth="8"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    />
    <motion.path
      d="M140 60 L160 60 Q 180 60 180 80 Q 180 100 160 100 L140 100"
      stroke="#FCD34D"
      strokeWidth="8"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    />
    <motion.text
      x="100"
      y="85"
      textAnchor="middle"
      fill="#92400E"
      fontSize="24"
      fontWeight="bold"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
    >
      #1
    </motion.text>
  </motion.svg>
);