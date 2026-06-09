import React, { useEffect, useState } from "react";
import { Calendar, Save, X } from "lucide-react";

import { MinimizableModal } from "../../common/MinimizableModal";
import { ModalInput } from "../../../components/ui/modal/modalComponent";
import {
  createPayrollPeriod,
  updatePayrollPeriod,
  type PayrollPeriod,
} from "../../../api/payrollConfigApi";
import DatePickerInput from "../../calendar/DatePickerInput";
import { showApiError, showSuccess, showValidationError } from "../../../utils/alert";
import { useUnsavedChangesGuard } from "../../../hooks/useUnsavedChangesGuard";

interface Props {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: PayrollPeriod | null;
  onSuccess?: () => void;
}

const EMPTY = { name: "", start_date: "", end_date: "" };

export const PayrollPeriodModal: React.FC<Props> = ({
  modalId,
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const isEdit = Boolean(initialData?.name);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const { markDirty, resetDirty, handleCloseWithConfirm, containerRef, activate, deactivate } =
    useUnsavedChangesGuard();

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: initialData?.name ?? "",
        start_date: initialData?.start_date ?? "",
        end_date: initialData?.end_date ?? "",
      });
      return activate();
    } else {
      deactivate();
      resetDirty();
    }
  }, [isOpen, initialData]);

  const set = <K extends keyof typeof EMPTY>(key: K, value: string) => {
    markDirty();
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showValidationError("Name is required"); return; }
    if (!form.start_date) { showValidationError("Start date is required"); return; }
    if (!form.end_date) { showValidationError("End date is required"); return; }
    if (form.end_date <= form.start_date) { showValidationError("End date must be after start date"); return; }

    try {
      setSaving(true);
      if (isEdit && initialData?.name) {
        await updatePayrollPeriod(initialData.name, {
          start_date: form.start_date,
          end_date: form.end_date,
        });
        showSuccess("Payroll period updated");
      } else {
        await createPayrollPeriod({ name: form.name, start_date: form.start_date, end_date: form.end_date });
        showSuccess("Payroll period created");
      }
      resetDirty();
      onSuccess?.();
      onClose();
    } catch (err) {
      showApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <div className="flex w-full items-center justify-end gap-3">
      <button
        type="button"
        onClick={() => handleCloseWithConfirm(onClose, modalId)}
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
        {saving ? "Saving..." : isEdit ? "Update Period" : "Create Period"}
      </button>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, modalId)}
      title={isEdit ? "Edit Payroll Period" : "New Payroll Period"}
      subtitle="Define payroll period start and end dates"
      icon={Calendar}
      customWidth="40vw"
      height="auto"
      footer={footer}
      formContainerRef={containerRef}
    >
      <div className="flex items-end gap-3 flex-wrap p-4">
        <div className="w-[180px]">
          <ModalInput
            label="Name"
            value={form.name}
            disabled={isEdit}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. FY 2026-27"
            required
          />
        </div>
        <div className="w-[170px]">
          <DatePickerInput
            label="Start Date"
            name="start_date"
            value={form.start_date}
            onChange={(name, value) => { markDirty(); set(name as keyof typeof EMPTY, value); }}
            required
          />
        </div>
        <div className="w-[170px]">
          <DatePickerInput
            label="End Date"
            name="end_date"
            value={form.end_date}
            onChange={(name, value) => { markDirty(); set(name as keyof typeof EMPTY, value); }}
            required
          />
        </div>
      </div>
    </MinimizableModal>
  );
};