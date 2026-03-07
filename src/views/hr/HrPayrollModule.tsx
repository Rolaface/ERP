import React, { useState } from "react";
import {
  FaUserTie,
  FaUsers,
  FaClipboardList,
  FaCalendarDay,
  FaMoneyCheckAlt,
  FaChartLine,
} from "react-icons/fa";
import HrDashboard from "./HrDashboard";
import EmployeeDirectory from "./EmployeeDirectory";
import TimeAttendance from "./time_leave/TimeAttendanceSimple";
import Leave from "./time_leave/Leave";
import Payroll from "./Payroll";

const navTabs = [
  { key: "dashboard", label: "HR Dashboard", icon: <FaChartLine /> },
  { key: "directory", label: "Employee Directory", icon: <FaUsers /> },
  { key: "attendance", label: "Time & Attendance", icon: <FaClipboardList /> },
  { key: "leave", label: "Leave Management", icon: <FaCalendarDay /> },
  { key: "payroll", label: "Payroll", icon: <FaMoneyCheckAlt /> },
];

const HrPayrollModule: React.FC = () => {
  const [tab, setTab] = useState(navTabs[0].key);

  return (
    <div className="bg-app min-h-screen p-8 pb-20">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2 text-main">
        <FaUserTie /> Human Resources
      </h1>

      {/* Navbar */}
      <div className="flex gap-8 mb-8 border-b border-theme">
        {navTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 pb-3 text-base font-medium transition border-b-4
              ${
                tab === t.key
                  ? "text-primary border-current"
                  : "text-muted border-transparent hover:text-primary"
              }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {tab === "dashboard" && <HrDashboard />}
        {tab === "directory" && <EmployeeDirectory />}
        {tab === "attendance" && <TimeAttendance />}
        {tab === "leave" && <Leave />}
        {tab === "payroll" && <Payroll />}
      </div>
    </div>
  );
};

export default HrPayrollModule;
