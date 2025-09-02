'use client';

import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

// Soft Glass Card Component
interface SoftGlassCardProps extends HTMLMotionProps<"div"> {
  variant?: 'default' | 'gradient' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  blur?: boolean;
  children: React.ReactNode;
}

export const SoftGlassCard = forwardRef<HTMLDivElement, SoftGlassCardProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md', 
    blur = false, 
    children, 
    ...props 
  }, ref) => {
    const baseStyles = "relative overflow-hidden transition-all duration-300";
    
    const variants = {
      default: "bg-white/80 backdrop-blur-sm border border-white/20 shadow-soft-lg",
      gradient: "bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md border border-white/30 shadow-soft-xl",
      glass: "bg-white/10 backdrop-blur-lg border border-white/20 shadow-soft-2xl"
    };
    
    const sizes = {
      sm: "p-4 rounded-2xl",
      md: "p-6 rounded-3xl", 
      lg: "p-8 rounded-4xl"
    };
    
    return (
      <motion.div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          blur && "backdrop-blur-xl",
          "hover:shadow-soft-2xl hover:scale-[1.02]",
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        {...props}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-inherit pointer-events-none" />
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    );
  }
);
SoftGlassCard.displayName = "SoftGlassCard";

// Soft Button Component
interface SoftButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'glass';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  glow?: boolean;
  children: React.ReactNode;
}

export const SoftButton = forwardRef<HTMLButtonElement, SoftButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    glow = false, 
    children, 
    ...props 
  }, ref) => {
    const baseStyles = "relative font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-soft-lg hover:shadow-soft-xl hover:from-primary-600 hover:to-primary-700",
      secondary: "bg-gradient-to-r from-secondary-500 to-secondary-600 text-white shadow-soft-lg hover:shadow-soft-xl hover:from-secondary-600 hover:to-secondary-700",
      accent: "bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-soft-lg hover:shadow-soft-xl hover:from-accent-600 hover:to-accent-700",
      ghost: "bg-white/50 backdrop-blur-sm text-neutral-700 border border-white/30 shadow-soft-md hover:bg-white/70 hover:shadow-soft-lg",
      glass: "bg-white/20 backdrop-blur-md text-neutral-800 border border-white/30 shadow-soft-lg hover:bg-white/30 hover:shadow-soft-xl"
    };
    
    const sizes = {
      xs: "px-3 py-1.5 text-xs rounded-lg",
      sm: "px-4 py-2 text-sm rounded-xl",
      md: "px-6 py-3 text-base rounded-2xl",
      lg: "px-8 py-4 text-lg rounded-2xl"
    };
    
    return (
      <motion.button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          glow && "shadow-glow-md hover:shadow-glow-lg",
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        {...props}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-inherit opacity-0 hover:opacity-100 transition-opacity duration-300" />
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </motion.button>
    );
  }
);
SoftButton.displayName = "SoftButton";

// Soft Input Component
interface SoftInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'glass';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const SoftInput = forwardRef<HTMLInputElement, SoftInputProps>(
  ({ 
    className, 
    variant = 'default', 
    icon, 
    iconPosition = 'left', 
    ...props 
  }, ref) => {
    const baseStyles = "w-full transition-all duration-300 focus:outline-none placeholder:text-neutral-400";
    
    const variants = {
      default: "bg-white/80 backdrop-blur-sm border border-white/30 shadow-inner-soft focus:shadow-soft-lg focus:border-primary-300 focus:bg-white/90",
      glass: "bg-white/20 backdrop-blur-md border border-white/30 shadow-inner-soft focus:shadow-soft-lg focus:border-white/50 focus:bg-white/30 text-neutral-800"
    };
    
    const inputClasses = cn(
      baseStyles,
      variants[variant],
      icon && iconPosition === 'left' && "pl-12",
      icon && iconPosition === 'right' && "pr-12",
      !icon && "px-4",
      "py-3 rounded-2xl",
      className
    );
    
    if (icon) {
      return (
        <div className="relative">
          {iconPosition === 'left' && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400">
              {icon}
            </div>
          )}
          <input ref={ref} className={inputClasses} {...props} />
          {iconPosition === 'right' && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400">
              {icon}
            </div>
          )}
        </div>
      );
    }
    
    return <input ref={ref} className={inputClasses} {...props} />;
  }
);
SoftInput.displayName = "SoftInput";

// Soft Badge Component
interface SoftBadgeProps extends HTMLMotionProps<"span"> {
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger';
  size?: 'xs' | 'sm' | 'md';
  glow?: boolean;
  children: React.ReactNode;
}

export const SoftBadge = forwardRef<HTMLSpanElement, SoftBadgeProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'sm', 
    glow = false, 
    children, 
    ...props 
  }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-300";
    
    const variants = {
      primary: "bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 border border-primary-300",
      secondary: "bg-gradient-to-r from-secondary-100 to-secondary-200 text-secondary-800 border border-secondary-300",
      accent: "bg-gradient-to-r from-accent-100 to-accent-200 text-accent-800 border border-accent-300",
      success: "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300",
      warning: "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300",
      danger: "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300"
    };
    
    const sizes = {
      xs: "px-2 py-0.5 text-2xs rounded-lg",
      sm: "px-3 py-1 text-xs rounded-xl",
      md: "px-4 py-1.5 text-sm rounded-2xl"
    };
    
    return (
      <motion.span
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          glow && "shadow-glow-sm",
          className
        )}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        {...props}
      >
        {children}
      </motion.span>
    );
  }
);
SoftBadge.displayName = "SoftBadge";

// Soft Progress Component
interface SoftProgressProps {
  value: number;
  max?: number;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const SoftProgress: React.FC<SoftProgressProps> = ({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  className
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const variants = {
    primary: "from-primary-400 to-primary-600",
    secondary: "from-secondary-400 to-secondary-600", 
    accent: "from-accent-400 to-accent-600"
  };
  
  const sizes = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4"
  };
  
  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "w-full bg-neutral-200 rounded-full overflow-hidden shadow-inner-soft",
        sizes[size]
      )}>
        <motion.div
          className={cn(
            "h-full bg-gradient-to-r rounded-full shadow-soft-sm",
            variants[variant]
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      {showLabel && (
        <motion.span 
          className="absolute right-0 -top-6 text-xs font-medium text-neutral-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {Math.round(percentage)}%
        </motion.span>
      )}
    </div>
  );
};

// Soft Loading Spinner
interface SoftSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

export const SoftSpinner: React.FC<SoftSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className
}) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };
  
  const variants = {
    primary: "border-primary-200 border-t-primary-600",
    secondary: "border-secondary-200 border-t-secondary-600",
    accent: "border-accent-200 border-t-accent-600"
  };
  
  return (
    <motion.div
      className={cn(
        "border-2 rounded-full animate-spin",
        sizes[size],
        variants[variant],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
};

// Soft Tooltip (bonus component)
interface SoftTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const SoftTooltip: React.FC<SoftTooltipProps> = ({
  content,
  children,
  position = 'top'
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  
  const positions = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2", 
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2"
  };
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <motion.div
          className={cn(
            "absolute z-50 px-3 py-2 bg-neutral-800 text-white text-sm rounded-xl shadow-soft-lg backdrop-blur-sm",
            positions[position]
          )}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          {content}
          <div className="absolute w-2 h-2 bg-neutral-800 rotate-45 -z-10
            data-[position=top]:top-full data-[position=top]:left-1/2 data-[position=top]:transform data-[position=top]:-translate-x-1/2 data-[position=top]:-translate-y-1/2
            data-[position=bottom]:bottom-full data-[position=bottom]:left-1/2 data-[position=bottom]:transform data-[position=bottom]:-translate-x-1/2 data-[position=bottom]:translate-y-1/2
            data-[position=left]:left-full data-[position=left]:top-1/2 data-[position=left]:transform data-[position=left]:-translate-x-1/2 data-[position=left]:-translate-y-1/2
            data-[position=right]:right-full data-[position=right]:top-1/2 data-[position=right]:transform data-[position=right]:translate-x-1/2 data-[position=right]:-translate-y-1/2"
            data-position={position}
          />
        </motion.div>
      )}
    </div>
  );
};