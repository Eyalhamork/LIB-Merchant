// components/ui/badge.tsx
import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'default';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export default function Badge({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-success-100 text-success-800',
    danger: 'bg-danger-100 text-danger-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const dotVariants = {
    primary: 'bg-primary-600',
    success: 'bg-success-600',
    danger: 'bg-danger-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-600',
    default: 'bg-gray-600',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotVariants[variant])} />
      )}
      {children}
    </span>
  );
}
