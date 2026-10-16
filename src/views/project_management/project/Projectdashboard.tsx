import React, { useMemo, useState } from "react";
import DateDisplay from "../../../components/UI_Utils/Datedisplay";
import PmListTable from "./projecttabe";
import { useProjectActions } from "../../../hooks/project_management/project/Useprojectactions";
import { DASHBOARD_LIST } from "./pmLists.config";
import {
  BUCKETS,
  addDays,
  bucketOf,
  toISODate,
  useProjectDashboard,
  type BucketId,
} from "../../../hooks/project_management/project/Useprojectdashboard";

/* ---------- small building blocks ---------- */

const Panel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <section
    className={`rounded-lg border p-4 ${className}`}
    style={{ borderColor: "var(--border)", background: "var(--card, transparent)" }}
  >
    {children}
  </section>
);

const Kpi: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: string;
}> = ({ label, value, hint, tone }) => (
  <Panel>
    <p className="text-xs text-muted">{label}</p>
    <p
      className="mt-1 font-mono text-3xl font-bold tabular-nums text-main"
      style={tone ? { color: tone } : undefined}
    >
      {value}
    </p>
    {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
  </Panel>
);

const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`animate-pulse rounded-md ${className}`}
    style={{ background: "var(--border)" }}
    aria-hidden
  />
);

const relativeDue = (due: string, today: string) => {
  const diff = Math.round(
    (new Date(due).getTime() - new Date(today).getTime()) / 86_400_000,
  );
  if (diff === 0) return "Due today";
  if (diff < 0) return `${Math.abs(diff)} day${diff === -1 ? "" : "s"} overdue`;
  return `Due in ${diff} day${diff === 1 ? "" : "s"}`;
};

/* ---------- date-bucket filters for the table ---------- */

const bucketFilters = (id: BucketId, today: string) => {
  const t = new Date(today);
  const in7 = toISODate(addDays(t, 7));
  const in30 = toISODate(addDays(t, 30));
  switch (id) {
    case "overdue":
      return [["expected_end_date", "<", today]];
    case "week":
      return [
        ["expected_end_date", ">=", today],
        ["expected_end_date", "<=", in7],
      ];
    case "month":
      return [
        ["expected_end_date", ">", in7],
        ["expected_end_date", "<=", in30],
      ];
    case "later":
      return [["expected_end_date", ">", in30]];
    case "nodate":
      return [["expected_end_date", "is", "not set"]];
  }
};

/* ---------- main ---------- */

const ProjectDashboard: React.FC = () => {
  const { loading, error, updatedAt, stats, reload } = useProjectDashboard();
  const [bucket, setBucket] = useState<BucketId | null>(null);
  const projectActions = useProjectActions();

  // Same table config as before, plus the selected deadline bucket.
  const tableConfig = useMemo(
    () =>
      bucket
        ? {
            ...DASHBOARD_LIST,
            baseFilters: [
              ...(DASHBOARD_LIST.baseFilters ?? []),
              ...bucketFilters(bucket, stats.today),
            ],
          }
        : DASHBOARD_LIST,
    [bucket, stats.today],
  );

  const toggle = (id: BucketId) => setBucket((b) => (b === id ? null : id));
  const activeBucket = BUCKETS.find((b) => b.id === bucket);
  const total = stats.activeCount;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
         
          <p className="text-xs text-muted" aria-live="polite">
            {updatedAt
              ? `Updated ${updatedAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Loading…"}
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="rounded-md border px-3 py-1.5 text-xs font-bold text-main transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 disabled:opacity-50"
          style={{ borderColor: "var(--border)" }}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <Panel>
          <p className="text-sm font-bold text-main">
            Projects didn't load
          </p>
          <p className="mt-1 text-xs text-muted">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-3 rounded-md border px-3 py-1.5 text-xs font-bold text-main"
            style={{ borderColor: "var(--border)" }}
          >
            Try again
          </button>
        </Panel>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading && !updatedAt ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[92px]" />
          ))
        ) : (
          <>
            <Kpi
              label="Active projects"
              value={stats.activeCount}
              hint={`${stats.completedCount} completed`}
            />
            <Kpi
              label="Overdue"
              value={stats.counts.overdue}
              hint={stats.counts.overdue ? "Past their due date" : "Nothing overdue"}
              tone={stats.counts.overdue ? "var(--danger, #dc2626)" : undefined}
            />
            <Kpi
              label="Due in 7 days"
              value={stats.counts.week}
              hint="Including today"
            />
            <Kpi
              label="Average progress"
              value={`${stats.avgProgress}%`}
              hint="Across active projects"
            />
          </>
        )}
      </div>

      {/* Deadline radar + attention list */}
      <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel>
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold text-main">Deadlines</h2>
            <p className="text-xs text-muted">Select a group to filter the table</p>
          </div>

          {loading && !updatedAt ? (
            <Skeleton className="mt-4 h-10" />
          ) : total === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No active projects. Create a project to see its deadline here.
            </p>
          ) : (
            <>
              {/* segmented bar */}
              <div
                className="mt-4 flex h-10 w-full gap-1 overflow-hidden rounded-md"
                role="group"
                aria-label="Active projects by due date"
              >
                {BUCKETS.filter((b) => stats.counts[b.id] > 0).map((b) => {
                  const selected = bucket === b.id;
                  const dimmed = bucket && !selected;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${b.label}: ${stats.counts[b.id]} projects`}
                      title={`${b.label}: ${stats.counts[b.id]}`}
                      onClick={() => toggle(b.id)}
                      className="min-w-[8px] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{
                        flexGrow: stats.counts[b.id],
                        flexBasis: 0,
                        background: b.color,
                        opacity: dimmed ? 0.3 : 1,
                      }}
                    />
                  );
                })}
              </div>

              {/* legend doubles as filter buttons (works for keyboard + small segments) */}
              <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {BUCKETS.map((b) => {
                  const n = stats.counts[b.id];
                  const selected = bucket === b.id;
                  return (
                    <li key={b.id}>
                      <button
                        type="button"
                        disabled={n === 0}
                        aria-pressed={selected}
                        onClick={() => toggle(b.id)}
                        className="w-full rounded-md border px-2.5 py-2 text-left transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                          borderColor: selected ? b.color : "var(--border)",
                          boxShadow: selected ? `inset 0 0 0 1px ${b.color}` : undefined,
                        }}
                      >
                        <span className="flex items-center gap-1.5 text-xs text-muted">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ background: b.color }}
                          />
                          {b.label}
                        </span>
                        <span className="mt-0.5 block font-mono text-lg font-bold tabular-nums text-main">
                          {n}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Panel>

        <Panel>
          <h2 className="text-sm font-bold text-main">Needs attention</h2>
          {loading && !updatedAt ? (
            <div className="mt-3 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9" />
              ))}
            </div>
          ) : stats.attention.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              Nothing is overdue or due this week.
            </p>
          ) : (
            <ul className="mt-2 divide-y" style={{ borderColor: "var(--border)" }}>
              {stats.attention.map((p) => {
                const b = BUCKETS.find((x) => x.id === bucketOf(p, stats.today))!;
                return (
                  <li
                    key={p.name}
                    className="flex items-center justify-between gap-3 py-2"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-main">
                        {p.project_name || p.name}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {p.customer || p.name}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-bold" style={{ color: b.color }}>
                        {relativeDue(p.expected_end_date!, stats.today)}
                      </p>
                      <p className="font-mono text-[10px] text-muted">
                        {Math.round(p.percent_complete || 0)}% done
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {/* Table */}
      <div className="flex flex-col gap-2">
        <div className="flex min-h-[28px] items-center justify-between">
          <h2 className="text-sm font-bold text-main">
            {activeBucket ? `Projects: ${activeBucket.label}` : "Active projects"}
          </h2>
          {activeBucket && (
            <button
              type="button"
              onClick={() => setBucket(null)}
              className="rounded-md px-2 py-1 text-xs font-bold text-main underline focus-visible:outline focus-visible:outline-2"
            >
              Clear filter
            </button>
          )}
        </div>
        {/* key remounts the table so it refetches cleanly when the filter changes */}
        <PmListTable
          key={bucket ?? "all"}
          config={tableConfig}
          height="560px"
          enableAdd={false}
          getActions={projectActions}
        />
      </div>
    </div>
  );
};

export default ProjectDashboard;