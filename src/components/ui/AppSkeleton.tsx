import React from "react";

interface AppSkeletonProps {
  rows?: number;
}

const AppSkeleton: React.FC<AppSkeletonProps> = ({ rows = 5 }) => {
  return (
    <div className="flex flex-col gap-3 p-4 w-full">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-8 w-32 rounded-lg skeleton-shimmer" />
        <div className="h-8 w-24 rounded-lg skeleton-shimmer" />
        <div className="h-8 w-20 rounded-lg skeleton-shimmer" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="h-12 w-full rounded-lg skeleton-shimmer"
            style={{ width: `${85 - (idx % 3) * 15}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export default AppSkeleton;