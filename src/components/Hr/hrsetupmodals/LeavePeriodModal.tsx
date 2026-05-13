// ─── LeavePeriodModal.tsx ──────────────────────────────────────────────────────
import React, { useCallback, useEffect, useState } from "react";
import { Calendar, Save, X } from "lucide-react";
import { MinimizableModal } from "../../common/MinimizableModal";

import { createLeavePeriod, updateLeavePeriod, type LeavePeriod } from "../../../api/leaveConfigApi";
import { ModalInput, YesNoCheckbox } from "../../../components/ui/modal/modalComponent";
import { showApiError, showSuccess, showValidationError } from "../../../utils/alert";
import { parseFrappeError } from "../../../views/hr/tabs/leave-config/hooks/parseFrappeError";
import DatePickerInput from "../../calendar/DatePickerInput";
interface Props {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: LeavePeriod | null;
  onSuccess?: () => void;
}

const EMPTY: LeavePeriod = {
  name: "",
  from_date: "",
  to_date: "",
  is_active: 1,
}; 

export const LeavePeriodModal: React.FC<Props> = ({
  modalId,
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const isEdit = Boolean(initialData?.name);
  const [form, setForm] = useState<LeavePeriod>(EMPTY);
  const [saving, setSaving] = useState(false);
const toDateInput = (val: string) => val ? val.split("T")[0] : "";

  useEffect(() => {
    if (isOpen) {
      setForm(
        initialData
          ? {
              name: initialData.name ?? "",
              from_date: toDateInput(initialData.from_date),
              to_date: toDateInput(initialData.to_date),
              is_active: initialData.is_active ?? 0,
            }
          : { ...EMPTY },
      );
    }
  }, [isOpen, initialData]);

const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
  setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      showValidationError("Leave Period Name is required");
      return;
    }
    if (!form.from_date) {
      showValidationError("From Date is required");
      return;
    }
    if (!form.to_date) {
      showValidationError("To Date is required");
      return;
    }
    if (new Date(form.from_date) > new Date(form.to_date)) {
      showValidationError("From Date cannot be after To Date");
      return;
    }

    try {
      setSaving(true);
      const payload = { ...form };

      if (isEdit && initialData?.name) {
        // Exclude 'name' from the payload when updating, as it's passed in the URL
        const { name, ...updatePayload } = payload;
        await updateLeavePeriod(initialData.name, updatePayload);
        showSuccess("Leave period updated successfully");
      } else {
        await createLeavePeriod(payload);
        showSuccess("Leave period created successfully");
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      showApiError(parseFrappeError(err) || "Failed to save leave period.");
    } finally {
      setSaving(false);
    }
  };

  const footer = (
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
        {saving ? "Saving…" : isEdit ? "Update Leave Period" : "Create Leave Period"}
      </button>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Leave Period" : "New Leave Period"}
      subtitle="Define fiscal or operational calendar periods for leave allocation"
      icon={Calendar}
      maxWidth="xl"
      height="auto"
      footer={footer}
    >
      <div className="space-y-5 pb-2">
        <ModalInput
          label="Leave Period Name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Leave Period 2026"
          required
          disabled={isEdit} 
        />

     <div className="grid grid-cols-2 gap-4">
  <DatePickerInput
    label="From Date"
    name="from_date"
    value={form.from_date}
    onChange={(name, value) =>
      set(name as keyof typeof form, value)
    }
    required
  />

  <DatePickerInput
    label="To Date"
    name="to_date"
    value={form.to_date}
    onChange={(name, value) =>
      set(name as keyof typeof form, value)
    }
    required
  />
</div>

        <div className="space-y-4 rounded-xl border border-[var(--border)] bg-app p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-sub">
            Status
          </p>
          <YesNoCheckbox
            name="is_active"
            label="Is Active"
            value={form.is_active ? "Y" : "N"}
            onChange={(name, value) => set("is_active", value === "Y" ? 1 : 0)}
          />
        </div>
      </div>
    </MinimizableModal>
  );
};