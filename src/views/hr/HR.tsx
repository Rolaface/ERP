import React, { useState } from "react";
import {
  FaUserTie,
  FaUserFriends,
  FaClipboardList,
  FaCalendarDay,
  FaMoneyCheckAlt,
  FaChartLine,
} from "react-icons/fa";
import HrDashboard from "./HrDashboard";
import EmployeeManagement from "./EmployeeManagement/EmployeeManagement";
import TimeAttendance from "./time_leave/TimeAttendanceSimple";
import Leave from "./time_leave/Leave";
import PayrollManagement from "./payroll-system/PayrollManagement";
// import Recruitment from './EmployeeManagement/Recruitment';

const navTabs = [
  { key: "dashboard", label: "HR Dashboard", icon: <FaChartLine /> },
  { key: "Management", label: "Employee Management", icon: <FaUserFriends /> },
  { key: "leave", label: "Leave Management", icon: <FaClipboardList /> },
  { key: "attendance", label: "Time & Attendance", icon: <FaCalendarDay /> },
  // { key: 'attendance', label: 'Attendance', icon: <FaClipboardList /> },
  // { key: 'leave', label: 'Leave Management', icon: <FaCalendarDay /> },
  { key: "payroll", label: "Payroll", icon: <FaMoneyCheckAlt /> },
];

const HrPayrollModule: React.FC = () => {
  const [tab, setTab] = useState(navTabs[0].key);

  return (
    <div className="p-6 bg-app min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-main">
          <FaUserTie /> Human Resources
        </h2>
      </div>

      {/* Navbar */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-4">
        {navTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap 
              ${
                tab === t.key
                  ? "text-primary border-b-2 border-current"
                  : "text-muted hover:text-main"
              }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {tab === "dashboard" && <HrDashboard />}
        {tab === "Management" && <EmployeeManagement />}
        {tab === "attendance" && <TimeAttendance />}
        {/* {tab === 'attendance' && <Attendance />}
        {tab === 'leave' && <LeaveManagement />} */}
        {tab === "payroll" && <PayrollManagement />}
        {tab === "leave" && <Leave />}
        {/* {tab === 'recruitment' && <Recruitment />} */}
      </div>
    </div>
  );
};

export default HrPayrollModule;
