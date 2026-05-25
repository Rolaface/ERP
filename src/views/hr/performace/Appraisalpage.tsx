import { useState } from "react";
import {
  FaSearch,
  FaBell,
  FaChevronDown,
  FaCheckCircle,
  FaClock,
  FaHourglassHalf,
  FaTimesCircle,
  FaUsers,
  FaFilter,
} from "react-icons/fa";
import AppraisalFormModal from "../../../components/Hr/performance/AppraisalFormModal";

// ─── Types ──────────────────────────────────────────────────────────────────

type AppraisalStatus = "Completed" | "In Review" | "Self Pending" | "Not Started";

interface AppraisalRecord {
  id: number;
  name: string;
  designation: string;
  dept: string;
  cycle: string;
  template: string;
  status: AppraisalStatus;
  selfScore: number | null;
  managerScore: number | null;
  dueDate: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_APPRAISALS: AppraisalRecord[] = [
  { id: 1,  name: "Rohan Sharma",   designation: "Senior Engineer",  dept: "Engineering", cycle: "Annual Review 2025", template: "Engineering — Standard", status: "Completed",    selfScore: 4.2, managerScore: 4.0, dueDate: "31 Mar 2026" },
  { id: 2,  name: "Priya Mehta",    designation: "UI Designer",      dept: "Design",      cycle: "Annual Review 2025", template: "Design — Standard",      status: "In Review",    selfScore: 3.8, managerScore: null, dueDate: "31 Mar 2026" },
  { id: 3,  name: "Arjun Singh",    designation: "Backend Engineer", dept: "Engineering", cycle: "Annual Review 2025", template: "Engineering — Standard", status: "Self Pending",  selfScore: null, managerScore: null, dueDate: "31 Mar 2026" },
  { id: 4,  name: "Sneha Kapoor",   designation: "HR Manager",       dept: "HR",          cycle: "Annual Review 2025", template: "HR — Standard",          status: "Completed",    selfScore: 4.5, managerScore: 4.3, dueDate: "31 Mar 2026" },
  { id: 5,  name: "Karan Verma",    designation: "Sales Lead",       dept: "Sales",       cycle: "Annual Review 2025", template: "Sales — Standard",       status: "In Review",    selfScore: 4.0, managerScore: null, dueDate: "31 Mar 2026" },
  { id: 6,  name: "Divya Nair",     designation: "Product Designer", dept: "Design",      cycle: "Annual Review 2025", template: "Design — Standard",      status: "Not Started",  selfScore: null, managerScore: null, dueDate: "31 Mar 2026" },
  { id: 7,  name: "Meera Iyer",     designation: "Finance Analyst",  dept: "Finance",     cycle: "Annual Review 2025", template: "Finance — Standard",     status: "Completed",    selfScore: 4.1, managerScore: 3.9, dueDate: "31 Mar 2026" },
  { id: 8,  name: "Rahul Gupta",    designation: "Sales Executive",  dept: "Sales",       cycle: "Annual Review 2025", template: "Sales — Standard",       status: "Not Started",  selfScore: null, managerScore: null, dueDate: "31 Mar 2026" },
];

const CYCLES = ["Annual Review 2025", "Q1 Review 2026", "Annual Review 2024"];
const DEPTS  = ["All", "Engineering", "Design", "Sales", "HR", "Finance"];
const STATUSES = ["All", "Completed", "In Review", "Self Pending", "Not Started"];

// ─── Status config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AppraisalStatus, {
  bg: string; text: string; dot: string; action: string; actionColor: string;
}> = {
  "Completed":    { bg: "rgba(34,197,94,0.1)",  text: "#16a34a", dot: "#22c55e", action: "View",     actionColor: "var(--muted)" },
  "In Review":    { bg: "rgba(59,130,246,0.1)", text: "#2563eb", dot: "#3b82f6", action: "Review",   actionColor: "#2563eb" },
  "Self Pending": { bg: "rgba(245,158,11,0.1)", text: "#d97706", dot: "#f59e0b", action: "Continue", actionColor: "#d97706" },
  "Not Started":  { bg: "var(--row-hover)",     text: "var(--muted)", dot: "var(--border)", action: "Start", actionColor: "var(--primary)" },
};

const DEPT_COLORS: Record<string, { bg: string; text: string }> = {
  Engineering: { bg: "rgba(59,130,246,0.12)",  text: "#2563eb" },
  Design:      { bg: "rgba(139,92,246,0.12)",  text: "#7c3aed" },
  Sales:       { bg: "rgba(34,197,94,0.12)",   text: "#15803d" },
  HR:          { bg: "rgba(236,72,153,0.12)",  text: "#be185d" },
  Finance:     { bg: "rgba(245,158,11,0.12)",  text: "#b45309" },
};

// ─── Avatar ──────────────────────────────────────────────────────────────────

const Avatar = ({ name, dept }: { name: string; dept: string }) => {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const colors = DEPT_COLORS[dept] ?? { bg: "var(--row-hover)", text: "var(--muted)" };
  return (
    <div style={{
      width: 34, height: 34, borderRadius: "50%",
      background: colors.bg, color: colors.text,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 700, flexShrink: 0,
      border: "1.5px solid " + colors.bg,
    }}>
      {initials}
    </div>
  );
};

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent: string;
  sub?: string;
}

const StatCard = ({ label, value, icon, accent, sub }: StatCardProps) => (
  <div className="card" style={{
    display: "flex", alignItems: "flex-start", gap: 14,
    padding: "16px 18px", borderRadius: 12,
    position: "relative", overflow: "hidden",
  }}>
    {/* Left accent bar */}
    <div style={{
      position: "absolute", left: 0, top: 0, bottom: 0,
      width: 3, background: accent, borderRadius: "12px 0 0 12px",
    }} />

    {/* Icon */}
    <div style={{
      width: 38, height: 38, borderRadius: 10,
      background: accent + "18",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: accent, fontSize: 15, flexShrink: 0,
    }}>
      {icon}
    </div>

    {/* Text */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </p>
      <p style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{sub}</p>
      )}
    </div>
  </div>
);

// ─── Completion bar ───────────────────────────────────────────────────────────

const CompletionBar = ({ records }: { records: AppraisalRecord[] }) => {
  const total      = records.length;
  const completed  = records.filter((r) => r.status === "Completed").length;
  const inReview   = records.filter((r) => r.status === "In Review").length;
  const selfPend   = records.filter((r) => r.status === "Self Pending").length;
  const notStarted = records.filter((r) => r.status === "Not Started").length;
  const pct = (n: number) => `${Math.round((n / total) * 100)}%`;

  const segments = [
    { color: "#22c55e", width: pct(completed),  label: "Completed",    count: completed  },
    { color: "#3b82f6", width: pct(inReview),   label: "In Review",    count: inReview   },
    { color: "#f59e0b", width: pct(selfPend),   label: "Self Pending", count: selfPend   },
    { color: "var(--border)", width: pct(notStarted), label: "Not Started", count: notStarted },
  ];

  return (
    <div className="card" style={{ padding: "14px 18px", borderRadius: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Cycle Completion</span>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          <span style={{ color: "#22c55e", fontWeight: 700 }}>{completed}</span> / {total} completed
        </span>
      </div>

      {/* Stacked progress bar */}
      <div style={{ height: 8, borderRadius: 99, overflow: "hidden", display: "flex", gap: 2, background: "var(--border)" }}>
        {segments.map((s) => (
          <div key={s.label} style={{ width: s.width, background: s.color, transition: "width 0.4s ease", minWidth: s.count > 0 ? 4 : 0 }} />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 10 }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{s.label} ({s.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Score pill ───────────────────────────────────────────────────────────────

const ScorePill = ({ value }: { value: number | null }) => {
  if (value === null) return <span style={{ color: "var(--border)", fontSize: 13 }}>—</span>;
  const color = value >= 4 ? "#16a34a" : value >= 3 ? "var(--primary)" : "#d97706";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 2,
      fontSize: 13, fontWeight: 700, color,
    }}>
      {value}
      <span style={{ fontSize: 10, fontWeight: 400, color: "var(--muted)" }}>/5</span>
    </span>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const AppraisalPage = () => {
  const [search, setSearch]       = useState("");
  const [selectedCycle, setCycle] = useState(CYCLES[0]);
  const [selectedDept, setDept]   = useState("All");
  const [selectedStatus, setStatus] = useState("All");
  const [openModalId, setOpenModalId] = useState<number | null>(null);

  const filtered = MOCK_APPRAISALS.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.name.toLowerCase().includes(q) || r.dept.toLowerCase().includes(q)) &&
      (selectedDept   === "All" || r.dept   === selectedDept) &&
      (selectedStatus === "All" || r.status === selectedStatus)
    );
  });

  const stats = {
    total:     MOCK_APPRAISALS.length,
    completed: MOCK_APPRAISALS.filter((r) => r.status === "Completed").length,
    inReview:  MOCK_APPRAISALS.filter((r) => r.status === "In Review").length,
    pending:   MOCK_APPRAISALS.filter((r) => r.status === "Self Pending" || r.status === "Not Started").length,
  };

  const hasFilters = selectedDept !== "All" || selectedStatus !== "All" || search;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "4px 2px" }}>

        {/* ── Cycle selector ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, flexShrink: 0 }}>Cycle</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CYCLES.map((c) => {
              const active = selectedCycle === c;
              return (
                <button
                  key={c}
                  onClick={() => setCycle(c)}
                  style={{
                    fontSize: 12, padding: "5px 14px", borderRadius: 8,
                    border: active ? "none" : "1px solid var(--border)",
                    background: active ? "var(--primary)" : "var(--card)",
                    color: active ? "#fff" : "var(--text)",
                    fontWeight: active ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: active ? "var(--glow-primary)" : "none",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <StatCard label="Total Employees" value={stats.total}     icon={<FaUsers />}         accent="var(--primary)" />
          <StatCard label="Completed"        value={stats.completed} icon={<FaCheckCircle />}   accent="#22c55e"         sub={`${Math.round((stats.completed / stats.total) * 100)}% done`} />
          <StatCard label="In Review"        value={stats.inReview}  icon={<FaClock />}         accent="#3b82f6" />
          <StatCard label="Pending"          value={stats.pending}   icon={<FaHourglassHalf />} accent="#f59e0b" />
        </div>

        {/* ── Completion bar ── */}
        <CompletionBar records={MOCK_APPRAISALS} />

        {/* ── Filters row ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              border: "1px solid var(--border)", borderRadius: 8,
              padding: "6px 12px", background: "var(--card)", width: 210,
            }}>
              <FaSearch style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  fontSize: 13, outline: "none", background: "transparent",
                  border: "none", width: "100%", color: "var(--text)",
                }}
              />
            </div>

            {/* Dept filter */}
            <div style={{ position: "relative" }}>
              <select
                value={selectedDept}
                onChange={(e) => setDept(e.target.value)}
                className="input-base"
                style={{ fontSize: 13, padding: "6px 32px 6px 12px", width: 150, height: 36, appearance: "none" }}
              >
                {DEPTS.map((d) => <option key={d}>{d}</option>)}
              </select>
              <FaChevronDown style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "var(--muted)", pointerEvents: "none" }} />
            </div>

            {/* Status filter */}
            <div style={{ position: "relative" }}>
              <select
                value={selectedStatus}
                onChange={(e) => setStatus(e.target.value)}
                className="input-base"
                style={{ fontSize: 13, padding: "6px 32px 6px 12px", width: 150, height: 36, appearance: "none" }}
              >
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <FaChevronDown style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "var(--muted)", pointerEvents: "none" }} />
            </div>

            {hasFilters && (
              <button
                className="btn btn-ghost"
                onClick={() => { setDept("All"); setStatus("All"); setSearch(""); }}
                style={{ fontSize: 12, color: "var(--muted)", padding: "6px 10px", height: 36 }}
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Send reminders */}
          <button
            className="btn btn-outline"
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, height: 36 }}
          >
            <FaBell style={{ fontSize: 11 }} /> Send Reminders
          </button>
        </div>

        {/* ── Table ── */}
        <div className="app-surface" style={{ overflow: "hidden", borderRadius: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
            <thead>
              <tr style={{ background: "var(--row-hover)", borderBottom: "1px solid var(--border)" }}>
                {[
                  { label: "Employee",   w: "auto"   },
                  { label: "Department", w: 120       },
                  { label: "Template",   w: 160       },
                  { label: "Due Date",   w: 110       },
                  { label: "Status",     w: 130       },
                  { label: "Self",       w: 70        },
                  { label: "Manager",    w: 80        },
                  { label: "Action",     w: 90        },
                ].map(({ label, w }) => (
                  <th key={label} style={{
                    padding: "10px 14px", textAlign: "left",
                    fontSize: 11, fontWeight: 700, color: "var(--muted)",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    width: typeof w === "number" ? w : undefined,
                    whiteSpace: "nowrap",
                  }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
                    No appraisals found
                  </td>
                </tr>
              ) : filtered.map((r, i) => {
                const cfg = STATUS_CONFIG[r.status];
                return (
                  <tr
                    key={r.id}
                    className="row-hover"
                    style={{
                      borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                      transition: "background 0.12s",
                    }}
                  >
                    {/* Employee */}
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={r.name} dept={r.dept} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.2 }}>{r.name}</p>
                          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{r.designation}</p>
                        </div>
                      </div>
                    </td>

                    {/* Dept */}
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                        background: DEPT_COLORS[r.dept]?.bg ?? "var(--row-hover)",
                        color: DEPT_COLORS[r.dept]?.text ?? "var(--muted)",
                      }}>
                        {r.dept}
                      </span>
                    </td>

                    {/* Template */}
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--muted)", maxWidth: 160 }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.template}
                      </span>
                    </td>

                    {/* Due date */}
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {r.dueDate}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
                        background: cfg.bg, color: cfg.text,
                        whiteSpace: "nowrap",
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
                        {r.status}
                      </span>
                    </td>

                    {/* Self score */}
                    <td style={{ padding: "11px 14px", textAlign: "center" }}>
                      <ScorePill value={r.selfScore} />
                    </td>

                    {/* Manager score */}
                    <td style={{ padding: "11px 14px", textAlign: "center" }}>
                      <ScorePill value={r.managerScore} />
                    </td>

                    {/* Action */}
                    <td style={{ padding: "11px 14px" }}>
                      <button
                        onClick={() => setOpenModalId(r.id)}
                        style={{
                          fontSize: 12, fontWeight: 600, padding: "5px 12px",
                          borderRadius: 7, cursor: "pointer", border: "none",
                          background: r.status === "Not Started"
                            ? "var(--gradient-primary)"
                            : r.status === "Completed"
                            ? "var(--row-hover)"
                            : "transparent",
                          color: r.status === "Not Started"
                            ? "#fff"
                            : cfg.actionColor,
                          border: r.status !== "Not Started" && r.status !== "Completed"
                            ? `1px solid ${cfg.dot}30`
                            : "none",
                          transition: "all 0.15s",
                          boxShadow: r.status === "Not Started" ? "var(--glow-primary)" : "none",
                        } as React.CSSProperties}
                      >
                        {cfg.action}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer */}
          <div style={{
            borderTop: "1px solid var(--border)",
            padding: "10px 14px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              Showing <span style={{ fontWeight: 600, color: "var(--text)" }}>{filtered.length}</span> of {MOCK_APPRAISALS.length} records
            </span>
            {hasFilters && (
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                <FaFilter style={{ display: "inline", marginRight: 4, fontSize: 10 }} />
                Filters active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Appraisal modal */}
      {openModalId !== null && (
        <AppraisalFormModal
          isOpen={true}
          onClose={() => setOpenModalId(null)}
          modalId={`appraisal-${openModalId}`}
        />
      )}
    </>
  );
};

export default AppraisalPage;