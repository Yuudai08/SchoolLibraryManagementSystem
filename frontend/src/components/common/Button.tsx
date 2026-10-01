import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 ease-out active:scale-[0.98] active:translate-y-[0.5px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:active:translate-y-0 select-none cursor-pointer tracking-tight';

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-brand-900 hover:bg-brand-950 text-white shadow-soft hover:shadow-card focus-visible:ring-brand-500 border border-brand-800/40',
    secondary: 'bg-stone-800 hover:bg-stone-900 text-white shadow-soft focus-visible:ring-stone-600 border border-stone-700/50',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-soft focus-visible:ring-rose-500 border border-rose-700/50',
    outline: 'border border-stone-300/90 bg-white hover:bg-stone-50/80 text-stone-700 focus-visible:ring-brand-500 shadow-soft',
    ghost: 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80 focus-visible:ring-stone-400',
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
