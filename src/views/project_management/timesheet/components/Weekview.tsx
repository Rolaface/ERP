import React from "react";
import { EventCard, DayOffBar } from "./Calendarparts";
import {
  formatHours,
  toYMD,
  type DayData,
  type DayEvent,
} from "./Calendarutils";
import {
  WEEKLY_OFF_COLOR,
  WEEKLY_OFF_TAG_BG,
  weeklyOffFill,
} from "./Weeklyoff";

interface Props extends DayData {
  days: Date[];
  todayKey: string;
  onLog: (dateKey: string) => void;
  chipEdit: (ev: DayEvent) => (() => void) | undefined;
}

const colBorder = "border-r border-[var(--border)]/40 last:border-r-0";

const WeekView: React.FC<Props> = ({
  days,
  todayKey,
  eventsByDay,
  dayTotal,
  dayOffOn,
  onLog,
  chipEdit,
}) => {
  const todayTint = (key: string) => (key === todayKey ? "bg-primary/5" : "");

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-card">
      <div className="grid shrink-0 grid-cols-7 border-b border-[var(--border)]/60">
        {days.map((d) => {
          const key = toYMD(d);
          const total = dayTotal(key);
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              className={`flex flex-col items-center gap-0.5 py-2 ${colBorder} ${todayTint(key)}`}
            >
              <span
                className={`text-[11px] font-semibold ${isToday ? "text-primary" : "text-muted"}`}
              >
                {d.toLocaleDateString(undefined, { weekday: "short" })}
              </span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-base font-semibold ${
                  isToday ? "bg-primary text-white" : "text-main"
                }`}
              >
                {d.getDate()}
              </span>
              <span className="font-mono text-[10px] font-bold text-muted">
                {total > 0 ? formatHours(total) : "\u00A0"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid shrink-0 grid-cols-7 border-b border-[var(--border)]/60">
        {days.map((d) => {
          const key = toYMD(d);
          const off = dayOffOn(key);
          const isWeeklyOff = off?.kind === "weekly_off";
          return (
            <div
              key={key}
              style={isWeeklyOff ? weeklyOffFill : undefined}
              className={`min-h-[28px] p-1 ${colBorder} ${todayTint(key)}`}
            >
              {off && !isWeeklyOff && <DayOffBar off={off} />}
              {isWeeklyOff && (
                <div
                  className="flex h-5 items-center justify-center rounded text-[10px] font-bold uppercase tracking-wide"
                  style={{
                    color: WEEKLY_OFF_COLOR,
                    background: WEEKLY_OFF_TAG_BG,
                  }}
                >
                  Weekly Off
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7">
        {days.map((d) => {
          const key = toYMD(d);
          const events = eventsByDay[key] ?? [];
          const isWeeklyOff = dayOffOn(key)?.kind === "weekly_off";
          return (
            <div
              key={key}
              onClick={() => onLog(key)}
              style={isWeeklyOff ? weeklyOffFill : undefined}
              className={`custom-scrollbar flex min-h-0 cursor-pointer flex-col gap-1.5 overflow-y-auto p-1.5 hover:bg-row-hover ${colBorder} ${todayTint(key)}`}
            >
              {events.map((ev) => (
                <EventCard key={ev.id} ev={ev} onEdit={chipEdit(ev)} />
              ))}
            </div>
          );
        })}
      </div>

      <div className="grid shrink-0 grid-cols-7 border-t border-[var(--border)]/60">
        {days.map((d) => {
          const key = toYMD(d);
          const total = dayTotal(key);
          return (
            <div
              key={key}
              className={`flex h-9 items-center justify-center ${colBorder} ${todayTint(key)}`}
            >
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-bold ${
                  total > 0 ? "bg-primary/10 text-primary" : "text-muted"
                }`}
              >
                {total > 0 ? formatHours(total) : "-"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekView;