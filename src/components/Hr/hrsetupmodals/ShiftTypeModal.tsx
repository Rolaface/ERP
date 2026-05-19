import React, { useEffect, useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import {
  createShiftType,
  updateShiftType,
  getShiftTypeByName,
} from "../../../api/shiftTypeApi";
import type { ShiftType } from "../../../views/hr/tabs/leave-config/hooks/useShiftTypes";
import {
  showApiError,
  showSuccess,
  showValidationError,
} from "../../../utils/alert";

interface Props {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: ShiftType | null;
  onSuccess?: () => void;
}

const CHECK_IN_OUT_OPTIONS = [
  {
    label: "Use Log Type",
    value: "Strictly based on Log Type in Employee Checkin",
  },
  {
    label: "Alternate IN/OUT",
    value: "Alternating entries as IN and OUT",
  },
];

const CALC_BASED_ON_OPTIONS = [
  {
    label: "First IN / Last OUT",
    value: "First Check-in and Last Check-out",
  },
  {
    label: "All Valid IN/OUT",
    value: "Every Valid Check-in and Check-out",
  },
];

export const ShiftTypeModal: React.FC<Props> = ({
  modalId,
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const isEdit = Boolean(initialData?.name);
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Basic Info
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Auto Attendance Settings
  const [determineCheckIn, setDetermineCheckIn] = useState(
    CHECK_IN_OUT_OPTIONS[0].value,
  );
  const [calcBasedOn, setCalcBasedOn] = useState(
    CALC_BASED_ON_OPTIONS[0].value,
  );
  const [beginCheckInMins, setBeginCheckInMins] = useState<number | "">(60);
  const [allowCheckOutMins, setAllowCheckOutMins] = useState<number | "">(60);

  // Late Entry & Early Exit
  const [enableLateEntry, setEnableLateEntry] = useState(false);
  const [lateEntryGrace, setLateEntryGrace] = useState<number | "">("");
  const [enableEarlyExit, setEnableEarlyExit] = useState(false);
  const [earlyExitGrace, setEarlyExitGrace] = useState<number | "">("");

  // Thresholds
  const [halfDayThreshold, setHalfDayThreshold] = useState<number | "">("");
  const [absentThreshold, setAbsentThreshold] = useState<number | "">("");

  // Attributes (Right Sidebar)
  const [enableAutoAttendance, setEnableAutoAttendance] = useState(true);
  const [markAutoOnHolidays, setMarkAutoOnHolidays] = useState(false);
  const [allowOvertime, setAllowOvertime] = useState(false);
  const [autoUpdateLastSync, setAutoUpdateLastSync] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (isEdit && initialData?.name) {
      fetchShiftTypeDetails(initialData.name);
    } else {
      resetForm();
    }
  }, [isOpen, initialData, isEdit]);

  const resetForm = () => {
    setName("");
    setStartTime("");
    setEndTime("");
    setDetermineCheckIn(CHECK_IN_OUT_OPTIONS[0].value);
    setCalcBasedOn(CALC_BASED_ON_OPTIONS[0].value);
    setBeginCheckInMins(60);
    setAllowCheckOutMins(60);
    setEnableLateEntry(false);
    setLateEntryGrace("");
    setEnableEarlyExit(false);
    setEarlyExitGrace("");
    setHalfDayThreshold("");
    setAbsentThreshold("");
    setEnableAutoAttendance(true);
    setMarkAutoOnHolidays(false);
    setAllowOvertime(false);
    setAutoUpdateLastSync(false);
  };

  const fetchShiftTypeDetails = async (shiftName: string) => {
    try {
      setIsLoading(true);
      const res = await getShiftTypeByName(shiftName);
      const data = res?.data || res?.message || res;

      setName(data.name || "");
      setStartTime(data.start_time || "");
      setEndTime(data.end_time || "");

      setDetermineCheckIn(
        data.determine_check_in_and_check_out || CHECK_IN_OUT_OPTIONS[0].value,
      );
      setCalcBasedOn(
        data.working_hours_calculation_based_on ||
          CALC_BASED_ON_OPTIONS[0].value,
      );
      setBeginCheckInMins(data.begin_check_in_before_shift_start_time ?? 60);
      setAllowCheckOutMins(data.allow_check_out_after_shift_end_time ?? 60);

      setEnableLateEntry(!!data.enable_late_entry_marking);
      setLateEntryGrace(data.late_entry_grace_period ?? "");
      setEnableEarlyExit(!!data.enable_early_exit_marking);
      setEarlyExitGrace(data.early_exit_grace_period ?? "");

      setHalfDayThreshold(data.working_hours_threshold_for_half_day ?? "");
      setAbsentThreshold(data.working_hours_threshold_for_absent ?? "");

      setEnableAutoAttendance(!!data.enable_auto_attendance);
      setMarkAutoOnHolidays(!!data.mark_auto_attendance_on_holidays);
      setAllowOvertime(!!data.allow_overtime);
      setAutoUpdateLastSync(!!data.auto_update_last_sync);
    } catch (error: any) {
      showApiError(error?.message || "Failed to fetch shift type details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return showValidationError("Shift Name is required");
    if (!startTime) return showValidationError("Start Time is required");
    if (!endTime) return showValidationError("End Time is required");

    try {
      setSaving(true);

      const payload = {
        name,
        start_time: startTime,
        end_time: endTime,
        determine_check_in_and_check_out: determineCheckIn,
        working_hours_calculation_based_on: calcBasedOn,
        begin_check_in_before_shift_start_time: Number(beginCheckInMins) || 0,
        allow_check_out_after_shift_end_time: Number(allowCheckOutMins) || 0,
        enable_late_entry_marking: enableLateEntry ? 1 : 0,
        late_entry_grace_period: Number(lateEntryGrace) || 0,
        enable_early_exit_marking: enableEarlyExit ? 1 : 0,
        early_exit_grace_period: Number(earlyExitGrace) || 0,
        working_hours_threshold_for_half_day: Number(halfDayThreshold) || 0,
        working_hours_threshold_for_absent: Number(absentThreshold) || 0,
        enable_auto_attendance: enableAutoAttendance ? 1 : 0,
        mark_auto_attendance_on_holidays: markAutoOnHolidays ? 1 : 0,
        allow_overtime: allowOvertime ? 1 : 0,
        auto_update_last_sync: autoUpdateLastSync ? 1 : 0,
      };

      if (isEdit && initialData?.name) {
        await updateShiftType(initialData.name, payload);
        showSuccess("Shift Type updated successfully");
      } else {
        await createShiftType(payload);
        showSuccess("Shift Type created successfully");
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      showApiError(err?.message || "Failed to save shift type");
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <div className="flex w-full items-center justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading || saving}
        className="px-4 py-2 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || isLoading}
        className="rounded-lg bg-[#0f172a] px-5 py-2 text-[13px] font-medium text-white transition hover:bg-slate-800 disabled:opacity-60 flex items-center gap-2"
      >
        {saving && <Loader2 size={16} className="animate-spin text-white" />}
        {saving
          ? "Saving…"
          : isEdit
            ? "Update Shift Type"
            : "Create Shift Type"}
      </button>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Shift Type" : "New Shift Type"}
      subtitle="Define work hours and attendance rules"
      icon={Clock}
      maxWidth="5xl"
      height="80vh"
      footer={footer}
      headerClass="bg-[#0f172a] text-white"
    >
      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center min-h-[300px]">
          <Loader2 size={32} className="animate-spin text-slate-800" />
        </div>
      ) : (
        <div className="flex h-full w-full flex-col md:flex-row bg-white">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 md:col-span-6">
                <label className="mb-1.5 block text-[11px] font-medium text-gray-600">
                  Shift Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Morning Shift"
                  disabled={isEdit}
                  className="w-full h-9 rounded-md border border-gray-200 px-3 text-[13px] text-gray-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div className="col-span-6 md:col-span-3">
                <label className="mb-1.5 block text-[11px] font-medium text-gray-600">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full h-9 rounded-md border border-gray-200 px-3 text-[13px] text-gray-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                />
              </div>
              <div className="col-span-6 md:col-span-3">
                <label className="mb-1.5 block text-[11px] font-medium text-gray-600">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full h-9 rounded-md border border-gray-200 px-3 text-[13px] text-gray-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-5">
              <h3 className="mb-4 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                Auto Attendance Settings
              </h3>
              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-12 md:col-span-6">
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-700">
                    Determine Check-in and Check-out
                  </label>
                  <select
                    value={determineCheckIn}
                    onChange={(e) => setDetermineCheckIn(e.target.value)}
                    className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-[13px] text-gray-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                  >
                    {CHECK_IN_OUT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-12 md:col-span-6">
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-700">
                    Working Hours Calculation Based On
                  </label>
                  <select
                    value={calcBasedOn}
                    onChange={(e) => setCalcBasedOn(e.target.value)}
                    className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-[13px] text-gray-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                  >
                    {CALC_BASED_ON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-12 md:col-span-6">
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-700">
                    Begin check-in before shift start (mins)
                  </label>
                  <input
                    type="number"
                    value={beginCheckInMins}
                    onChange={(e) =>
                      setBeginCheckInMins(
                        e.target.value ? Number(e.target.value) : "",
                      )
                    }
                    className="w-full h-9 rounded-md border border-gray-200 px-3 text-[13px] text-gray-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-700">
                    Allow check-out after shift end (mins)
                  </label>
                  <input
                    type="number"
                    value={allowCheckOutMins}
                    onChange={(e) =>
                      setAllowCheckOutMins(
                        e.target.value ? Number(e.target.value) : "",
                      )
                    }
                    className="w-full h-9 rounded-md border border-gray-200 px-3 text-[13px] text-gray-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Late Entry & Early Exit Card */}
            <div className="rounded-lg border border-gray-200 p-5">
              <h3 className="mb-4 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                Late Entry & Early Exit
              </h3>
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-6 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableLateEntry}
                      onChange={(e) => setEnableLateEntry(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-slate-800 focus:ring-slate-800"
                    />
                    <span className="text-[12px] font-medium text-gray-800">
                      Enable Late Entry Marking
                    </span>
                  </label>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium text-gray-600">
                      Late Entry Grace Period (mins)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 10"
                      disabled={!enableLateEntry}
                      value={lateEntryGrace}
                      onChange={(e) =>
                        setLateEntryGrace(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      className="w-full h-9 rounded-md border border-gray-200 px-3 text-[13px] text-gray-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                </div>
                <div className="col-span-12 md:col-span-6 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableEarlyExit}
                      onChange={(e) => setEnableEarlyExit(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-slate-800 focus:ring-slate-800"
                    />
                    <span className="text-[12px] font-medium text-gray-800">
                      Enable Early Exit Marking
                    </span>
                  </label>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium text-gray-600">
                      Early Exit Grace Period (mins)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 10"
                      disabled={!enableEarlyExit}
                      value={earlyExitGrace}
                      onChange={(e) =>
                        setEarlyExitGrace(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      className="w-full h-9 rounded-md border border-gray-200 px-3 text-[13px] text-gray-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Thresholds Card */}
            <div className="rounded-lg border border-gray-200 p-5">
              <h3 className="mb-4 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                Thresholds
              </h3>
              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-12 md:col-span-6">
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-700">
                    Working Hours Threshold for Half Day
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 4"
                    value={halfDayThreshold}
                    onChange={(e) =>
                      setHalfDayThreshold(
                        e.target.value ? Number(e.target.value) : "",
                      )
                    }
                    className="w-full h-9 rounded-md border border-gray-200 px-3 text-[13px] text-gray-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-700">
                    Working Hours Threshold for Absent
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 2"
                    value={absentThreshold}
                    onChange={(e) =>
                      setAbsentThreshold(
                        e.target.value ? Number(e.target.value) : "",
                      )
                    }
                    className="w-full h-9 rounded-md border border-gray-200 px-3 text-[13px] text-gray-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - ATTRIBUTES */}
          <div className="w-full md:w-72 bg-[#f8faff] border-l border-gray-200 p-6 flex flex-col gap-5 overflow-y-auto">
            <h3 className="text-[14px] font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Attributes
            </h3>

            <label className="flex items-start gap-3 cursor-pointer">
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  checked={enableAutoAttendance}
                  onChange={(e) => setEnableAutoAttendance(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-slate-800 focus:ring-slate-800"
                />
              </div>
              <span className="text-[13px] font-medium text-gray-700">
                Mark Auto Attendance
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  checked={markAutoOnHolidays}
                  onChange={(e) => setMarkAutoOnHolidays(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-slate-800 focus:ring-slate-800"
                />
              </div>
              <span className="text-[13px] font-medium text-gray-700 leading-snug">
                Mark Attendance on Holidays
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  checked={allowOvertime}
                  onChange={(e) => setAllowOvertime(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-slate-800 focus:ring-slate-800"
                />
              </div>
              <span className="text-[13px] font-medium text-gray-700">
                Allow Overtime
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  checked={autoUpdateLastSync}
                  onChange={(e) => setAutoUpdateLastSync(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-slate-800 focus:ring-slate-800"
                />
              </div>
              <span className="text-[13px] font-medium text-gray-700 leading-snug">
                Auto Update Last Check-In Sync
              </span>
            </label>
          </div>
        </div>
      )}
    </MinimizableModal>
  );
};
