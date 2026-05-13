import React, { useCallback, useEffect, useState } from "react";
import { Save, UserRoundCog, X } from "lucide-react";

import { MinimizableModal } from "../../components/common/MinimizableModal";
import { ModalInput } from "../../components/ui/modal/modalComponent";
import {
  createEmployeeType,
  updateEmployeeType,
  type EmployeeType,
} from "../../api/employeeConfigApi";
import {
  showApiError,
  showSuccess,
  showValidationError,
} from "../../utils/alert";

interface Props {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: EmployeeType | null;
  onSuccess?: () => void;
}

const EMPTY: Omit<EmployeeType, "name"> = {
  employee_type_name: "",
};

export const EmployeeTypeModal: React.FC<Props> = ({
  modalId,
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const isEdit = Boolean(initialData?.name);
  const [form, setForm] = useState<Omit<EmployeeType, "name">>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(
        initialData
          ? { employee_type_name: initialData.employee_type_name ?? initialData.name ?? "" }
          : { ...EMPTY },
      );
    }
  }, [isOpen, initialData]);

  const set = useCallback(
    <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const handleSave = async () => {
    if (!form.employee_type_name.trim()) {
      showValidationError("Employee type is required");
      return;
    }
    try {
      setSaving(true);
      if (isEdit && initialData?.name) {
        await updateEmployeeType(initialData.name, form);
        showSuccess("Employee type updated");
      } else {
        await createEmployeeType(form);
        showSuccess("Employee type created");
      }
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
      <button type="button" onClick={onClose} className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-app px-4 py-2 text-sm font-medium text-main transition hover:bg-[var(--border)]">
        <X className="h-3.5 w-3.5" />
        Cancel
      </button>
      <button type="button" onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
        <Save className="h-3.5 w-3.5" />
        {saving ? "Saving..." : isEdit ? "Update Employee Type" : "Create Employee Type"}
      </button>
    </div>
  );

  return (
    <MinimizableModal modalId={modalId} isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Employee Type" : "New Employee Type"} subtitle="Configure employment categories" icon={UserRoundCog} maxWidth="xl" height="auto" footer={footer}>
      <div className="space-y-5 pb-2">
        <ModalInput label="Employee Type" value={form.employee_type_name} disabled={isEdit} onChange={(e) => set("employee_type_name", e.target.value)} required />
      </div>
    </MinimizableModal>
  );
};
