import React from "react";
import { Pencil } from "lucide-react";
import { DAY_OFF_TONE } from "./DayOffChip";
import {
  eventTone,
  formatHours,
  toneLabel,
  tintStyle,
  type DayEvent,
  type DayOff,
} from "./Calendarutils";

const editTitle = (ev: DayEvent, onEdit?: () => void) =>
  `${ev.label} · ${formatHours(ev.hours)} · ${toneLabel(ev)}${
    onEdit ? " — click to edit draft" : ""
  }`;


export const EventBar: React.FC<{ ev: DayEvent; onEdit?: () => void }> = ({
  ev,
  onEdit,
}) => {
  const tone = eventTone(ev);
  return (
    <div
      title={editTitle(ev, onEdit)}
      onClick={
        onEdit
          ? (e) => {
              e.stopPropagation();
              onEdit();
            }
          : undefined
      }
      className={`flex h-5 shrink-0 items-center gap-1.5 overflow-hidden rounded pr-1.5 text-[11px] ${
        onEdit ? "cursor-pointer hover:brightness-95" : ""
      }`}
      style={{ background: `color-mix(in srgb, var(${tone}) 14%, transparent)` }}
    >
      <span
        className="h-full w-[3px] shrink-0"
        style={{ background: `var(${tone})` }}
      />
      <span className="min-w-0 flex-1 truncate font-semibold text-main">
        {ev.label}
      </span>
      <span
        className="shrink-0 font-mono text-[10px] font-bold"
        style={{ color: `var(${tone})` }}
      >
        {formatHours(ev.hours)}
      </span>
    </div>
  );
};


export const EventCard: React.FC<{ ev: DayEvent; onEdit?: () => void }> = ({
  ev,
  onEdit,
}) => {
  const tone = eventTone(ev);
  const sub = [...new Set(ev.items.map((i) => i.activity_type).filter(Boolean))]
    .join(", ");
  return (
    <div
      title={editTitle(ev, onEdit)}
      onClick={
        onEdit
          ? (e) => {
              e.stopPropagation();
              onEdit();
            }
          : undefined
      }
      className={`group/card relative flex shrink-0 overflow-hidden rounded-lg ${
        onEdit ? "cursor-pointer hover:brightness-95" : ""
      }`}
      style={{ background: `color-mix(in srgb, var(${tone}) 12%, transparent)` }}
    >
      <span className="w-1 shrink-0" style={{ background: `var(${tone})` }} />
      <div className="min-w-0 flex-1 px-2 py-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-bold text-main">
            {ev.label}
          </span>
          <span
            className="shrink-0 font-mono text-[11px] font-bold"
            style={{ color: `var(${tone})` }}
          >
            {formatHours(ev.hours)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-muted">
          <span className="truncate">{sub || toneLabel(ev)}</span>
          {onEdit && (
            <Pencil
              size={10}
              className="shrink-0 text-primary opacity-0 transition-opacity group-hover/card:opacity-100"
            />
          )}
        </div>
      </div>
    </div>
  );
};


export const DayOffBar: React.FC<{ off: DayOff; className?: string }> = ({
  off,
  className = "",
}) => {
  const tone =
    (DAY_OFF_TONE as Record<string, string>)[off.kind] ?? "--border";
  return (
    <div
      title={off.label}
      className={`flex h-5 w-full shrink-0 items-center overflow-hidden rounded px-1.5 text-[10px] font-semibold ${className}`}
      style={tintStyle(tone, 20)}
    >
      <span className="truncate">
        {off.label}
        {off.halfDay ? " · Half day" : ""}
      </span>
    </div>
  );
};

export const LegendItem: React.FC<{ color: string; label: string }> = ({
  color,
  label,
}) => (
  <span className="flex items-center gap-1.5">
    <span className="h-2 w-2 rounded-full" style={{ background: color }} />
    {label}
  </span>
);