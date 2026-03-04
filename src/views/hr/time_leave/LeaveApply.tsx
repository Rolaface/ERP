import React, { useState, useEffect } from "react";
import { Calendar, Clock, FileText, CheckCircle2, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import AdvancedCalendar from "../../../components/Hr/leave/Calendar";
import HrDateInput from "../../../components/Hr/HrDateInput";
import { applyLeave } from "../../../api/leaveApi";
import { getAllEmployees } from "../../../api/employeeapi";
import { getEmployeeById } from "../../../api/employeeapi";
import { getLeaveById, updateLeaveApplication } from "../../../api/leaveApi";
import type { LeaveBalanceUI } from "../../../types/leave/leaveBalance";

import { mapLeaveBalanceFromApi } from "../../../types/leave/leaveMapper";
import { getEmployeeLeaveBalanceReport } from "../../../api/leaveApi";
import {
  closeSwal,
  showApiError,
  showLoading,
  showSuccess,
} from "../../../utils/alert";

type LeaveFormData = {
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  isHalfDay: boolean;
};

interface LeaveApplyProps {
  editLeaveId?: string | null;
}

const LeaveApply: React.FC<LeaveApplyProps> = ({ editLeaveId }) => {
  const [formData, setFormData] = useState<LeaveFormData>({
    type: "",
    startDate: "",
    endDate: "",
    reason: "",
    isHalfDay: false,
  });

  // const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [leaveApprover, setLeaveApprover] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const isEditMode = Boolean(editLeaveId);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalanceUI | null>(null);

  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    if (!employeeId) {
      setLeaveBalance(null);
      return;
    }

    const fetchLeaveBalance = async () => {
      try {
        setBalanceLoading(true);

        const res = await getEmployeeLeaveBalanceReport({
          employeeId,
          fromDate: "2026-01-01", // TODO: make FY dynamic
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
  }, [employeeId]);

  useEffect(() => {
    const fetchEmployees = async () => {
      const res = await getAllEmployees(1, 100);
      setEmployees(res.employees || []);
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!editLeaveId) return;

    const fetchLeaveDetail = async () => {
      try {
        const res = await getLeaveById(editLeaveId);
        const l = res.data;

        // MUST use employee.employeeId (DB ID)
        setEmployeeId(String(l.employee.employeeId));

        setFormData({
          type: l.leaveType,
          startDate: l.fromDate,
          endDate: l.toDate,
          isHalfDay: l.isHalfDay,
          reason: l.leaveReason,
        });
      } catch (err) {
        console.error("Failed to fetch leave", err);
      }
    };

    fetchLeaveDetail();
  }, [editLeaveId]);

  useEffect(() => {
    if (!formData.startDate) {
      setSelectedRange(undefined);
      return;
    }

    const from = new Date(formData.startDate);
    const to = formData.endDate ? new Date(formData.endDate) : undefined;

    setSelectedRange({ from, to });
  }, [formData.startDate, formData.endDate]);

  useEffect(() => {
    if (!employeeId) {
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

        const manager = employees.find(
          (e) => e.employeeId === managerEmployeeCode,
        );

        if (manager) {
          setLeaveApprover({
            id: manager.id,
            name: manager.name,
          });
        } else {
          setLeaveApprover(null);
        }
      } catch (err) {
        console.error("Failed to fetch reporting manager", err);
        setLeaveApprover(null);
      }
    };

    fetchReportingManager();
  }, [employeeId, employees]);

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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { id, value, type, checked } = e.target as HTMLInputElement;

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

  const showSummary =
    !!formData.startDate || !!formData.endDate || formData.isHalfDay;

  const buildPayload = () => {
    const fromDate = formData.startDate;
    const toDate = formData.isHalfDay ? fromDate : formData.endDate || fromDate;
    return {
      employeeId,
      leaveType: formData.type,
      leaveFromDate: fromDate,
      leaveToDate: toDate,
      isHalfDay: formData.isHalfDay,
      leaveReason: formData.reason,
      leaveStatus: "Open",
      ...(leaveApprover?.id && { approverId: leaveApprover.id }), //  only include if exists
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId) {
      showApiError("Please select employee");
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

      if (isEditMode && editLeaveId) {
        await updateLeaveApplication({
          leaveId: editLeaveId,
          leaveType: formData.type,
          leaveFromDate: formData.startDate,
          leaveToDate: formData.endDate,
          isHalfDay: formData.isHalfDay,
          leaveReason: formData.reason,
        });

        closeSwal();
        showSuccess("Leave updated successfully");
      } else {
        await applyLeave(buildPayload());

        closeSwal();
        showSuccess("Leave applied successfully");
      }

      if (!isEditMode) {
        handleReset();
      }
    } catch (err: any) {
      closeSwal();
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      type: "",
      startDate: "",
      endDate: "",
      reason: "",
      isHalfDay: false,
    });
    setSelectedRange(undefined);
    setEmployeeId("");
    setLeaveApprover(null);
  };

  return (
    <div className="bg-app">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-5 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-2xl border border-theme">
            <div className="bg-primary p-6 text-white flex gap-2 items-center">
              <Calendar size={20} />
              <h2 className="font-bold">Calendar View</h2>
            </div>
            <div className="p-8">
              <AdvancedCalendar
                leaves={calendarLeaves}
                selectedRange={selectedRange}
                onRangeSelect={handleRangeSelect}
              />
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-2xl border border-theme">
            <div className="bg-primary p-6 text-white flex items-center justify-between">
              <div className="flex gap-2 items-center">
                <FileText size={20} />
                <h2 className="font-bold">Leave Request Form</h2>
              </div>

              {/* INLINE LEAVE SUMMARY */}
              <div className="text-xs font-medium bg-white/10 px-3 py-1.5 rounded-full">
                Total:{" "}
                <span className="font-bold">
                  {leaveBalance?.summary.totalAllocated ?? 0}
                </span>
                {" | "}
                Taken:{" "}
                <span className="font-bold">
                  {leaveBalance?.summary.totalTaken ?? 0}
                </span>
                {" | "}
                Available:{" "}
                <span className="font-bold">
                  {leaveBalance?.summary.totalClosingBalance ?? 0}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* LEAVE TYPE + APPROVER */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-red-600">
                    Select Employee
                  </label>
                  <select
                    value={employeeId}
                    disabled={isEditMode}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full mt-2 px-2 py-1 rounded-xl border bg-app"
                  >
                    <option value="">Select employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">LEAVE TYPE</label>
                  <select
                    id="type"
                    value={formData.type}
                    disabled={isEditMode || balanceLoading}
                    onChange={handleChange}
                    className="w-full mt-2 px-2 py-1 rounded-xl border bg-app"
                  >
                    <option value="">Select Leave Type</option>

                    {leaveBalance?.balances.map((b) => (
                      <option key={b.leaveType} value={b.leaveType}>
                        {b.leaveType} ({b.remaining} / {b.allocated})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">
                    LEAVE APPROVER
                  </label>
                  <input
                    disabled
                    value={
                      leaveApprover?.name || "No reporting manager assigned"
                    }
                    className="w-full mt-2 px-2 py-1 rounded-xl border bg-app opacity-80"
                  />
                </div>
              </div>

              {/* HALF DAY  */}
              <label className="flex gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  id="isHalfDay"
                  checked={formData.isHalfDay}
                  onChange={handleChange}
                />
                Apply for Half Day
              </label>

              {/* START + END DATE */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold">START DATE</label>
                  <div className="mt-2">
                    <HrDateInput
                      id="startDate"
                      value={formData.startDate}
                      onChange={(v: string) =>
                        setFormData((prev) => ({ ...prev, startDate: v }))
                      }
                      placeholder="DD/MM/YYYY"
                      inputClassName="px-2 py-1 rounded-xl border bg-app"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold">END DATE</label>
                  <div className="mt-2">
                    <HrDateInput
                      id="endDate"
                      value={formData.endDate}
                      onChange={(v: string) =>
                        setFormData((prev) => ({ ...prev, endDate: v }))
                      }
                      disabled={formData.isHalfDay}
                      placeholder="DD/MM/YYYY"
                      inputClassName="px-2 py-1 rounded-xl border bg-app"
                    />
                  </div>

                  {showSummary && (
                    <div className="mt-2 flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span className="font-semibold">TOTAL:</span>{" "}
                        {totalDays}
                      </div>
                      <div>
                        <span className="font-semibold">WORK:</span> {workDays}
                      </div>
                      <div>
                        <span className="font-semibold">DAY OFF:</span>{" "}
                        {dayOffDays}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* REASON */}
              <textarea
                id="reason"
                value={formData.reason}
                onChange={handleChange}
                rows={3}
                placeholder="Reason for leave"
                className="w-full px-4 py-3 rounded-xl border bg-app"
              />

              {/* ACTIONS */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="border rounded-lg px-4 py-2 flex items-center gap-2 text-sm leading-none"
                >
                  <X size={14} /> Reset
                </button>

                <button
                  type="submit"
                  disabled={loading || balanceLoading}
                  className="bg-primary text-white rounded-lg px-4 py-2 flex items-center gap-2 text-sm leading-none"
                >
                  <CheckCircle2 size={14} />
                  {loading
                    ? isEditMode
                      ? "Updating..."
                      : "Submitting..."
                    : isEditMode
                      ? "Update"
                      : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveApply;
