import React, { useState, useEffect } from "react";
import { Calendar, Clock, Save, X, User, Briefcase, CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";
import AdvancedCalendar from "../../../components/Hr/leave/Calendar";

import {
  createLeaveApplication,
  getLeaveApplicationById,
  updateLeaveApplication,
  getAllHolidayLists,
  type LeaveApplication,
} from "../../../api/leaveApplicationApi";
import { getEmployeeById, getEmployeeDetailsById } from "../../../api/employeeapi";
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
import { parseFrappeError } from "../../../views/hr/tabs/leave-config/hooks/parseFrappeError";
import EmployeeLeaveTypeSelect from "../../selects/EmployeeLeaveType";

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
  const isView = Boolean((initialData as any)?._isView);
  const { user } = useAuth();
  const targetEmployeeId = (initialData as any)?.employee || user?.employeeId;

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
const [calendarMonth,   setCalendarMonth]   = useState<Date>(new Date());
  const [selectedRange,   setSelectedRange]   = useState<DateRange | undefined>();
  const [loading,         setLoading]         = useState(false);
  const [leaveApprover,   setLeaveApprover]   = useState<string>("");
  const [leaveApproverId, setLeaveApproverId] = useState<string>("");
  const [empDetails, setEmpDetails] = useState<any>(null);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [leaveApproverName, setLeaveApproverName] = useState<string>("");
  const [holidayDates, setHolidayDates] = useState<Date[]>([]);
  const [includeHolidayFlag, setIncludeHolidayFlag] = useState<boolean>(false);

  useEffect(() => {
  if (!isOpen) return;

  const fetchHolidays = async () => {
    try {
      const targetYear = calendarMonth.getFullYear();
      const holidayLists = await getAllHolidayLists(targetYear);
      
      // Flatten out all holiday dates from the backend response structure
      const dates: Date[] = [];
      holidayLists.forEach((list: any) => {
        if (list.holidays) {
          list.holidays.forEach((h: any) => {
            if (h.holiday_date) {
               const [y, m, d] = h.holiday_date.split("-").map(Number);
              dates.push(new Date(y, m - 1, d));
            }
          });
        }
      });
      setHolidayDates(dates);
    } catch (err) {
      showApiError(parseFrappeError(err) || "Failed to fetch holidays:");
    }
  };

  fetchHolidays();
}, [isOpen, calendarMonth]);

// useEffect(() => {
//   if (!isOpen) return;

//   const fetchEmployeeData = async () => {
//     // const id = editLeaveId || editId;
//     // if (id) return; 

//     if (!user?.employeeId) return; 

//     try {
//       const res = await getEmployeeById(user.employeeId!);
//       const data = res?.message?.data ?? res?.data ?? res;
//       setLeaveApproverName(data?.leave_approver_name ?? "");
//       setLeaveApprover(data?.leave_approver ?? "");
//       setLeaveApproverId(data?.leave_approver ?? "");

//       const detailsRes = await getEmployeeDetailsById(user.employeeId!);
//       const detailsData = detailsRes?.message?.data ?? detailsRes?.data ?? detailsRes;
//       if (detailsData?.employeeInfo) setEmpDetails(detailsData.employeeInfo);
//       if (detailsData?.leaveBalances) setLeaveBalances(detailsData.leaveBalances);
//     } catch {
//       setLeaveApproverName("");
//       setLeaveApprover("");
//       setLeaveApproverId("");
//     }
//   };

//   fetchEmployeeData();
// }, [isOpen, user?.employeeId]);

useEffect(() => {
  if (!isOpen) return;

  const fetchEmployeeData = async () => {
    if (!targetEmployeeId) return; 

    try {
      const res = await getEmployeeById(targetEmployeeId);
      const data = res?.message?.data ?? res?.data ?? res;
      setLeaveApproverName(data?.leave_approver_name ?? "");
      setLeaveApprover(data?.leave_approver ?? "");
      setLeaveApproverId(data?.leave_approver ?? "");

      const detailsRes = await getEmployeeDetailsById(targetEmployeeId);
      const detailsData = detailsRes?.message?.data ?? detailsRes?.data ?? detailsRes;
      if (detailsData?.employeeInfo) setEmpDetails(detailsData.employeeInfo);
      if (detailsData?.leaveBalances) setLeaveBalances(detailsData.leaveBalances);
    } catch {
      setLeaveApproverName("");
      setLeaveApprover("");
      setLeaveApproverId("");
    }
  };

  fetchEmployeeData();
}, [isOpen, targetEmployeeId]);

  useEffect(() => {
    const id = editLeaveId || editId;
    if (!id || !isOpen){
      setCalendarMonth(new Date());
      return;
    }

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
         if (l.leave_approver) {
      setLeaveApprover(l.leave_approver);
      setLeaveApproverId(l.leave_approver);
    }
    if (l.leave_approver_name) {
      setLeaveApproverName(l.leave_approver_name);
    }
        if (l.from_date) {
          setCalendarMonth(new Date(l.from_date));
        }
      } catch (err) {
        showApiError(parseFrappeError(err) || `Failed to fetch leave: ${err}`);
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

  // ── Sync includeHolidayFlag on View/Edit mode ──
  useEffect(() => {
    if (formData.type && leaveBalances?.length > 0) {
      // Find the selected leave type in the balances array
      const selectedType = leaveBalances.find(
        (lt) => lt.leave_type === formData.type || lt.name === formData.type
      );
      if (selectedType) {
        setIncludeHolidayFlag(selectedType.include_holiday === 1);
      }
    }
  }, [formData.type, leaveBalances]);

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
  let totalDays       = 0;
  let workDays        = 0; 
  let dayOffDays      = 0; 
  let holidaysCount   = 0; 
  let totalLeaveCount = 0; 

  if (formData.startDate && formData.endDate) {
    const start   = new Date(formData.startDate + "T00:00:00");
    const end     = new Date(formData.endDate   + "T00:00:00");
    const current = new Date(start);

    const isHoliday = (date: Date) => {
      return holidayDates.some(
        (h) =>
          h.getDate() === date.getDate() &&
          h.getMonth() === date.getMonth() &&
          h.getFullYear() === date.getFullYear()
      );
    };

    while (current <= end) {
      totalDays++;
      
      const isWknd = isWeekend(current);
      const isHol = isHoliday(current);

      if (isWknd) {
        dayOffDays++;
      } else if (isHol) {
        holidaysCount++;
      }

      // Work days are strictly ONLY non-holiday and non-weekend
      if (!isWknd && !isHol) {
        workDays++;
      }
      
      current.setDate(current.getDate() + 1);
    }

    // Adjust counts based on half-day and include_holiday logic
    if (formData.isHalfDay) {
      if (workDays > 0) workDays -= 0.5;
      totalLeaveCount = 0.5; 
    } else {
      // If include_holiday is true, deduct calendar days. Otherwise deduct work days.
      totalLeaveCount = includeHolidayFlag ? totalDays : workDays;
    }
  }

  const showSummary = !!formData.startDate || !!formData.endDate || formData.isHalfDay;

  // ── Calendar range select ────────────────────────────────────────────────
  const handleRangeSelect = (range?: DateRange) => {
    if (isView) return;
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
      // employee:   user?.employeeId ?? "",  
      employee:   targetEmployeeId ?? "",
      leave_type: formData.type,
      from_date:  fromDate,
      to_date:    toDate,
      half_day:   formData.isHalfDay ? 1 : (0 as 0 | 1),
      ...(formData.isHalfDay && { half_day_date: fromDate }),
      description:    formData.reason,
      status:         "Open",
      ...(leaveApproverId && { leave_approver: leaveApproverId }),
      ...(leaveApproverName && { leave_approver_name: leaveApproverName }), 
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type)      { showApiError("Leave Type is required"); return; }
    if (!formData.startDate) { showApiError("Start date is required"); return; }
    if (!formData.endDate) {
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
      showApiError(parseFrappeError(err) || err);
    } finally {
      setLoading(false);
    }
  };

  // ── Close / reset ────────────────────────────────────────────────────────
  const handleClose = () => {
    setFormData({ type: "", startDate: "", endDate: "", reason: "", isHalfDay: false });
    setSelectedRange(undefined);
    setCalendarMonth(new Date());
    setLeaveApprover("");
    setLeaveApproverId("");
    setLeaveApproverName("");
    onClose();
  };

  if (!isOpen) return null;

  const footer = !isView ? (
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
        // form="leave-form"
        form={`leave-form-${modalId}`}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        <Save className="h-3.5 w-3.5" />
        {loading ? "Saving…" : isEditMode ? "Update Leave" : "Apply Leave"}
      </button>
    </div>
  ): null;

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={handleClose}
      // title={isEditMode ? "Edit Leave Application" : isView ? "View Leave Application" : "New Leave Application"}
title={
  initialData && !isView
    ? "Edit Leave Application"
    : isView
    ? "View Leave Application"
    : "New Leave Application"
}
      subtitle="Request time off and check your calendar availability"
      icon={Calendar}
      customWidth="65vw"
      height="auto"
      footer={footer}
    >
    
<div className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: "calc(85vh - 140px)" }}>
  <div className="flex flex-col lg:flex-row gap-6"> 
      <div className="flex-1 grid lg:grid-cols-12 gap-8 order-2 lg:order-1">
          {/* ── LEFT: Calendar ── */}
          <div className="lg:col-span-5 space-y-4 min-w-0 w-full">
        <p className="text-xs font-semibold uppercase tracking-wider text-sub">
          Select Dates
        </p>
        {/* Added overflow-x-auto and dynamic padding for smaller screens */}
        <div className="rounded-xl border border-[var(--border)] bg-app p-2 sm:p-4 shadow-sm w-full overflow-x-auto">
          {/* Wrapper to keep calendar centered but allow horizontal scroll if it exceeds screen width */}
          <div className="min-w-fit flex justify-center w-full">
            <AdvancedCalendar
              leaves={[]}
              selectedRange={selectedRange}
              holidays={holidayDates}
              onRangeSelect={handleRangeSelect}
              month={calendarMonth}            
              onMonthChange={setCalendarMonth}
            />
          </div>
        </div>
      </div>

          {/* ── RIGHT: Form ── */}
          <div className="lg:col-span-7">
            <form id={`leave-form-${modalId}`} onSubmit={handleSubmit} noValidate className="space-y-5">
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
                  {/* <LeaveTypeSelect
                    label="Leave Type"
                    required
                    value={formData.type}
                    onChange={(lt) => { setFormData((p) => ({ ...p, type: lt.name }));
                  setIncludeHolidayFlag(lt.include_holiday === 1);}}
                    disabled={isEditMode}
                    leaveBalances={leaveBalances}
                  /> */}
                  <EmployeeLeaveTypeSelect
                  label="Leave Type"
                  required
                  value={formData.type}
                 onChange={(lt) => { 
                      setFormData((p) => ({ ...p, type: lt.name }));
                      setIncludeHolidayFlag(lt.include_holiday === 1);
                    }}
                    disabled={isEditMode || isView}
                    // employeeId={user?.employeeId || ""}
                    employeeId={targetEmployeeId || ""}
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
                    disabled={isView}
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
                     disabled={isView}
                  />
                  <DatePickerInput
                    label="To Date"
                    name="endDate"
                    value={formData.endDate}
                    required={!formData.isHalfDay}
                    disabled={formData.isHalfDay || isView}
                    onChange={handleDateChange}
                  />
                </div>

            {showSummary && (
                  <div className="flex flex-wrap items-center gap-3 rounded-lg bg-[var(--border)]/30 px-3 py-2 text-xs text-main">
                    
                    {/* Shows the actual Leaves to be deducted */}
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-bold text-primary text-sm">{totalLeaveCount}</span>
                      <span className="font-bold text-main">Leave{totalLeaveCount !== 1 ? "s" : ""} Deducted</span>
                    </div>

                    <div className="h-3 w-px bg-[var(--border)]" />

                    {/* Shows the strict Work Days calculation */}
                    <div className="flex items-center gap-1 text-muted">
                      <span>Work Days:</span>
                      <span className="font-semibold text-main">{workDays}</span>
                    </div>

                    <div className="h-3 w-px bg-[var(--border)]" />

                    <div className="flex items-center gap-1 text-muted">
                      <span>Total:</span>
                      <span className="font-semibold text-main">{totalDays}</span>
                    </div>

                    {dayOffDays > 0 && (
                      <>
                        <div className="h-3 w-px bg-[var(--border)]" />
                        <div className="flex items-center gap-1 text-muted">
                          <span>Weekends:</span>
                          <span className="font-semibold text-main">{dayOffDays}</span>
                        </div>
                      </>
                    )}

                    {holidaysCount > 0 && (
                      <>
                        <div className="h-3 w-px bg-[var(--border)]" />
                        <div className="flex items-center gap-1 text-muted">
                          <span className="text-indigo-500 font-medium">Holidays:</span>
                          <span className="font-semibold text-main">{holidaysCount}</span>
                        </div>
                      </>
                    )}
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
                  disabled={isView}
                  rows={3}
                  placeholder="Brief description for your leave request..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-app text-main focus:border-primary focus:outline-none transition-colors resize-none"
                />
              </div>
            </form>
          </div>

        </div>
  </div>
</div>
    </MinimizableModal>
  );
}