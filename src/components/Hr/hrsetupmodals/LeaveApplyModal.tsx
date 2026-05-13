import React, { useState, useEffect } from "react";
import { Calendar, Clock, Save, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import AdvancedCalendar from "../../../components/Hr/leave/Calendar";

import {
  createLeaveApplication,
  getLeaveApplicationById,
  updateLeaveApplication,
  type LeaveApplication,
} from "../../../api/leaveApplicationApi";
import { getEmployeeById } from "../../../api/employeeapi";
import {
  closeSwal,
  showApiError,
  showLoading,
  showSuccess,
} from "../../../utils/alert";

import LeaveTypeSelect    from "../../../components/selects/LeaveTypeSelect";
import { MinimizableModal } from "../../common/MinimizableModal";
import { ModalInput }     from "../../ui/modal/modalComponent";
import DatePickerInput from "../../calendar/DatePickerInput";
import { useAuth }        from "../../../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type LeaveFormData = {
  type:       string;
  startDate:  string;
  endDate:    string;
  reason:     string;
  isHalfDay:  boolean;
};

interface LeaveApplyModalProps {
  modalId:       string;
  isOpen:        boolean;
  initialData?:  LeaveApplication | null;
  onClose:       () => void;
  editLeaveId?:  string | null;
  onSuccess?:    () => void;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LeaveApplyModal({
  modalId,
  isOpen,
  onClose,
  initialData,
  editLeaveId,
  onSuccess,
}: LeaveApplyModalProps) {
  const { user } = useAuth();

  // ── Form state ──────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<LeaveFormData>({
    type:      "",
    startDate: "",
    endDate:   "",
    reason:    "",
    isHalfDay: false,
  });

  const editId       = initialData?.name || initialData?.id;
  const isEditMode   = Boolean(editLeaveId || editId);

  const [selectedRange,   setSelectedRange]   = useState<DateRange | undefined>();
  const [loading,         setLoading]         = useState(false);
  const [leaveApprover,   setLeaveApprover]   = useState<string>("");
  const [leaveApproverId, setLeaveApproverId] = useState<string>("");

  // ── On open: fetch logged-in employee to get leave_approver ─────────────
  useEffect(() => {
    if (!isOpen || !user?.employeeId) return;

    const fetchApprover = async () => {
      try {
        const res  = await getEmployeeById(user.employeeId!);
        const data = res?.message?.data ?? res?.data ?? res;
        const approver = data?.leave_approver ?? "";
        setLeaveApprover(approver);
        setLeaveApproverId(approver);
      } catch {
        setLeaveApprover("");
        setLeaveApproverId("");
      }
    };

    fetchApprover();
  }, [isOpen, user?.employeeId]);

  // ── Edit mode: prefill form ──────────────────────────────────────────────
  useEffect(() => {
    const id = editLeaveId || editId;
    if (!id || !isOpen) return;

    const fetchLeaveDetail = async () => {
      try {
        const l = await getLeaveApplicationById(id);
        setFormData({
          type:      l.leave_type  || "",
          startDate: l.from_date   || "",
          endDate:   l.to_date     || "",
          isHalfDay: l.half_day === 1,
          reason:    l.description || "",
        });
      } catch (err) {
        console.error("Failed to fetch leave", err);
      }
    };
    fetchLeaveDetail();
  }, [editLeaveId, editId, isOpen]);

  // ── Sync calendar with form dates ────────────────────────────────────────
  useEffect(() => {
    if (!formData.startDate) { setSelectedRange(undefined); return; }
    const from = new Date(formData.startDate);
    const to   = formData.endDate ? new Date(formData.endDate) : undefined;
    setSelectedRange({ from, to });
  }, [formData.startDate, formData.endDate]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatLocalDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // ── Day calculation ──────────────────────────────────────────────────────
  let totalDays  = 0;
  let workDays   = 0;
  let dayOffDays = 0;

  if (formData.startDate && formData.endDate) {
    const start   = new Date(formData.startDate + "T00:00:00");
    const end     = new Date(formData.endDate   + "T00:00:00");
    const current = new Date(start);
    while (current <= end) {
      totalDays++;
      isWeekend(current) ? dayOffDays++ : workDays++;
      current.setDate(current.getDate() + 1);
    }
  }

  const showSummary = !!formData.startDate || !!formData.endDate || formData.isHalfDay;

  // ── Calendar range select ────────────────────────────────────────────────
  const handleRangeSelect = (range?: DateRange) => {
    if (!range?.from) return;
    setSelectedRange(range);
    const from = formatLocalDate(range.from);
    const to   = range.to ? formatLocalDate(range.to) : "";
    setFormData((p) => ({
      ...p,
      startDate: from,
      endDate:   p.isHalfDay ? from : to,
    }));
  };


  const handleDateChange = (name: string, value: string) => {
    setFormData((p) => {
      const updated = { ...p, [name]: value };
      // If half-day is on and startDate changes, lock endDate to startDate
      if (name === "startDate" && p.isHalfDay) updated.endDate = value;
      return updated;
    });
  };


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { id, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((p) => {
      const updated = { ...p, [id]: type === "checkbox" ? checked : value };
      if (id === "isHalfDay" && checked && p.startDate) updated.endDate = p.startDate;
      return updated;
    });
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const buildPayload = () => {
    const fromDate = formData.startDate;
    const toDate   = formData.isHalfDay ? fromDate : formData.endDate || fromDate;
    return {
      employee:   user?.employeeId ?? "",   // always in payload, never shown in UI
      leave_type: formData.type,
      from_date:  fromDate,
      to_date:    toDate,
      half_day:   formData.isHalfDay ? 1 : (0 as 0 | 1),
      ...(formData.isHalfDay && { half_day_date: fromDate }),
      description:    formData.reason,
      status:         "Open",
      ...(leaveApproverId && { leave_approver: leaveApproverId }),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type)      { showApiError("Leave Type is required"); return; }
    if (!formData.startDate) { showApiError("Start date is required"); return; }
    if (!formData.isHalfDay && !formData.endDate) {
      showApiError("End date is required"); return;
    }

    setLoading(true);
    try {
      showLoading(isEditMode ? "Updating Leave..." : "Applying Leave...");
      const payload = buildPayload();
      const id      = editLeaveId || editId;

      if (isEditMode && id) {
        await updateLeaveApplication(id, payload);
        closeSwal();
        showSuccess("Leave updated successfully");
      } else {
        await createLeaveApplication(payload);
        closeSwal();
        showSuccess("Leave applied successfully");
      }

      onSuccess?.();
      handleClose();
    } catch (err) {
      closeSwal();
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Close / reset ────────────────────────────────────────────────────────
  const handleClose = () => {
    setFormData({ type: "", startDate: "", endDate: "", reason: "", isHalfDay: false });
    setSelectedRange(undefined);
    setLeaveApprover("");
    setLeaveApproverId("");
    onClose();
  };

  if (!isOpen) return null;

  // ── Footer ───────────────────────────────────────────────────────────────
  const footer = (
    <div className="flex w-full items-center justify-end gap-3">
      <button
        type="button"
        onClick={handleClose}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-app px-4 py-2 text-sm font-medium text-main transition hover:bg-[var(--border)]"
      >
        <X className="h-3.5 w-3.5" /> Cancel
      </button>
      <button
        type="submit"
        form="leave-form"
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        <Save className="h-3.5 w-3.5" />
        {loading ? "Saving…" : isEditMode ? "Update Leave" : "Apply Leave"}
      </button>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? "Edit Leave Application" : "New Leave Application"}
      subtitle="Request time off and check your calendar availability"
      icon={Calendar}
      customWidth="65vw"
      height="auto"
      footer={footer}
    >
      <div className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: "calc(85vh - 140px)" }}>
        <div className="grid lg:grid-cols-12 gap-8">

          {/* ── LEFT: Calendar ── */}
          <div className="lg:col-span-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-sub">
              Select Dates
            </p>
            <div className="rounded-xl border border-[var(--border)] bg-app p-4 shadow-sm">
              <AdvancedCalendar
                leaves={[]}
                selectedRange={selectedRange}
                onRangeSelect={handleRangeSelect}
              />
            </div>
          </div>

          {/* ── RIGHT: Form ── */}
          <div className="lg:col-span-7">
            <form id="leave-form" onSubmit={handleSubmit} className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-sub">
                Application Details
              </p>

              <div className="grid md:grid-cols-1 gap-5">

                {/* Employee — hidden from UI; value still in buildPayload() */}
                <div className="hidden" aria-hidden="true">
                  <ModalInput
                    label="Employee"
                    value={user?.employeeId || ""}
                    disabled
                    readOnly
                  />
                </div>

                {/* Leave Type — now full width since Employee is hidden */}
                <div className="flex flex-col min-w-0">
                  <LeaveTypeSelect
                    label="Leave Type"
                    required
                    value={formData.type}
                    onChange={(lt) => setFormData((p) => ({ ...p, type: lt.name }))}
                    disabled={isEditMode}
                  />
                </div>

                {/* Leave Approver — auto-filled from employee record */}
                <div>
                  <ModalInput
                    label="Leave Approver"
                    value={leaveApprover || "No leave approver assigned"}
                    disabled
                    readOnly
                  />
                </div>
              </div>

              {/* ── Date section ── */}
              <div className="space-y-4 rounded-xl border border-[var(--border)] bg-app p-4 shadow-sm">

                {/* Half day toggle */}
                <div className="flex items-center gap-2">
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

                {/* From Date / To Date — using DatePickerInput */}
                <div className="grid md:grid-cols-2 gap-5">
                  <DatePickerInput
                    label="From Date"
                    name="startDate"
                    value={formData.startDate}
                    required
                    onChange={handleDateChange}
                  />
                  <DatePickerInput
                    label="To Date"
                    name="endDate"
                    value={formData.endDate}
                    required={!formData.isHalfDay}
                    disabled={formData.isHalfDay}
                    onChange={handleDateChange}
                  />
                </div>

                {/* ── Day summary ── */}
                {showSummary && (
                  <div className="flex items-center gap-3 rounded-lg bg-[var(--border)]/30 px-3 py-2 text-xs text-main">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-bold text-primary text-sm">{workDays}</span>
                      <span className="font-bold text-main">Work Day{workDays !== 1 ? "s" : ""}</span>
                    </div>

                    <div className="h-3 w-px bg-[var(--border)]" />

                    <div className="flex items-center gap-1 text-muted">
                      <span>Total:</span>
                      <span className="font-semibold text-main">{totalDays}</span>
                    </div>

                    <div className="h-3 w-px bg-[var(--border)]" />

                    <div className="flex items-center gap-1 text-muted">
                      <span>Day Off:</span>
                      <span className="font-semibold text-main">{dayOffDays}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Reason ── */}
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
    </MinimizableModal>
  );
}