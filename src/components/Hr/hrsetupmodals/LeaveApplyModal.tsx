import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar, Clock, FileText, Save, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import AdvancedCalendar from "../../../components/Hr/leave/Calendar";

// API Imports
import { 
  createLeaveApplication, 
  getLeaveApplicationById, 
  updateLeaveApplication 
} from "../../../api/leaveApplicationApi";
import { getAllEmployees, getEmployeeById } from "../../../api/employeeapi";
import { getEmployeeLeaveBalanceReport } from "../../../api/leaveApi";

// Types and Mappers
import type { LeaveBalanceUI } from "../../../types/leave/leaveBalance";
import { mapLeaveBalanceFromApi } from "../../../types/leave/leaveMapper";
import { closeSwal, showApiError, showLoading, showSuccess } from "../../../utils/alert";

import LeaveTypeSelect from "../../../components/selects/LeaveTypeSelect";

type LeaveFormData = {
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  isHalfDay: boolean;
};

interface LeaveApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  editLeaveId?: string | null;
  onSuccess?: () => void;
}

export default function LeaveApplyModal({ isOpen, onClose, editLeaveId, onSuccess }: LeaveApplyModalProps) {
  const [formData, setFormData] = useState<LeaveFormData>({
    type: "",
    startDate: "",
    endDate: "",
    reason: "",
    isHalfDay: false,
  });

  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState<string>("HR-EMP-00001");
  const [leaveApprover, setLeaveApprover] = useState<{
    id: string;
    name: string;
  } | null>(null);
  
  const isEditMode = Boolean(editLeaveId);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalanceUI | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // 1. Fetch Leave Balance
  useEffect(() => {
    if (!employeeId || !isOpen) {
      setLeaveBalance(null);
      return;
    }

    const fetchLeaveBalance = async () => {
      try {
        setBalanceLoading(true);
        const res = await getEmployeeLeaveBalanceReport({
          employeeId,
          fromDate: "2026-01-01",
          toDate: "2026-12-31",
        });

        const uiBalance = mapLeaveBalanceFromApi(res.data);
        setLeaveBalance(uiBalance);
      } catch (err) {
        console.error("Failed to fetch leave balance", err);
        setLeaveBalance(null);
      } finally {
        setBalanceLoading(false);
      }
    };

    fetchLeaveBalance();
  }, [employeeId, isOpen]);

  // 2. Fetch Employees
  useEffect(() => {
    if (!isOpen) return;
    const fetchEmployees = async () => {
      const res = await getAllEmployees(1, 100);
      setEmployees(res.data.employees || []);
    };
    fetchEmployees();
  }, [isOpen]);

  // 3. Handle Edit Mode Data Fetching
  useEffect(() => {
    if (!editLeaveId || !isOpen) return;

    const fetchLeaveDetail = async () => {
      try {
        const l = await getLeaveApplicationById(editLeaveId);

        setEmployeeId(String(l.employee));
        setFormData({
          type: l.leave_type || "",
          startDate: l.from_date || "",
          endDate: l.to_date || "",
          isHalfDay: l.half_day === 1,
          reason: l.description || "",
        });
      } catch (err) {
        console.error("Failed to fetch leave", err);
      }
    };

    fetchLeaveDetail();
  }, [editLeaveId, isOpen]);

  // 4. Sync Form Dates with Calendar
  useEffect(() => {
    if (!formData.startDate) {
      setSelectedRange(undefined);
      return;
    }
    const from = new Date(formData.startDate);
    const to = formData.endDate ? new Date(formData.endDate) : undefined;
    setSelectedRange({ from, to });
  }, [formData.startDate, formData.endDate]);

  // 5. Fetch Reporting Manager
  useEffect(() => {
    if (!employeeId || !isOpen) {
      setLeaveApprover(null);
      return;
    }

    const fetchReportingManager = async () => {
      try {
        const empRes = await getEmployeeById(employeeId);
        const emp = empRes?.data || empRes;
        const managerEmployeeCode = emp?.employmentInfo?.reportingManager;

        if (!managerEmployeeCode) {
          setLeaveApprover(null);
          return;
        }

        const manager = employees.find((e) => e.employeeId === managerEmployeeCode);

        if (manager) {
          setLeaveApprover({ id: manager.id, name: manager.name });
        } else {
          setLeaveApprover(null);
        }
      } catch (err) {
        console.error("Failed to fetch reporting manager", err);
        setLeaveApprover(null);
      }
    };

    fetchReportingManager();
  }, [employeeId, employees, isOpen]);

  const formatLocalDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const calendarLeaves: any[] = [];
  
  const handleRangeSelect = (range?: DateRange) => {
    if (!range?.from) return;

    setSelectedRange(range);
    const from = formatLocalDate(range.from);
    const to = range.to ? formatLocalDate(range.to) : "";

    setFormData((p) => ({
      ...p,
      startDate: from,
      endDate: p.isHalfDay ? from : to,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { id, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((p) => {
      const updated = {
        ...p,
        [id]: type === "checkbox" ? checked : value,
      };

      // half day lock
      if (id === "isHalfDay" && checked && p.startDate) {
        updated.endDate = p.startDate;
      }
      if (id === "startDate" && p.isHalfDay) {
        updated.endDate = value;
      }

      return updated;
    });
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  let totalDays = 0;
  let workDays = 0;
  let dayOffDays = 0;

  if (formData.startDate && formData.endDate) {
    const start = new Date(formData.startDate + "T00:00:00");
    const end = new Date(formData.endDate + "T00:00:00");
    const current = new Date(start);

    while (current <= end) {
      totalDays++;
      if (isWeekend(current)) {
        dayOffDays++;
      } else {
        workDays++;
      }
      current.setDate(current.getDate() + 1);
    }
  }

  const showSummary = !!formData.startDate || !!formData.endDate || formData.isHalfDay;

  const buildPayload = () => {
    const fromDate = formData.startDate;
    const toDate = formData.isHalfDay ? fromDate : formData.endDate || fromDate;
    
    return {
      employee: employeeId,
      leave_type: formData.type,
      from_date: fromDate,
      to_date: toDate,
      half_day: formData.isHalfDay ? 1 : 0 as 0 | 1,
      ...(formData.isHalfDay && { half_day_date: fromDate }), 
      description: formData.reason,
      status: "Open", 
      ...(leaveApprover?.id && { leave_approver: leaveApprover.id }),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type) {
      showApiError("Leave Type is required");
      return;
    }
    if (!formData.startDate) {
      showApiError("Start date is required");
      return;
    }
    if (!formData.isHalfDay && !formData.endDate) {
      showApiError("End date is required");
      return;
    }

    setLoading(true);

    try {
      showLoading(isEditMode ? "Updating Leave..." : "Applying Leave...");
      const payload = buildPayload();

      if (isEditMode && editLeaveId) {
        await updateLeaveApplication(editLeaveId, payload);
        closeSwal();
        showSuccess("Leave updated successfully");
      } else {
        await createLeaveApplication(payload);
        closeSwal();
        showSuccess("Leave applied successfully");
      }

      onSuccess?.();
      handleClose();
    } catch (err: any) {
      closeSwal();
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ type: "", startDate: "", endDate: "", reason: "", isHalfDay: false });
    setSelectedRange(undefined);
    setEmployeeId("");
    setLeaveApprover(null);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    // <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      {/* Modal Container */}
      <div className="relative w-full max-w-6xl max-h-full overflow-hidden flex flex-col rounded-xl border border-[var(--border)] bg-app shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Styled like MinimizableModal */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-6 py-4 bg-app">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-main">
                {isEditMode ? "Edit Leave Application" : "New Leave Application"}
              </h2>
              <p className="text-sm text-sub">
                Request time off and check your calendar availability
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sub transition hover:bg-[var(--border)] hover:text-main"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid lg:grid-cols-12 gap-8">
            
            {/* LEFT: Calendar */}
            <div className="lg:col-span-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-sub">
                Select Dates
              </p>
              <div className="rounded-xl border border-[var(--border)] bg-app p-4 shadow-sm">
                <AdvancedCalendar
                  leaves={calendarLeaves}
                  selectedRange={selectedRange}
                  onRangeSelect={handleRangeSelect}
                />
              </div>

              {/* Summary Box (Moves under calendar for clean layout) */}
              {leaveBalance && (
                <div className="space-y-4 rounded-xl border border-[var(--border)] bg-app p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-sub">
                    Leave Balance Summary
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-sm text-main">
                    <div className="flex flex-col">
                      <span className="text-sub text-xs mb-1">Allocated</span>
                      <span className="font-semibold">{leaveBalance.summary.totalAllocated}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sub text-xs mb-1">Taken</span>
                      <span className="font-semibold text-danger">{leaveBalance.summary.totalTaken}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sub text-xs mb-1">Available</span>
                      <span className="font-semibold text-primary">{leaveBalance.summary.totalClosingBalance}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Form */}
            <div className="lg:col-span-7">
              <form id="leave-form" onSubmit={handleSubmit} className="space-y-5">
                
                <p className="text-xs font-semibold uppercase tracking-wider text-sub">
                  Application Details
                </p>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-main">Employee <span className="text-danger">*</span></label>
                    <select
                      value="HR-EMP-00001"
                      disabled={isEditMode}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-app text-main focus:border-primary focus:outline-none transition-colors disabled:opacity-60 disabled:bg-gray-50"
                    >
                      <option value="HR-EMP-00001">HR-EMP-00001</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <LeaveTypeSelect
                      label="Leave Type"
                      required
                      value={formData.type}
                      onChange={(type) => setFormData((p) => ({ ...p, type: type.name }))}
                      disabled={isEditMode || balanceLoading}
                      className="w-full" 
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-main">Leave Approver</label>
                    <input
                      disabled
                      value={leaveApprover?.name || "No reporting manager assigned"}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-gray-50 text-sub opacity-80 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Date Grid */}
                <div className="space-y-4 rounded-xl border border-[var(--border)] bg-app p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                     <input
                        type="checkbox"
                        id="isHalfDay"
                        checked={formData.isHalfDay}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="isHalfDay" className="text-sm font-medium text-main cursor-pointer">
                        Apply for Half Day
                      </label>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-main">From Date <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        id="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-app text-main focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-main">To Date <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        id="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        disabled={formData.isHalfDay}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-app text-main focus:border-primary focus:outline-none transition-colors disabled:opacity-60 disabled:bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* Dynamic Summary */}
                  {showSummary && (
                    <div className="mt-4 flex items-center gap-4 rounded-lg bg-[var(--border)]/30 px-3 py-2 text-xs text-main">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Total Days:</span> {totalDays}
                      </div>
                      <div className="h-3 w-px bg-[var(--border)]"></div>
                      <div><span className="font-semibold">Work:</span> {workDays}</div>
                      <div className="h-3 w-px bg-[var(--border)]"></div>
                      <div><span className="font-semibold text-sub">Day Off:</span> {dayOffDays}</div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-main">Reason</label>
                  <textarea
                    id="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Brief description for your leave request..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-app text-main focus:border-primary focus:outline-none transition-colors resize-none"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer actions matching LeavePeriodModal */}
        <div className="flex shrink-0 w-full items-center justify-end gap-3 border-t border-[var(--border)] bg-gray-50/30 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-app px-4 py-2 text-sm font-medium text-main transition hover:bg-[var(--border)]"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
          <button
            type="submit"
            form="leave-form"
            disabled={loading || balanceLoading}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" />
            {loading ? "Saving…" : isEditMode ? "Update Leave" : "Apply Leave"}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}