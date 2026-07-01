import React from "react";

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 3, cols = 6 }) => {
  return (
    <div className="bg-card rounded-lg p-2 shadow-sm w-full">
      {/* Header */}
      <div className="flex gap-2 px-2 py-2 border-b border-theme mb-1">
        <div className="h-3 w-6 rounded skeleton-shimmer shrink-0" />
        {Array.from({ length: cols - 1 }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded skeleton-shimmer"
            style={{ flex: i === 0 ? 2 : 1 }}
          />
        ))}
        <div className="h-3 w-8 rounded skeleton-shimmer shrink-0" />
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-2 px-2 py-1.5 border-b border-theme/40"
          style={{ opacity: 1 - rowIdx * 0.2 }}
        >
          <div className="h-[26px] w-6 rounded skeleton-shimmer shrink-0" />
          {Array.from({ length: cols - 1 }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="h-[26px] rounded skeleton-shimmer"
              style={{ flex: colIdx === 0 ? 2 : 1 }}
            />
          ))}
          <div className="h-[26px] w-8 rounded skeleton-shimmer shrink-0" />
        </div>
      ))}

      {/* Add Item button */}
      <div className="mt-3 h-7 w-24 rounded skeleton-shimmer" />
    </div>
  );
};

export default TableSkeleton;