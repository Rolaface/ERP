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
import { showApiError, showSuccess, showValidationError } from "../../utils/alert";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";

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
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [descError, setDescError] = useState("");

  const { markDirty, resetDirty, handleCloseWithConfirm, containerRef, activate, deactivate } =
    useUnsavedChangesGuard();

  useEffect(() => {
    if (isOpen) {
      setCodeError("");
      setDescError("");
      if (initialData) {
        const raw = initialData.name ?? "";
        const separatorIdx = raw.indexOf(" | ");
        const parsedCode = separatorIdx !== -1 ? raw.slice(0, separatorIdx) : raw;
        const parsedDesc = separatorIdx !== -1 ? raw.slice(separatorIdx + 3) : "";
        setCode(parsedCode);
        setDesc(parsedDesc);
        setForm({
          name: raw,
          default_salary_structure: initialData.default_salary_structure ?? "",
        });
      } else {
        setCode("");
        setDesc("");
        setForm({ ...EMPTY });
      }
      return activate();
    } else {
      deactivate();
      resetDirty();
    }
  }, [isOpen, initialData]);

  const set = useCallback(
    <K extends keyof EmployeeGrade>(key: K, value: EmployeeGrade[K]) => {
      markDirty();
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [markDirty],
  );

  const fetchSalaryStructureOptions = async (q: string) => {
    const res = await searchSalaryStructures(q);
    return res.map((item: any) => ({ label: item.name, value: item.name }));
  };

  const handleSave = async () => {
    if (!code.trim()) {
      showValidationError("Grade name is required");
      return;
    }
    if (codeError || descError) return;

    const combinedName = desc.trim() ? `${code.trim()} | ${desc.trim()}` : code.trim();
    const formToSubmit = { ...form, name: combinedName };

    try {
      setSaving(true);
      if (isEdit && initialData?.name) {
        const { name: _name, ...payload } = formToSubmit;
        await updateEmployeeGrade(initialData.name, payload);
        showSuccess("Grade updated");
      } else {
        await createEmployeeGrade(formToSubmit);
        showSuccess("Grade created");
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
        {saving ? "Saving..." : isEdit ? "Update Grade" : "Create Grade"}
      </button>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, modalId)}
      title={isEdit ? "Edit Grade" : "New Grade"}
      subtitle="Configure employee bands and default salary structure"
      icon={Layers}
      customWidth="60vw"
      height="40vh"
      footer={footer}
      formContainerRef={containerRef}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 flex flex-col">
          <ModalInput
            label="Name"
            value={code}
            disabled={isEdit}
            onChange={(e) => {
              markDirty();
              setCode(e.target.value);
              setCodeError(e.target.value.length > 20 ? "Name cannot exceed 20 characters" : "");
            }}
            required
            placeholder="e.g. GRD01"
            error={codeError}
          />
          <div className="min-h-[20px]" />
        </div>
        <div className="flex-[2] flex flex-col">
          <ModalInput
            label="Description"
            value={desc}
            disabled={isEdit}
            onChange={(e) => {
              markDirty();
              setDesc(e.target.value);
              setDescError(e.target.value.length > 50 ? "Description cannot exceed 50 characters" : "");
            }}
            placeholder="Grade description (optional)"
            error={descError}
          />
          <div className="min-h-[20px]" />
        </div>
        <div className="flex-[2] flex flex-col">
          <SearchSelect2
            label="Default Salary Structure"
            value={form.default_salary_structure}
            fetchOptions={fetchSalaryStructureOptions}
            onChange={(val) => {
              markDirty();
              set("default_salary_structure", val);
            }}
            placeholder="Search salary structure..."
          />
          <div className="min-h-[20px]" />
        </div>
      </div>
    </MinimizableModal>
  );
};