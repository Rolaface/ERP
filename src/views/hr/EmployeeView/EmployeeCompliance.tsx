import React, { useState } from "react";
import { ShieldCheck, BookOpen, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";

const DUMMY_COMPLIANCE = [
  {
    id:       "1",
    title:    "Anti-Harassment Policy",
    type:     "Policy",
    deadline: "31 May 2026",
    status:   "Pending",
    priority: "High",
    desc:     "Read and acknowledge the company's anti-harassment and workplace conduct policy.",
  },
  {
    id:       "2",
    title:    "Data Privacy & GDPR Training",
    type:     "Course",
    deadline: "15 Jun 2026",
    status:   "Pending",
    priority: "High",
    desc:     "Complete the mandatory data privacy training course. Estimated time: 45 minutes.",
  },
  {
    id:       "3",
    title:    "Fire Safety Training",
    type:     "Course",
    deadline: "30 Jun 2026",
    status:   "Pending",
    priority: "Medium",
    desc:     "Complete the annual fire safety and evacuation procedures training.",
  },
  {
    id:       "4",
    title:    "Code of Conduct Acknowledgement",
    type:     "Policy",
    deadline: "01 Apr 2026",
    status:   "Completed",
    priority: "High",
    desc:     "Acknowledge and agree to the company's code of conduct.",
  },
  {
    id:       "5",
    title:    "Information Security Policy",
    type:     "Policy",
    deadline: "15 Apr 2026",
    status:   "Completed",
    priority: "Medium",
    desc:     "Read and acknowledge the information security policy.",
  },
];

const priorityCls: Record<string, string> = {
  High:   "bg-red-100 text-red-600",
  Medium: "bg-amber-100 text-amber-600",
  Low:    "bg-blue-100 text-blue-600",
};

const EmployeeCompliance: React.FC = () => {
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const filtered = DUMMY_COMPLIANCE.filter((c) => {
    if (filter === "pending")   return c.status === "Pending";
    if (filter === "completed") return c.status === "Completed";
    return true;
  });

  const pendingCount   = DUMMY_COMPLIANCE.filter((c) => c.status === "Pending").length;
  const completedCount = DUMMY_COMPLIANCE.filter((c) => c.status === "Completed").length;
  const totalCount     = DUMMY_COMPLIANCE.length;
  const pct            = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="p-4 space-y-5">

      {/* ── Header Card ── */}
      <div
        className="rounded-2xl p-5 text-white"
        style={{ background: "var(--gradient-primary, var(--primary))" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold">Compliance Status</h2>
            <p className="text-xs opacity-70 mt-0.5">
              {pendingCount} pending · {completedCount} completed
            </p>
          </div>
          <div
            className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-lg font-black"
          >
            {pct}%
          </div>
        </div>
        <div className="h-2 rounded-full bg-white/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-white transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* ── Filter ── */}
      <div className="flex gap-2">
        {[
          { id: "all" as const,       label: `All (${totalCount})` },
          { id: "pending" as const,   label: `Pending (${pendingCount})` },
          { id: "completed" as const, label: `Completed (${completedCount})` },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f.id
                ? "text-white"
                : "bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
            }`}
            style={filter === f.id ? { background: "var(--primary)" } : {}}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Items ── */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`bg-[var(--card)] border rounded-2xl p-5 transition-colors ${
              item.status === "Completed"
                ? "border-green-200 opacity-70"
                : "border-[var(--border)]"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                  item.status === "Completed"
                    ? "bg-green-100 text-green-600"
                    : "text-[var(--primary)]"
                }`}
                style={
                  item.status !== "Completed"
                    ? { background: "color-mix(in srgb, var(--primary) 12%, transparent)" }
                    : {}
                }
              >
                {item.type === "Course"
                  ? <BookOpen size={16} />
                  : <FileText size={16} />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-bold text-[var(--text)]">{item.title}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityCls[item.priority]}`}>
                      {item.priority}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[var(--muted)] mb-3 leading-relaxed">
                  {item.desc}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                    <Clock size={12} />
                    Deadline: {item.deadline}
                  </div>

                  {item.status === "Pending" ? (
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                      style={{ background: "var(--primary)" }}
                    >
                      {item.type === "Course" ? "Start Course" : "Acknowledge"}
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                      <CheckCircle size={13} /> Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeCompliance;