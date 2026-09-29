import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { showApiError } from "../../../../utils/alert";
import { getTimesheetHours } from "../../../../api/project/timesheet/timesheet.api";
import type { TimesheetHoursEntry } from "../../../../types/Project_Management/Timesheet/Table/timesheet.types";
import TimesheetMatrix from "./Timesheetmatrix";
import { TIMESHEET_VIEW_OPTIONS } from "./imesheetViews"
import ViewSelector from "../../../project_management/ViewSelector";

import DateRangeFilter from "../../../../components/ui/modal/DateRangeFilter";

type ViewMode = "month" | "week" | "day" | "list" | "year";

interface Props {
  canViewAll: boolean;
  onSwitchToList: () => void;
}

interface DayEvent {
  id: string;
  label: string;
  hours: number;
  draftHours: number;
  items: TimesheetHoursEntry[];
}

const VIEWS: { label: string; value: ViewMode }[] = [
  { label: "Month", value: "month" },
  { label: "Week", value: "week" },
  { label: "Day", value: "day" },
  { label: "List", value: "list" },
];

const ADMIN_VIEWS: { label: string; value: ViewMode }[] = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
];

const WEEK_START_DAY = 1;
const DAYS_IN_WEEK = 7;
const MONTHS_IN_YEAR = 12;
const HOURS_DECIMALS = 2;
const DRAFT_DOCSTATUS = 0;
const MAX_CHIPS_MONTH = 2;
const APPROVED_TONE = "--success";
const DRAFT_TONE = "--warning";
const EMPTY_LABEL = "—";
const MAX_RANGE_DAYS = 92; // keeps the admin matrix readable

interface DateRange {
  from: string;
  to: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

const toYMD = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const formatHours = (h: number) => `${+h.toFixed(HOURS_DECIMALS)}h`;

const fromYMD = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const startOfWeek = (d: Date) =>
  addDays(d, -((d.getDay() - WEEK_START_DAY + DAYS_IN_WEEK) % DAYS_IN_WEEK));

const daysBetween = (start: Date, end: Date) => {
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  return days;
};

const getVisibleDays = (view: ViewMode, anchor: Date): Date[] => {
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

const shiftAnchor = (view: ViewMode, anchor: Date, dir: 1 | -1) => {
  if (view === "year") return new Date(anchor.getFullYear() + dir, 0, 1);
  if (view === "day") return addDays(anchor, dir);
  if (view === "week") return addDays(anchor, dir * DAYS_IN_WEEK);
  return new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1);
};

const getTitle = (view: ViewMode, days: Date[], anchor: Date) => {
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

const describeDay = (d: Date) =>
  d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

const projectTask = (e: TimesheetHoursEntry) =>
  [e.project, e.task].filter(Boolean).join(" · ");

const eventTone = (ev: DayEvent) =>
  ev.draftHours > 0 ? DRAFT_TONE : APPROVED_TONE;

const navButton = "rounded-lg bg-primary p-2 text-white hover:opacity-90";
const ghostButton =
  "whitespace-nowrap rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-semibold text-main transition-colors hover:bg-row-hover";

const toneLabel = (ev: DayEvent) => (ev.draftHours > 0 ? "Draft" : "Approved");

const EventChip: React.FC<{ ev: DayEvent }> = ({ ev }) => {
  const tone = eventTone(ev);
  return (
    <div
      title={`${ev.label} · ${formatHours(ev.hours)} · ${toneLabel(ev)}`}
      className="rounded-lg border border-primary/20 bg-primary/5 px-2 py-1.5"
    >
      <div className="flex items-center justify-between gap-1">
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
          style={{
            background: `color-mix(in srgb, var(${tone}) 16%, transparent)`,
            color: `var(${tone})`,
          }}
        >
          {toneLabel(ev)}
        </span>
        <span className="font-mono text-[10px] font-bold text-main">
          {formatHours(ev.hours)}
        </span>
      </div>
      <p className="mt-1 truncate text-[11px] font-semibold text-main">
        {ev.label}
      </p>
    </div>
  );
};

const DayDetail: React.FC<{ events: DayEvent[]; showPrimary: boolean }> = ({
  events,
  showPrimary,
}) => (
  <div className="divide-y divide-[var(--border)]/40">
    {events.map((ev) => (
      <div key={ev.id} className="px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-main">{ev.label}</span>
          <span
            className="font-mono text-xs font-bold"
            style={{ color: `var(${eventTone(ev)})` }}
          >
            {formatHours(ev.hours)}
          </span>
        </div>
        <div className="mt-1 space-y-1">
          {ev.items.map((e, i) => (
            <div
              key={`${e.timesheet}-${i}`}
              className="flex justify-between gap-3 text-[10px] text-muted"
            >
              <span className="min-w-0 break-words">
                {[
                  showPrimary ? projectTask(e) : null,
                  e.timesheet,
                  e.activity_type,
                  e.description,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <span className="shrink-0 font-mono">{formatHours(e.hours)}</span>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const TimesheetCalendar: React.FC<Props> = ({ canViewAll, onSwitchToList }) => {
  const [view, setView] = useState<ViewMode>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  // Custom range (admin only). null = normal period navigation.
  const [range, setRange] = useState<DateRange | null>(null);
  const [entries, setEntries] = useState<TimesheetHoursEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const visibleDays = useMemo(
    () =>
      range
        ? daysBetween(fromYMD(range.from), fromYMD(range.to))
        : getVisibleDays(view, anchor),
    [view, anchor, range],
  );

  // Admin matrix columns: year -> 12 months, month -> days of the month
  // (no padded weeks), everything else -> the visible days.
  const matrixDays = useMemo(() => {
    if (!range && view === "year") {
      return Array.from(
        { length: MONTHS_IN_YEAR },
        (_, i) => new Date(anchor.getFullYear(), i, 1),
      );
    }
    return range || view !== "month"
      ? visibleDays
      : getVisibleDays("list", anchor);
  }, [view, anchor, range, visibleDays]);

  const matrixGranularity: "day" | "month" =
    view === "year" && !range ? "month" : "day";

  const fromDate = toYMD(visibleDays[0]);
  const toDate = toYMD(visibleDays[visibleDays.length - 1]);
  const todayKey = toYMD(new Date());
  const activeDay = view === "day" ? toYMD(anchor) : selectedDay;
  const showMatrix = canViewAll && view !== "list";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSelectedDay(null);
    getTimesheetHours(fromDate, toDate)
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch(showApiError)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fromDate, toDate]);

  const eventsByDay = useMemo(() => {
    const grouped: Record<string, Record<string, DayEvent>> = {};
    entries.forEach((e) => {
      const label = canViewAll
        ? e.employee
        : projectTask(e) || e.activity_type || EMPTY_LABEL;
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
  }, [entries, canViewAll]);

  const rangeTotal = useMemo(
    () => entries.reduce((sum, e) => sum + e.hours, 0),
    [entries],
  );

  const dayTotal = (key: string) =>
    (eventsByDay[key] ?? []).reduce((sum, ev) => sum + ev.hours, 0);

  const title = range
    ? [visibleDays[0], visibleDays[visibleDays.length - 1]]
        .map((d) =>
          d.toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        )
        .join(" – ")
    : getTitle(view, visibleDays, anchor);

  const shift = (dir: 1 | -1) => {
    if (!range) {
      setAnchor(shiftAnchor(view, anchor, dir));
      return;
    }
    const span = visibleDays.length;
    setRange({
      from: toYMD(addDays(fromYMD(range.from), dir * span)),
      to: toYMD(addDays(fromYMD(range.to), dir * span)),
    });
  };

  const goToday = () => {
    setRange(null);
    setAnchor(new Date());
  };

  const handleRangeChange = ({
    from_date,
    to_date,
  }: {
    from_date?: string;
    to_date?: string;
  }) => {
    if (!from_date) {
      setRange(null);
      return;
    }
    const start = fromYMD(from_date);
    const end = fromYMD(to_date ?? from_date);
    const lastAllowed = addDays(start, MAX_RANGE_DAYS - 1);
    setRange({
      from: toYMD(start),
      to: toYMD(end > lastAllowed ? lastAllowed : end),
    });
    setAnchor(start);
  };

  const renderCell = (d: Date, maxChips: number, minHeight: string) => {
    const key = toYMD(d);
    const events = eventsByDay[key] ?? [];
    const total = dayTotal(key);
    const hidden = events.length - maxChips;
    const isOutside = view === "month" && d.getMonth() !== anchor.getMonth();

    return (
      <div
        key={key}
        onClick={() => setSelectedDay(key)}
        onDoubleClick={() => {
          setAnchor(d);
          setView("day");
        }}
        style={{ minHeight }}
        className={[
          "cursor-pointer rounded-lg border bg-card p-2 transition-shadow hover:shadow-md",
          key === activeDay
            ? "border-primary ring-1 ring-primary"
            : "border-transparent",
        ].join(" ")}
      >
        <div className="mb-1.5 flex items-start justify-between">
          <span className="font-mono text-[10px] font-bold text-muted">
            {total > 0 ? formatHours(total) : ""}
          </span>
          <span
            className={[
              "flex h-6 min-w-[24px] items-center justify-center rounded-full px-1 text-sm font-bold",
              key === todayKey
                ? "bg-primary text-white"
                : isOutside
                  ? "text-muted"
                  : "text-main",
            ].join(" ")}
          >
            {d.getDate()}
          </span>
        </div>
        <div className="space-y-1.5">
          {events.slice(0, maxChips).map((ev) => (
            <EventChip key={ev.id} ev={ev} />
          ))}
          {hidden > 0 && (
            <span className="block text-[10px] font-semibold text-primary">
              +{hidden} more
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderGrid = () => (
    <div className="rounded-xl bg-[var(--border)]/15 p-2">
      <div className="mb-2 grid grid-cols-7 gap-2 rounded-lg bg-card py-2">
        {visibleDays.slice(0, DAYS_IN_WEEK).map((d) => (
          <div
            key={d.getDay()}
            className="text-center text-xs font-semibold text-main"
          >
            {d.toLocaleDateString(undefined, { weekday: "short" })}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {visibleDays.map((d) =>
          view === "month"
            ? renderCell(d, MAX_CHIPS_MONTH, "120px")
            : renderCell(d, Infinity, "280px"),
        )}
      </div>
    </div>
  );

  const renderDayCards = (days: Date[]) => {
    const withEvents = days.filter((d) => eventsByDay[toYMD(d)]);
    if (withEvents.length === 0) {
      return (
        <p className="py-10 text-center text-sm text-muted">
          No timesheet entries in this period.
        </p>
      );
    }
    return (
      <div className="space-y-3">
        {withEvents.map((d) => (
          <div
            key={toYMD(d)}
            className="rounded-xl border border-[var(--border)] bg-card"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)]/40 px-3 py-2">
              <span className="text-xs font-bold text-main">
                {describeDay(d)}
              </span>
              <span className="font-mono text-xs font-bold text-primary">
                {formatHours(dayTotal(toYMD(d)))}
              </span>
            </div>
            <DayDetail
              events={eventsByDay[toYMD(d)]}
              showPrimary={canViewAll}
            />
          </div>
        ))}
      </div>
    );
  };

  const panelDay =
    !showMatrix && (view === "month" || view === "week") ? selectedDay : null;
  const panelEvents = panelDay ? (eventsByDay[panelDay] ?? []) : [];

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden p-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)]/40 bg-card px-3 py-2">
        <div className="flex items-center gap-2">
          <button className={ghostButton} onClick={goToday}>
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button className={navButton} onClick={() => shift(-1)}>
            <ChevronLeft size={14} />
          </button>
          <span className="min-w-[190px] text-center text-base font-bold text-main">
            {title}
          </span>
          <button className={navButton} onClick={() => shift(1)}>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold text-main">
            {loading ? "Loading..." : `Total: ${formatHours(rangeTotal)}`}
          </span>
          <div className="flex overflow-hidden rounded-lg border border-[var(--border)]">
            {(canViewAll ? ADMIN_VIEWS : VIEWS).map((v) => (
              <button
                key={v.value}
                onClick={() => {
                  setRange(null);
                  setView(v.value);
                }}
                className={[
                  "px-3 py-1.5 text-xs font-semibold transition-colors",
                  view === v.value && !range
                    ? "bg-primary text-white"
                    : "text-muted hover:text-main",
                ].join(" ")}
              >
                {v.label}
              </button>
            ))}
          </div>
          {canViewAll && (
            <DateRangeFilter
              from={range?.from}
              to={range?.to}
              onChange={handleRangeChange}
            />
          )}
         <ViewSelector
  value="calendar"
  options={TIMESHEET_VIEW_OPTIONS}
  onChange={(m) => m === "table" && onSwitchToList()}
/>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-3">
        <div
          className={[
            "custom-scrollbar min-w-0 flex-1",
            showMatrix ? "overflow-hidden" : "overflow-y-auto",
            loading ? "opacity-60" : "",
          ].join(" ")}
        >
          {showMatrix ? (
            <TimesheetMatrix
              days={matrixDays}
              entries={entries}
              todayKey={todayKey}
              granularity={matrixGranularity}
            />
          ) : null}
          {!showMatrix && (view === "month" || view === "week")
            ? renderGrid()
            : null}
          {!showMatrix && view === "day" ? renderDayCards(visibleDays) : null}
          {view === "list" ? renderDayCards(visibleDays) : null}
        </div>

        {panelDay && (
          <aside className="custom-scrollbar hidden w-72 shrink-0 overflow-y-auto rounded-xl border border-[var(--border)] bg-card lg:block">
            <div className="flex items-center justify-between border-b border-[var(--border)]/40 px-3 py-2">
              <div>
                <p className="text-xs font-bold text-main">
                  {describeDay(new Date(`${panelDay}T00:00:00`))}
                </p>
                <p className="font-mono text-[10px] text-primary">
                  {formatHours(dayTotal(panelDay))}
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-lg leading-none text-muted hover:text-main"
              >
                ×
              </button>
            </div>
            {panelEvents.length > 0 ? (
              <DayDetail events={panelEvents} showPrimary={canViewAll} />
            ) : (
              <p className="px-3 py-6 text-center text-xs text-muted">
                No entries on this day.
              </p>
            )}
          </aside>
        )}
      </div>

      <div className="flex items-center gap-4 text-[10px] font-semibold text-muted">
        <span className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: `var(${APPROVED_TONE})` }}
          />
          Approved
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: `var(${DRAFT_TONE})` }}
          />
          Includes draft
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--border)]" />
          No Entry
        </span>
      </div>
    </div>
  );
};

export default TimesheetCalendar;
