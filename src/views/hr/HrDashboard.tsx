import React, { useEffect, useState } from "react";
import { 
  getEmployeeStatusCount, 
  getEmployeeTrend, 
  getHrDashboardData 
} from "../../api/hrDashboardApi";
import { parseFrappeError } from "./tabs/leave-config/hooks/parseFrappeError";
import { EmployeeTrendChart, DepartmentPayrollChart, AttendancePatternChart } from "../../components/charts/HrDashboardCharts";
import { CalendarRange, Gavel, HandCoins, Icon, NotebookPen, UserCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";


const HrDashboard: React.FC = () => {
  // Existing Summary State
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<{
    total: number;
    active: number;
    inactive: number;
    onLeave: number;
    totalLeaveTypes: number;
    activeWorking: number;
    pendingLeaves: number;
    presentToday: number;
    approvedLeaves: number;
    rejectedLeaves: number;
  } | null>(null);

  // New Trend State
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendData, setTrendData] = useState<any>(null);
  const [visibleMonths, setVisibleMonths] = useState(6);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // New Dashboard Data State (Payroll & Attendance)
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Fetch KPI Summary
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setSummaryLoading(true);
        setSummaryError(null);
        const resp = await getEmployeeStatusCount();
        if (!mounted) return;
        
        const data = resp.data;
        setSummaryData({
          total: (data?.total_active || 0) + (data?.inactive || 0),  
          active: data?.total_active || 0,
          inactive: data?.inactive || 0,
          onLeave: data?.on_leave || 0,
          totalLeaveTypes: data?.total_leave_types || 0,
          activeWorking: data?.active_working || 0,
          pendingLeaves: data?.pending_leaves || 0,
          presentToday: data?.present_today || 0,
          approvedLeaves: data?.approved_leaves || 0,
          rejectedLeaves: data?.rejected_leaves || 0,
        });
      } catch (e: any) {
        if (!mounted) return;
        setSummaryError(parseFrappeError(e) || "Failed to load HR dashboard summary");
      } finally {
        if (!mounted) return;
        setSummaryLoading(false);
      }
    };

    run();
    return () => { mounted = false; };
  }, []);

// Fetch Employee Trend
  useEffect(() => {
    let mounted = true;
    const fetchTrend = async () => {
      try {
        setTrendLoading(true);
        const currentYear = new Date().getFullYear();
        // const resp = await getEmployeeTrend(currentYear, visibleMonths);
        const resp = await getEmployeeTrend(selectedYear, visibleMonths);
        if (!mounted) return;
        
        // FIX: Unwrap Frappe's 'message' wrapper
        // Fallbacks added just in case your Axios interceptor already unwraps it
        const actualData = resp.message?.data || (resp as any).data?.message?.data || resp.data;
        
        setTrendData(actualData);
      } catch (e: any) {
        if (!mounted) return;
        console.error("Failed to load trend data", e);
      } finally {
        if (!mounted) return;
        setTrendLoading(false);
      }
    };

    fetchTrend();
    return () => { mounted = false; };
  }, [visibleMonths, selectedYear]);

  // Fetch Payroll & Attendance Dashboard Data
  useEffect(() => {
    let mounted = true;
    const fetchDashboardData = async () => {
      try {
        setDashboardLoading(true);
        const currentYear = new Date().getFullYear();
        const resp = await getHrDashboardData(currentYear);
        if (!mounted) return;
        
        // FIX: Unwrap Frappe's 'message' wrapper
        const actualData = resp.message?.data || (resp as any).data?.message?.data || resp.data;
        
        setDashboardData(actualData);
      } catch (e: any) {
        if (!mounted) return;
        console.error("Failed to load dashboard data", e);
      } finally {
        if (!mounted) return;
        setDashboardLoading(false);
      }
    };

    fetchDashboardData();
    return () => { mounted = false; };
  }, []);

const currentY = new Date().getFullYear();
  const yearOptions = Array.from({ length: 4 }, (_, i) => currentY - i);

  return (
    <div className="bg-gray-100 min-h-screen p-6 font-sans">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-2 mb-6">
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center gap-3">
          <Users size={16} className="text-black-500" />
          <p className="text-gray-500 text-sm">Employees</p>
          </div>
          <h2 className="text-2xl font-bold mt-2">
            {summaryLoading ? "..." : summaryData?.active || "0"}
          </h2>
          <p className="text-green-500 text-sm mt-1">+{summaryLoading ? "..." : summaryData?.active || "0"} this month</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
           <div className="flex items-center gap-3">
          <CalendarRange size={16} className="text-blue-500" />
          <p className="text-gray-500 text-sm">Attendance</p>
          </div>
          <h2 className="text-2xl font-bold mt-2">
            {summaryLoading 
              ? "..." 
              : `${summaryData?.active ? Math.round((summaryData.presentToday / summaryData.active) * 100) : 0}%`
            }
          </h2>
          <p className="text-blue-500 text-sm mt-1">
            {summaryLoading 
              ? "Loading..." 
              : `${summaryData?.presentToday || 0} / ${summaryData?.active || 0} Present Today`
            }
          </p>
        </div>

        {/* <div className="bg-white rounded-2xl shadow p-4">
           <div className="flex items-center gap-3">
          <NotebookPen size={16} className="text-red-500" />
          <p className="text-gray-500 text-sm">Pending Leaves</p>
          </div>
          <h2 className="text-2xl font-bold mt-2">
            {summaryLoading ? "..." : summaryData?.pendingLeaves || "0"}
          </h2>
          <p className="text-orange-500 text-sm mt-1">Need Approval</p>
        </div> */}
        <Link 
          to="?tab=leave"
          className="block bg-white rounded-2xl shadow p-4 cursor-pointer hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex items-center gap-3">
            <NotebookPen size={16} className="text-red-500" />
            <p className="text-gray-500 text-sm">Pending Leaves</p>
          </div>
          <h2 className="text-2xl font-bold mt-2">
            {summaryLoading ? "..." : summaryData?.pendingLeaves || "0"}
          </h2>
          <p className="text-orange-500 text-sm mt-1">Need Approval</p>
        </Link>

        <div className="bg-white rounded-2xl shadow p-4">
           <div className="flex items-center gap-3">
          <HandCoins size={16} className="text-green-500" />
          <p className="text-gray-500 text-sm">Reimbursements</p>
          </div>
          <h2 className="text-2xl font-bold mt-2">8</h2>
          <p className="text-red-500 text-sm mt-1">Pending Claims</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
           <div className="flex items-center gap-3">
          <UserCheck size={16} className="text-green-500" />
          <p className="text-gray-500 text-sm">Upcoming Appraisals</p>
          </div>
          <h2 className="text-2xl font-bold mt-2">21</h2>
          <p className="text-purple-500 text-sm mt-1">Next 30 days</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
           <div className="flex items-center gap-3">
          <Gavel size={16} className="text-black-500" />
          <p className="text-gray-500 text-sm">Compliance</p>
          </div>
          <h2 className="text-2xl font-bold mt-2">87%</h2>
          <p className="text-green-500 text-sm mt-1">Completed</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT SECTION */}
        <div className="xl:col-span-2 space-y-6">

          {/* Employee Trend */}
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Employee Trend</h2>
              </div>
              <div className="flex items-center gap-3">
             <select 
                className="border rounded-lg px-3 py-2 text-sm outline-none cursor-pointer"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select 
                className="border rounded-lg px-3 py-2 text-sm outline-none cursor-pointer"
                onChange={(e) => setVisibleMonths(e.target.value === "Yearly" ? 12 : e.target.value === "Quarterly" ? 3 : 6)}
                defaultValue="Monthly"
              >
                <option value="Monthly">Monthly (6M)</option>
                <option value="Quarterly">Quarterly (3M)</option>
                <option value="Yearly">Yearly (12M)</option>
              </select>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              {/* Hired */}
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Hired</p>
                  <h3 className="text-2xl font-bold text-green-600">
                    {trendLoading ? "..." : trendData?.summary?.hired || "0"}
                  </h3>
                </div>
                <p className="text-xs text-green-500 mt-2">+12% from last month</p>
              </div>

              {/* Resigned */}
              <div className="bg-orange-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Resigned</p>
                  <h3 className="text-2xl font-bold text-orange-500">
                    {trendLoading ? "..." : trendData?.summary?.resigned || "0"}
                  </h3>
                </div>
                <p className="text-xs text-orange-500 mt-2">Voluntary exits</p>
              </div>

              {/* Fired */}
              <div className="bg-red-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Fired</p>
                  <h3 className="text-2xl font-bold text-red-600">
                    {trendLoading ? "..." : trendData?.summary?.fired || "0"}
                  </h3>
                </div>
                <p className="text-xs text-red-500 mt-2">Terminated employees</p>
              </div>

              {/* Net Growth */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Net Growth</p>
                  <h3 className="text-2xl font-bold text-blue-600">
                    {trendLoading 
                      ? "..." 
                      : `${(trendData?.summary?.net_growth || 0) > 0 ? "+" : ""}${trendData?.summary?.net_growth || "0"}`
                    }
                  </h3>
                </div>
                <p className="text-xs text-blue-500 mt-2">Current workforce growth</p>
              </div>
            </div>

            <EmployeeTrendChart data={trendData?.trend} loading={trendLoading} />
          </div>

          {/* Payroll & Attendance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Payroll (Rose Type EChart) */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Department Wise Payroll</h2>
              <DepartmentPayrollChart data={dashboardData?.["Department Wise Payroll"]} loading={dashboardLoading} />
            </div>

            {/* Attendance (Dataset Link EChart) */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Attendance Pattern</h2>
              <AttendancePatternChart data={dashboardData?.["Attendance Pattern"]} loading={dashboardLoading} />
            </div>

          </div>

          {/* Compliance */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Compliance Tracker</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>PF Filing</span>
                  <span className="text-green-600">Completed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full w-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>POSH Training</span>
                  <span className="text-orange-500">Pending</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-orange-500 h-3 rounded-full w-[70%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Reimbursement & Leave */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="space-y-6">

          {/* Birthdays */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Birthdays & Events</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-200"></div>
                <div>
                  <p className="font-medium">Rahul Sharma</p>
                  <p className="text-sm text-gray-500">Birthday Today 🎂</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-200"></div>
                <div>
                  <p className="font-medium">Priya Singh</p>
                  <p className="text-sm text-gray-500">5 Year Anniversary 🎉</p>
                </div>
              </div>
            </div>
          </div>

          {/* Appraisals */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Appraisals</h2>
            <div className="space-y-4">
              <div className="border rounded-xl p-4">
                <p className="text-sm text-gray-500">Last Approval</p>
                <h3 className="font-semibold mt-1">Amit Kumar</h3>
                <p className="text-sm text-gray-400">Approved on 12 May 2026</p>
              </div>

              <div className="border rounded-xl p-4">
                <p className="text-sm text-gray-500">Upcoming Approval</p>
                <h3 className="font-semibold mt-1">Neha Verma</h3>
                <p className="text-sm text-gray-400">Due on 28 May 2026</p>
              </div>
            </div>
          </div>

          {/* Leaves */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Leave Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Pending</span>
                  <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm">
                    {summaryLoading ? "..." : summaryData?.pendingLeaves || "0"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Approved</span>
                  <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm">
                    {summaryLoading ? "..." : summaryData?.approvedLeaves || "0"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Rejected</span>
                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm">
                    {summaryLoading ? "..." : summaryData?.rejectedLeaves || "0"}
                  </span>
                </div>
              </div>
            </div>
          {/* Reimbursement */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Reimbursements</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-orange-100 rounded-xl p-4">
                  <h3 className="text-2xl font-bold text-orange-600">12</h3>
                  <p className="text-sm mt-1">Pending</p>
                </div>
                <div className="bg-blue-100 rounded-xl p-4">
                  <h3 className="text-2xl font-bold text-blue-600">18</h3>
                  <p className="text-sm mt-1">Approved</p>
                </div>
                <div className="bg-green-100 rounded-xl p-4">
                  <h3 className="text-2xl font-bold text-green-600">105</h3>
                  <p className="text-sm mt-1">Paid</p>
                </div>
              </div>
            </div>

        </div>

      </div>
    </div>
  );
};

export default HrDashboard;