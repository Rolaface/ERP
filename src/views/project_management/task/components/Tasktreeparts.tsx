import React from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Loader2,
  Minus,
} from "lucide-react";

export const GroupCheckbox: React.FC<{
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: () => void;
  label?: string;
}> = ({ checked, indeterminate, disabled, onChange, label = "Select" }) => {
  const on = checked || !!indeterminate;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-40 ${
        on
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-slate-300 bg-white hover:border-blue-400"
      }`}
    >
      {indeterminate ? (
        <Minus size={12} strokeWidth={3} />
      ) : checked ? (
        <Check size={12} strokeWidth={3} />
      ) : null}
    </button>
  );
};

export const ChildTaskSelector: React.FC<{
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label?: string;
}> = ({ checked, disabled, onChange, label = "Select task" }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={(e) => {
      e.stopPropagation();
      onChange();
    }}
    className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-40 ${
      checked
        ? "border-blue-600 bg-white"
        : "border-slate-300 bg-white hover:border-blue-400"
    }`}
  >
    {checked && <span className="h-2 w-2 rounded-full bg-blue-600" />}
  </button>
);

export const ProgressBar: React.FC<{ value?: number | null }> = ({ value }) => {
  const pct = Math.max(0, Math.min(100, Math.round(value ?? 0)));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200/70">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            pct >= 100 ? "bg-emerald-500" : "bg-blue-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-9 text-xs tabular-nums text-muted">{pct}%</span>
    </div>
  );
};

const BASE_X = 28;
const STEP = 28;
const ELBOW = 18;

const LINE = "pointer-events-none absolute bg-slate-200";

export interface TaskTreeCellProps {
  name: string;
  taskId: string;
  description?: string | null;
  isGroup: boolean;
  depth: number;
  guides: boolean[];
  isLast: boolean;
  expanded?: boolean;
  loading?: boolean;
  childCount?: number;
  showToggle?: boolean;
  onToggle?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onView?: () => void;
}

export const TaskTreeCell: React.FC<TaskTreeCellProps> = ({
  name,
  taskId,
  description,
  isGroup,
  depth,
  guides,
  isLast,
  expanded,
  loading,
  childCount = 0,
  showToggle = true,
  onToggle,
  selectable,
  selected,
  onSelect,
  onView,
}) => {
  const nested = depth > 0;
  const elbowX = BASE_X + (depth - 1) * STEP;
  const paddingLeft = nested ? elbowX + ELBOW + 4 : 8;

  const nameBtn = (
    <button
      type="button"
      onClick={onView}
      className={`whitespace-normal break-words text-left text-sm text-main hover:text-blue-600 ${
        isGroup ? "font-semibold" : "font-medium"
      }`}
    >
      {name}
    </button>
  );

  return (
    <div
      className={`relative flex items-center gap-2 pr-3 ${
        isGroup ? "min-h-[60px] py-2.5" : "min-h-[48px] py-2"
      }`}
      style={{ paddingLeft }}
    >
      {nested && (
        <>
          {guides.map(
            (on, k) =>
              on && (
                <span
                  key={k}
                  aria-hidden
                  className={`${LINE} w-px`}
                  style={{ left: BASE_X + k * STEP, top: -1, bottom: -1 }}
                />
              ),
          )}
          <span
            aria-hidden
            className={`${LINE} w-px`}
            style={{ left: elbowX, top: -1, bottom: isLast ? "50%" : -1 }}
          />
          <span
            aria-hidden
            className={`${LINE} h-px`}
            style={{ left: elbowX, width: ELBOW, top: "50%" }}
          />
        </>
      )}

      {isGroup ? (
        <>
          {showToggle ? (
            <button
              type="button"
              aria-label={expanded ? "Collapse group" : "Expand group"}
              aria-expanded={!!expanded}
              onClick={(e) => {
                e.stopPropagation();
                onToggle?.();
              }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : expanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          ) : (
            <span className="w-6 shrink-0" />
          )}

          {expanded && showToggle ? (
            <FolderOpen
              size={20}
              className="shrink-0 text-amber-500"
              fill="currentColor"
              fillOpacity={0.25}
            />
          ) : (
            <Folder
              size={20}
              className="shrink-0 text-amber-500"
              fill="currentColor"
              fillOpacity={0.25}
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {nameBtn}
              {childCount > 0 && (
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                  {childCount} {childCount === 1 ? "task" : "tasks"}
                </span>
              )}
            </div>
            <p className="mt-0.5 whitespace-normal break-words text-xs text-muted">
              {description || taskId}
            </p>
          </div>
        </>
      ) : (
        <>
          <ChildTaskSelector
            checked={!!selected}
            disabled={!selectable}
            onChange={() => onSelect?.()}
            label={`Select ${name}`}
          />
          <div className="min-w-0 flex-1 pl-1">
            {nameBtn}
            <p className="text-[11px] leading-4 text-muted">{taskId}</p>
          </div>
        </>
      )}
    </div>
  );
};