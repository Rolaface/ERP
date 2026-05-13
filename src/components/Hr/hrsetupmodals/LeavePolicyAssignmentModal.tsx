// ─── LeavePolicyAssignmentModal.tsx ──────────────────────────────────────────
import React, { useCallback, useEffect, useState } from "react";
import { Link2, Save, X } from "lucide-react";
import { MinimizableModal } from "../../common/MinimizableModal";

import { 
  createLeavePolicyAssignment, 
  updateLeavePolicyAssignment,
  getAllLeavePeriods, 
  getAllLeavePolicies,
  type LeavePolicyAssignment 
} from "../../../api/leaveConfigApi";
import { getAllEmployees, getEmployeeById } from "../../../api/employeeapi";
import { ModalInput, YesNoCheckbox } from "../../../components/ui/modal/modalComponent";
import { showApiError, showSuccess, showValidationError } from "../../../utils/alert";
import PolicySelect from "../../selects/LeavePolicySelect";
import { parseFrappeError } from "../../../views/hr/tabs/leave-config/hooks/parseFrappeError";
import SearchSelect2 from "../../ui/modal/SearchSelect2";
interface Props {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: LeavePolicyAssignment | null;
  onSuccess?: () => void;
}

const EMPTY: LeavePolicyAssignment = {
  employee: "",
  leave_policy: "",
  assignment_based_on: "Leave Period",
  leave_period: "",
  carry_forward: 0,
  docstatus: 1,
};

export const LeavePolicyAssignmentModal: React.FC<Props> = ({
  modalId,
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const isEdit = Boolean(initialData?.name);
  const [form, setForm] = useState<LeavePolicyAssignment>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setForm(
        initialData
          ? {
              employee: initialData.employee ?? "",
              leave_policy: initialData.leave_policy ?? "",
              assignment_based_on: initialData.assignment_based_on ?? "Leave Period",
              leave_period: initialData.leave_period ?? "",
              carry_forward: initialData.carry_forward ?? 0,
              docstatus: initialData.docstatus ?? 0,
            }
          : { ...EMPTY }
      );
    }
  }, [isOpen, initialData]);

  const set = useCallback(
    <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const fetchEmployeesOptions = async (query: string) => {
    try {
      const res = await getAllEmployees(1, 100); 
      const allEmployees = res.data || [];

      const filteredEmployees = query
        ? allEmployees.filter((emp: any) =>
            emp.employee_name?.toLowerCase().includes(query.toLowerCase()) ||
            emp.name?.toLowerCase().includes(query.toLowerCase())
          )
        : allEmployees;

      return filteredEmployees.map((emp: any) => ({
        label: `${emp.employee_name} (${emp.employee_number || emp.name})`,
        value: emp.employee_number || emp.name,
        raw: emp, 
      }));
    } catch (error) {
      showApiError(parseFrappeError(error) || "Failed to fetch leave employees");
      return [];
    }
  };

const fetchLeavePeriodsOptions = async (query: string) => {
    try {
      const res: any = await getAllLeavePeriods(); 
      
      let allPeriods = [];
      if (Array.isArray(res)) allPeriods = res;
      else if (Array.isArray(res?.data)) allPeriods = res.data;
      else if (Array.isArray(res?.data?.data)) allPeriods = res.data.data;
      else if (Array.isArray(res?.message)) allPeriods = res.message;
      else if (Array.isArray(res?.data?.message)) allPeriods = res.data.message;

      const filteredPeriods = query
        ? allPeriods.filter((period: any) =>
            period.name?.toLowerCase().includes(query.toLowerCase())
          )
        : allPeriods;

      return filteredPeriods.map((period: any) => ({
        label: period.name, 
        value: period.name, 
        raw: period,        
      }));
    } catch (error) {
      showApiError(parseFrappeError(error) || "Failed to fetch leave periods");
      return [];
    }
  };
  const handleSave = async () => {
    if (!form.employee.trim()) {
      showValidationError("Employee is required");
      return;
    }
    if (!form.leave_policy.trim()) {
      showValidationError("Leave Policy is required");
      return;
    }
    if (form.assignment_based_on === "Leave Period" && !form.leave_period?.trim()) {
      showValidationError("Leave Period is required when assignment is based on Leave Period");
      return;
    }

    try {
      setSaving(true);
      const payload = { ...form };
      
      if (payload.assignment_based_on === "Joining Date") {
        delete payload.leave_period;
      }

      if (isEdit && initialData?.name) {
        await updateLeavePolicyAssignment(initialData.name, {
          carry_forward: payload.carry_forward,
        });
        showSuccess("Assignment updated successfully");
      } else {
        await createLeavePolicyAssignment(payload);
        showSuccess("Assignment created successfully");
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      showApiError(parseFrappeError(err) || "Failed to save assignment");
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
        {saving ? "Saving…" : isEdit ? "Update Assignment" : "Create Assignment"}
      </button>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Leave Policy Assignment" : "New Leave Policy Assignment"}
      subtitle="Link an Employee to a Leave Policy"
      icon={Link2}
      maxWidth="xl"
      height="auto"
      footer={footer}
    >
      <div className="space-y-5 pb-2">
        <div className="grid grid-cols-2 gap-4">
          {/* <ModalInput
            label="Employee ID"
            value={form.employee}
            onChange={(e) => set("employee", e.target.value)}
            placeholder="e.g. HR-EMP-00001"
            required
            disabled={isEdit} // Core link generally cannot be changed
          /> */}
          <SearchSelect2
  label="Select Employee"
  placeholder="Search by name..."
  value={selectedEmployeeId} 
  fetchOptions={fetchEmployeesOptions}
  onChange={(val, option) => {
    setSelectedEmployeeId(val);
    set("employee", val); 
    console.log("Selected ID:", val);
    console.log("Full Employee Object:", option.raw); 
  }}
  required={true}
/>
          {/* <ModalInput
            label="Leave Policy"
            value={form.leave_policy}
            onChange={(e) => set("leave_policy", e.target.value)}
            placeholder="e.g. HR-LPOL-2026-00001"
            required
            disabled={isEdit}
          /> */}
            
                 <PolicySelect
  label="Leave Policy"
  value={form.leave_policy}
  onChange={(policy) => set("leave_policy", policy.name)}
  disabled={isEdit}
  required
  className="w-full"
/>
        </div>

        <div className="space-y-4 rounded-xl border border-[var(--border)] bg-app p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-sub">
            Assignment Details
          </p>

          <div className="flex flex-col gap-4">
            {/* Custom Select for Assignment Based On */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-main">
                Assignment Based On <span className="text-red-500">*</span>
              </label>
              <select
                value={form.assignment_based_on}
                onChange={(e) => set("assignment_based_on", e.target.value as "Leave Period" | "Joining Date")}
                disabled={isEdit}
                className="w-full rounded-lg border border-[var(--border)] bg-app px-3 py-2 text-sm text-main outline-none transition focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-60"
              >
                <option value="Leave Period">Leave Period</option>
                <option value="Joining Date">Joining Date</option>
              </select>
            </div>

            {form.assignment_based_on === "Leave Period" && (
             <SearchSelect2
        label="Leave Period"
        placeholder="Search leave period (e.g., HR-LPR-...)"
        value={selectedPeriod}
        fetchOptions={fetchLeavePeriodsOptions}
        onChange={(val) => {
          setSelectedPeriod(val);
          set("leave_period", val); 
          console.log("Selected Leave Period Name:", val); 
        }}
        required={true}
      />
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-[var(--border)] bg-app p-4">
          <div className="grid grid-cols-2 gap-y-4 md:grid-cols-2">
            <YesNoCheckbox
              name="carry_forward"
              label="Carry Forward Unused Leaves"
              value={form.carry_forward ? "Y" : "N"}
              onChange={(name, value) => set("carry_forward", value === "Y" ? 1 : 0)}
            />
            
            {/* {!isEdit && (
              <YesNoCheckbox
                name="docstatus"
                label="Submit Immediately"
                value={form.docstatus === 1 ? "Y" : "N"}
                onChange={(name, value) => set("docstatus", value === "Y" ? 1 : 0)}
              />
            )} */}
          </div>
        </div>
      </div>
    </MinimizableModal>
  );
};