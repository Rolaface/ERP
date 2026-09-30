import React, { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { EventBar, DayOffBar } from "./Calendarparts";
import {
  DAYS_IN_WEEK,
  formatHours,
  toYMD,
  type DayData,
  type DayEvent,
} from "./Calendarutils";

interface Props extends DayData {
  days: Date[];
  anchor: Date;
  todayKey: string;
  onLog: (dateKey: string) => void;
  onOpenDay: (dateKey: string) => void;
  chipEdit: (ev: DayEvent) => (() => void) | undefined;
}

const DATE_ROW = 28;
const FOOTER_ROW = 22;
const OFF_ROW = 22;
const CHIP_ROW = 22;
const CELL_PADDING = 6;

const MonthView: React.FC<Props> = ({
  days,
  anchor,
  todayKey,
  eventsByDay,
  dayTotal,
  dayOffOn,
  isDayOff,
  onLog,
  onOpenDay,
  chipEdit,
}) => {
  const weeks = Math.max(1, Math.round(days.length / DAYS_IN_WEEK));
  const bodyRef = useRef<HTMLDivElement>(null);
  const [cellHeight, setCellHeight] = useState(120);

  // Measure the grid so we know how many chips fit without scrolling inside a cell
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => setCellHeight(el.clientHeight / weeks);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [weeks]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-card">
      <div className="grid grid-cols-7 border-b border-[var(--border)]/60">
        {days.slice(0, DAYS_IN_WEEK).map((d, i) => (
          <div
            key={i}
            className="py-2 text-center text-xs font-semibold text-muted"
          >
            {d.toLocaleDateString(undefined, { weekday: "short" })}
          </div>
        ))}
      </div>

      <div
        ref={bodyRef}
        className="grid min-h-0 flex-1 grid-cols-7 gap-px bg-[var(--border)]/40"
        style={{ gridTemplateRows: `repeat(${weeks}, minmax(0, 1fr))` }}
      >
        {days.map((d) => {
          const key = toYMD(d);
          const events = eventsByDay[key] ?? [];
          const total = dayTotal(key);
          const off = dayOffOn(key);
          const blocked = isDayOff(key);
          const showOffBar = off && off.kind !== "weekly_off";
          const isOutside = d.getMonth() !== anchor.getMonth();
          const isToday = key === todayKey;

          const available =
            cellHeight -
            DATE_ROW -
            FOOTER_ROW -
            CELL_PADDING -
            (showOffBar ? OFF_ROW : 0);
          const fit = Math.max(1, Math.floor(available / CHIP_ROW));
          const overflow = events.length > fit;
          const shown = overflow ? events.slice(0, Math.max(fit - 1, 0)) : events;
          const hidden = events.length - shown.length;

          return (
            <div
              key={key}
              onClick={blocked ? undefined : () => onLog(key)}
              className={`group/cell relative flex min-h-0 flex-col overflow-hidden p-1 ${
                off?.kind === "weekly_off"
                  ? "bg-[var(--border)]/15"
                  : "bg-card"
              } ${blocked ? "" : "cursor-pointer hover:bg-row-hover"}`}
            >
              <div className="flex h-6 shrink-0 items-center justify-between">
                <span
                  className={[
                    "flex h-6 min-w-[24px] items-center justify-center rounded-full px-1 text-xs font-semibold",
                    isToday
                      ? "bg-primary text-white"
                      : isOutside
                        ? "text-muted"
                        : "text-main",
                  ].join(" ")}
                >
                  {d.getDate()}
                </span>
                {!blocked && (
                  <span className="hidden h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary group-hover/cell:flex">
                    <Plus size={12} />
                  </span>
                )}
              </div>

              {showOffBar && off && <DayOffBar off={off} className="mb-0.5" />}

              <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                {shown.map((ev) => (
                  <EventBar key={ev.id} ev={ev} onEdit={chipEdit(ev)} />
                ))}
              </div>

              <div className="flex h-5 shrink-0 items-center justify-between gap-1">
                {hidden > 0 ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDay(key);
                    }}
                    className="rounded px-1 text-[10px] font-semibold text-primary hover:bg-primary/10"
                  >
                    +{hidden} more
                  </button>
                ) : (
                  <span />
                )}
                {total > 0 && (
                  <span className="rounded-full bg-[var(--border)]/30 px-1.5 py-0.5 font-mono text-[10px] font-bold text-main">
                    {formatHours(total)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;