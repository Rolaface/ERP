import React, { useState } from "react";
import { AppSubTabs } from "../../../components/ui/app-shell";
import { BarChart2, MessageSquare, Download } from "lucide-react";

const DUMMY_PROJECT_REPORTS = [
  { id: "1", project: "ERP Module",    role: "Developer", startDate: "01 Jan 2026", endDate: "Ongoing", hoursLogged: 320, status: "Active" },
  { id: "2", project: "Client Portal", role: "Developer", startDate: "01 Nov 2025", endDate: "28 Feb 2026", hoursLogged: 180, status: "Completed" },
];

const DUMMY_FEEDBACK = [
  { id: "1", from: "Manager — Rahul Sharma", date: "15 Apr 2026", type: "Quarterly Review", rating: 4, comment: "Consistently delivers high-quality work. Good at problem solving." },
  { id: "2", from: "Peer — Priya Mehta",      date: "01 Mar 2026", type: "360° Feedback",    rating: 5, comment: "Great team player and very communicative." },
];

const ProjectReport: React.FC = () => (
  <div className="p-4 space-y-4">
    {DUMMY_PROJECT_REPORTS.map((p) => (
      <div
        key={p.id}
        className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl"
              style={{
                background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                color:       "var(--primary)",
              }}
            >
              <BarChart2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text)]">{p.project}</h3>
              <p className="text-xs text-[var(--muted)]">{p.role}</p>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              p.status === "Active"
                ? "bg-green-100 text-green-700"
                : "bg-[var(--row-hover)] text-[var(--muted)]"
            }`}
          >
            {p.status}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Start Date",    value: p.startDate },
            { label: "End Date",      value: p.endDate },
            { label: "Hours Logged",  value: `${p.hoursLogged}h` },
          ].map((f) => (
            <div key={f.label}>
              <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-0.5">
                {f.label}
              </p>
              <p className="text-sm font-semibold text-[var(--text)]">{f.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-end">
          <button className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
            <Download size={13} /> Download Report
          </button>
        </div>
      </div>
    ))}
  </div>
);

const FeedbackReport: React.FC = () => (
  <div className="p-4 space-y-4">
    {DUMMY_FEEDBACK.map((fb) => (
      <div
        key={fb.id}
        className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl"
              style={{
                background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                color:       "var(--primary)",
              }}
            >
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text)]">{fb.from}</h3>
              <p className="text-xs text-[var(--muted)]">{fb.type} · {fb.date}</p>
            </div>
          </div>
          {/* Star rating */}
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={`text-base ${s <= fb.rating ? "text-amber-400" : "text-[var(--border)]"}`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
        <p className="text-sm text-[var(--muted)] leading-relaxed italic">
          "{fb.comment}"
        </p>
      </div>
    ))}
  </div>
);

const REPORT_TABS = [
  { id: "project",  label: "Project Reports" },
  { id: "feedback", label: "Feedback Reports" },
];

const EmployeeReports: React.FC = () => {
  const [tab, setTab] = useState("project");
  return (
    <div className="h-full flex flex-col">
      <AppSubTabs tabs={REPORT_TABS} activeTab={tab} onChange={setTab} />
      <div className="flex-1 overflow-y-auto">
        {tab === "project"  && <ProjectReport />}
        {tab === "feedback" && <FeedbackReport />}
      </div>
    </div>
  );
};

export default EmployeeReports;