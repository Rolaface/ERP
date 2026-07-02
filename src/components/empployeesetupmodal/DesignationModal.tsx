import React, { useCallback, useEffect, useState } from "react";
import { Briefcase, Save, X } from "lucide-react";

import { MinimizableModal } from "../../components/common/MinimizableModal";
import { ModalInput } from "../../components/ui/modal/modalComponent";
import {
  createDesignation,
  updateDesignation,
  type Designation,
} from "../../api/employeeConfigApi";
import { showApiError, showSuccess, showValidationError } from "../../utils/alert";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";

interface Props {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: Designation | null;
  onSuccess?: () => void;
}

const EMPTY: Omit<Designation, "name"> = {
  designation_name: "",
  description: "",
};

export const DesignationModal: React.FC<Props> = ({
  modalId,
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const isEdit = Boolean(initialData?.name);
  const [form, setForm] = useState<Omit<Designation, "name">>(EMPTY);
  const [saving, setSaving] = useState(false);

  const { resetDirty, handleCloseWithConfirm, containerRef, activate, deactivate } =
    useUnsavedChangesGuard();

  useEffect(() => {
    if (isOpen) {
      setForm(
        initialData
          ? {
              designation_name: initialData.designation_name ?? initialData.name ?? "",
              description: initialData.description ?? "",
            }
          : { ...EMPTY },
      );
      return activate();
    } else {
      deactivate();
      resetDirty();
    }
  }, [isOpen, initialData]);

  const set = useCallback(
    <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const handleSave = async () => {
    if (!form.designation_name.trim()) {
      showValidationError("Designation name is required");
      return;
    }
    try {
      setSaving(true);
      if (isEdit && initialData?.name) {
        await updateDesignation(initialData.name, form);
        showSuccess("Designation updated");
      } else {
        await createDesignation(form);
        showSuccess("Designation created");
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
        {saving ? "Saving..." : isEdit ? "Update " : "Submit"}
      </button>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, modalId)}
      title={isEdit ? "Edit Designation" : "Add Designation"}
      subtitle={
        isEdit
          ? "Edit and manage employee role classification"
          : "Add and manage employee role classification"
      } icon={Briefcase}
      maxWidth="xl"
      height="auto"
      footer={footer}
      formContainerRef={containerRef}
    >
      <div className="flex items-end gap-3 flex-nowrap overflow-x-auto">
        <ModalInput
          label="Designation Name"
          value={form.designation_name}
          disabled={isEdit}
          onChange={(e) => set("designation_name", e.target.value)}
          required
        />
        <ModalInput
          label="Description"
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
    </MinimizableModal>
  );
};