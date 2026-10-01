import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  size = 'md',
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-emerald-50/80 text-emerald-800 border-emerald-200/90 shadow-[0_1px_2px_rgba(16,185,129,0.06)]',
    warning: 'bg-amber-50/80 text-amber-800 border-amber-200/90 shadow-[0_1px_2px_rgba(245,158,11,0.06)]',
    danger: 'bg-rose-50/80 text-rose-800 border-rose-200/90 shadow-[0_1px_2px_rgba(244,63,94,0.06)]',
    info: 'bg-brand-50 text-brand-800 border-brand-200/90 shadow-[0_1px_2px_rgba(43,108,176,0.06)]',
    neutral: 'bg-stone-100/80 text-stone-700 border-stone-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
    purple: 'bg-violet-50/80 text-violet-800 border-violet-200/90 shadow-[0_1px_2px_rgba(139,92,246,0.06)]',
  };

  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-[11px] font-medium' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border tracking-tight transition-colors ${variantStyles[variant]} ${sizeStyles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
        variant === 'success' ? 'bg-emerald-500 ring-2 ring-emerald-200/60' :
        variant === 'warning' ? 'bg-amber-500 ring-2 ring-amber-200/60' :
        variant === 'danger' ? 'bg-rose-500 ring-2 ring-rose-200/60' :
        variant === 'info' ? 'bg-brand-500 ring-2 ring-brand-200/60' :
        variant === 'purple' ? 'bg-violet-500 ring-2 ring-violet-200/60' : 'bg-stone-400 ring-2 ring-stone-200/60'
      }`} />
      <span>{children}</span>
    </span>
  );
};
