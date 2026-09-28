import React, { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { TimesheetHoursEntry } from "../../../../types/Project_Management/Timesheet/Table/timesheet.types";

interface Props {
  days: Date[];
  entries: TimesheetHoursEntry[];
  todayKey: string;
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
const COMPACT_MAX_DAYS = 7;

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

const uniqueSorted = (values: (string | null)[]) =>
  Array.from(new Set(values.filter(Boolean) as string[])).sort();

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

const TimesheetMatrix: React.FC<Props> = ({ days, entries, todayKey }) => {
  const [search, setSearch] = useState("");
  const [project, setProject] = useState(ALL);
  const [activity, setActivity] = useState(ALL);
  const [status, setStatus] = useState(ALL); // ALL | draft | submitted

  const projects = useMemo(
    () => uniqueSorted(entries.map((e) => e.project)),
    [entries],
  );
  const activities = useMemo(
    () => uniqueSorted(entries.map((e) => e.activity_type)),
    [entries],
  );

  const rows = useMemo<Row[]>(() => {
    const dayKeys = new Set(days.map(toYMD));
    const q = search.trim().toLowerCase();
    const byEmployee = new Map<string, Row>();

    entries.forEach((e) => {
      if (!dayKeys.has(e.date)) return;
      if (project !== ALL && e.project !== project) return;
      if (activity !== ALL && e.activity_type !== activity) return;
      const isDraft = e.docstatus === DRAFT_DOCSTATUS;
      if (status === "draft" && !isDraft) return;
      if (status === "submitted" && isDraft) return;
      if (q && !e.employee.toLowerCase().includes(q)) return;

      const row = byEmployee.get(e.employee) ?? {
        name: e.employee,
        cells: {},
        total: 0,
      };
      const cell = (row.cells[e.date] ??= { hours: 0, draftHours: 0, items: [] });
      cell.hours += e.hours;
      if (isDraft) cell.draftHours += e.hours;
      cell.items.push(e);
      row.total += e.hours;
      byEmployee.set(e.employee, row);
    });

    return Array.from(byEmployee.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [days, entries, search, project, activity, status]);

  const dayTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    rows.forEach((r) =>
      Object.entries(r.cells).forEach(([k, c]) => {
        totals[k] = (totals[k] ?? 0) + c.hours;
      }),
    );
    return totals;
  }, [rows]);

  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);
  const compact = days.length > COMPACT_MAX_DAYS;
  const chipWidth = compact ? "max-w-[34px]" : "max-w-[72px]";
  const hasFilters =
    search || project !== ALL || activity !== ALL || status !== ALL;

  const stickyLeft = "sticky left-0 z-10 bg-card border-r border-[var(--border)]/40";
  const stickyRight = "sticky right-0 z-10 bg-card border-l border-[var(--border)]/40";
  const emptyChip = `mx-auto flex h-7 w-full ${chipWidth} items-center justify-center rounded-md bg-[var(--border)]/20 text-xs text-muted`;

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
        <FilterSelect value={project} onChange={setProject}>
          <option value={ALL}>All Projects</option>
          {projects.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect value={activity} onChange={setActivity}>
          <option value={ALL}>All Activity Types</option>
          {activities.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect value={status} onChange={setStatus}>
          <option value={ALL}>All Status</option>
          <option value="submitted">Approved</option>
          <option value="draft">Includes draft</option>
        </FilterSelect>
        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setProject(ALL);
              setActivity(ALL);
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
              NAME_COL_WIDTH + TOTAL_COL_WIDTH + days.length * DAY_COL_MIN_WIDTH,
          }}
        >
          <colgroup>
            <col style={{ width: NAME_COL_WIDTH }} />
            {days.map((d) => (
              <col key={toYMD(d)} />
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
                const today = toYMD(d) === todayKey;
                return (
                  <th
                    key={toYMD(d)}
                    className="sticky top-0 z-20 bg-card px-0.5 py-3"
                  >
                    <div
                      className={[
                        "text-sm font-bold",
                        today ? "text-primary" : "text-main",
                      ].join(" ")}
                    >
                      {d.getDate()}
                    </div>
                    <div className="text-[11px] font-medium text-muted">
                      {d.toLocaleDateString(undefined, { weekday: "short" })}
                    </div>
                    {today && (
                      <div className="mx-auto mt-1 h-0.5 w-4 rounded-full bg-primary" />
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
                  <td className={`${stickyLeft} px-4 text-left group-hover:bg-row-hover`}>
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
                    const key = toYMD(d);
                    const cell = row.cells[key];
                    const tone = cell?.draftHours ? DRAFT_TONE : APPROVED_TONE;
                    return (
                      <td key={key} className="px-[3px] py-1">
                        {cell ? (
                          <div
                            title={cellTitle(cell)}
                            className={`mx-auto flex h-7 w-full ${chipWidth} items-center justify-center rounded-md text-[11px] font-bold`}
                            style={{
                              background: `color-mix(in srgb, var(${tone}) 18%, transparent)`,
                              color: `var(${tone})`,
                            }}
                          >
                            {formatHours(cell.hours)}
                          </div>
                        ) : (
                          <div className={emptyChip}>-</div>
                        )}
                      </td>
                    );
                  })}
                  <td className={`${stickyRight} px-2 group-hover:bg-row-hover`}>
                    <span className="inline-flex h-8 min-w-[56px] items-center justify-center rounded-lg bg-primary/10 px-2 text-xs font-bold text-primary">
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
                  const total = dayTotals[toYMD(d)] ?? 0;
                  return (
                    <td
                      key={toYMD(d)}
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
                  <span className="inline-flex h-10 min-w-[72px] items-center justify-center rounded-lg bg-primary/15 px-2 text-sm font-bold text-primary">
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