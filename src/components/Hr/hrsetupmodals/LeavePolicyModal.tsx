// ─── LeavePolicyModal.tsx ──────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { FileText, Save, X, Plus, Trash2 } from "lucide-react";
import { MinimizableModal } from "../../common/MinimizableModal";

import { 
  createLeavePolicy, 
  updateLeavePolicy,
  getAllLeaveTypes, 
  type LeavePolicy, 
  type LeavePolicyDetail 
} from "../../../api/leaveConfigApi";
import { ModalInput, YesNoCheckbox } from "../../../components/ui/modal/modalComponent";
import { showApiError, showSuccess, showValidationError } from "../../../utils/alert";
import { parseFrappeError } from "../../../views/hr/tabs/leave-config/hooks/parseFrappeError";
import LeaveTypeSelect from "../../selects/LeaveTypeSelect";

interface Props {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: LeavePolicy | null;
  onSuccess?: () => void;
}

const EMPTY: LeavePolicy = {
  title: "",
  leave_policy_details: [],
  docstatus: 0, // Default to Draft on creation
};

export const LeavePolicyModal: React.FC<Props> = ({
  modalId,
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const isEdit = Boolean(initialData?.name);
  const [form, setForm] = useState<LeavePolicy>(EMPTY);
  const [saving, setSaving] = useState(false);
  
  // State to hold fetched Leave Types for the dropdown
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState<{name: string}[]>([]);

  useEffect(() => {
    if (isOpen) {
      setForm(
        initialData
          ? {
              title: initialData.title ?? initialData.name ?? "",
              docstatus: initialData.docstatus ?? 0,
              leave_policy_details: initialData.leave_policy_details?.map(d => ({ ...d })) || [],
            }
          : { ...EMPTY, leave_policy_details: [{ leave_type: "", annual_allocation: 0 }] }
      );

      // Fetch the available Leave Types
      getAllLeaveTypes()
        .then((data) => setAvailableLeaveTypes(data))
        .catch((err) => console.error("Failed to fetch leave types", err));
    }
  }, [isOpen, initialData]);

  const addDetailRow = () => {
    setForm((prev) => ({
      ...prev,
      leave_policy_details: [
        ...prev.leave_policy_details,
        { leave_type: "", annual_allocation:0},
      ],
    }));
  };

  const removeDetailRow = (index: number) => {
    setForm((prev) => {
      const updated = [...prev.leave_policy_details];
      updated.splice(index, 1);
      return { ...prev, leave_policy_details: updated };
    });
  };

  const updateDetailRow = (index: number, field: keyof LeavePolicyDetail, value: any) => {
    setForm((prev) => {
      const updated = [...prev.leave_policy_details];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, leave_policy_details: updated };
    });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      showValidationError("Leave Policy Title is required");
      return;
    }

    const validDetails = form.leave_policy_details.filter(d => d.leave_type.trim() !== "");
    if (validDetails.length === 0) {
      showValidationError("At least one valid Leave Type configuration is required");
      return;
    }

    try {
      setSaving(true);
      const payload: LeavePolicy = {
        title: form.title,
        docstatus: form.docstatus,
        leave_policy_details: validDetails,
      };

      if (isEdit && initialData?.name) {
        await updateLeavePolicy(initialData.name, payload);
        showSuccess(form.docstatus === 1 ? "Leave policy submitted successfully" : "Leave policy updated successfully");
      } else {
        await createLeavePolicy(payload);
        showSuccess("Leave policy created successfully");
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      showApiError(parseFrappeError(err) || "Failed to save leave policy");
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
        className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 ${
          form.docstatus === 1 ? "bg-blue-600" : "bg-primary"
        }`}
      >
        <Save className="h-3.5 w-3.5" />
        {saving ? "Saving…" : form.docstatus === 1 ? "Submit Policy" : isEdit ? "Update Policy" : "Save as Draft"}
      </button>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Leave Policy" : "New Leave Policy"}
      subtitle="Define annual leave allocations by type"
      icon={FileText}
      maxWidth="2xl"
      height="auto"
      footer={footer}
    >
      <div className="space-y-6 pb-2">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <ModalInput
            label="Policy Title"
            value={form.title}
            onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g. Standard Leave Policy 2026"
            required
            disabled={initialData?.docstatus === 1}
          />
        </div>

        {/* Policy Details (Child Table) */}
        <div className="space-y-3 rounded-xl border border-[var(--border)] bg-app p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-main">Leave Allocations</p>
            {initialData?.docstatus !== 1 && (
              <button
                type="button"
                onClick={addDetailRow}
                className="flex items-center gap-1 text-xs font-medium text-primary transition hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Row
              </button>
            )}
          </div>

          <div className="space-y-3">
            {form.leave_policy_details.map((detail, index) => (
              <div key={index} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                <div className="grid flex-1 grid-cols-2 gap-4">
                  
                <LeaveTypeSelect
  label="Leave Type"
  value={detail.leave_type}
  onChange={(type) => updateDetailRow(index, "leave_type", type.name)}
  disabled={initialData?.docstatus === 1}
  required
  className="flex-1"
/>

               <ModalInput
  label="Annual Allocation"
  type="number"
  className="no-spinner"
  value={detail.annual_allocation || ""}
  placeholder="0"
  onChange={(e) =>
    updateDetailRow(
      index,
      "annual_allocation",
      Number(e.target.value) || 0,
    )
  }
  required
  disabled={initialData?.docstatus === 1}
/>
                </div>
                {initialData?.docstatus !== 1 && (
                  <button
                    type="button"
                    onClick={() => removeDetailRow(index)}
                    className="mt-6 p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700 rounded"
                    title="Remove Row"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </MinimizableModal>
  );
};