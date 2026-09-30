import React, { useMemo } from "react";
import { Pencil, Plus } from "lucide-react";
import { DayOffBar } from "./Calendarparts";
import type { TimesheetHoursEntry } from "../../../../types/Project_Management/Timesheet/Table/timesheet.types";
import {
  APPROVED_TONE,
  DRAFT_DOCSTATUS,
  DRAFT_TONE,
  describeDay,
  formatHours,
  projectTask,
  toYMD,
  type DayData,
} from "./Calendarutils";

interface CommonProps extends DayData {
  canViewAll: boolean;
  onLog: (dateKey: string) => void;
  onEdit?: (timesheetId: string) => void;
}

interface DayViewProps extends CommonProps {
  date: Date;
}

interface AgendaProps extends CommonProps {
  days: Date[];
}

const primaryButton =
  "inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

const EntryRow: React.FC<{
  e: TimesheetHoursEntry;
  title: string;
  meta: string;
  maxHours: number;
  onEdit?: (timesheetId: string) => void;
}> = ({ e, title, meta, maxHours, onEdit }) => {
  const isDraft = e.docstatus === DRAFT_DOCSTATUS;
  const tone = isDraft ? DRAFT_TONE : APPROVED_TONE;
  const width = maxHours > 0 ? Math.max(4, (e.hours / maxHours) * 100) : 0;
  return (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-xs font-semibold text-main">
          {title}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {onEdit && isDraft && (
            <button
              title="Edit draft"
              onClick={() => onEdit(e.timesheet)}
              className="rounded p-0.5 text-primary transition-colors hover:bg-primary/10"
            >
              <Pencil size={12} />
            </button>
          )}
          <span
            className="font-mono text-xs font-bold"
            style={{ color: `var(${tone})` }}
          >
            {formatHours(e.hours)}
          </span>
        </span>
      </div>
      {meta && (
        <p className="mt-0.5 break-words text-[10px] text-muted">{meta}</p>
      )}
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--border)]/30">
        <div
          className="h-full rounded-full"
          style={{ width: `${width}%`, background: `var(${tone})` }}
        />
      </div>
    </div>
  );
};

const entryMeta = (e: TimesheetHoursEntry) =>
  [e.activity_type, e.description, e.timesheet].filter(Boolean).join(" · ");

// ── Day ──────────────────────────────────────────────────────────

export const DayView: React.FC<DayViewProps> = ({
  date,
  eventsByDay,
  dayTotal,
  dayOffOn,
  isDayOff,
  canViewAll,
  onLog,
  onEdit,
}) => {
  const key = toYMD(date);
  const events = eventsByDay[key] ?? [];
  const total = dayTotal(key);
  const off = dayOffOn(key);
  const blocked = isDayOff(key);

  const groups = useMemo(() => {
    const map = new Map<string, { items: TimesheetHoursEntry[]; hours: number }>();
    events
      .flatMap((ev) => ev.items)
      .forEach((e) => {
        const g = canViewAll ? e.employee : e.project || "No project";
        const entry = map.get(g) ?? { items: [], hours: 0 };
        entry.items.push(e);
        entry.hours += e.hours;
        map.set(g, entry);
      });
    return Array.from(map.entries()).sort((a, b) => b[1].hours - a[1].hours);
  }, [events, canViewAll]);

  const maxHours = Math.max(0, ...events.flatMap((ev) => ev.items.map((i) => i.hours)));
  const draftHours = events.reduce((s, ev) => s + ev.draftHours, 0);
  const approvedHours = total - draftHours;
  const approvedPct = total > 0 ? (approvedHours / total) * 100 : 0;

  return (
    <div className="grid gap-3 p-0.5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-3">
        {groups.length === 0 && (
          <p className="rounded-xl border border-[var(--border)] bg-card py-10 text-center text-sm text-muted">
            No timesheet entries for this day.
          </p>
        )}
        {groups.map(([name, g]) => (
          <div
            key={name}
            className="overflow-hidden rounded-xl border border-[var(--border)] bg-card"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)]/40 px-3 py-2">
              <span className="text-xs font-bold text-main">{name}</span>
              <span className="font-mono text-xs font-bold text-primary">
                {formatHours(g.hours)}
              </span>
            </div>
            <div className="divide-y divide-[var(--border)]/30">
              {g.items.map((e, i) => (
                <EntryRow
                  key={`${e.timesheet}-${i}`}
                  e={e}
                  title={canViewAll ? projectTask(e) || e.activity_type || "—" : e.task || e.activity_type || "—"}
                  meta={entryMeta(e)}
                  maxHours={maxHours}
                  onEdit={onEdit}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <aside className="h-fit space-y-3 rounded-xl border border-[var(--border)] bg-card p-4">
        <div>
          <p className="text-xs font-semibold text-muted">{describeDay(date)}</p>
          <p className="mt-1 font-mono text-3xl font-bold text-main">
            {formatHours(total)}
          </p>
        </div>

        <div>
          <div className="flex h-2 overflow-hidden rounded-full bg-[var(--border)]/30">
            <div
              style={{ width: `${approvedPct}%`, background: `var(${APPROVED_TONE})` }}
            />
            <div
              style={{ width: `${100 - approvedPct}%`, background: total > 0 ? `var(${DRAFT_TONE})` : "transparent" }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] font-semibold text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: `var(${APPROVED_TONE})` }} />
              Approved {formatHours(approvedHours)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: `var(${DRAFT_TONE})` }} />
              Draft {formatHours(draftHours)}
            </span>
          </div>
        </div>

        {off && off.kind !== "weekly_off" && <DayOffBar off={off} />}
        {off?.kind === "weekly_off" && (
          <p className="text-[11px] font-semibold text-muted">Weekly off</p>
        )}

        <button className={primaryButton} disabled={blocked} onClick={() => onLog(key)}>
          <Plus size={14} /> Log time
        </button>
      </aside>
    </div>
  );
};

// ── List (agenda) ────────────────────────────────────────────────

export const AgendaList: React.FC<AgendaProps> = ({
  days,
  eventsByDay,
  dayTotal,
  dayOffOn,
  isDayOff,
  canViewAll,
  onLog,
  onEdit,
}) => {
  const visible = days.filter((d) => {
    const key = toYMD(d);
    const off = dayOffOn(key);
    return eventsByDay[key] || (off && off.kind !== "weekly_off");
  });

  if (visible.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted">
        No timesheet entries in this period.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {visible.map((d) => {
        const key = toYMD(d);
        const off = dayOffOn(key);
        const items = (eventsByDay[key] ?? []).flatMap((ev) => ev.items);
        const maxHours = Math.max(0, ...items.map((i) => i.hours));
        return (
          <div
            key={key}
            className="overflow-hidden rounded-xl border border-[var(--border)] bg-card"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)]/40 px-3 py-2">
              <span className="text-xs font-bold text-main">{describeDay(d)}</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-primary">
                  {formatHours(dayTotal(key))}
                </span>
                {!isDayOff(key) && (
                  <button
                    className="rounded-md border border-[var(--border)] p-1 text-muted transition-colors hover:text-main"
                    title="Log time on this day"
                    onClick={() => onLog(key)}
                  >
                    <Plus size={12} />
                  </button>
                )}
              </div>
            </div>
            {off && off.kind !== "weekly_off" && (
              <div className="px-3 pt-2">
                <DayOffBar off={off} />
              </div>
            )}
            <div className="divide-y divide-[var(--border)]/30">
              {items.map((e, i) => (
                <EntryRow
                  key={`${e.timesheet}-${i}`}
                  e={e}
                  title={
                    canViewAll
                      ? `${e.employee} · ${projectTask(e)}`
                      : projectTask(e) || e.activity_type || "—"
                  }
                  meta={entryMeta(e)}
                  maxHours={maxHours}
                  onEdit={onEdit}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};