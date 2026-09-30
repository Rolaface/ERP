import React from "react";
import type { DayOff } from "./dayOff.types";

export const DAY_OFF_TONE = {
  company_holiday: "--info",
  weekly_off: "--border",
  leave: "--danger",
} as const;

const SHORT = {
  company_holiday: "H",
  weekly_off: "W",
  leave: "L",
} as const;

const DayOffChip: React.FC<{
  off: DayOff;
  compact?: boolean;
  className?: string;
}> = ({ off, compact, className = "" }) => {
  const tone = DAY_OFF_TONE[off.kind];
  const short = SHORT[off.kind];
  return (
    <div
      title={`${off.label}${off.halfDay ? " (Half day)" : ""}`}
      className={`mx-auto flex h-7 w-full items-center justify-center truncate rounded-md px-1 text-[10px] font-bold ${className}`}
      style={{
        background: `color-mix(in srgb, var(${tone}) 15%, transparent)`,
        color: `var(${tone})`,
      }}
    >
      {compact ? short : `${off.halfDay ? "½ " : ""}${off.label}`}
    </div>
  );
};

export default DayOffChip;