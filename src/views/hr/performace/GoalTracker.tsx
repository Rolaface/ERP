import { useState } from "react";
import { FaPlus, FaFlag, FaBullseye } from "react-icons/fa";
import { ModalInput, ModalSelect, ModalTextarea } from "../../../components/ui/modal/modalComponent";

interface Goal {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  status: "On Track" | "At Risk" | "Completed" | "Not Started";
  progress: number;
  employee: string;
  dept: string;
}

const MOCK_GOALS: Goal[] = [
  { id: 1, title: "Improve API response time", description: "Reduce p95 latency below 200ms", dueDate: "31-Mar-2026", priority: "High", status: "On Track", progress: 65, employee: "Rohan Sharma", dept: "Engineering" },
  { id: 2, title: "Complete React migration", description: "Migrate legacy jQuery pages to React", dueDate: "30-Jun-2026", priority: "High", status: "At Risk", progress: 30, employee: "Priya Mehta", dept: "Engineering" },
  { id: 3, title: "Hire 3 designers", description: "Expand design team capacity", dueDate: "30-Apr-2026", priority: "Medium", status: "On Track", progress: 66, employee: "Sneha Kapoor", dept: "HR" },
  { id: 4, title: "Q1 revenue target", description: "Achieve 2.5Cr in Q1", dueDate: "31-Mar-2026", priority: "High", status: "Completed", progress: 100, employee: "Karan Verma", dept: "Sales" },
  { id: 5, title: "Design system v2", description: "Ship updated component library", dueDate: "15-May-2026", priority: "Medium", status: "Not Started", progress: 0, employee: "Divya Nair", dept: "Design" },
];

const STATUS_STYLE: Record<string, string> = {
  "On Track":   "bg-green-100 text-green-700",
  "At Risk":    "bg-red-100 text-red-700",
  "Completed":  "bg-blue-100 text-blue-700",
  "Not Started":"bg-[var(--row-hover)] text-[var(--muted)]",
};

const PRIORITY_STYLE: Record<string, string> = {
  High:   "bg-red-50 text-red-600",
  Medium: "bg-yellow-50 text-yellow-700",
  Low:    "bg-green-50 text-green-700",
};

const PROGRESS_COLOR = (p: number) => {
  if (p >= 100) return "bg-blue-500";
  if (p >= 60)  return "bg-green-500";
  if (p >= 30)  return "bg-yellow-500";
  return "bg-red-400";
};

const EMPTY_FORM = {
  title: "", description: "", dueDate: "",
  priority: "Medium" as Goal["priority"],
  employee: "", dept: "", progress: 0,
};

const GoalTracker = () => {
  const [goals, setGoals]           = useState<Goal[]>(MOCK_GOALS);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState<number | null>(null);
  const [form, setForm]             = useState({ ...EMPTY_FORM });

  const filtered = goals.filter((g) => {
    const matchSearch = g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.employee.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? g.status === filterStatus : true;
    const matchDept   = filterDept   ? g.dept   === filterDept   : true;
    return matchSearch && matchStatus && matchDept;
  });

  const stats = {
    total:     goals.length,
    onTrack:   goals.filter((g) => g.status === "On Track").length,
    atRisk:    goals.filter((g) => g.status === "At Risk").length,
    completed: goals.filter((g) => g.status === "Completed").length,
  };

  const depts   = [...new Set(goals.map((g) => g.dept))];
  const statuses: Goal["status"][] = ["On Track", "At Risk", "Completed", "Not Started"];

  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEdit = (g: Goal) => {
    setEditId(g.id);
    setForm({
      title: g.title, description: g.description, dueDate: g.dueDate,
      priority: g.priority, employee: g.employee, dept: g.dept,
      progress: g.progress,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    if (editId !== null) {
      setGoals((prev) => prev.map((g) =>
        g.id === editId
          ? { ...g, ...form,
              status: form.progress >= 100 ? "Completed"
                : form.progress > 0 ? "On Track" : "Not Started" }
          : g
      ));
    } else {
      const newGoal: Goal = {
        id: Date.now(), ...form,
        status: form.progress >= 100 ? "Completed"
          : form.progress > 0 ? "On Track" : "Not Started",
      };
      setGoals((prev) => [newGoal, ...prev]);
    }
    setShowForm(false);
  };

  const handleDelete = (id: number) =>
    setGoals((prev) => prev.filter((g) => g.id !== id));

  const handleProgress = (id: number, val: number) => {
    setGoals((prev) => prev.map((g) =>
      g.id === id
        ? { ...g, progress: val,
            status: val >= 100 ? "Completed" : val > 0 ? "On Track" : "Not Started" }
        : g
    ));
  };

  return (
    <div className="space-y-4 p-1">

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Goals",  value: stats.total,     color: "text-[var(--text)]"    },
          { label: "On Track",     value: stats.onTrack,   color: "text-green-600"         },
          { label: "At Risk",      value: stats.atRisk,    color: "text-red-500"           },
          { label: "Completed",    value: stats.completed, color: "text-blue-600"          },
        ].map((c) => (
          <div key={c.label} className="card rounded-xl p-4">
            <p className="text-xs text-[var(--muted)] mb-1">{c.label}</p>
            <p className={`text-2xl font-semibold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search goals or employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base text-sm pl-9 h-9 w-56"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] text-xs">
              <FaBullseye />
            </span>
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-base text-sm h-9 w-36"
          >
            <option value="">All Status</option>
            {statuses.map((s) => <option key={s}>{s}</option>)}
          </select>

          {/* Dept filter */}
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="input-base text-sm h-9 w-36"
          >
            <option value="">All Depts</option>
            {depts.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>

        <button
          onClick={openAdd}
          className="btn btn-primary flex items-center gap-1.5 text-sm px-4 h-9"
        >
          <FaPlus size={11} /> New Goal
        </button>
      </div>

      {/* Inline Add / Edit Form */}
      {showForm && (
        <div className="card rounded-xl border border-[var(--border)] p-4 space-y-3">
          <p className="text-sm font-semibold text-[var(--text)]">
            {editId !== null ? "Edit Goal" : "New Goal"}
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-3">
              <ModalInput
                label="Goal Title"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Improve API response time"
              />
            </div>

            <div className="col-span-2 sm:col-span-3">
              <ModalTextarea
                label="Description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What does success look like?"
              />
            </div>

            <ModalInput
              label="Employee"
              value={form.employee}
              onChange={(e) => setForm((f) => ({ ...f, employee: e.target.value }))}
              placeholder="Employee name"
            />

            <ModalInput
              label="Department"
              value={form.dept}
              onChange={(e) => setForm((f) => ({ ...f, dept: e.target.value }))}
              placeholder="e.g. Engineering"
            />

            <ModalInput
              label="Due Date"
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />

            <ModalSelect
              label="Priority"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Goal["priority"] }))}
              options={[
                { label: "High",   value: "High"   },
                { label: "Medium", value: "Medium" },
                { label: "Low",    value: "Low"    },
              ]}
            />

            <div className="col-span-2 sm:col-span-2">
              <label className="form-label block mb-1">
                Progress — {form.progress}%
              </label>
              <input
                type="range" min={0} max={100} step={5}
                value={form.progress}
                onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) }))}
                className="w-full accent-[var(--primary)]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button onClick={handleSave} className="btn btn-primary text-sm px-4 h-8">
              {editId !== null ? "Update" : "Save Goal"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="btn btn-outline text-sm px-4 h-8"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Goals Table */}
      <div className="app-surface overflow-hidden rounded-xl">
        {/* Table header */}
        <div className="border-b border-[var(--border)] bg-[var(--border)]/10">
          <table className="w-full table-fixed text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            <colgroup>
              <col style={{ width: "28%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <thead>
              <tr>
                {["Goal", "Employee", "Due Date", "Priority", "Progress", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left">{h}</th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        {/* Table body */}
        <div className="overflow-y-auto" style={{ maxHeight: "420px" }}>
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col style={{ width: "28%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-[var(--muted)]">
                    No goals found
                  </td>
                </tr>
              ) : filtered.map((g) => (
                <tr
                  key={g.id}
                  className="row-hover border-b border-[var(--border)]/20 transition-colors"
                >
                  {/* Goal title + status badge */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-[var(--text)] truncate">{g.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full w-fit font-medium ${STATUS_STYLE[g.status]}`}>
                        {g.status}
                      </span>
                    </div>
                  </td>

                  {/* Employee + dept */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-[var(--border)] flex items-center justify-center text-[10px] font-semibold text-[var(--text)] shrink-0">
                        {g.employee.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[var(--text)] truncate">{g.employee}</p>
                        <p className="text-[10px] text-[var(--muted)] truncate">{g.dept}</p>
                      </div>
                    </div>
                  </td>

                  {/* Due date */}
                  <td className="px-4 py-3 text-xs text-[var(--muted)]">{g.dueDate}</td>

                  {/* Priority */}
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLE[g.priority]}`}>
                      {g.priority}
                    </span>
                  </td>

                  {/* Progress bar + inline slider on hover */}
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-[var(--muted)]">
                        <span>{g.progress}%</span>
                        {g.status !== "Completed" && (
                          <span className="text-[10px] text-[var(--primary)] cursor-pointer"
                            onClick={() => handleProgress(g.id, Math.min(g.progress + 10, 100))}>
                            +10
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[var(--border)]">
                        <div
                          className={`h-1.5 rounded-full transition-all ${PROGRESS_COLOR(g.progress)}`}
                          style={{ width: `${g.progress}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(g)}
                        className="text-xs text-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(g.id)}
                        className="text-xs text-[var(--muted)] hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        <div className="border-t border-[var(--border)] bg-card px-4 py-2 text-xs text-[var(--muted)]">
          Total: {filtered.length}
        </div>
      </div>
    </div>
  );
};

export default GoalTracker;