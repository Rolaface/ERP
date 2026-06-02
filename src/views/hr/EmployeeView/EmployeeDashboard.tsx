import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getEmployeeDashboardSummary,
  EmployeeDashboardData,
  ExpenseClaim,
} from "../../../api/dashboard/EmployeeDashboardApi";
import { postEmployeeAttendance } from "../../../api/employeeAttendanceApi";
import { useAuth } from "../../../context/AuthContext";
import { openLeaveApplyModal, openExpenseModal, MODAL_LAYER } from "../../../store/modalStore";
import { showApiError } from "../../../utils/alert";
import { parseFrappeError } from "../tabs/leave-config/hooks/parseFrappeError";
import NewCycleModal from "../../../components/Hr/performance/Newcyclemodal";
import AttendanceTimer from "./AttendanceTimer";
import {
  LogIn,
  LogOut,
  CalendarDays,
  Umbrella,
  AlertCircle,
  Gift,
  Cake,
  Sparkles,
  Star,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Banknote,
  Megaphone,
  FileText,
  ChevronDown,
} from "lucide-react";

// ── TYPE PATCHES ──────────────────────────────────────────────────────────────

interface HolidayEntry {
  date: string;
  description: string;
}

interface BirthdayEntry {
  employeeName: string;
  dateOfBirth: string;
  daysLeft: number;
}

interface SafeDashboardData extends Omit<EmployeeDashboardData, "holidays" | "birthdays"> {
  holidays?: { upcoming: HolidayEntry[] };
  birthdays?: { upcoming: BirthdayEntry[] };
  expenseClaim?: ExpenseClaim[];
  employeeDetails?: EmployeeDashboardData["employeeDetails"] & {
    expenseApproverName?: string;
    shiftApproverName?: string;
  };
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function formatTime(dt: string | null): string {
  if (!dt) return "—";
  const d = new Date(dt.replace(" ", "T"));
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function getDayName(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", { weekday: "long" });
}

function getCountdown(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return "Passed";
  return `${diff}d`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function initials(name?: string | null): string {
  if (!name || typeof name !== "string") return "?";
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function getBirthdayLabel(daysLeft: number): string {
  if (daysLeft === 0) return "🎂 Today";
  if (daysLeft === 1) return "Tomorrow";
  return `${daysLeft}d`;
}

// ── ATOMS ─────────────────────────────────────────────────────────────────────

const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse rounded-xl bg-[var(--muted)]/40 ${className}`} />
);

const EmptyState: React.FC<{ message?: string }> = ({
  message = "No data available",
}) => (
  <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
    <AlertCircle size={18} className="text-[var(--muted-foreground)]/30" />
    <p className="text-xs text-[var(--muted-foreground)]">{message}</p>
  </div>
);

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];

const Avatar: React.FC<{
  name?: string | null;
  photo?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  colorIndex?: number;
}> = ({ name, photo, size = "md", colorIndex = 0 }) => {
  const sizeMap = {
    xs: "h-6 w-6 text-[9px]",
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-sm",
  };
  const color = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  return (
    <div
      className={`${sizeMap[size]} shrink-0 rounded-xl overflow-hidden flex items-center justify-center font-semibold ${photo ? "" : color}`}
    >
      {photo ? (
        <img src={photo} alt={name ?? ""} className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  );
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] ${className}`}>
    {children}
  </div>
);

const SectionHeader: React.FC<{
  icon: React.ElementType;
  iconColor?: string;
  title: string;
  right?: React.ReactNode;
}> = ({ icon: Icon, iconColor = "text-[var(--primary)]", title, right }) => (
  <div className="flex items-center justify-between px-4 pt-3 pb-2.5">
    <div className="flex items-center gap-2">
      <div
        className={`rounded-lg p-1.5 ${iconColor}`}
        style={{ background: "color-mix(in srgb, currentColor 12%, transparent)" }}
      >
        <Icon size={13} />
      </div>
      <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
    </div>
    {right && <div>{right}</div>}
  </div>
);

// ── ATTENDANCE ROW ────────────────────────────────────────────────────────────

interface AttendanceRowProps {
  inTime: string | null;
  outTime: string | null;
  totalWorkedSeconds: number;
  isActive: boolean;
  loading: boolean;
  employeeId: string;
  onAttendanceUpdate: () => void;
}

const AttendanceRow: React.FC<AttendanceRowProps> = ({
  inTime,
  outTime,
  totalWorkedSeconds,
  isActive,
  loading,
  employeeId,
  onAttendanceUpdate,
}) => {
  const { user } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);

  const isClockedIn = isActive;

  const getCurrentFormattedTime = () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  };

  const handleClockAction = async () => {
    if (!user || !employeeId) return;
    setActionLoading(true);
    try {
      const payload = {
        docstatus: 0,
        doctype: "Employee Checkin",
        owner: user.email,
        log_type: isClockedIn ? "OUT" : "IN",
        time: getCurrentFormattedTime(),
        employee_name: user.fullName,
        employee: employeeId,
      };
      await postEmployeeAttendance(payload);
      onAttendanceUpdate();
    } catch (error) {
      showApiError(parseFrappeError(error) || "Failed to log attendance. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex gap-3 items-stretch">
      {/* ── Clock In / Out ACTION card ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 flex flex-col gap-1.5 w-[130px] shrink-0 justify-between">
        <p className="text-[10px] text-[var(--muted-foreground)] font-medium">Attendance</p>
        {loading ? (
          <Skeleton className="h-8 w-full" />
        ) : (
          <button
            disabled={actionLoading}
            onClick={handleClockAction}
            className={`flex items-center justify-center gap-1.5 w-full rounded-xl px-2 py-1.5 text-white text-[11px] font-bold transition-all active:scale-95 disabled:opacity-60 ${isClockedIn
              ? "bg-rose-500 hover:bg-rose-600"
              : "bg-emerald-500 hover:bg-emerald-600"
              }`}
          >
            {isClockedIn ? <LogOut size={12} /> : <LogIn size={12} />}
            {actionLoading ? "…" : isClockedIn ? "Check Out" : "Check In"}
          </button>
        )}
      </div>

      {/* ── Check In time card ── */}
      <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/6 p-3 text-left flex-1 min-w-0 h-[75px]">
        {loading ? (
          <Skeleton className="h-full w-full min-h-[60px]" />
        ) : (
          <div className="flex flex-col gap-1">
            <LogIn size={14} className="text-emerald-600" />
            <p className="text-base font-bold leading-tight text-emerald-600">
              {formatTime(inTime)}
            </p>
            <p className="text-[10px] text-[var(--muted-foreground)]">Check In</p>
          </div>
        )}
      </div>

      {/* ── Check Out time card ── */}
      <div className="rounded-2xl border border-rose-500/15 bg-rose-500/6 p-3 text-left flex-1 min-w-0 h-[75px]">
        {loading ? (
          <Skeleton className="h-full w-full min-h-[60px]" />
        ) : (
          <div className="flex flex-col gap-1">
            <LogOut size={14} className="text-rose-500" />
            <p className="text-base font-bold leading-tight text-rose-500">
              {formatTime(outTime)}
            </p>
            <p className="text-[10px] text-[var(--muted-foreground)]">Check Out</p>
          </div>
        )}
      </div>

      {/* ── Hours Worked — extracted timer component ── */}
      <AttendanceTimer
        inTime={inTime}
        totalWorkedSeconds={totalWorkedSeconds}
        isActive={isActive}
        loading={loading}
      />
    </div>
  );
};

// ── LEAVE BALANCE ─────────────────────────────────────────────────────────────

const LeaveBalanceSection: React.FC<{
  leave: SafeDashboardData["leaveBalance"] | null;
  loading: boolean;
  onApplyLeave: (e: React.MouseEvent) => void;
  onNavigate: () => void;
}> = ({ leave, loading, onApplyLeave, onNavigate }) => {
  return (
    <div
      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] cursor-pointer hover:shadow-sm transition-shadow"
      onClick={onNavigate}
    >
      <div className="px-4 pt-3 pb-3">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3 gap-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <div
              className="rounded-lg p-1.5 text-[var(--primary)] shrink-0"
              style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)" }}
            >
              <Umbrella size={13} />
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] shrink-0">
              Leave Balance
            </h3>
            {!loading && leave && (
              <div className="flex items-center gap-2 ml-1">
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  Total{" "}
                  <span className="font-bold text-[var(--foreground)]">
                    {leave.totalAllocated}
                  </span>
                </span>
                <span className="h-3 w-px bg-[var(--border)]" />
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  Used{" "}
                  <span className="font-bold text-rose-500">{leave.totalUsed}</span>
                </span>
                <span className="h-3 w-px bg-[var(--border)]" />
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  Left{" "}
                  <span className="font-bold text-emerald-600">
                    {leave.totalRemaining}
                  </span>
                </span>
              </div>
            )}
            {loading && <Skeleton className="h-4 w-36 ml-1" />}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onApplyLeave(e); }}
            className="flex items-center gap-1 shrink-0 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/6 px-2.5 py-1 text-[11px] font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/12 transition-colors"
          >
            + Apply Leave
          </button>
        </div>

        {loading ? (
          <div className="flex gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
          </div>
        ) : !leave ? (
          <EmptyState message="Leave balance unavailable" />
        ) : (
          leave.leaveTypes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {leave.leaveTypes.map((lt) => {
                const pct =
                  lt.allocated > 0
                    ? Math.min(100, Math.round((lt.used / lt.allocated) * 100))
                    : 0;
                return (
                  <div
                    key={lt.leaveType}
                    className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-1.5"
                  >
                    <span className="text-[11px] font-medium capitalize text-[var(--foreground)]">
                      {lt.leaveType}
                    </span>
                    <span className="text-[11px] font-bold text-[var(--primary)]">
                      {lt.remaining}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      /{lt.allocated}
                    </span>
                    <div className="w-12 h-1 rounded-full bg-[var(--muted)]/30 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                        style={{ width: `${100 - pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
};

const ExpenseClaimCard: React.FC<{
  claims: ExpenseClaim[];
  onNavigate: () => void;
  onAddExpense: (e: React.MouseEvent) => void;
}> = ({ claims, onNavigate, onAddExpense }) => {
  const pendingCount = claims.filter(
    (c) => c.approval_status === "Draft" || c.approval_status === "Pending For Approval"
  ).length;

  return (
    <div
      className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--card)] cursor-pointer hover:shadow-sm transition-shadow"
      onClick={onNavigate}
    >
      <div className="px-4 pt-2 pb-3 h-[110px] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="rounded-lg p-1.5 text-amber-500 shrink-0"
              style={{ background: "color-mix(in srgb, #f59e0b 12%, transparent)" }}
            >
              <CreditCard size={13} />
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Expense Claims</h3>
          </div>
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
              {pendingCount} pending
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onAddExpense(e); }}
            className="flex items-center gap-1 shrink-0 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/6 px-2.5 py-1 text-[11px] font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/12 transition-colors"
          >
            + Add Expense
          </button>
        </div>

        <div className="space-y-1.5 flex-1">
          {claims.length === 0 ? (
            <EmptyState message="No expense claims" />
          ) : (
            claims.slice(0, 1).map((claim) => (
              <div
                key={claim.name}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2"
              >
                <span className="text-[11px] font-medium text-[var(--foreground)] truncate">
                  {claim.description || claim.name}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-semibold text-[var(--foreground)]">
                    ₹{claim.grand_total.toLocaleString("en-IN")}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${claim.approval_status === "Approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                      }`}
                  >
                    {claim.approval_status === "Draft"
                      ? "Pending For Approval"
                      : claim.approval_status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)]">
          View all claims <ChevronRight size={11} />
        </div>
      </div>
    </div>
  );
};

// ── SALARY SUMMARY CARD ───────────────────────────────────────────────────────

const SalarySummaryCard: React.FC<{
  onViewPayslip: (e: React.MouseEvent) => void;
  onNavigate: () => void;
}> = ({ onViewPayslip, onNavigate }) => {
  return (
    <div
      className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--card)] cursor-pointer hover:shadow-sm transition-shadow"
      onClick={onNavigate}
    >
      <div className="px-4 pt-2 pb-3 h-[110px] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="rounded-lg p-1.5 text-emerald-600 shrink-0"
              style={{ background: "color-mix(in srgb, #10b981 12%, transparent)" }}
            >
              <Banknote size={13} />
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Compensation</h3>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onViewPayslip(e); }}
          className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/6 px-3 py-2 text-[11px] font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/12 transition-colors"
        >
          <FileText size={12} />
          View Latest Payslip
        </button>
      </div>
    </div>
  );
};

// ── APPRAISAL SECTION ─────────────────────────────────────────────────────────

interface AppraisalSectionProps {
  onNavigate: () => void;
}

const AppraisalSection: React.FC<AppraisalSectionProps> = ({ onNavigate }) => {
  const [cycleModalOpen, setCycleModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleFillForm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCycleModalOpen(true);
  };

  const handleModalClose = useCallback(() => {
    setCycleModalOpen(false);
  }, []);

  const handleBackdropClick = useCallback(() => {
    setCycleModalOpen(false);
    navigate("/hr/emp-appraisals");
  }, [navigate]);

  return (
    <>
      <div
        className="rounded-2xl border border-[var(--border)] bg-[var(--card)] cursor-pointer hover:shadow-sm transition-shadow"
        onClick={onNavigate}
      >
        <div className="px-4 pt-3 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="rounded-lg p-1.5 text-amber-500"
                style={{ background: "color-mix(in srgb, #f59e0b 12%, transparent)" }}
              >
                <Star size={13} />
              </div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Appraisals</h3>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>

          <div className="mt-2.5 flex items-center justify-between rounded-xl border border-amber-200/60 bg-amber-50/50 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 shrink-0">
                <ClipboardList size={14} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--foreground)]">
                  Performance Review Cycle
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  Self-assessment form is open · Fill before deadline
                </p>
              </div>
            </div>
            <button
              onClick={handleFillForm}
              className="flex items-center gap-1 shrink-0 rounded-lg bg-amber-500 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-600 transition-colors ml-3"
            >
              Fill Form
              <ChevronRight size={11} />
            </button>
          </div>
        </div>
      </div>

      {cycleModalOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: MODAL_LAYER.modalBackdropBase, cursor: "pointer" }}
            onClick={handleBackdropClick}
          />
          <NewCycleModal
            isOpen={cycleModalOpen}
            onClose={handleModalClose}
            onSave={() => { }}
            modalId="dashboard-appraisal-cycle"
            isViewMode
          />
        </>
      )}
    </>
  );
};

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────────────────

const AnnouncementsSection: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  const announcements = [
    {
      id: "1",
      type: "compliance",
      title: "PF Nomination Form",
      body: "Complete and submit your PF nomination to HR.",
      due: "Due 15 Jun",
      urgent: true,
      icon: AlertCircle,
      iconColor: "text-rose-500",
      iconBg: "color-mix(in srgb, #f43f5e 12%, transparent)",
      badgeClass: "bg-rose-500/10 border-rose-500/20 text-rose-600",
      dotClass: "bg-rose-500",
      cardClass: "border-rose-200/60 bg-rose-50/50",
    },
    {
      id: "2",
      type: "compliance",
      title: "ESI Declaration",
      body: "Submit your ESI declaration form for FY 2026-27.",
      due: "Due 30 Jun",
      urgent: false,
      icon: AlertCircle,
      iconColor: "text-amber-500",
      iconBg: "color-mix(in srgb, #f59e0b 12%, transparent)",
      badgeClass: "bg-amber-500/10 border-amber-500/20 text-amber-600",
      dotClass: "bg-amber-400",
      cardClass: "border-[var(--border)] bg-[var(--background)]",
    },
    {
      id: "3",
      type: "announcement",
      title: "Office Closed — 30 May",
      body: "The office will be closed tomorrow for the local holiday. WFH approved.",
      due: "Tomorrow",
      urgent: false,
      icon: Megaphone,
      iconColor: "text-[var(--primary)]",
      iconBg: "color-mix(in srgb, var(--primary) 12%, transparent)",
      badgeClass: "bg-[var(--primary)]/10 border-[var(--primary)]/20 text-[var(--primary)]",
      dotClass: "bg-[var(--primary)]",
      cardClass: "border-[var(--border)] bg-[var(--background)]",
    },
    {
      id: "4",
      type: "announcement",
      title: "Team All-Hands — 5 Jun",
      body: "Quarterly all-hands meeting at 3 PM. Attendance mandatory.",
      due: "7d",
      urgent: false,
      icon: Megaphone,
      iconColor: "text-indigo-500",
      iconBg: "color-mix(in srgb, #6366f1 12%, transparent)",
      badgeClass: "bg-indigo-500/10 border-indigo-500/20 text-indigo-600",
      dotClass: "bg-indigo-400",
      cardClass: "border-[var(--border)] bg-[var(--background)]",
    },
  ];

  const urgentCount = announcements.filter((a) => a.urgent).length;
  const visibleAnnouncements = expanded ? announcements : announcements.slice(0, 1);
  const hiddenCount = announcements.length - 1;

  return (
    <Card>
      <div className="px-4 pt-3 pb-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div
              className="rounded-lg p-1.5 text-[var(--primary)]"
              style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)" }}
            >
              <Megaphone size={13} />
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Announcements</h3>
          </div>
          {urgentCount > 0 && (
            <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
              {urgentCount} action needed
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          {visibleAnnouncements.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`flex items-start justify-between gap-2 rounded-xl border px-3 py-2.5 ${item.cardClass}`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`rounded-lg p-1 shrink-0 mt-0.5 ${item.iconColor}`}
                    style={{ background: item.iconBg }}
                  >
                    <Icon size={11} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--foreground)] leading-tight">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${item.badgeClass}`}
                >
                  {item.due}
                </span>
              </div>
            );
          })}
        </div>

        {announcements.length > 1 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:opacity-80 transition-opacity"
          >
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
            {expanded ? "Show less" : `Show ${hiddenCount} more`}
          </button>
        )}
      </div>
    </Card>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<SafeDashboardData | null>(null);

  const fetchDashboard = async () => {
    const employeeId = user?.employeeId;
    if (!employeeId) return;
    setLoading(true);
    try {
      const data = await getEmployeeDashboardSummary(employeeId);
      setDashboardData(data as SafeDashboardData);
    } catch (e) {
      console.error("Error fetching employee dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user?.employeeId]);

  const emp = dashboardData?.employeeDetails ?? null;
  const leave = dashboardData?.leaveBalance ?? null;
  const checkins = dashboardData?.checkins ?? null;
  const upcomingHolidays = dashboardData?.holidays?.upcoming ?? [];
  const upcomingBirthdays = dashboardData?.birthdays?.upcoming ?? [];
  const expenseClaims = dashboardData?.expenseClaim ?? [];

  const handleAddExpense = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const seedData = user?.employeeId
      ? {
        employee: user.employeeId,
        employee_name: user.fullName ?? user.username ?? "",
      }
      : null;
    openExpenseModal(seedData, false, {
      onSuccess: () => {
        fetchDashboard();
      },
    });
  }, [user]);

  return (
    <div className="w-full space-y-3 py-4">

      {/* ── HERO BANNER ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-[var(--primary)] px-5 py-4 text-white">
        <span className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/5" />
        <span className="pointer-events-none absolute bottom-0 right-32 h-28 w-28 rounded-full bg-white/5" />
        <span className="pointer-events-none absolute top-3 right-60 h-14 w-14 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white/15 flex items-center justify-center text-base font-bold">
              {loading ? (
                <Skeleton className="h-12 w-12 rounded-2xl" />
              ) : emp?.profilePhoto ? (
                <img
                  src={emp.profilePhoto}
                  alt={emp.employeeName ?? ""}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials(emp?.employeeName)
              )}
            </div>
            <div className="min-w-0">
              {loading ? (
                <>
                  <Skeleton className="mb-1.5 h-5 w-40 bg-white/20" />
                  <Skeleton className="h-3 w-52 bg-white/15" />
                </>
              ) : (
                <>
                  <h1 className="text-lg font-semibold truncate leading-tight">
                    {getGreeting()}, {emp?.employeeName?.split(" ")[0] ?? "Employee"} 👋
                  </h1>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/60">
                    <span className="flex items-center gap-1">
                      <Sparkles size={10} />
                      {emp?.employeeId ?? "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays size={10} />
                      Joined {formatDate(emp?.dateOfJoining ?? null)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-sm self-start sm:self-auto shrink-0">
            <p className="text-[9px] uppercase tracking-widest text-white/45 mb-0.5">Today</p>
            <p className="text-sm font-semibold text-white whitespace-nowrap">
              {formatDate(checkins?.asofDate ?? null)}
            </p>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">

        {/* LEFT 2 COLS */}
        <div className="flex flex-col gap-3 xl:col-span-2">

          {/* ── ROW 1: Attendance ── */}
          <AttendanceRow
            inTime={checkins?.inTime ?? null}
            outTime={checkins?.outTime ?? null}
            totalWorkedSeconds={checkins?.totalWorkedSeconds ?? 0}
            isActive={checkins?.isActive ?? false}
            loading={loading}
            employeeId={user?.employeeId ?? ""}
            onAttendanceUpdate={fetchDashboard}
          />

          {/* ── ROW 2: Leave Balance ── */}
          <LeaveBalanceSection
            leave={leave}
            loading={loading}
            onApplyLeave={(e) => {
              openLeaveApplyModal(null, false, {
                onSuccess: fetchDashboard,
              });
            }}
            onNavigate={() => navigate("/hr/emp-leave")}
          />

          {/* ── ROW 3: Expense Claim + Salary Summary ── */}
          <div className="flex gap-3">
            <ExpenseClaimCard
              claims={expenseClaims}
              onNavigate={() => navigate("/hr/emp-expenses")}
              onAddExpense={handleAddExpense}
            />
            <SalarySummaryCard
              onViewPayslip={(e) => {
                e.stopPropagation();
                navigate("/hr/emp-financials", { state: { tab: "salary-slip" } });
              }}
              onNavigate={() => navigate("/hr/emp-financials")}
            />
          </div>

          {/* ── ROW 4: Appraisals ── */}
          <AppraisalSection
            onNavigate={() => navigate("/hr/emp-appraisals")}
          />

          {/* ── ROW 5: Announcements ── */}
          <AnnouncementsSection />

        </div>

        {/* RIGHT SIDEBAR */}
        <div className="xl:col-span-1">
          <div className="space-y-3 xl:sticky xl:top-4">

            {/* Upcoming Holidays */}
            <Card>
              <SectionHeader icon={Gift} title="Upcoming Holidays" />
              <div className="px-4 pb-3">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : upcomingHolidays.length === 0 ? (
                  <EmptyState message="No upcoming holidays" />
                ) : (
                  <div className="space-y-1.5">
                    {upcomingHolidays.map((holiday: HolidayEntry) => {
                      const countdown = getCountdown(holiday.date);
                      if (countdown === "Passed") return null;
                      const isNext = countdown === "Tomorrow" || countdown === "Today";
                      return (
                        <div
                          key={holiday.date}
                          className={`flex items-start justify-between gap-2 rounded-xl border p-2.5 ${isNext
                            ? "border-[var(--primary)]/20 bg-[var(--primary)]/5"
                            : "border-[var(--border)] bg-[var(--background)]"
                            }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[var(--foreground)] truncate">
                              {stripHtml(holiday.description) || "Holiday"}
                            </p>
                            <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                              {formatDateShort(holiday.date)} · {getDayName(holiday.date)}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isNext
                              ? "bg-[var(--primary)] text-white"
                              : "bg-[var(--muted)]/40 text-[var(--muted-foreground)]"
                              }`}
                          >
                            {countdown}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            {/* Upcoming Birthdays */}
            <Card>
              <SectionHeader
                icon={Cake}
                iconColor="text-pink-500"
                title="Upcoming Birthdays"
              />
              <div className="px-4 pb-3">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : upcomingBirthdays.length === 0 ? (
                  <EmptyState message="No upcoming birthdays" />
                ) : (
                  <div className="space-y-1.5">
                    {upcomingBirthdays.map((b, i) => {
                      const isToday = b.daysLeft === 0;
                      return (
                        <div
                          key={`${b.employeeName}-${i}`}
                          className={`flex items-center gap-2 rounded-xl px-2.5 py-2 ${isToday
                            ? "bg-pink-50 border border-pink-200/60"
                            : "border border-[var(--border)] bg-[var(--background)]"
                            }`}
                        >
                          <Avatar name={b.employeeName} colorIndex={i} size="xs" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-[var(--foreground)] capitalize truncate leading-tight">
                              {b.employeeName}
                            </p>
                            <p className="text-[9px] text-[var(--muted-foreground)]">
                              {new Date(b.dateOfBirth).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 text-[10px] font-semibold whitespace-nowrap ${isToday ? "text-pink-500" : "text-[var(--muted-foreground)]"
                              }`}
                          >
                            {getBirthdayLabel(b.daysLeft)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;