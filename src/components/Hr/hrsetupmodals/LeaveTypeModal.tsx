// ─── LeaveTypeModal.tsx ──────────────────────────────────────────────────────
import React, { useCallback, useEffect, useState } from "react";
import {Save, X, Layers } from "lucide-react";
import { MinimizableModal } from "../../common/MinimizableModal";

import {
  createLeaveType,
  updateLeaveType,
  type LeaveType,
} from "../../../api/leaveConfigApi";
import {
  ModalInput,
  YesNoCheckbox,
} from "../../../components/ui/modal/modalComponent";
import {
  showApiError,
  showSuccess,
  showValidationError,
} from "../../../utils/alert";
import { parseFrappeError } from "../../../views/hr/tabs/leave-config/hooks/parseFrappeError";

interface Props {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: LeaveType | null;
  onSuccess?: () => void;
}

const EMPTY: Omit<LeaveType, "name"> = {
  leave_type_name: "",
  max_leaves_allowed: 0,
  is_lwp: 0,
  is_carry_forward: 0,
  allow_negative: 0,
  include_holiday: 0,
  fraction_of_daily_salary_per_leave: 1,
  is_earned_leave: 0,
  earned_leave_frequency: "",
  allocate_on_day: "",
  rounding: "",
};

export const LeaveTypeModal: React.FC<Props> = ({
  modalId,
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const isView = Boolean((initialData as any)?._isView);
  const isEdit = Boolean(initialData?.name);
  const [form, setForm] = useState<Omit<LeaveType, "name">>(EMPTY);
  const [saving, setSaving] = useState(false);

  // Sync when modal opens / initialData changes
  useEffect(() => {
    if (isOpen) {
      setForm(
        initialData
          ? {
              leave_type_name: initialData.leave_type_name ?? "",
              max_leaves_allowed: initialData.max_leaves_allowed,
              is_lwp: initialData.is_lwp ?? 0,
              is_carry_forward: initialData.is_carry_forward ?? 0,
              allow_negative: initialData.allow_negative ?? 0,
              include_holiday: initialData.include_holiday ?? 0,
              allow_encashment: initialData.allow_encashment ?? 0,
              fraction_of_daily_salary_per_leave:
                initialData.fraction_of_daily_salary_per_leave ?? 1,
              // is_earned_leave: initialData.is_earned_leave ?? 0,
              // is_earned_leave: Number(initialData.is_earned_leave) || 0,
              is_earned_leave: Number(initialData.is_earned_leave) === 1 ? 1 : 0,
              earned_leave_frequency: initialData.earned_leave_frequency ?? "",
              allocate_on_day: initialData.allocate_on_day ?? "",
              rounding: initialData.rounding ?? "",
            }
          : { ...EMPTY },
      );
    }
  }, [isOpen, initialData]);

  const set = useCallback(
    <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.leave_type_name.trim()) {
      showValidationError("Leave Type Name is required");
      return;
    }

    if (form.max_leaves_allowed < 0 ) {
      showValidationError("Max leaves allowed cannot be negative");
      return;
    }
    if (!form.max_leaves_allowed ) {
    showValidationError("Max leave allocation is required.");
    return;
    }
    if (!Number.isInteger(form.max_leaves_allowed)) {
    showValidationError("Max leave allocation must be a whole number.");
    return;
    }
    if (
      form.fraction_of_daily_salary_per_leave !== undefined &&
      form.fraction_of_daily_salary_per_leave < 0
    ) {
      showValidationError(
        "Fraction of Daily Salary per Leave allowed cannot be negative",
      );
      return;
    }
     if (!Number.isInteger(form.fraction_of_daily_salary_per_leave)) {
    showValidationError("Fraction of Daily Salary per Leave must be a whole number.");
    return;
    }

    try {
      setSaving(true);
      const payload = { ...form };

      if (isEdit && initialData?.name) {
        await updateLeaveType(initialData.name, payload);
        showSuccess("Leave type updated successfully");
      } else {
        await createLeaveType(payload);
        showSuccess("Leave type created successfully");
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      showApiError(parseFrappeError(err) || "Failed to save leave type");
    } finally {
      setSaving(false);
    }
  };

  const footer = !isView ?(
    <div className="flex w-full items-center justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-app px-4 py-2 text-sm font-medium text-main transition hover:bg-[var(--border)]"
      >
        <X className="h-3.5 w-3.5" />
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        <Save className="h-3.5 w-3.5" />
        {saving
          ? "Saving…"
          : isEdit
            ? "Update "
            : "  Submit"}
      </button>
    </div>
  ): null;

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      // title={isEdit ? "Edit Leave Type" : "New Leave Type"}
      title={isView ? "View Leave Type" : isEdit ? "Edit Leave Type" : "Add Leave Type"}
      subtitle="Configure leave policies and rules"
      icon={Layers}
      maxWidth="2xl"
      height="auto"
      footer={footer}
    >
      <div className="space-y-5 pb-2">
        {/* ── Row 1: Basic Info ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <ModalInput
            label="Leave Type Name"
            value={form.leave_type_name}
            onChange={(e) => set("leave_type_name", e.target.value)}
            placeholder="e.g. Casual Leave"
            required
            disabled={isView}
          />
          <ModalInput
            label="Max Leaves Allowed"
            type="number"
            className="no-spinner"
            value={form.max_leaves_allowed || ""}
            placeholder="0"
            onChange={(e) =>
              set("max_leaves_allowed", Number(e.target.value) || 0)
            }
            disabled={isView}
          />
        </div>

        {/* ── Row 2: Salary Configuration ────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <ModalInput
            label="Fraction of Daily Salary Per Leave"
            type="number"
            step="0.1"
            className="no-spinner"
            value={form.fraction_of_daily_salary_per_leave || ""}
            placeholder="0"
            onChange={(e) =>
              set(
                "fraction_of_daily_salary_per_leave",
                Number(e.target.value) || 0,
              )
            }
            disabled={isView}
          />
        </div>

        {/* ── Row 3: Boolean Toggles (Checkboxes) ──────────────────────── */}
        <div className="space-y-4 rounded-xl border border-[var(--border)] bg-app p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-sub">
            Leave Configuration Rules
          </p>

          <div className="grid grid-cols-2 gap-y-4 md:grid-cols-4">
            <YesNoCheckbox
              name="is_lwp"
              label="Is Leave Without Pay"
              value={form.is_lwp ? "Y" : "N"}
              onChange={(name, value) => set("is_lwp", value === "Y" ? 1 : 0)}
              disabled={isView}
            />
            <YesNoCheckbox
              name="is_carry_forward"
              label="Is Carry Forward"
              value={form.is_carry_forward ? "Y" : "N"}
              onChange={(name, value) =>
                set("is_carry_forward", value === "Y" ? 1 : 0)
              }
              disabled={isView}
            />
            <YesNoCheckbox
              name="allow_negative"
              label="Allow Negative Balance"
              value={form.allow_negative ? "Y" : "N"}
              onChange={(name, value) =>
                set("allow_negative", value === "Y" ? 1 : 0)
              }
              disabled={isView}
            />
            <YesNoCheckbox
              name="include_holiday"
              label="Include Holiday"
              value={form.include_holiday ? "Y" : "N"}
              onChange={(name, value) =>
                set("include_holiday", value === "Y" ? 1 : 0)
              }
              disabled={isView}
            />
            <YesNoCheckbox
              name="allow_encashment"
              label="Allow Encashment"
              value={form.allow_encashment ? "Y" : "N"}
              onChange={(name, value) =>
                set("allow_encashment", value === "Y" ? 1 : 0)
              }
              disabled={isView}
            />
            <YesNoCheckbox
  name="is_earned_leave"
  label="Is Earned Leave"
  value={form.is_earned_leave ? "Y" : "N"}
  onChange={(name, value) => set("is_earned_leave", value === "Y" ? 1 : 0)}
  disabled={isView}
/>
          </div>
          {form.is_earned_leave === 1 && (
  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-4">
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-main">Earned Leave Frequency</label>
      <select
        className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-sm text-main focus:border-primary focus:outline-none disabled:opacity-60"
        value={form.earned_leave_frequency}
        onChange={(e) => set("earned_leave_frequency", e.target.value)}
        disabled={isView}
      >
        <option value="" disabled>Select Frequency</option>
        <option value="Monthly">Monthly</option>
        <option value="Quarterly">Quarterly</option>
        <option value="Half-Yearly">Half-Yearly</option>
        <option value="Yearly">Yearly</option>
      </select>
    </div>

    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-main">Allocate on Day</label>
      <select
        className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-sm text-main focus:border-primary focus:outline-none disabled:opacity-60"
        value={form.allocate_on_day}
        onChange={(e) => set("allocate_on_day", e.target.value)}
        disabled={isView}
      >
        <option value="" disabled>Select Day</option>
        <option value="First Day">First Day</option>
        <option value="Last Day">Last Day</option>
        <option value="Date of Joining">Date of Joining</option>
      </select>
      <span className="text-[11px] text-sub">The day of the month when leaves should be allocated</span>
    </div>

    <div className="flex flex-col ">
      <label className="text-sm font-medium text-main">Rounding</label>
      <select
        className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-sm text-main focus:border-primary focus:outline-none disabled:opacity-60"
        value={form.rounding}
        onChange={(e) => set("rounding", e.target.value)}
        disabled={isView}
      >
        <option value="" disabled>Select Rounding</option>
        <option value="0.25">0.25</option>
        <option value="0.5">0.5</option>
        <option value="1">1</option>
      </select>
    </div>
  </div>
)}
        </div>
      </div>
    </MinimizableModal>
  );
};
