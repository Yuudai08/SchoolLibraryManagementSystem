import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
  label,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 gap-2.5 text-slate-500 ${className}`}>
      <Loader2 className={`${sizeMap[size]} animate-spin text-indigo-600`} />
      {label && <p className="text-xs font-medium text-slate-600">{label}</p>}
    </div>
  );
};
