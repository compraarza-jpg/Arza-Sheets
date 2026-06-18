import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
  key?: React.Key;
}

export default function Skeleton({ className = 'h-4 w-full', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-md bg-stone-200 ${className}`}
        />
      ))}
    </>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-surface p-4 shadow-xs ${className}`}>
      <Skeleton className="mb-3 h-3 w-1/3" />
      <Skeleton className="mb-2 h-6 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex gap-3 py-3">
      {Array.from({ length: cols }, (_, i) => i).map(i => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}
