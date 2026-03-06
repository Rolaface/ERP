import React, { useState } from "react";
import {
  Calendar,
  Clock,
  TrendingUp,
  ArrowRight,
  Edit2,
  Trash2,
  Plus,
  Download,
  Filter,
  Search,
  X,
  CheckCircle,
  AlertCircle,
  Settings,
  FileText,
  BarChart3,
  Activity,
  ChevronRight,
  Target,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";

type AttendanceRecord = {
  id: string;
  employeeName: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  breakMinutes: number;
  totalHours: number;
  status: "Present" | "Late" | "Early Departure" | "Absent";
};

type TimesheetEntry = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  project: string;
  taskDescription: string;
  hoursWorked: number;
  status: "Pending" | "Approved" | "Rejected";
};

type TimesheetSetup = {
  employeeId: string;
  employeeName: string;
  department: string;
  defaultProject: string;
  workingHours: number;
  overtimeAllowed: boolean;
  approver: string;
};

const demoAttendanceRecords: AttendanceRecord[] = [
  {
    id: "A001",
    employeeName: "John Smith",
    employeeId: "EMP001",
    date: "2025-11-27",
    checkIn: "08:55 AM",
    checkOut: "05:30 PM",
    breakMinutes: 50,
    totalHours: 7.85,
    status: "Present",
  },
  {
    id: "A002",
    employeeName: "Sarah Johnson",
    employeeId: "EMP002",
    date: "2025-11-27",
    checkIn: "09:15 AM",
    checkOut: "05:45 PM",
    breakMinutes: 60,
    totalHours: 7.5,
    status: "Late",
  },
  {
    id: "A003",
    employeeName: "Mike Chen",
    employeeId: "EMP003",
    date: "2025-11-27",
    checkIn: "08:45 AM",
    checkOut: "05:20 PM",
    breakMinutes: 45,
    totalHours: 7.92,
    status: "Present",
  },
  {
    id: "A004",
    employeeName: "Emily Davis",
    employeeId: "EMP004",
    date: "2025-11-27",
    checkIn: "08:50 AM",
    checkOut: "04:30 PM",
    breakMinutes: 30,
    totalHours: 7.17,
    status: "Early Departure",
  },
  {
    id: "A005",
    employeeName: "David Wilson",
    employeeId: "EMP005",
    date: "2025-11-27",
    checkIn: "09:00 AM",
    checkOut: "05:35 PM",
    breakMinutes: 55,
    totalHours: 7.67,
    status: "Present",
  },
  {
    id: "A006",
    employeeName: "Lisa Anderson",
    employeeId: "EMP006",
    date: "2025-11-27",
    checkIn: "08:30 AM",
    checkOut: "05:15 PM",
    breakMinutes: 45,
    totalHours: 8.0,
    status: "Present",
  },
];

const demoTimesheetEntries: TimesheetEntry[] = [
  {
    id: "TS001",
    employeeId: "EMP001",
    employeeName: "John Smith",
    date: "2025-11-27",
    project: "Project Alpha",
    taskDescription: "Frontend development - Dashboard UI",
    hoursWorked: 6.5,
    status: "Approved",
  },
  {
    id: "TS002",
    employeeId: "EMP001",
    employeeName: "John Smith",
    date: "2025-11-27",
    project: "Project Beta",
    taskDescription: "Bug fixes and testing",
    hoursWorked: 1.5,
    status: "Approved",
  },
  {
    id: "TS003",
    employeeId: "EMP002",
    employeeName: "Sarah Johnson",
    date: "2025-11-27",
    project: "Project Alpha",
    taskDescription: "Backend API development",
    hoursWorked: 7.0,
    status: "Pending",
  },
  {
    id: "TS004",
    employeeId: "EMP003",
    employeeName: "Mike Chen",
    date: "2025-11-27",
    project: "Project Gamma",
    taskDescription: "Database optimization",
    hoursWorked: 8.0,
    status: "Approved",
  },
  {
    id: "TS005",
    employeeId: "EMP004",
    employeeName: "Emily Davis",
    date: "2025-11-27",
    project: "Project Beta",
    taskDescription: "Client meeting and requirements",
    hoursWorked: 3.0,
    status: "Pending",
  },
  {
    id: "TS006",
    employeeId: "EMP005",
    employeeName: "David Wilson",
    date: "2025-11-27",
    project: "Project Alpha",
    taskDescription: "Code review and optimization",
    hoursWorked: 4.5,
    status: "Approved",
  },
];

const weeklyData = [
  { day: "Mon", attendance: 42, timesheet: 38 },
  { day: "Tue", attendance: 45, timesheet: 43 },
  { day: "Wed", attendance: 38, timesheet: 36 },
  { day: "Thu", attendance: 47, timesheet: 45 },
  { day: "Fri", attendance: 41, timesheet: 39 },
];

const monthlyTrendData = [
  { month: "Jul", hours: 165 },
  { month: "Aug", hours: 172 },
  { month: "Sep", hours: 168 },
  { month: "Oct", hours: 175 },
  { month: "Nov", hours: 180 },
];

const TimeAttendance: React.FC = () => {
  const [currentView, setCurrentView] = useState<
    "dashboard" | "attendance" | "timesheet" | "setup"
  >("dashboard");
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [setupForm, setSetupForm] = useState<TimesheetSetup>({
    employeeId: "",
    employeeName: "",
    department: "",
    defaultProject: "",
    workingHours: 8,
    overtimeAllowed: false,
    approver: "",
  });

  const [attendanceRecords] = useState(demoAttendanceRecords);
  const [timesheetEntries] = useState(demoTimesheetEntries);

  // Calculate statistics
  const totalPresent = attendanceRecords.filter(
    (r) =>
      r.status === "Present" ||
      r.status === "Late" ||
      r.status === "Early Departure",
  ).length;
  const totalAbsent = attendanceRecords.filter(
    (r) => r.status === "Absent",
  ).length;
  const avgHours =
    attendanceRecords.length > 0
      ? (
          attendanceRecords.reduce((sum, r) => sum + r.totalHours, 0) /
          attendanceRecords.length
        ).toFixed(2)
      : "0.00";
  const lateCount = attendanceRecords.filter((r) => r.status === "Late").length;
  const onTimePercentage =
    attendanceRecords.length > 0
      ? Math.round(
          ((totalPresent - lateCount) / attendanceRecords.length) * 100,
        )
      : 0;

  const pendingTimesheets = timesheetEntries.filter(
    (t) => t.status === "Pending",
  ).length;
  const approvedTimesheets = timesheetEntries.filter(
    (t) => t.status === "Approved",
  ).length;
  const totalTimesheetHours = timesheetEntries.reduce(
    (sum, t) => sum + t.hoursWorked,
    0,
  );

  const attendanceSummaryData = [
    { name: "On-Time", value: onTimePercentage },
    { name: "Late", value: 100 - onTimePercentage },
  ];

  const timesheetStatusData = [
    { name: "Approved", value: approvedTimesheets },
    { name: "Pending", value: pendingTimesheets },
    {
      name: "Rejected",
      value: timesheetEntries.filter((t) => t.status === "Rejected").length,
    },
  ];

  const filteredAttendance = attendanceRecords.filter(
    (record) =>
      record.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredTimesheet = timesheetEntries.filter(
    (entry) =>
      entry.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.project.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleRecordClick = (id: string, type: "attendance" | "timesheet") => {
    setSelectedRecord(id);
    setCurrentView(type);
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete ${currentView} record for "${name}"?`)) {
      alert(`Delete functionality ready — connect to API later`);
    }
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      `Timesheet setup saved for ${setupForm.employeeName}!\n\nConnect to your backend API to persist this configuration.`,
    );
    setShowAddModal(false);
  };

  // DASHBOARD VIEW
  const renderDashboard = () => (
    <div className="space-y-6 pt--19">
      {/* Welcome Header */}
      <div className="bg-blue-200 rounded-2xl shadow-lg p-2 text-grey-400">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-indigo-600 text-sm mt-2">
              Today: Wednesday, November 27, 2025
            </p>
          </div>
          <button
            onClick={() => setCurrentView("setup")}
            className="bg-blue/20 hover:bg-blue/30 backdrop-blur-sm px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            Setup
          </button>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer"
          onClick={() => setCurrentView("attendance")}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Present Today</p>
          <p className="text-3xl font-bold text-gray-900">{totalPresent}</p>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> View Attendance
          </p>
        </div>

        <div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer"
          onClick={() => setCurrentView("attendance")}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Avg Hours/Day</p>
          <p className="text-3xl font-bold text-gray-900">{avgHours}</p>
          <p className="text-xs text-gray-500 mt-2">Standard: 8.0 hrs</p>
        </div>

        <div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer"
          onClick={() => setCurrentView("timesheet")}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Pending Timesheets</p>
          <p className="text-3xl font-bold text-gray-900">
            {pendingTimesheets}
          </p>
          <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> Review Now
          </p>
        </div>

        <div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer"
          onClick={() => setCurrentView("timesheet")}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Logged Hours</p>
          <p className="text-3xl font-bold text-gray-900">
            {totalTimesheetHours}
          </p>
          <p className="text-xs text-purple-600 mt-2">This period</p>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
              Attendance Overview
            </h3>
            <button
              onClick={() => setCurrentView("attendance")}
              className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex justify-center mb-6">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={attendanceSummaryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill="var(--brand-blue-bottom)" />
                  <Cell fill="var(--primary)" />
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-row-hover rounded-lg">
              <span className="text-sm font-medium text-main">
                On-Time Arrivals
              </span>
              <span className="text-lg font-bold text-primary">
                {onTimePercentage}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-row-hover rounded-lg">
              <span className="text-sm font-medium text-main">
                Late Arrivals
              </span>
              <span className="text-lg font-bold text-primary">
                {lateCount}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Recent Attendance
            </h4>
            <div className="space-y-2">
              {attendanceRecords.slice(0, 3).map((record) => (
                <div
                  key={record.id}
                  onClick={() => handleRecordClick(record.id, "attendance")}
                  className="flex items-center justify-between p-2 hover:bg-indigo-50 rounded-lg cursor-pointer transition"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {record.employeeName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {record.checkIn} - {record.totalHours.toFixed(2)} hrs
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      record.status === "Present"
                        ? "bg-row-hover text-primary"
                        : record.status === "Late"
                          ? "bg-row-hover text-primary"
                          : "bg-row-hover text-primary"
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-main flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Timesheet Status
            </h3>
            <button
              onClick={() => setCurrentView("timesheet")}
              className="text-primary font-semibold text-sm flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex justify-center mb-6">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={timesheetStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill="var(--brand-blue-bottom)" />
                  <Cell fill="var(--brand-blue-top)" />
                  <Cell fill="var(--primary)" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-row-hover rounded-lg">
              <p className="text-2xl font-bold text-primary">
                {approvedTimesheets}
              </p>
              <p className="text-xs text-muted mt-1">Approved</p>
            </div>
            <div className="text-center p-3 bg-row-hover rounded-lg">
              <p className="text-2xl font-bold text-primary">
                {pendingTimesheets}
              </p>
              <p className="text-xs text-muted mt-1">Pending</p>
            </div>
            <div className="text-center p-3 bg-row-hover rounded-lg">
              <p className="text-2xl font-bold text-primary">0</p>
              <p className="text-xs text-muted mt-1">Rejected</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Recent Submissions
            </h4>
            <div className="space-y-2">
              {timesheetEntries.slice(0, 3).map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => handleRecordClick(entry.id, "timesheet")}
                  className="flex items-center justify-between p-2 hover:bg-purple-50 rounded-lg cursor-pointer transition"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {entry.employeeName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {entry.project} - {entry.hoursWorked} hrs
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      entry.status === "Approved"
                        ? "bg-row-hover text-primary"
                        : entry.status === "Pending"
                          ? "bg-row-hover text-primary"
                          : "bg-row-hover text-primary"
                    }`}
                  >
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Trend Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-main flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Weekly Hours Comparison
          </h3>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="attendance"
              fill="var(--brand-blue-bottom)"
              name="Attendance Hours"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="timesheet"
              fill="var(--primary)"
              name="Logged Hours"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-main flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Monthly Productivity Trend
          </h3>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="var(--brand-blue-bottom)"
              strokeWidth={3}
              dot={{ fill: "var(--brand-blue-bottom)", r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // ATTENDANCE VIEW
  const renderAttendance = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentView("dashboard")}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Attendance Records
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {filteredAttendance.length} records found
              </p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                <Filter className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                <Download className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Record
              </button>
            </div>
          </div>

          <div className="mt-4 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or employee ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Check In
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Check Out
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Break
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Total Hours
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAttendance.map((record) => (
                <tr
                  key={record.id}
                  className={`hover:bg-indigo-50/30 transition-colors cursor-pointer ${selectedRecord === record.id ? "bg-indigo-50" : ""}`}
                  onClick={() => setSelectedRecord(record.id)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {record.employeeName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {record.employeeId}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {record.date}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {record.checkIn}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {record.checkOut}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {record.breakMinutes} min
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {record.totalHours.toFixed(2)} hrs
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${
                        record.status === "Present"
                          ? "bg-green-100 text-green-800"
                          : record.status === "Late"
                            ? "bg-yellow-100 text-yellow-800"
                            : record.status === "Early Departure"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800"
                      }`}
                    >
                      {record.status === "Present" && (
                        <CheckCircle className="w-3 h-3" />
                      )}
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) =>
                          handleDelete(record.id, record.employeeName, e)
                        }
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAttendance.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No attendance records found</p>
            <p className="text-sm mt-1">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );

  // TIMESHEET VIEW
  const renderTimesheet = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-purple-600" />
            Timesheet Management
          </h2>
          <p className="text-gray-600 mt-1">
            Track project hours and task allocations
          </p>
        </div>
        <button
          onClick={() => setCurrentView("dashboard")}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Timesheet Entries
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {filteredTimesheet.length} entries found
              </p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                <Filter className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                <Download className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Entry
              </button>
            </div>
          </div>

          <div className="mt-4 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Project
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Task Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Hours
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTimesheet.map((entry) => (
                <tr
                  key={entry.id}
                  className={`hover:bg-purple-50/30 transition-colors cursor-pointer ${selectedRecord === entry.id ? "bg-purple-50" : ""}`}
                  onClick={() => setSelectedRecord(entry.id)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {entry.employeeName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {entry.employeeId}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {entry.date}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                      {entry.project}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                    {entry.taskDescription}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {entry.hoursWorked} hrs
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${
                        entry.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : entry.status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) =>
                          handleDelete(entry.id, entry.employeeName, e)
                        }
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTimesheet.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No timesheet entries found</p>
            <p className="text-sm mt-1">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );

  // SETUP VIEW
  const renderSetup = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-indigo-600" />
            Timesheet Setup & Configuration
          </h2>
          <p className="text-gray-600 mt-1">
            Configure employee timesheet settings and preferences
          </p>
        </div>
        <button
          onClick={() => setCurrentView("dashboard")}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <form
          onSubmit={handleSetupSubmit}
          className="max-w-2xl mx-auto space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Employee ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={setupForm.employeeId}
                onChange={(e) =>
                  setSetupForm({ ...setupForm, employeeId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="EMP001"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Employee Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={setupForm.employeeName}
                onChange={(e) =>
                  setSetupForm({ ...setupForm, employeeName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={setupForm.department}
                onChange={(e) =>
                  setSetupForm({ ...setupForm, department: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Department</option>
                <option value="Engineering">Engineering</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="HR">Human Resources</option>
                <option value="Finance">Finance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Default Project
              </label>
              <input
                type="text"
                value={setupForm.defaultProject}
                onChange={(e) =>
                  setSetupForm({ ...setupForm, defaultProject: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Project Alpha"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Standard Working Hours/Day{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                max="12"
                step="0.5"
                value={setupForm.workingHours}
                onChange={(e) =>
                  setSetupForm({
                    ...setupForm,
                    workingHours: parseFloat(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Timesheet Approver <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={setupForm.approver}
                onChange={(e) =>
                  setSetupForm({ ...setupForm, approver: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Manager Name"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg">
            <input
              type="checkbox"
              id="overtimeAllowed"
              checked={setupForm.overtimeAllowed}
              onChange={(e) =>
                setSetupForm({
                  ...setupForm,
                  overtimeAllowed: e.target.checked,
                })
              }
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
            <label
              htmlFor="overtimeAllowed"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              Allow Overtime Logging
            </label>
          </div>

          <div className="pt-6 border-t border-gray-200 flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Save Configuration
            </button>
            <button
              type="button"
              onClick={() => setCurrentView("dashboard")}
              className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-lg font-semibold transition"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Configuration Guide
          </h4>
          <ul className="text-sm text-blue-800 space-y-1 ml-7">
            <li>• Set up individual timesheet preferences for each employee</li>
            <li>• Configure standard working hours and overtime policies</li>
            <li>• Assign project defaults and approval workflows</li>
            <li>• Changes will be applied to future timesheet entries</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-app">
      <div className="p-6 max-w-7xl mx-auto">
        {currentView === "dashboard" && renderDashboard()}
        {currentView === "attendance" && renderAttendance()}
        {currentView === "timesheet" && renderTimesheet()}
        {currentView === "setup" && renderSetup()}

        {/* Add Entry Modal */}
        {showAddModal && currentView !== "setup" && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <div
              className="bg-white rounded-xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Add New{" "}
                  {currentView === "attendance"
                    ? "Attendance Record"
                    : "Timesheet Entry"}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 text-center py-8">
                Form fields will be added here.
                <br />
                Connect to your backend API to save new {currentView} records.
              </p>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeAttendance;
