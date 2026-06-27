import React from 'react';

interface ShimmerProps {
  className?: string;
}

export function Shimmer({ className = 'h-4 w-full' }: ShimmerProps) {
  return (
    <div className={`relative overflow-hidden bg-gray-100 rounded-lg ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-3xl border border-gray-100 p-4 space-y-4">
      <Shimmer className="aspect-square w-full rounded-2xl" />
      <div className="space-y-2">
        <Shimmer className="h-3.5 w-1/3" />
        <Shimmer className="h-5 w-5/6" />
        <Shimmer className="h-4 w-1/2" />
      </div>
      <div className="pt-2 flex gap-2">
        <Shimmer className="h-10 flex-1 rounded-xl" />
        <Shimmer className="h-10 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center space-y-3 p-4 bg-white rounded-2xl border border-gray-50">
      <Shimmer className="h-16 w-16 rounded-full" />
      <Shimmer className="h-4 w-20" />
    </div>
  );
}
