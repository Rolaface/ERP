import { useState } from "react";
import { FaSearch, FaFilter } from "react-icons/fa";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface EmployeeScore {
  id: number;
  name: string;
  designation: string;
  dept: string;
  cycle: string;
  selfScore: number | null;
  managerScore: number | null;
  finalScore: number | null;
  band: string | null;
  status: "Completed" | "In Review" | "Pending";
}

// ─── Mock Data ───────────────────────────────────────────────────────────────────

const MOCK_SCORES: EmployeeScore[] = [
  { id: 1,  name: "Rohan Sharma",   designation: "Senior Engineer",  dept: "Engineering", cycle: "Annual Review 2025", selfScore: 4.2, managerScore: 4.0, finalScore: 88.4, band: "Exceeds Expectations", status: "Completed"  },
  { id: 2,  name: "Priya Mehta",    designation: "UI Designer",      dept: "Design",       cycle: "Annual Review 2025", selfScore: 3.8, managerScore: 3.6, finalScore: 74.0, band: "Meets Expectations",  status: "Completed"  },
  { id: 3,  name: "Sneha Kapoor",   designation: "HR Manager",       dept: "HR",           cycle: "Annual Review 2025", selfScore: 4.5, managerScore: 4.3, finalScore: 92.0, band: "Exceptional",         status: "Completed"  },
  { id: 4,  name: "Karan Verma",    designation: "Sales Lead",       dept: "Sales",        cycle: "Annual Review 2025", selfScore: 4.0, managerScore: null, finalScore: null, band: null,                 status: "In Review"  },
  { id: 5,  name: "Divya Nair",     designation: "Product Designer", dept: "Design",       cycle: "Annual Review 2025", selfScore: null, managerScore: null, finalScore: null, band: null,               status: "Pending"    },
  { id: 6,  name: "Arjun Singh",    designation: "Backend Engineer", dept: "Engineering", cycle: "Annual Review 2025", selfScore: 3.5, managerScore: 3.8, finalScore: 69.0, band: "Meets Expectations",  status: "Completed"  },
  { id: 7,  name: "Meera Iyer",     designation: "Finance Analyst",  dept: "Finance",      cycle: "Annual Review 2025", selfScore: 4.1, managerScore: 3.9, finalScore: 82.0, band: "Exceeds Expectations", status: "Completed" },
  { id: 8,  name: "Rahul Gupta",    designation: "Sales Executive",  dept: "Sales",        cycle: "Annual Review 2025", selfScore: null, managerScore: null, finalScore: null, band: null,               status: "Pending"    },
];

const CYCLES = ["Annual Review 2025", "Q1 Review 2026", "Annual Review 2024"];
const DEPTS  = ["All", "Engineering", "Design", "Sales", "HR", "Finance"];
const BANDS  = ["All", "Exceptional", "Exceeds Expectations", "Meets Expectations", "Needs Improvement", "Unsatisfactory"];

// ─── Helpers ─────────────────────────────────────────────────────────────────────

const BAND_STYLE: Record<string, string> = {
  "Exceptional":           "bg-green-100 text-green-700",
  "Exceeds Expectations":  "bg-blue-100 text-blue-700",
  "Meets Expectations":    "bg-yellow-100 text-yellow-700",
  "Needs Improvement":     "bg-orange-100 text-orange-700",
  "Unsatisfactory":        "bg-red-100 text-red-700",
};

const STATUS_STYLE: Record<string, string> = {
  "Completed": "bg-green-100 text-green-700",
  "In Review": "bg-blue-100 text-blue-700",
  "Pending":   "bg-[var(--row-hover)] text-[var(--muted)]",
};

const ScoreBar = ({ value }: { value: number }) => {
  const color =
    value >= 90 ? "bg-green-500" :
    value >= 75 ? "bg-blue-500"  :
    value >= 60 ? "bg-yellow-500":
    value >= 40 ? "bg-orange-500": "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--border)]">
        <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-semibold text-[var(--text)] w-10 text-right">{value}%</span>
    </div>
  );
};

const Avatar = ({ name, dept }: { name: string; dept: string }) => {
  const colors: Record<string, string> = {
    Engineering: "bg-blue-100 text-blue-700",
    Design:      "bg-purple-100 text-purple-700",
    Sales:       "bg-green-100 text-green-700",
    HR:          "bg-pink-100 text-pink-700",
    Finance:     "bg-yellow-100 text-yellow-700",
  };
  const cls = colors[dept] ?? "bg-[var(--border)] text-[var(--muted)]";
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${cls}`}>
      {name.split(" ").map((n) => n[0]).join("")}
    </div>
  );
};

// ─── Stat Card ───────────────────────────────────────────────────────────────────

const StatCard = ({
  label, value, sub, color = "text-[var(--text)]",
}: { label: string; value: string | number; sub?: string; color?: string }) => (
  <div className="card border border-[var(--border)] rounded-xl p-4">
    <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
    <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    {sub && <p className="text-[10px] text-[var(--muted)] mt-0.5">{sub}</p>}
  </div>
);

// ─── Band Distribution Bar ───────────────────────────────────────────────────────

const BandDistribution = ({ scores }: { scores: EmployeeScore[] }) => {
  const completed = scores.filter((s) => s.band);
  if (!completed.length) return null;

  const bands = [
    { label: "Exceptional",          color: "bg-green-500",  min: 90  },
    { label: "Exceeds Expectations",  color: "bg-blue-500",   min: 75  },
    { label: "Meets Expectations",    color: "bg-yellow-500", min: 60  },
    { label: "Needs Improvement",     color: "bg-orange-500", min: 40  },
    { label: "Unsatisfactory",        color: "bg-red-500",    min: 0   },
  ];

  return (
    <div className="card border border-[var(--border)] rounded-xl p-4 space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Band Distribution</p>
      <div className="space-y-2">
        {bands.map((b) => {
          const count = completed.filter((s) => s.band === b.label).length;
          const pct   = completed.length ? Math.round((count / completed.length) * 100) : 0;
          return (
            <div key={b.label} className="flex items-center gap-3">
              <span className="text-[10px] text-[var(--muted)] w-36 shrink-0">{b.label}</span>
              <div className="flex-1 h-2 rounded-full bg-[var(--border)]">
                <div className={`h-2 rounded-full transition-all ${b.color}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] font-semibold text-[var(--text)] w-6 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────────

const ScoreView = () => {
  const [search, setSearch]         = useState("");
  const [selectedCycle, setCycle]   = useState(CYCLES[0]);
  const [selectedDept, setDept]     = useState("All");
  const [selectedBand, setBand]     = useState("All");
  const [selectedStatus, setStatus] = useState("All");

  const filtered = MOCK_SCORES.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.dept.toLowerCase().includes(search.toLowerCase());
    const matchDept   = selectedDept   === "All" || s.dept === selectedDept;
    const matchBand   = selectedBand   === "All" || s.band === selectedBand;
    const matchStatus = selectedStatus === "All" || s.status === selectedStatus;
    return matchSearch && matchDept && matchBand && matchStatus;
  });

  const completed    = MOCK_SCORES.filter((s) => s.status === "Completed");
  const avgFinal     = completed.length
    ? (completed.reduce((sum, s) => sum + (s.finalScore ?? 0), 0) / completed.length).toFixed(1)
    : "—";
  const topPerformer = completed.sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0))[0];

  return (
    <div className="space-y-4 p-1">

      {/* Cycle selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--muted)]">Cycle:</span>
        <div className="flex items-center gap-1.5">
          {CYCLES.map((c) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all
                ${selectedCycle === c
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] bg-card"
                }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Employees"  value={MOCK_SCORES.length} />
        <StatCard label="Completed"        value={completed.length}   color="text-green-600"
          sub={`${Math.round(completed.length / MOCK_SCORES.length * 100)}% completion`} />
        <StatCard label="Avg Final Score"  value={avgFinal ? `${avgFinal}%` : "—"} color="text-[var(--primary)]" />
        <StatCard
          label="Top Performer"
          value={topPerformer?.name.split(" ")[0] ?? "—"}
          sub={topPerformer ? `${topPerformer.finalScore}%` : undefined}
          color="text-green-600"
        />
      </div>

      {/* Band distribution */}
      <BandDistribution scores={MOCK_SCORES} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex items-center gap-2 border border-[var(--border)] rounded-lg px-3 py-2 w-52 bg-card">
          <FaSearch className="text-[var(--muted)] text-xs shrink-0" />
          <input
            type="text"
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs outline-none bg-transparent w-full text-[var(--text)]"
          />
        </div>

        <select value={selectedDept}   onChange={(e) => setDept(e.target.value)}   className="input-base text-xs h-9 w-36">
          {DEPTS.map((d) => <option key={d}>{d}</option>)}
        </select>

        <select value={selectedBand}   onChange={(e) => setBand(e.target.value)}   className="input-base text-xs h-9 w-44">
          {BANDS.map((b) => <option key={b}>{b}</option>)}
        </select>

        <select value={selectedStatus} onChange={(e) => setStatus(e.target.value)} className="input-base text-xs h-9 w-32">
          {["All", "Completed", "In Review", "Pending"].map((s) => <option key={s}>{s}</option>)}
        </select>

        {(selectedDept !== "All" || selectedBand !== "All" || selectedStatus !== "All" || search) && (
          <button
            onClick={() => { setDept("All"); setBand("All"); setStatus("All"); setSearch(""); }}
            className="text-xs text-[var(--muted)] hover:text-red-500 transition-colors px-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Score table */}
      <div className="app-surface rounded-xl overflow-hidden">
        {/* Header */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--border)]/10">
              {["Employee", "Department", "Status", "Self", "Manager", "Final Score", "Band"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--muted)]">
                  No records found
                </td>
              </tr>
            ) : filtered.map((s) => (
              <tr key={s.id} className="border-b border-[var(--border)]/20 row-hover transition-colors">

                {/* Employee */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={s.name} dept={s.dept} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--text)] truncate">{s.name}</p>
                      <p className="text-[10px] text-[var(--muted)] truncate">{s.designation}</p>
                    </div>
                  </div>
                </td>

                {/* Dept */}
                <td className="px-4 py-3 text-xs text-[var(--muted)]">{s.dept}</td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[s.status]}`}>
                    {s.status}
                  </span>
                </td>

                {/* Self score */}
                <td className="px-4 py-3 text-xs text-[var(--text)]">
                  {s.selfScore !== null
                    ? <span className="font-medium">{s.selfScore} / 5</span>
                    : <span className="text-[var(--muted)]">—</span>}
                </td>

                {/* Manager score */}
                <td className="px-4 py-3 text-xs text-[var(--text)]">
                  {s.managerScore !== null
                    ? <span className="font-medium">{s.managerScore} / 5</span>
                    : <span className="text-[var(--muted)]">—</span>}
                </td>

                {/* Final score bar */}
                <td className="px-4 py-3 w-40">
                  {s.finalScore !== null
                    ? <ScoreBar value={s.finalScore} />
                    : <span className="text-xs text-[var(--muted)]">—</span>}
                </td>

                {/* Band */}
                <td className="px-4 py-3">
                  {s.band
                    ? <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${BAND_STYLE[s.band]}`}>
                        {s.band}
                      </span>
                    : <span className="text-xs text-[var(--muted)]">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--muted)]">
          Showing {filtered.length} of {MOCK_SCORES.length} employees
        </div>
      </div>

    </div>
  );
};

export default ScoreView;