import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-stone-200/70 rounded-md ${className}`}
      aria-hidden="true"
    />
  );
};

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="w-full divide-y divide-stone-100 p-4">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1 max-w-xs">
              <Skeleton className="h-3.5 w-3/4 rounded" />
              <Skeleton className="h-2.5 w-1/2 rounded" />
            </div>
          </div>
          {Array.from({ length: cols - 2 }).map((_, cIdx) => (
            <Skeleton key={cIdx} className="h-3 w-20 hidden sm:block rounded" />
          ))}
          <Skeleton className="h-6 w-16 rounded-md shrink-0" />
        </div>
      ))}
    </div>
  );
};

export const KpiCardSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl p-5 border border-stone-200/80 shadow-soft flex items-start justify-between"
        >
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-7 w-16 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
          <Skeleton className="w-10 h-10 rounded-xl shrink-0 ml-4" />
        </div>
      ))}
    </div>
  );
};
