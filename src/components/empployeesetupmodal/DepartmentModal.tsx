import React, { useCallback, useEffect, useState } from "react";
import { Building2, Save, X } from "lucide-react";

import { MinimizableModal } from "../../components/common/MinimizableModal";
import { getAllDepartments } from "../../api/utils/frappeUtilsApi";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import { getalluser } from "../../api/utils/frappeUtilsApi";
import { ModalInput, YesNoCheckbox } from "../../components/ui/modal/modalComponent";
import {
  createDepartment,
  updateDepartment,
  type Department,
  type DepartmentApprover,
} from "../../api/employeeConfigApi";
import { showApiError, showSuccess, showValidationError } from "../../utils/alert";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";

interface Props {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: Department | null;
  onSuccess?: () => void;
}

type DepartmentForm = Omit<Department, "name">;

const EMPTY: DepartmentForm = {
  parent_department: "All Departments",
  department_name: "",
  is_group: 0,
  leave_block_list: "",
  leave_approvers: [],
  expense_approvers: [],
  shift_request_approver: [],
};

const approversToText = (rows?: DepartmentApprover[]) =>
  (rows ?? []).map((row) => row.approver).join(", ");

const textToApprovers = (value: string): DepartmentApprover[] =>
  value
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean)
    .map((approver) => ({ approver }));

export const DepartmentModal: React.FC<Props> = ({
  modalId,
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const isEdit = Boolean(initialData?.name);

  const [form, setForm] = useState<DepartmentForm>(EMPTY);
  const [leaveApprovers, setLeaveApprovers] = useState("");
  const [expenseApprovers, setExpenseApprovers] = useState("");
  const [shiftApprovers, setShiftApprovers] = useState("");
  const [saving, setSaving] = useState(false);

  const { markDirty, resetDirty, handleCloseWithConfirm, containerRef, activate, deactivate } =
    useUnsavedChangesGuard();

  useEffect(() => {
    if (isOpen) {
      setForm(
        initialData
          ? {
              parent_department: initialData.parent_department ?? "All Departments",
              department_name: initialData.department_name ?? initialData.name ?? "",
              is_group: initialData.is_group ?? 0,
              leave_block_list: initialData.leave_block_list ?? "",
              leave_approvers: initialData.leave_approvers ?? [],
              expense_approvers: initialData.expense_approvers ?? [],
              shift_request_approver: initialData.shift_request_approver ?? [],
            }
          : { ...EMPTY },
      );
      setLeaveApprovers(approversToText(initialData?.leave_approvers));
      setExpenseApprovers(approversToText(initialData?.expense_approvers));
      setShiftApprovers(approversToText(initialData?.shift_request_approver));
      return activate();
    } else {
      deactivate();
      resetDirty();
    }
  }, [isOpen, initialData]);

  const set = useCallback(
    <K extends keyof DepartmentForm>(key: K, value: DepartmentForm[K]) => {
      markDirty();
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [markDirty],
  );

  const handleSave = async () => {
    if (!form.department_name.trim()) {
      showValidationError("Department name is required");
      return;
    }

    try {
      setSaving(true);
      const payload: DepartmentForm = {
        ...form,
        leave_approvers: textToApprovers(leaveApprovers),
        expense_approvers: textToApprovers(expenseApprovers),
        shift_request_approver: textToApprovers(shiftApprovers),
      };

      if (isEdit && initialData?.name) {
        await updateDepartment(initialData.name, payload);
        showSuccess("Department updated");
      } else {
        await createDepartment(payload);
        showSuccess("Department created");
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
    <div className="flex w-full items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => handleCloseWithConfirm(onClose, modalId)}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-app px-3.5 py-1.5 text-sm font-medium text-main transition hover:bg-[var(--border)]"
      >
        <X className="h-3.5 w-3.5" />
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        <Save className="h-3.5 w-3.5" />
        {saving ? "Saving..." : isEdit ? "Update" : "Submit"}
      </button>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, modalId)}
      title={isEdit ? "Edit Department" : "Add Department"}
      subtitle={
        isEdit
          ? "Edit and manage department hierarchy and approvers"
          : "Add and manage department hierarchy and approvers"
      } icon={Building2}
      customWidth="52vw"
      height="45vh"
      footer={footer}
      formContainerRef={containerRef}
    >
      <div className="bg-app">
        <div className="flex items-end gap-3 flex-nowrap overflow-x-auto">
          <ModalInput
            label="Department Name"
            value={form.department_name}
            disabled={isEdit}
            onChange={(e) => set("department_name", e.target.value)}
            required
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SearchSelect2
              label="Parent Department"
              value={form.parent_department ?? ""}
              fetchOptions={async (search: string) => {
                const res = await getAllDepartments(search);
                return res || [];
              }}
              onChange={(val: any) => {
                markDirty();
                set("parent_department", typeof val === "string" ? val : val?.value || "");
              }}
            />
            <ModalInput
              label="Leave Block List"
              value={form.leave_block_list ?? ""}
              onChange={(e) => set("leave_block_list", e.target.value)}
            />
          </div>

          <div>
            <YesNoCheckbox
              name="is_group"
              label="Is Group"
              value={form.is_group ? "Y" : "N"}
              onChange={(_, value) => set("is_group", value === "Y" ? 1 : 0)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-7">
          <SearchSelect2
            label="Leave Approver"
            value={leaveApprovers}
            placeholder="Search user..."
            fetchOptions={getalluser}
            onChange={(val: any) => {
              markDirty();
              setLeaveApprovers(typeof val === "string" ? val : val?.value || "");
            }}
          />
          <SearchSelect2
            label="Expense Approver"
            value={expenseApprovers}
            placeholder="Search user..."
            fetchOptions={getalluser}
            onChange={(val: any) => {
              markDirty();
              setExpenseApprovers(typeof val === "string" ? val : val?.value || "");
            }}
          />
          <SearchSelect2
            label="Shift Approver"
            value={shiftApprovers}
            placeholder="Search user..."
            fetchOptions={getalluser}
            onChange={(val: any) => {
              markDirty();
              setShiftApprovers(typeof val === "string" ? val : val?.value || "");
            }}
          />
        </div>
      </div>
    </MinimizableModal>
  );
};