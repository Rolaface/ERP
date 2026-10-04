import React from "react";

interface DayOffBadgeProps {
  letter: string;
  color: string;
  title: string;
  className?: string;
}

const DayOffBadge: React.FC<DayOffBadgeProps> = ({
  letter,
  color,
  title,
  className = "",
}) => (
  <span
    title={title}
    className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded px-1 text-[10px] font-bold ${className}`}
    style={{
      color,
      background: `color-mix(in srgb, ${color} 16%, transparent)`,
    }}
  >
    {letter}
  </span>
);

export default DayOffBadge;