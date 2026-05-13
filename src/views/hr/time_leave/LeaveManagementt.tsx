import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp,
} from "lucide-react";
import {
  getEmployeeLeaveBalanceReport,
  getAllEmployeeLeaveHistory,
} from "../../../api/leaveApi";
import { useAuth }             from "../../../context/AuthContext";
import LeaveApplyTable         from "./LeaveApply";
import LeaveApproval           from "./LeaveApproval";
import { showApiError } from "../../../utils/alert";
import { getEmployeeDetailsById } from "../../../api/employeeapi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaveBalance {
  leaveType: string;
  total:     number;
  used:      number;
  remaining: number;
}

interface RecentLeave {
  id:        string;
  leaveType: string;
  fromDate:  string;
  toDate:    string;
  status:    string;
  reason:    string;
}

interface LeaveProps {
  isEmployeeView?: boolean;
}

// ─── Status chip ──────────────────────────────────────────────────────────────

const StatusChip: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    Open:      { bg: "bg-blue-50",  text: "text-blue-700",  icon: <Clock       size={11} /> },
    Approved:  { bg: "bg-green-50", text: "text-green-700", icon: <CheckCircle size={11} /> },
    Rejected:  { bg: "bg-red-50",   text: "text-red-700",   icon: <XCircle     size={11} /> },
    Cancelled: { bg: "bg-gray-100", text: "text-gray-600",  icon: <XCircle     size={11} /> },
  };
  const s = map[status] ?? { bg: "bg-gray-100", text: "text-gray-600", icon: <AlertCircle size={11} /> };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.bg} ${s.text}`}>
      {s.icon}{status}
    </span>
  );
};

// ─── Balance card ─────────────────────────────────────────────────────────────

const CARD_COLORS = ["#3b82f6","#22c55e","#f59e0b","#8b5cf6","#ec4899","#14b8a6","#f97316","#6366f1"];

const BalanceCard: React.FC<{ balance: LeaveBalance; color: string }> = ({ balance, color }) => {
  const pct = balance.total > 0
    ? Math.round(((balance.total - balance.used) / balance.total) * 100)
    : 100;
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--text)] leading-tight">{balance.leaveType}</p>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: `${color}18`, color }}>
          {balance.remaining} left
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--row-hover)] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="flex justify-between text-[11px] text-[var(--muted)]">
        <span>{balance.used} used</span>
        <span>{balance.total} total</span>
      </div>
    </div>
  );
};

// ─── Employee leave section (balance + recent + apply table) ──────────────────

const EmployeeLeaveSection: React.FC = () => {
  const { user } = useAuth();
  const [balances,       setBalances]       = useState<LeaveBalance[]>([]);
  const [recentLeaves,   setRecentLeaves]   = useState<RecentLeave[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingRecent,  setLoadingRecent]  = useState(true);
  const [refreshKey,     setRefreshKey]     = useState(0);
  const [empDetails, setEmpDetails] = useState<any>(null);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);

  const fetchBalances = useCallback(async () => {
    if (!user?.employeeId) { setLoadingBalance(false); return; }
    try {
      setLoadingBalance(true);
      const today    = new Date();
      const fromDate = `${today.getFullYear()}-01-01`;
      const toDate   = today.toISOString().split("T")[0];
      const res      = await getEmployeeLeaveBalanceReport({ employeeId: user.employeeId, fromDate, toDate, page: 1, page_size: 50 });
      const raw: any[] = res?.message?.data ?? res?.data ?? [];
      setBalances(raw.map((item: any) => ({
        leaveType: item.leave_type ?? item.leaveType ?? "Leave",
        total:     Number(item.total_leaves   ?? item.total     ?? 0),
        used:      Number(item.leaves_taken   ?? item.used      ?? 0),
        remaining: Number(item.balance_leaves ?? item.remaining ?? 0),
      })));
    } catch (err) {
      console.warn("[Leave] balance fetch failed", err);
    } finally {
      setLoadingBalance(false);
    }
  }, [user?.employeeId]);

  useEffect(() => {
    if (!user?.employeeId) return;

    const fetchEmployeeData = async () => {
      try {
        const detailsRes = await getEmployeeDetailsById(user.employeeId!);
        const detailsData = detailsRes?.message?.data ?? detailsRes?.data ?? detailsRes;
        
        if (detailsData?.employeeInfo) setEmpDetails(detailsData.employeeInfo);
        if (detailsData?.leaveBalances) setLeaveBalances(detailsData.leaveBalances);
      } catch (err: any) {
        showApiError(
          err?.response?.data?.message ?? err?.message ?? "Failed to fetch API.",
        );
      } finally {
        // This ensures loading is set to false whether the API succeeds OR fails
        setIsLoading(false); 
      }
    };

    fetchEmployeeData();
  }, [user?.employeeId]);
  

  const fetchRecent = useCallback(async () => {
    if (!user?.employeeId) { setLoadingRecent(false); return; }
    try {
      setLoadingRecent(true);
      const res  = await getAllEmployeeLeaveHistory(1, 100);
      const raw: any[] = res?.message?.data ?? res?.data ?? [];
      const sorted = [...raw].sort((a, b) => {
        const order: Record<string, number> = { Open: 0, Approved: 1, Rejected: 2, Cancelled: 3 };
        return (order[a.status] ?? 9) - (order[b.status] ?? 9);
      });
      setRecentLeaves(sorted.slice(0, 5).map((item: any) => ({
        id:        item.name ?? item.id ?? "",
        leaveType: item.leave_type ?? item.leaveType ?? "Leave",
        fromDate:  item.from_date  ?? item.fromDate  ?? "",
        toDate:    item.half_day === 1 ? "Half Day" : (item.to_date ?? item.toDate ?? ""),
        status:    item.status     ?? "Open",
        reason:    item.description ?? item.reason ?? "—",
      })));
    } catch (err) {
      console.warn("[Leave] recent fetch failed", err);
    } finally {
      setLoadingRecent(false);
    }
  }, [user?.employeeId]);

  useEffect(() => { fetchBalances(); fetchRecent(); }, [fetchBalances, fetchRecent, refreshKey]);

  const handleAfterApply = () => setRefreshKey((k) => k + 1);

  return (
    <div className="space-y-6">
      {/* Leave Balance */}
     {/* Leave Balance */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--muted)]">Leave Balance</h2>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-[var(--row-hover)] animate-pulse" />
            ))}
          </div>
        ) : leaveBalances.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {leaveBalances.map((leave, idx) => {
              // Map the getEmployeeDetailsById response to the BalanceCard props
              const balanceData = {
                leaveType: leave.leave_type,
                total: Number((leave.new_leaves_allocated + leave.opening_balance).toFixed(1)),
                used: Number(leave.leaves_taken.toFixed(1)),
                remaining: Number(leave.balance.toFixed(1)),
              };

              return (
                <BalanceCard 
                  key={idx} 
                  balance={balanceData} 
                  color={CARD_COLORS[idx % CARD_COLORS.length]} 
                />
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-[var(--muted)] py-2">
            <TrendingUp size={15} /> No leave balance data available.
          </div>
        )}
      </div>

      {/* Recent Requests */}
      {(loadingRecent || recentLeaves.length > 0) && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--muted)] mb-3">Recent Requests</h2>
          {loadingRecent ? (
            <div className="space-y-2">
              {[1,2,3].map((i) => <div key={i} className="h-14 rounded-xl bg-[var(--row-hover)] animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {recentLeaves.map((leave) => (
                <div key={leave.id} className="flex items-center justify-between bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-lg shrink-0" style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--primary)" }}>
                      <Calendar size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text)] truncate">{leave.leaveType}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {leave.fromDate}{leave.toDate && leave.toDate !== leave.fromDate ? ` → ${leave.toDate}` : ""}
                      </p>
                    </div>
                  </div>
                  <StatusChip status={leave.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Applications */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--muted)] mb-3">All Applications</h2>
        <LeaveApplyTable key={refreshKey} onAfterApply={handleAfterApply} />
      </div>
    </div>
  );
};

// ─── Main export ─────────────────────────────────────────────────────────────

const Leave: React.FC<LeaveProps> = ({ isEmployeeView = false }) => {
  // Employee view: show their own leave section (balance + apply table)
  if (isEmployeeView) {
    return <EmployeeLeaveSection />;
  }

  // Professional view: show Leave Approval table directly (no sub-tabs)
  return <LeaveApproval />;
};

export default Leave;