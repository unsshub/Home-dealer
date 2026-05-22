import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-secondary text-secondary-foreground',
    success: 'bg-success-bg text-success border-success/30',
    warning: 'bg-warning-bg text-warning border-warning/30',
    danger: 'bg-danger-bg text-danger border-danger/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
