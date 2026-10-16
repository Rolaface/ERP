import { useCallback, useEffect, useMemo, useState } from "react";
import { getAllProjects } from "../../../api/project/projectapi/project.api";

export interface DashProject {
  name: string;
  project_name: string;
  customer?: string | null;
  status: string;
  expected_end_date?: string | null;
  percent_complete?: number | null;
}

export type BucketId =
  | "overdue"
  | "week"
  | "month"
  | "later"
  | "nodate";

export const BUCKETS: { id: BucketId; label: string; color: string }[] = [
  { id: "overdue", label: "Overdue", color: "var(--danger, #dc2626)" },
  { id: "week", label: "Due in 7 days", color: "var(--warning, #f59e0b)" },
  { id: "month", label: "Due in 30 days", color: "var(--primary, #2563eb)" },
  { id: "later", label: "Later", color: "var(--success, #16a34a)" },
  { id: "nodate", label: "No due date", color: "var(--muted, #94a3b8)" },
];

/** yyyy-mm-dd in local time (avoids the UTC off-by-one of toISOString) */
export const toISODate = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const addDays = (d: Date, days: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + days);
  return c;
};

export const bucketOf = (p: DashProject, today: string): BucketId => {
  const due = p.expected_end_date;
  if (!due) return "nodate";
  const t = new Date(today);
  if (due < today) return "overdue";
  if (due <= toISODate(addDays(t, 7))) return "week";
  if (due <= toISODate(addDays(t, 30))) return "month";
  return "later";
};

const fetchProjects = () => getAllProjects() as Promise<DashProject[]>;

export const useProjectDashboard = () => {
  const [projects, setProjects] = useState<DashProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProjects(await fetchProjects());
      setUpdatedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const today = toISODate(new Date());
    const active = projects.filter(
      (p) => p.status !== "Completed" && p.status !== "Cancelled",
    );
    const counts: Record<BucketId, number> = {
      overdue: 0,
      week: 0,
      month: 0,
      later: 0,
      nodate: 0,
    };
    active.forEach((p) => counts[bucketOf(p, today)]++);

    const avgProgress = active.length
      ? Math.round(
          active.reduce((s, p) => s + (p.percent_complete || 0), 0) /
            active.length,
        )
      : 0;

    // Most urgent first: overdue (oldest due date first), then due within 7 days
    const attention = active
      .filter((p) => {
        const b = bucketOf(p, today);
        return b === "overdue" || b === "week";
      })
      .sort((a, b) =>
        (a.expected_end_date || "").localeCompare(b.expected_end_date || ""),
      )
      .slice(0, 6);

    return {
      today,
      activeCount: active.length,
      completedCount: projects.filter((p) => p.status === "Completed").length,
      counts,
      avgProgress,
      attention,
    };
  }, [projects]);

  return { loading, error, updatedAt, stats, reload: load };
};