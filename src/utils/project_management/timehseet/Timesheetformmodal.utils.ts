import { DAY_OFF_TONE } from "../../../views/project_management/timesheet/components/DayOffChip";
import { WEEKLY_OFF_COLOR } from "../../../views/project_management/timesheet/components/Weeklyoff";
import type { DayOff } from "../../../views/project_management/timesheet/components/dayOff.types";
import type {
  DateRange,
  TimesheetLine,
} from "../../../types/Project_Management/Timesheet/form/Timesheetformmodal";

export const MODAL_SIZE = {
  width: "min(1400px, 96vw)",
  height: "min(750px, 92vh)",
} as const;

export const SUMMARY_WIDTH_CLASS = "w-full lg:w-[184px]";

export const TIMESHEET_FIELD_STYLES = `.ts-field input,.ts-info input{height:36px !important;box-sizing:border-box !important;}.ts-picker > div > button{height:36px !important;box-sizing:border-box !important;}.ts-has-off > div > button{padding-right:36px !important;}`;

const WEEKLY_OFF_LABEL = "Weekly Off";

export const dayOffLabel = (off: DayOff) =>
  off.kind === "weekly_off" ? WEEKLY_OFF_LABEL : off.label;

export const dayOffColor = (off: DayOff) =>
  off.kind === "weekly_off"
    ? WEEKLY_OFF_COLOR
    : `var(${DAY_OFF_TONE[off.kind]})`;

export const dayOffLetter = (off: DayOff) =>
  off.kind === "weekly_off" ? "W" : off.kind === "leave" ? "L" : "H";

export const DAY_OFF_LEGEND = [
  {
    letter: "H",
    label: "Holiday",
    color: `var(${DAY_OFF_TONE.company_holiday})`,
  },
  { letter: "L", label: "Leave", color: `var(${DAY_OFF_TONE.leave})` },
  { letter: "W", label: WEEKLY_OFF_LABEL, color: WEEKLY_OFF_COLOR },
];

export const todayYmd = () => new Date().toISOString().slice(0, 10);

export const formatDateLabel = (ymd: string) =>
  new Date(`${ymd}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export const formatLongDate = (ymd: string) =>
  new Date(`${ymd}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";

type DateLine = Pick<TimesheetLine, "date" | "to_date">;

export const getLinesRange = (
  lines: DateLine[],
  fallback?: string,
  extra?: DateRange | null,
): DateRange => {
  const starts = [...lines.map((l) => l.date), extra?.from]
    .filter(Boolean)
    .sort() as string[];
  const ends = [...lines.map((l) => l.to_date), extra?.to]
    .filter(Boolean)
    .sort() as string[];
  const from = starts[0] ?? fallback ?? todayYmd();
  return { from, to: ends[ends.length - 1] ?? fallback ?? from };
};

export const formatRangeLabel = (lines: DateLine[], fallback?: string) => {
  const { from, to } = getLinesRange(lines, fallback);
  return from === to
    ? formatLongDate(from)
    : `${formatLongDate(from)} – ${formatLongDate(to)}`;
};