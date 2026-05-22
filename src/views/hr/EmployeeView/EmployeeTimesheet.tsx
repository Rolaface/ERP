import React from "react";

const DUMMY_TIMESHEETS = [
  { id: "1", project: "ERP Module",   task: "Frontend Development", date: "12 May 2026", hours: 8, status: "Submitted" },
  { id: "2", project: "Client Portal",task: "API Integration",      date: "11 May 2026", hours: 6, status: "Approved" },
  { id: "3", project: "ERP Module",   task: "Bug Fixes",            date: "08 May 2026", hours: 7, status: "Approved" },
];

const EmployeeTimesheet: React.FC = () => {
  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-end mb-4">
        <button
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--primary)" }}
        >
          + Log Time
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3">
        {DUMMY_TIMESHEETS.map((ts) => (
          <div
            key={ts.id}
            className="bg-[var(--card)] border border-[var(--border)] rounded-xl px-5 py-4 flex items-center justify-between hover:bg-[var(--row-hover)] transition-colors shadow-sm"
          >
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">{ts.project}</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">{ts.task} · {ts.date}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-[var(--text)]">{ts.hours}h</span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  ts.status === "Approved"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {ts.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeTimesheet;