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
              fraction_of_daily_salary_per_leave:
                initialData.fraction_of_daily_salary_per_leave ?? 1,
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
          </div>
        </div>
      </div>
    </MinimizableModal>
  );
};
