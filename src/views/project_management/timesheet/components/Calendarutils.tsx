import type { TimesheetHoursEntry } from "../../../../types/Project_Management/Timesheet/Table/timesheet.types";
import type { DayOffLookup } from "./dayOff.types";

export type ViewMode = "month" | "week" | "day" | "list" | "year";

export interface DayEvent {
  id: string;
  label: string;
  hours: number;
  draftHours: number;
  items: TimesheetHoursEntry[];
}

export interface DateRange {
  from: string;
  to: string;
}

export type DayOff = NonNullable<ReturnType<DayOffLookup["holidayOn"]>>;


export interface DayData {
  eventsByDay: Record<string, DayEvent[]>;
  dayTotal: (key: string) => number;
  dayOffOn: (key: string) => DayOff | undefined;
  isDayOff: (key: string) => boolean;
}

export const VIEWS: { label: string; value: ViewMode }[] = [
  { label: "Month", value: "month" },
  { label: "Week", value: "week" },
  { label: "Day", value: "day" },
  { label: "List", value: "list" },
];

export const ADMIN_VIEWS: { label: string; value: ViewMode }[] = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
];

export const WEEK_START_DAY = 1;
export const DAYS_IN_WEEK = 7;
export const MONTHS_IN_YEAR = 12;
export const HOURS_DECIMALS = 2;
export const DRAFT_DOCSTATUS = 0;
export const APPROVED_TONE = "--success";
export const DRAFT_TONE = "--warning";
export const EMPTY_LABEL = "—";
export const MAX_RANGE_DAYS = 92;

export const pad = (n: number) => String(n).padStart(2, "0");

export const toYMD = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const formatHours = (h: number) => `${+h.toFixed(HOURS_DECIMALS)}h`;

export const fromYMD = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const startOfWeek = (d: Date) =>
  addDays(d, -((d.getDay() - WEEK_START_DAY + DAYS_IN_WEEK) % DAYS_IN_WEEK));

export const daysBetween = (start: Date, end: Date) => {
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  return days;
};

export const getVisibleDays = (view: ViewMode, anchor: Date): Date[] => {
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  const firstOfMonth = new Date(y, m, 1);
  const lastOfMonth = new Date(y, m + 1, 0);

  if (view === "year") {
    return daysBetween(new Date(y, 0, 1), new Date(y, MONTHS_IN_YEAR - 1, 31));
  }
  if (view === "day") return [anchor];
  if (view === "week") {
    const start = startOfWeek(anchor);
    return daysBetween(start, addDays(start, DAYS_IN_WEEK - 1));
  }
  if (view === "list") return daysBetween(firstOfMonth, lastOfMonth);
  return daysBetween(
    startOfWeek(firstOfMonth),
    addDays(startOfWeek(lastOfMonth), DAYS_IN_WEEK - 1),
  );
};

export const shiftAnchor = (view: ViewMode, anchor: Date, dir: 1 | -1) => {
  if (view === "year") return new Date(anchor.getFullYear() + dir, 0, 1);
  if (view === "day") return addDays(anchor, dir);
  if (view === "week") return addDays(anchor, dir * DAYS_IN_WEEK);
  return new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1);
};

export const getTitle = (view: ViewMode, days: Date[], anchor: Date) => {
  if (view === "year") return String(anchor.getFullYear());
  if (view === "day") {
    return anchor.toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (view === "week") {
    const short: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
    };
    return `${days[0].toLocaleDateString(undefined, short)} – ${days[
      days.length - 1
    ].toLocaleDateString(undefined, { ...short, year: "numeric" })}`;
  }
  return anchor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
};

export const describeDay = (d: Date) =>
  d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

export const projectTask = (e: TimesheetHoursEntry) =>
  [e.project, e.task].filter(Boolean).join(" · ");

export const eventTone = (ev: DayEvent) =>
  ev.draftHours > 0 ? DRAFT_TONE : APPROVED_TONE;

export const toneLabel = (ev: DayEvent) =>
  ev.draftHours > 0 ? "Draft" : "Approved";

export const draftIds = (items: TimesheetHoursEntry[]) => [
  ...new Set(
    items
      .filter((e) => e.docstatus === DRAFT_DOCSTATUS)
      .map((e) => e.timesheet),
  ),
];


export const buildEventsByDay = (
  entries: TimesheetHoursEntry[],
  canViewAll: boolean,
): Record<string, DayEvent[]> => {
  const grouped: Record<string, Record<string, DayEvent>> = {};
  entries.forEach((e) => {
 const label = canViewAll
  ? e.employee
  : e.description || e.activity_type || EMPTY_LABEL;
    const day = (grouped[e.date] ??= {});
    const ev = (day[label] ??= {
      id: label,
      label,
      hours: 0,
      draftHours: 0,
      items: [],
    });
    ev.hours += e.hours;
    if (e.docstatus === DRAFT_DOCSTATUS) ev.draftHours += e.hours;
    ev.items.push(e);
  });
  return Object.fromEntries(
    Object.entries(grouped).map(([date, evs]) => [
      date,
      Object.values(evs).sort((a, b) => b.hours - a.hours),
    ]),
  );
};


export const tintStyle = (tone: string, pct = 16) => ({
  background: `color-mix(in srgb, var(${tone}) ${pct}%, transparent)`,
  color: `var(${tone})`,
});