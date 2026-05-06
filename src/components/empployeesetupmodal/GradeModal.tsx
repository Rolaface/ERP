import React, { useCallback, useEffect, useState } from "react";
import { Layers, Save, X } from "lucide-react";

import { MinimizableModal } from "../../components/common/MinimizableModal";
import { ModalInput } from "../../components/ui/modal/modalComponent";
import { searchSalaryStructures } from "../../api/payrollConfigApi";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import {
  createEmployeeGrade,
  updateEmployeeGrade,
  type EmployeeGrade,
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
  initialData?: EmployeeGrade | null;
  onSuccess?: () => void;
}

const EMPTY: EmployeeGrade = {
  name: "",
  default_salary_structure: "",
};

export const GradeModal: React.FC<Props> = ({
  modalId,
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const isEdit = Boolean(initialData?.name);
  const [form, setForm] = useState<EmployeeGrade>(EMPTY);
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    if (isOpen) {
      setForm(
        initialData
          ? {
            name: initialData.name ?? "",
            default_salary_structure:
              initialData.default_salary_structure ?? "",
          }
          : { ...EMPTY },
      );
    }
  }, [isOpen, initialData]);

  const set = useCallback(
    <K extends keyof EmployeeGrade>(key: K, value: EmployeeGrade[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const fetchSalaryStructureOptions = async (q: string) => {
    const res = await searchSalaryStructures(q);

    return res.map((item: any) => ({
      label: item.name,
      value: item.name,
    }));
  };
  const handleSave = async () => {
    if (!form.name.trim()) {
      showValidationError("Grade name is required");
      return;
    }
    try {
      setSaving(true);
      if (isEdit && initialData?.name) {
        const { name: _name, ...payload } = form;
        await updateEmployeeGrade(initialData.name, payload);
        showSuccess("Grade updated");
      } else {
        await createEmployeeGrade(form);
        showSuccess("Grade created");
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to save grade");
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
        {saving ? "Saving..." : isEdit ? "Update Grade" : "Create Grade"}
      </button>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Grade" : "New Grade"}
      subtitle="Configure employee bands and default salary structure"
      icon={Layers}
      maxWidth="xl"
      height="auto"
      footer={footer}
    >
      <div className="flex items-end gap-3 flex-nowrap overflow-x-auto">
        <ModalInput
          label="Grade Name"
          value={form.name}
          disabled={isEdit}
          onChange={(e) => set("name", e.target.value)}
          required
        />
        

        <div className="[30px]">
        <SearchSelect2
          label="Default Salary Structure"
          value={form.default_salary_structure}
          fetchOptions={fetchSalaryStructureOptions}
          onChange={(val) => set("default_salary_structure", val)}
          placeholder="Search salary structure..."
        />
        </div>
      </div>
    </MinimizableModal>
  );
};
