import React, { useCallback, useMemo, useState } from "react";
import { ChevronDown, Pencil, Plus, Search } from "lucide-react";
import { showApiError } from "../../../../utils/alert";

import SearchSelect2, {
  type Option,
} from "../../../../components/ui/modal/SearchSelect2";
import { getAllProjects } from "../../../../api/project/projectapi/project.api";
import { getAllActivityTypes } from "../../../../api/project/projectapi/Activity/activityType.api";
import type { TimesheetHoursEntry } from "../../../../types/Project_Management/Timesheet/Table/timesheet.types";
import type { DayOffLookup } from "./dayOff.types";
import DayOffChip, { DAY_OFF_TONE } from "./DayOffChip";
import { WEEKLY_OFF_COLOR, weeklyOffFill } from "./Weeklyoff";

interface Props {
  days: Date[];
  entries: TimesheetHoursEntry[];
  todayKey: string;
  granularity?: "day" | "month";
  onCellClick?: (employee: string, dateKey: string) => void;
  onEditDraft?: (timesheetId: string) => void;
  dayOffs?: DayOffLookup;
}

interface Cell {
  hours: number;
  draftHours: number;
  items: TimesheetHoursEntry[];
}

interface Row {
  name: string;
  cells: Record<string, Cell>;
  total: number;
}

const ALL = "ALL";
const DRAFT_DOCSTATUS = 0;
const HOURS_DECIMALS = 2;
const APPROVED_TONE = "--success";
const DRAFT_TONE = "--warning";
const NAME_COL_WIDTH = 200;
const TOTAL_COL_WIDTH = 96;
const DAY_COL_MIN_WIDTH = 38;
const MONTH_COL_MIN_WIDTH = 64;
const COMPACT_MAX_DAYS = 7;
const DAY_KEY_LENGTH = 10;
const MONTH_KEY_LENGTH = 7;

const AVATAR_COLORS = [
  { bg: "#1e3a8a", fg: "#ffffff" },
  { bg: "#3b82f6", fg: "#ffffff" },
  { bg: "#fbcfe8", fg: "#9d174d" },
  { bg: "#fecaca", fg: "#991b1b" },
  { bg: "#bfdbfe", fg: "#1e40af" },
  { bg: "#c7d2fe", fg: "#3730a3" },
  { bg: "#ddd6fe", fg: "#5b21b6" },
  { bg: "#bbf7d0", fg: "#166534" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const toYMD = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const bucketKey = (ymd: string, monthly: boolean) =>
  ymd.slice(0, monthly ? MONTH_KEY_LENGTH : DAY_KEY_LENGTH);
const formatHours = (h: number) => `${+h.toFixed(HOURS_DECIMALS)}h`;
const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
const avatarColor = (name: string) =>
  AVATAR_COLORS[
    Array.from(name).reduce((s, c) => s + c.charCodeAt(0), 0) %
      AVATAR_COLORS.length
  ];

const cellTitle = (c: Cell) =>
  c.items
    .map(
      (e) =>
        `${[e.project, e.task, e.activity_type].filter(Boolean).join(" · ")} — ${formatHours(e.hours)}`,
    )
    .join("\n");

const FilterSelect: React.FC<{
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}> = ({ value, onChange, children }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="cursor-pointer appearance-none rounded-lg border border-[var(--border)] bg-card py-2 pl-3 pr-8 text-xs font-medium text-main outline-none focus:border-primary"
    >
      {children}
    </select>
    <ChevronDown
      size={14}
      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
    />
  </div>
);

const TimesheetMatrix: React.FC<Props> = ({
  days,
  entries,
  todayKey,
  granularity = "day",
  onCellClick,
  onEditDraft,
  dayOffs,
}) => {
  const isMonthly = granularity === "month";
  const clickable = Boolean(onCellClick) && !isMonthly;
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projectLabel, setProjectLabel] = useState("");
  const [activityId, setActivityId] = useState("");
  const [activityLabel, setActivityLabel] = useState("");
  const [status, setStatus] = useState(ALL);

  const fetchProjects = useCallback(async (q: string): Promise<Option[]> => {
    try {
      const list = await getAllProjects(q || undefined);
      return list.map((p) => ({
        value: p.name,
        label: p.project_name || p.name,
        subLabel:
          p.project_name && p.project_name !== p.name ? p.name : undefined,
      }));
    } catch (err) {
      showApiError(err);
      return [];
    }
  }, []);

  const fetchActivityTypes = useCallback(
    async (q: string): Promise<Option[]> => {
      try {
        const list = await getAllActivityTypes(q || undefined);
        return list.map((a) => ({
          value: a.name,
          label: a.activity_type || a.name,
        }));
      } catch (err) {
        showApiError(err);
        return [];
      }
    },
    [],
  );

  const rows = useMemo<Row[]>(() => {
    const columnKeys = new Set(days.map((d) => bucketKey(toYMD(d), isMonthly)));
    const q = search.trim().toLowerCase();
    const byEmployee = new Map<string, Row>();

    entries.forEach((e) => {
      const bucket = bucketKey(e.date, isMonthly);
      if (!columnKeys.has(bucket)) return;
      if (projectId && e.project !== projectId) return;
      if (activityId && e.activity_type !== activityId) return;
      const isDraft = e.docstatus === DRAFT_DOCSTATUS;
      if (status === "draft" && !isDraft) return;
      if (status === "submitted" && isDraft) return;
      if (q && !e.employee.toLowerCase().includes(q)) return;

      const row = byEmployee.get(e.employee) ?? {
        name: e.employee,
        cells: {},
        total: 0,
      };
      const cell = (row.cells[bucket] ??= {
        hours: 0,
        draftHours: 0,
        items: [],
      });
      cell.hours += e.hours;
      if (isDraft) cell.draftHours += e.hours;
      cell.items.push(e);
      row.total += e.hours;
      byEmployee.set(e.employee, row);
    });

    return Array.from(byEmployee.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [days, entries, search, projectId, activityId, status, isMonthly]);

  const columnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    rows.forEach((r) =>
      Object.entries(r.cells).forEach(([k, c]) => {
        totals[k] = (totals[k] ?? 0) + c.hours;
      }),
    );
    return totals;
  }, [rows]);

  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);
  const compact = !isMonthly && days.length > COMPACT_MAX_DAYS;
  const chipWidth = isMonthly
    ? "max-w-[64px]"
    : compact
      ? "max-w-[34px]"
      : "max-w-[72px]";
  const colMinWidth = isMonthly ? MONTH_COL_MIN_WIDTH : DAY_COL_MIN_WIDTH;
  const hasFilters = search || projectId || activityId || status !== ALL;

  const isCurrent = (key: string) =>
    isMonthly ? key === todayKey.slice(0, MONTH_KEY_LENGTH) : key === todayKey;

  const stickyLeft =
    "sticky left-0 z-10 bg-card border-r border-[var(--border)]/40";
  const stickyRight =
    "sticky right-0 z-10 bg-card border-l border-[var(--border)]/40";
  const emptyChip = `mx-auto flex h-7 w-full ${chipWidth} items-center justify-center rounded-md bg-[var(--border)]/20 text-xs text-muted`;
  const addableChip = "transition-colors group-hover/cell:bg-primary/10";

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee..."
            className="w-60 rounded-lg border border-[var(--border)] bg-card py-2 pl-9 pr-3 text-xs text-main outline-none focus:border-primary"
          />
        </div>
        <div className="w-48">
          <SearchSelect2
            label=""
            placeholder="All Projects"
            value={projectLabel}
            fetchOptions={fetchProjects}
            onChange={(val, opt) => {
              setProjectId(val);
              setProjectLabel(opt.label);
            }}
          />
        </div>
        <div className="w-52">
          <SearchSelect2
            label=""
            placeholder="All Activity Types"
            value={activityLabel}
            fetchOptions={fetchActivityTypes}
            onChange={(val, opt) => {
              setActivityId(val);
              setActivityLabel(opt.label);
            }}
          />
        </div>
        <FilterSelect value={status} onChange={setStatus}>
          <option value={ALL}>All Status</option>
          <option value="submitted">Approved</option>
          <option value="draft">Includes draft</option>
        </FilterSelect>
        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setProjectId("");
              setProjectLabel("");
              setActivityId("");
              setActivityLabel("");
              setStatus(ALL);
            }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-auto rounded-xl border border-[var(--border)] bg-card">
        <table
          className="w-full table-fixed border-collapse text-center"
          style={{
            minWidth:
              NAME_COL_WIDTH + TOTAL_COL_WIDTH + days.length * colMinWidth,
          }}
        >
          <colgroup>
            <col style={{ width: NAME_COL_WIDTH }} />
            {days.map((d) => (
              <col key={bucketKey(toYMD(d), isMonthly)} />
            ))}
            <col style={{ width: TOTAL_COL_WIDTH }} />
          </colgroup>
          <thead>
            <tr className="border-b border-[var(--border)]/60">
              <th
                className={`${stickyLeft} sticky top-0 z-30 px-4 py-3 text-left text-sm font-bold text-main`}
              >
                Employee
              </th>
              {days.map((d) => {
                const key = bucketKey(toYMD(d), isMonthly);
                const current = isCurrent(key);
                const headerOff = isMonthly
                  ? undefined
                  : dayOffs?.holidayOn(key);
                const holiday =
                  headerOff?.kind === "company_holiday" ? headerOff : undefined;
                const weeklyOff = headerOff?.kind === "weekly_off";
                return (
                  <th
                    key={key}
                    style={weeklyOff ? weeklyOffFill : undefined}
                    className="sticky top-0 z-20 bg-card px-0.5 py-3"
                  >
                    <div
                      className={[
                        "mx-auto flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
                        current
                          ? "bg-primary text-white"
                          : weeklyOff
                            ? "text-muted"
                            : "text-main",
                      ].join(" ")}
                    >
                      {isMonthly
                        ? d.toLocaleDateString(undefined, { month: "short" })
                        : d.getDate()}
                    </div>
                    <div
                      className={`mt-0.5 text-[11px] font-medium ${current ? "text-primary" : "text-muted"}`}
                    >
                      {isMonthly
                        ? d.getFullYear()
                        : d.toLocaleDateString(undefined, { weekday: "short" })}
                    </div>
                    {holiday && (
                      <div
                        title={holiday.label}
                        className="mx-auto mt-1 h-1 w-4 rounded-full"
                        style={{
                          background: `var(${DAY_OFF_TONE.company_holiday})`,
                        }}
                      />
                    )}
                    {weeklyOff && (
                      <div
                        title="Weekly Off"
                        className="mx-auto mt-1 h-1 w-4 rounded-full"
                        style={{ background: WEEKLY_OFF_COLOR }}
                      />
                    )}
                  </th>
                );
              })}
              <th
                className={`${stickyRight} sticky top-0 z-30 px-2 py-3 text-sm font-bold leading-tight text-main`}
              >
                Total
                <br />
                Hours
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={days.length + 2}
                  className="py-12 text-center text-sm text-muted"
                >
                  No timesheet entries match the current filters.
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const av = avatarColor(row.name);
              return (
                <tr
                  key={row.name}
                  className="group h-[52px] border-b border-[var(--border)]/40 hover:bg-row-hover"
                >
                  <td
                    className={`${stickyLeft} px-4 text-left group-hover:bg-row-hover`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                        style={{ background: av.bg, color: av.fg }}
                      >
                        {initials(row.name)}
                      </span>
                      <span className="truncate text-[13px] font-bold text-main">
                        {row.name}
                      </span>
                    </div>
                  </td>
                  {days.map((d) => {
                    const key = bucketKey(toYMD(d), isMonthly);
                    const cell = row.cells[key];
                    const tone = cell?.draftHours ? DRAFT_TONE : APPROVED_TONE;
                    const off = isMonthly
                      ? undefined
                      : (dayOffs?.holidayOn(key) ??
                        dayOffs?.leaveOn(key, row.name));
                    const canAdd = clickable;
                    const columnTint = isCurrent(key) ? "bg-primary/5" : "";
                    const draftIds = cell
                      ? [
                          ...new Set(
                            cell.items
                              .filter((e) => e.docstatus === DRAFT_DOCSTATUS)
                              .map((e) => e.timesheet),
                          ),
                        ]
                      : [];
                    const editId =
                      onEditDraft && draftIds.length === 1
                        ? draftIds[0]
                        : undefined;
                    return (
                      <td
                        key={key}
                        onClick={
                          canAdd ? () => onCellClick?.(row.name, key) : undefined
                        }
                        style={
                          off?.kind === "weekly_off" ? weeklyOffFill : undefined
                        }
                        className={`group/cell px-[3px] py-1 ${columnTint} ${canAdd ? "cursor-pointer" : ""}`}
                      >
                        {cell ? (
                          <div
                            title={cellTitle(cell)}
                            className={`relative mx-auto flex h-7 w-full ${chipWidth} items-center justify-center rounded-md text-[11px] font-bold`}
                            style={{
                              background: `color-mix(in srgb, var(${tone}) 18%, transparent)`,
                              color: `var(${tone})`,
                            }}
                          >
                            {formatHours(cell.hours)}
                            {editId && (
                              <button
                                title="Edit draft"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  onEditDraft?.(editId);
                                }}
                                className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-primary text-white shadow group-hover/cell:flex"
                              >
                                <Pencil size={9} />
                              </button>
                            )}
                          </div>
                        ) : off ? (
                          <DayOffChip
                            off={off}
                            compact={compact}
                            className={chipWidth}
                          />
                        ) : (
                          <div
                            title={canAdd ? "Log time" : undefined}
                            className={`relative ${emptyChip} ${canAdd ? addableChip : ""}`}
                          >
                            <span
                              className={
                                canAdd
                                  ? "transition-all duration-200 group-hover/cell:scale-50 group-hover/cell:opacity-0"
                                  : ""
                              }
                            >
                              -
                            </span>
                            {canAdd && (
                              <span className="absolute inset-0 flex scale-50 items-center justify-center text-primary opacity-0 transition-all duration-300 ease-out group-hover/cell:scale-100 group-hover/cell:opacity-100">
                                <Plus
                                  size={16}
                                  className="transition-transform duration-300 group-hover/cell:rotate-90"
                                />
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className={`${stickyRight} px-2 group-hover:bg-row-hover`}>
                    <span className="inline-flex h-8 min-w-[56px] items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-bold text-primary">
                      {formatHours(row.total)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="h-[60px] border-t border-[var(--border)]/60">
                <td
                  className={`${stickyLeft} sticky bottom-0 z-30 px-4 text-left text-[13px] font-bold leading-tight text-main`}
                >
                  Total Hours
                  <br />
                  (All Employees)
                </td>
                {days.map((d) => {
                  const key = bucketKey(toYMD(d), isMonthly);
                  const total = columnTotals[key] ?? 0;
                  return (
                    <td
                      key={key}
                      className="sticky bottom-0 z-20 bg-card px-[3px] py-1"
                    >
                      <div
                        className={`mx-auto flex h-8 w-full ${chipWidth} items-center justify-center rounded-md bg-[var(--border)]/20 text-[11px] font-bold ${total > 0 ? "text-main" : "text-muted"}`}
                      >
                        {total > 0 ? formatHours(total) : "-"}
                      </div>
                    </td>
                  );
                })}
                <td className={`${stickyRight} sticky bottom-0 z-30 px-2`}>
                  <span className="inline-flex h-10 min-w-[72px] items-center justify-center rounded-full bg-primary/15 px-2 text-sm font-bold text-primary">
                    {formatHours(grandTotal)}
                  </span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default TimesheetMatrix;