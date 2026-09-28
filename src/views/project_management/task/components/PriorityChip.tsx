import React from "react";

const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
  Low: { bg: "#F3F4F6", color: "#6B7280" },
  Medium: { bg: "#DBEAFE", color: "#2563EB" },
  High: { bg: "#FEF3C7", color: "#B45309" },
  Urgent: { bg: "#FEE2E2", color: "#DC2626" },
};

interface PriorityChipProps {
  priority: string;
}

const PriorityChip: React.FC<PriorityChipProps> = ({ priority }) => {
  const style = PRIORITY_STYLE[priority] ?? PRIORITY_STYLE.Low;

  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-[1px] text-[9px] font-semibold leading-tight whitespace-nowrap"
      style={{ background: style.bg, color: style.color }}
    >
      {priority}
    </span>
  );
};

export default PriorityChip;