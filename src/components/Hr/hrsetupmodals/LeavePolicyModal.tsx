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
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const totalPages = Math.max(1, Math.ceil(form.leave_policy_details.length / ITEMS_PER_PAGE));
  const paginatedDetails = form.leave_policy_details.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState<any[]>([]);

  const fetchLatestLeaveTypes = async () => {
    try {
      const res: any = await getAllLeaveTypes();
      const data = res?.data ?? res;
      setAvailableLeaveTypes(data);
    } catch (err) {
      console.error("Failed to fetch leave types", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setForm(
        initialData
          ? {
              title: initialData.title ?? initialData.name ?? "",
              docstatus: initialData.docstatus ?? 0,
              leave_policy_details: initialData.leave_policy_details?.map(d => ({ ...d })) || [],
            }
          : { ...EMPTY, leave_policy_details: [{ leave_type: "", annual_allocation: 0, max_leaves_allowed: 0 }] }
      );

      fetchLatestLeaveTypes();
    }
  }, [isOpen, initialData]);

  const addDetailRow = () => {
    setForm((prev) => ({
      ...prev,
      leave_policy_details: [
        ...prev.leave_policy_details,
        { leave_type: "", annual_allocation: 0, max_leaves_allowed: 0 },
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
        docstatus: isEdit ? form.docstatus : 1,
        leave_policy_details: validDetails.map(d => ({ ...d })),
      };

      if (isEdit && initialData?.name) {
        await updateLeavePolicy(initialData.name, payload);
        showSuccess(form.docstatus === 1 ? "Leave policy submitted successfully" : "Leave policy updated successfully");
      } else {
        await createLeavePolicy(payload);
        showSuccess("Leave policy created and submitted successfully");
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      showApiError(parseFrappeError(err) || "Failed to save leave policy");
    } finally {
      setSaving(false);
    }
  };

  const footer = !isEdit ? (
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
        {saving ? "Saving…" : form.docstatus === 1 ? "Submit Policy" : isEdit ? "Update Policy" : "Save Plicy"}
      </button>
    </div>
  ): null;

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
        <div className="rounded border border-[var(--border)] bg-app overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f4f5f7] border-b border-[var(--border)] text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 w-1/2 border-r border-[var(--border)]">Leave Type</th>
                <th className="px-4 py-3 w-[20%] border-r border-[var(--border)] text-center">Max Allowed</th>
                <th className="px-4 py-3 w-1/2 border-r border-[var(--border)]">Annual Allocation</th>
                <th className="px-4 py-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {/* {paginatedDetails.map((detail, pageIndex) => {
                const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + pageIndex;
                
                return (
                  <tr key={actualIndex} className="bg-white">
                    <td 
                      className="p-2 border-r border-[var(--border)] align-top"
                      onClick={fetchLatestLeaveTypes}
                    >
                      <LeaveTypeSelect
                        label=""
                        value={detail.leave_type}
                        onChange={(type) => {
                          const typeName = type.name || type;
                          const matchedLeaveType = availableLeaveTypes.find(lt => lt.name === typeName);
                          
                          setForm((prev) => {
                            const updated = [...prev.leave_policy_details];
                            updated[actualIndex] = { 
                              ...updated[actualIndex], 
                              leave_type: typeName,
                              max_leaves_allowed: matchedLeaveType ? matchedLeaveType.max_leaves_allowed : 0 
                            };
                            return { ...prev, leave_policy_details: updated };
                          });
                        }}
                        disabled={initialData?.docstatus === 1}
                        required
                        className="w-full"
                      />
                    </td>
                    <td className="p-2 border-r border-[var(--border)] align-middle text-center">
                      <div className="flex w-full items-center justify-center rounded text-sm font-semibold text-gray-600 border border-transparent">
                        {detail.max_leaves_allowed !== undefined ? detail.max_leaves_allowed : "-"}
                      </div>
                    </td>
                    <td className="p-2 border-r border-[var(--border)] align-top">
                      <ModalInput
                        label=""
                        type="number"
                        className="no-spinner w-full"
                        value={detail.annual_allocation || ""}
                        placeholder="0"
                        onChange={(e) => {
                          let val = Number(e.target.value);
                          if (val < 0) {
                            showValidationError("Annual allocation cannot be negative.");
                            val = 0;
                          } 
                          else if (!Number.isInteger(val)) {
                            showValidationError("Annual allocation must be a whole number.");
                            val = Math.floor(val);
                          }

                          updateDetailRow(
                            actualIndex,
                            "annual_allocation",
                            val || 0,
                          );
                        }}
                        disabled={initialData?.docstatus === 1}
                      /> 
                    </td>
                    <td className="p-2 text-center align-middle">
                      {initialData?.docstatus !== 1 && (
                        <button
                          type="button"
                          onClick={() => removeDetailRow(actualIndex)}
                          className="p-1.5 text-gray-400 transition hover:text-red-600 rounded"
                          title="Remove Row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })} */}
              {paginatedDetails.map((detail, pageIndex) => {
                const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + pageIndex;
                
                // Dynamically fetch the max limit from our loaded leave types array for view mode
                const matchedLeaveType = availableLeaveTypes.find(lt => lt.name === detail.leave_type);
                const displayMax = matchedLeaveType?.max_leaves_allowed ?? detail.max_leaves_allowed;
                
                return (
                  <tr key={actualIndex} className="bg-white">
                    <td 
                      className="p-2 border-r border-[var(--border)] align-top"
                      onClick={fetchLatestLeaveTypes}
                    >
                      <LeaveTypeSelect
                        label=""
                        value={detail.leave_type}
                        onChange={(type: any) => {
                          // Correctly narrow the type to string to satisfy TypeScript
                          const typeName = typeof type === "string" ? type : (type?.name || "");
                          const selectedLeaveType = availableLeaveTypes.find(lt => lt.name === typeName);
                          
                          setForm((prev) => {
                            const updated = [...prev.leave_policy_details];
                            updated[actualIndex] = { 
                              ...updated[actualIndex], 
                              leave_type: typeName as string,
                              max_leaves_allowed: selectedLeaveType ? selectedLeaveType.max_leaves_allowed : 0 
                            };
                            return { ...prev, leave_policy_details: updated };
                          });
                        }}
                        disabled={initialData?.docstatus === 1}
                        required
                        className="w-full"
                      />
                    </td>
                    <td className="p-2 border-r border-[var(--border)] align-middle text-center">
                      <div className="flex w-full items-center justify-center rounded text-sm font-semibold text-gray-600 border border-transparent">
                        {/* Use the dynamically resolved displayMax */}
                        {displayMax !== undefined ? displayMax : "-"}
                      </div>
                    </td>
                    <td className="p-2 border-r border-[var(--border)] align-top">
                      <ModalInput
                        label=""
                        type="number"
                        className="no-spinner w-full"
                        value={detail.annual_allocation || ""}
                        placeholder="0"
                        onChange={(e) => {
                          let val = Number(e.target.value);
                          if (val < 0) {
                            showValidationError("Annual allocation cannot be negative.");
                            val = 0;
                          } 
                          else if (!Number.isInteger(val)) {
                            showValidationError("Annual allocation must be a whole number.");
                            val = Math.floor(val);
                          }

                          updateDetailRow(
                            actualIndex,
                            "annual_allocation",
                            val || 0,
                          );
                        }}
                        disabled={initialData?.docstatus === 1}
                      /> 
                    </td>
                    <td className="p-2 text-center align-middle">
                      {initialData?.docstatus !== 1 && (
                        <button
                          type="button"
                          onClick={() => removeDetailRow(actualIndex)}
                          className="p-1.5 text-gray-400 transition hover:text-red-600 rounded"
                          title="Remove Row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Table Footer: Add Row & Pagination */}
          <div className="flex items-center justify-between bg-white p-3 border-t border-[var(--border)]">
            {initialData?.docstatus !== 1 ? (
              <button
                type="button"
                onClick={addDetailRow}
                className="flex items-center gap-1.5 rounded border border-[var(--border)] bg-white px-3 py-1.5 text-sm font-medium text-main transition hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
                Add Row
              </button>
            ) : <div />}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-gray-500 hover:text-main disabled:opacity-30"
                >
                  Prev
                </button>
                <span className="text-gray-500 font-medium text-xs">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-gray-500 hover:text-main disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </MinimizableModal>
  );
};