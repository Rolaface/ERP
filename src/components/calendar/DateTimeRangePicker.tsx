import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { DAY_OFF_TONE } from "../../views/project_management/timesheet/components/DayOffChip";
import { WEEKLY_OFF_COLOR } from "../../views/project_management/timesheet/components/Weeklyoff";
import type { DayOff } from "../../views/project_management/timesheet/components/dayOff.types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const POPOVER_GAP = 6;
const VIEWPORT_MARGIN = 8;

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parseYMD(s: string) {
  return new Date(`${s}T00:00:00`);
}
function calDays(year: number, month: number) {
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(first).fill(null);
  for (let i = 1; i <= total; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
function fmtDate(s?: string) {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return `${d} ${MONTHS[+m - 1].slice(0, 3)} ${y}`;
}
function daysBetween(from: string, to: string) {
  if (!from || !to) return 1;
  return Math.round((parseYMD(to).getTime() - parseYMD(from).getTime()) / 86400000) + 1;
}

export function calcDurationHours(from: string, to: string): number {
  if (!from || !to) return 0;
  const [h1, m1] = from.split(":").map(Number);
  const [h2, m2] = to.split(":").map(Number);
  let diff = h2 * 60 + m2 - (h1 * 60 + m1);
  if (diff < 0) diff += 24 * 60;
  return Math.round((diff / 60) * 100) / 100;
}

export function formatTime12h(time24: string): string {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  let h = Number(hStr);
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${String(mStr ?? "00").padStart(2, "0")} ${period}`;
}

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function addMinutes(time24: string, minutes: number): string {
  const total = Math.max(0, Math.min(23 * 60 + 59, toMinutes(time24) + minutes));
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
function buildTimeOptions(intervalMinutes: number): string[] {
  const count = Math.floor((24 * 60) / intervalMinutes);
  return Array.from({ length: count }, (_, i) => {
    const total = i * intervalMinutes;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  });
}

const dayOffColor = (off: DayOff) =>
  off.kind === "weekly_off"
    ? WEEKLY_OFF_COLOR
    : `var(${DAY_OFF_TONE[off.kind]})`;

const dayOffText = (off: DayOff) =>
  `${off.kind === "weekly_off" ? "Weekly Off" : off.label}${off.halfDay ? " (Half day)" : ""}`;

const DEFAULT_QUICK_DURATIONS = [
  { label: "0.5h", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
  { label: "4h", minutes: 240 },
  { label: "6h", minutes: 360 },
  { label: "8h", minutes: 480 },
];

interface TimeDropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
}

const TimeDropdown: React.FC<TimeDropdownProps> = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>('[data-active="true"]');
    activeEl?.scrollIntoView({ block: "center" });
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: "relative", flex: 1 }}>
      <span style={{ display: "block", fontSize: 10, fontWeight: 600, color: "var(--muted)", marginBottom: 4 }}>
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...timeSelectStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <span>{value ? formatTime12h(value) : "--:--"}</span>
        <ChevronIcon />
      </button>

      {open && (
        <div
          ref={listRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            maxHeight: 200,
            overflowY: "auto",
            background: "var(--card)",
            border: "1.5px solid var(--border)",
            borderRadius: 8,
            boxShadow: "var(--shadow-lg)",
            zIndex: 10,
          }}
        >
          {options.map((t) => (
            <div
              key={t}
              data-active={t === value ? "true" : undefined}
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              style={{
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: t === value ? 700 : 400,
                color: t === value ? "#fff" : "var(--text)",
                background: t === value ? "var(--primary)" : "transparent",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (t !== value) e.currentTarget.style.background = "var(--row-hover)";
              }}
              onMouseLeave={(e) => {
                if (t !== value) e.currentTarget.style.background = "transparent";
              }}
            >
              {formatTime12h(t)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface MonthCalProps {
  year: number;
  month: number;
  selected?: string;
  selectedEnd?: string;
  onDay: (ymd: string) => void;
  onPrev: () => void;
  onNext: () => void;
  disableFuture?: boolean;
  disablePast?: boolean;
  getDayOff?: (ymd: string) => DayOff | undefined;
}

const MonthCal: React.FC<MonthCalProps> = ({
  year, month, selected, selectedEnd, onDay, onPrev, onNext, disableFuture, disablePast, getDayOff,
}) => {
  const cells = calDays(year, month);
  const todayYMD = toYMD(new Date());

  return (
    <div style={{ minWidth: 220 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button type="button" onClick={onPrev} style={navBtn}>‹</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
          {MONTHS[month]} {year}
        </span>
        <button type="button" onClick={onNext} style={navBtn}>›</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
        {DAYS.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: "var(--muted)", padding: "2px 0" }}>
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const ymd = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isSelected = ymd === selected || ymd === selectedEnd;
          const inRange = !!selected && !!selectedEnd && ymd > selected && ymd < selectedEnd;
          const isToday = ymd === todayYMD;
          const disabled =
            (disableFuture && ymd > todayYMD) || (disablePast && ymd < todayYMD);
          const off = getDayOff?.(ymd);
          const offColor = off ? dayOffColor(off) : undefined;

          return (
            <button
              key={i}
              type="button"
              onClick={() => !disabled && onDay(ymd)}
              disabled={disabled}
              title={off ? dayOffText(off) : undefined}
              style={{
                position: "relative",
                border: "none",
                borderRadius: 8,
                padding: "5px 0",
                fontSize: 12,
                fontWeight: isSelected ? 700 : 400,
                cursor: disabled ? "not-allowed" : "pointer",
                background: isSelected
                  ? "var(--primary)"
                  : inRange
                    ? "var(--row-hover)"
                    : offColor
                      ? `color-mix(in srgb, ${offColor} 14%, transparent)`
                      : "transparent",
                color: isSelected
                  ? "#fff"
                  : disabled
                    ? "var(--muted)"
                    : inRange || isToday
                      ? "var(--primary)"
                      : "var(--text)",
                opacity: disabled ? 0.4 : 1,
                outline: isToday && !isSelected ? "1.5px solid var(--input-focus-ring)" : "none",
                transition: "all .12s",
              }}
            >
              {day}
              {off && (
                <span
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: 1,
                    width: 4,
                    height: 4,
                    marginLeft: -2,
                    borderRadius: "50%",
                    background: isSelected ? "#fff" : offColor,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const navBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  border: "1.5px solid var(--border)",
  borderRadius: 7,
  background: "var(--card)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
  color: "var(--text)",
  lineHeight: 1,
};

const LegendDot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
    {label}
  </span>
);

export interface DateTimeRangePickerProps {
  date: string;
  to_date?: string;
  from_time: string;
  to_time: string;
  onApply: (date: string, from_time: string, to_time: string, to_date: string) => void;
  disabled?: boolean;
  intervalMinutes?: number;
  quickDurations?: { label: string; minutes: number }[];
  disableFuture?: boolean;
  disablePast?: boolean;
  placeholder?: string;
  /** Optional: mark holidays / leaves / weekly off on the date grid. */
  getDayOff?: (ymd: string) => DayOff | undefined;
  /** Optional: called with first/last day of the month being viewed (YYYY-MM-DD). */
  onMonthChange?: (from: string, to: string) => void;
}

const DateTimeRangePicker: React.FC<DateTimeRangePickerProps> = ({
  date,
  to_date,
  from_time,
  to_time,
  onApply,
  disabled,
  intervalMinutes = 30,
  quickDurations = DEFAULT_QUICK_DURATIONS,
  disableFuture,
  disablePast,
  placeholder = "Set time",
  getDayOff,
  onMonthChange,
}) => {
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(date);
  const [draftToDate, setDraftToDate] = useState(to_date || date);
  const [pickingEnd, setPickingEnd] = useState(false);
  const [viewY, setViewY] = useState(() => (date ? parseYMD(date) : new Date()).getFullYear());
  const [viewM, setViewM] = useState(() => (date ? parseYMD(date) : new Date()).getMonth());
  const [draftFrom, setDraftFrom] = useState(from_time);
  const [draftTo, setDraftTo] = useState(to_time);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const onMonthChangeRef = useRef(onMonthChange);
  onMonthChangeRef.current = onMonthChange;

  const timeOptions = buildTimeOptions(intervalMinutes);

  useEffect(() => {
    if (!open) return;
    const today = new Date();
    const base = date || toYMD(today);
    const d = parseYMD(base);
    setDraftDate(base);
    setDraftToDate(to_date || base);
    setPickingEnd(false);
    setViewY(d.getFullYear());
    setViewM(d.getMonth());
    setDraftFrom(from_time);
    setDraftTo(to_time);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // tell the parent which month is on screen so it can load leaves for it
  useEffect(() => {
    if (!open) return;
    const first = toYMD(new Date(viewY, viewM, 1));
    const last = toYMD(new Date(viewY, viewM + 1, 0));
    onMonthChangeRef.current?.(first, last);
  }, [open, viewY, viewM]);

  const place = useCallback(() => {
    const trigger = triggerRef.current?.getBoundingClientRect();
    const pop = popRef.current;
    if (!trigger || !pop) return;

    const { offsetWidth: w, offsetHeight: h } = pop;
    const spaceBelow = window.innerHeight - trigger.bottom - VIEWPORT_MARGIN;
    const spaceAbove = trigger.top - VIEWPORT_MARGIN;
    const openUp = h > spaceBelow && spaceAbove > spaceBelow;

    const rawTop = openUp ? trigger.top - h - POPOVER_GAP : trigger.bottom + POPOVER_GAP;
    const top = Math.max(VIEWPORT_MARGIN, Math.min(rawTop, window.innerHeight - h - VIEWPORT_MARGIN));
    const left = Math.max(VIEWPORT_MARGIN, Math.min(trigger.left, window.innerWidth - w - VIEWPORT_MARGIN));

    setPos((prev) => (prev && prev.top === top && prev.left === left ? prev : { top, left }));
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, viewY, viewM, place]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || popRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const rangeInvalid = !draftFrom || !draftTo || toMinutes(draftTo) <= toMinutes(draftFrom);
  const draftHours = rangeInvalid ? 0 : calcDurationHours(draftFrom, draftTo);
  const dayCount = daysBetween(draftDate, draftToDate);
  const showError = rangeInvalid && !!draftFrom && !!draftTo;

  const handleQuickDuration = (minutes: number) => {
    const base = draftFrom || "09:00";
    setDraftFrom(base);
    setDraftTo(addMinutes(base, minutes));
  };

  const handleDayClick = (ymd: string) => {
    if (!pickingEnd) {
      setDraftDate(ymd);
      setDraftToDate(ymd);
      setPickingEnd(true);
      return;
    }
    if (ymd < draftDate) {
      setDraftToDate(draftDate);
      setDraftDate(ymd);
    } else {
      setDraftToDate(ymd);
    }
    setPickingEnd(false);
  };

  const handleApply = () => {
    if (rangeInvalid || !draftDate) return;
    onApply(draftDate, draftFrom, draftTo, draftToDate || draftDate);
    setOpen(false);
  };

  const prevMonth = () => {
    if (viewM === 0) {
      setViewM(11);
      setViewY((y) => y - 1);
    } else {
      setViewM((m) => m - 1);
    }
  };
  const nextMonth = () => {
    if (viewM === 11) {
      setViewM(0);
      setViewY((y) => y + 1);
    } else {
      setViewM((m) => m + 1);
    }
  };

  const dateLabel = date
    ? `${fmtDate(date)}${to_date && to_date !== date ? " → " + fmtDate(to_date) : ""}`
    : "";
  const triggerLabel =
    from_time && to_time
      ? `${dateLabel ? dateLabel + " · " : ""}${formatTime12h(from_time)} → ${formatTime12h(to_time)}`
      : placeholder;

  return (
    <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          padding: "6px 8px",
          background: "var(--card)",
          border: "1.5px solid var(--border)",
          borderRadius: 8,
          fontSize: 12,
          color: "var(--text)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
          <ClockIcon />
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {triggerLabel}
          </span>
        </span>
        <ChevronIcon />
      </button>

      {open &&
        createPortal(
          <div
            ref={popRef}
            style={{
              position: "fixed",
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              visibility: pos ? "visible" : "hidden",
              zIndex: 99999,
              maxHeight: `calc(100vh - ${VIEWPORT_MARGIN * 2}px)`,
              overflowY: "auto",
              background: "var(--card)",
              border: "1.5px solid var(--border)",
              borderRadius: 14,
              boxShadow: "var(--shadow-lg)",
              display: "flex",
            }}
          >
            <div style={{ padding: 16, borderRight: "1.5px solid var(--border)" }}>
              <MonthCal
                year={viewY}
                month={viewM}
                selected={draftDate}
                selectedEnd={draftToDate}
                onDay={handleDayClick}
                onPrev={prevMonth}
                onNext={nextMonth}
                disableFuture={disableFuture}
                disablePast={disablePast}
                getDayOff={getDayOff}
              />
              <div
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  fontWeight: 600,
                  textAlign: "center",
                  color: pickingEnd ? "var(--primary)" : "var(--muted)",
                }}
              >
                {pickingEnd
                  ? "Now select end date"
                  : `${fmtDate(draftDate)}${draftToDate && draftToDate !== draftDate ? " → " + fmtDate(draftToDate) : ""}`}
              </div>
              {getDayOff && (
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 10,
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--muted)",
                  }}
                >
                  <LegendDot color={`var(${DAY_OFF_TONE.company_holiday})`} label="Holiday" />
                  <LegendDot color={`var(${DAY_OFF_TONE.leave})`} label="Leave" />
                  <LegendDot color={WEEKLY_OFF_COLOR} label="Weekly Off" />
                </div>
              )}
            </div>

            <div style={{ padding: 16, width: 280, display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5, margin: 0 }}>
                Time Range
              </p>

              <div style={{ display: "flex", gap: 10 }}>
                <TimeDropdown label="From" value={draftFrom} options={timeOptions} onChange={setDraftFrom} />
                <TimeDropdown label="To" value={draftTo} options={timeOptions} onChange={setDraftTo} />
              </div>

              <div>
                <span style={{ display: "block", fontSize: 10, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>
                  Quick Duration
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {quickDurations.map((q) => {
                    const active =
                      !rangeInvalid &&
                      !!draftFrom &&
                      !!draftTo &&
                      calcDurationHours(draftFrom, draftTo) === q.minutes / 60;
                    return (
                      <button
                        key={q.label}
                        type="button"
                        onClick={() => handleQuickDuration(q.minutes)}
                        style={{
                          padding: "5px 10px",
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 7,
                          border: `1.5px solid ${active ? "var(--primary)" : "var(--border)"}`,
                          background: active ? "var(--primary)" : "var(--bg)",
                          color: active ? "#fff" : "var(--text)",
                          cursor: "pointer",
                        }}
                      >
                        {q.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  textAlign: "center",
                  padding: "8px 0",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  background: showError ? "rgba(220,38,38,0.12)" : "var(--row-hover)",
                  color: showError ? "var(--danger, #dc2626)" : "var(--primary)",
                }}
              >
                {showError
                  ? "End time must be after start time."
                  : `Duration: ${draftHours.toFixed(1)} hrs${dayCount > 1 ? ` × ${dayCount} days` : ""}`}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1.5px solid var(--border)", paddingTop: 10 }}>
                <button type="button" onClick={() => setOpen(false)} style={footerBtn("ghost")}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={rangeInvalid || !draftDate}
                  style={footerBtn("primary", rangeInvalid || !draftDate)}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

const timeSelectStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  fontSize: 12,
  borderRadius: 7,
  border: "1.5px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
};

function footerBtn(variant: "ghost" | "primary", disabled?: boolean): React.CSSProperties {
  return {
    padding: "7px 16px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    border: variant === "primary" ? "none" : "1.5px solid var(--border)",
    background: variant === "primary" ? (disabled ? "var(--muted)" : "var(--primary)") : "transparent",
    color: variant === "primary" ? "#fff" : "var(--text)",
    opacity: disabled ? 0.6 : 1,
  };
}

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary)", flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const ChevronIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)", flexShrink: 0 }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default DateTimeRangePicker;