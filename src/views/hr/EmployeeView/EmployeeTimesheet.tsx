import React, { useState } from "react";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { AppSubTabs } from "../../../components/ui/app-shell";

const DUMMY_ATTENDANCE = [
  { date: "12 May 2026", day: "Tuesday",  in: "09:02", out: "18:15", hours: "9h 13m", status: "Present" },
  { date: "11 May 2026", day: "Monday",   in: "08:55", out: "18:00", hours: "9h 05m", status: "Present" },
  { date: "10 May 2026", day: "Sunday",   in: "—",     out: "—",     hours: "—",      status: "Weekend" },
  { date: "09 May 2026", day: "Saturday", in: "—",     out: "—",     hours: "—",      status: "Weekend" },
  { date: "08 May 2026", day: "Friday",   in: "09:30", out: "18:30", hours: "9h 00m", status: "Present" },
  { date: "07 May 2026", day: "Thursday", in: "—",     out: "—",     hours: "—",      status: "Absent" },
  { date: "06 May 2026", day: "Wednesday",in: "09:05", out: "18:10", hours: "9h 05m", status: "Present" },
];

const DUMMY_TIMESHEETS = [
  { id: "1", project: "ERP Module",   task: "Frontend Development", date: "12 May 2026", hours: 8, status: "Submitted" },
  { id: "2", project: "Client Portal",task: "API Integration",      date: "11 May 2026", hours: 6, status: "Approved" },
  { id: "3", project: "ERP Module",   task: "Bug Fixes",            date: "08 May 2026", hours: 7, status: "Approved" },
];

const statusConfig: Record<string, { icon: React.ReactNode; cls: string }> = {
  Present:  { icon: <CheckCircle size={13} />, cls: "text-green-600 bg-green-50" },
  Absent:   { icon: <XCircle size={13} />,     cls: "text-red-500 bg-red-50" },
  Weekend:  { icon: <AlertCircle size={13} />, cls: "text-[var(--muted)] bg-[var(--row-hover)]" },
  Late:     { icon: <Clock size={13} />,       cls: "text-amber-600 bg-amber-50" },
};

const AttendanceView: React.FC = () => (
  <div className="p-4 space-y-3">
    <div className="grid grid-cols-3 gap-3 mb-4">
      {[
        { label: "Present",  value: 18, color: "text-green-600 bg-green-50" },
        { label: "Absent",   value: 2,  color: "text-red-500 bg-red-50" },
        { label: "On Leave", value: 3,  color: "text-blue-600 bg-blue-50" },
      ].map((s) => (
        <div
          key={s.label}
          className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-center"
        >
          <p className={`text-2xl font-bold ${s.color.split(" ")[0]}`}>{s.value}</p>
          <p className="text-xs text-[var(--muted)] mt-1">{s.label}</p>
        </div>
      ))}
    </div>

    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
      <div className="grid grid-cols-5 px-4 py-2.5 bg-[var(--row-hover)] text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">
        <span>Date</span>
        <span>Day</span>
        <span className="text-center">In</span>
        <span className="text-center">Out</span>
        <span className="text-right">Status</span>
      </div>
      {DUMMY_ATTENDANCE.map((row) => {
        const cfg = statusConfig[row.status] ?? statusConfig["Present"];
        return (
          <div
            key={row.date}
            className="grid grid-cols-5 px-4 py-3 border-t border-[var(--border)] hover:bg-[var(--row-hover)] transition-colors items-center"
          >
            <span className="text-sm text-[var(--text)]">{row.date}</span>
            <span className="text-sm text-[var(--muted)]">{row.day}</span>
            <span className="text-sm text-center text-[var(--text)]">{row.in}</span>
            <span className="text-sm text-center text-[var(--text)]">{row.out}</span>
            <div className="flex justify-end">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.cls}`}>
                {cfg.icon}
                {row.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const TimesheetView: React.FC = () => (
  <div className="p-4 space-y-3">
    <div className="flex justify-end mb-2">
      <button
        className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
        style={{ background: "var(--primary)" }}
      >
        + Log Time
      </button>
    </div>
    {DUMMY_TIMESHEETS.map((ts) => (
      <div
        key={ts.id}
        className="bg-[var(--card)] border border-[var(--border)] rounded-xl px-5 py-4 flex items-center justify-between hover:bg-[var(--row-hover)] transition-colors"
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
);

const TABS = [
  { id: "attendance", label: "Attendance" },
  { id: "timesheet",  label: "Timesheet" },
];

const EmployeeTimesheet: React.FC = () => {
  const [tab, setTab] = useState("attendance");
  return (
    <div className="h-full flex flex-col">
      <AppSubTabs tabs={TABS} activeTab={tab} onChange={setTab} />
      <div className="flex-1 overflow-y-auto">
        {tab === "attendance" && <AttendanceView />}
        {tab === "timesheet"  && <TimesheetView />}
      </div>
    </div>
  );
};

export default EmployeeTimesheet;