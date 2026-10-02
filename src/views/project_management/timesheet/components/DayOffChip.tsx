import React from "react";
import type { DayOff } from "./dayOff.types";
import { WEEKLY_OFF_COLOR, WEEKLY_OFF_TAG_BG } from "./Weeklyoff";

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
  const isWeeklyOff = off.kind === "weekly_off";
  const tone = DAY_OFF_TONE[off.kind];
  const short = SHORT[off.kind];
  const color = isWeeklyOff ? WEEKLY_OFF_COLOR : `var(${tone})`;
  const background = isWeeklyOff
    ? WEEKLY_OFF_TAG_BG
    : `color-mix(in srgb, var(${tone}) 15%, transparent)`;
  const label = isWeeklyOff ? "Weekly Off" : off.label;
  const title = isWeeklyOff
    ? `Weekly Off (${off.label})`
    : `${off.label}${off.halfDay ? " (Half day)" : ""}`;

  return (
    <div
      title={title}
      className={`mx-auto flex h-7 w-full items-center justify-center truncate rounded-md px-1 text-[10px] font-bold ${className}`}
      style={{ background, color }}
    >
      {compact ? short : label}
    </div>
  );
};

export default DayOffChip;