import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Wallet } from "lucide-react";
import { useModalStore } from "../../store/modalStore";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import { Button } from "../../components/ui/modal/formComponent";
import { ModalInput } from "../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../components/ui/modal/SearchSelect2";
import { showApiError } from "../../utils/alert";
import DatePickerInput from "../calendar/DatePickerInput";
import { getAllModeOfPayment } from "../../api/BankAccountApi";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import {
  getAdvanceGLAccounts,
  createEmployeeAdvance,
  updateEmployeeAdvance,
  getAllEmployees,
  type CreateEmployeeAdvancePayload,
} from "../../api/expenseClaimApi";

import { cleanGLNameList ,getGLNameWithoutAbbreviation} from "../../api/utils/glAccountUtils";
export interface EmployeeAdvanceFormData {
  id?: string;
  posting_date: string;
  employee: string;
  employee_name?: string;
  purpose: string;
  amount: number | "";
  advance_account: string;
  payment_mode: string;
  repay_unclaimed_from_salary: boolean;
}

const defaultForm: EmployeeAdvanceFormData = {
  posting_date: new Date().toISOString().split("T")[0],
  employee: "",
  employee_name: "",
  purpose: "",
  amount: "",
  advance_account: "",
  payment_mode: "",
  repay_unclaimed_from_salary: false,
};

interface EmployeeAdvanceModalProps {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: EmployeeAdvanceFormData) => void;
}

export const EmployeeAdvanceModal: React.FC<EmployeeAdvanceModalProps> = ({
  modalId,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const modals = useModalStore((state) => state.modals);
  const modal = useMemo(
    () => modals.find((m) => m.id === modalId),
    [modals, modalId],
  );
  const isEditMode = modal?.isEdit ?? false;
  const { markDirty, resetDirty, handleCloseWithConfirm } =
    useUnsavedChangesGuard();

  const [form, setForm] = useState<EmployeeAdvanceFormData>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [employeeDisplayName, setEmployeeDisplayName] = useState("");
  const [advanceAccountDisplay, setAdvanceAccountDisplay] = useState("");
  useEffect(() => {
    if (isOpen) {
      const data = modal?.initialData as EmployeeAdvanceFormData | undefined;
      setForm(data ?? defaultForm);
      setErrors({});
      setEmployeeDisplayName(data?.employee_name ?? data?.employee ?? "");
      setAdvanceAccountDisplay(getGLNameWithoutAbbreviation(data?.advance_account ?? ""));  // add this

    }

  }, [isOpen]);

  const reset = () => {
    setForm(defaultForm);
    setErrors({});
    setEmployeeDisplayName("");
    setAdvanceAccountDisplay("")
    resetDirty();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? target.checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    markDirty();
  };

  const fetchEmployees = useCallback(async (search: string) => {
    try {
      const data = await getAllEmployees(search);
      return data.map((emp: any) => ({
        value: emp.value,
        label: emp.label,
      }));
    } catch (err) {
      showApiError(err);
      return [];
    }
  }, []);
  const fetchPaymentModes = useCallback(async (search: string) => {
    try {
      const res = await getAllModeOfPayment(1, 50, search || undefined, 1);
      return res.data.map((mode: { name: string }) => ({
        value: mode.name,
        label: mode.name,
      }));
    } catch (err) {
      showApiError(err);
      return [];
    }
  }, []);

  const fetchAdvanceAccounts = useCallback(async (search: string) => {
    try {
      const res = await getAdvanceGLAccounts(search || undefined);

      return cleanGLNameList(res.map((acc) => ({
        value: acc.value,
        label: acc.label,
      })),
        "label"
      );
    } catch (err) {
      showApiError(err);
      return [];
    }
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.posting_date) newErrors.posting_date = "Posting date is required";
    if (!form.employee) newErrors.employee = "Employee is required";
    if (!form.purpose.trim()) newErrors.purpose = "Purpose is required";
    if (form.amount === "" || Number(form.amount) <= 0)
      newErrors.amount = "Enter a valid amount";
    if (!form.advance_account)
      newErrors.advance_account = "Advance account is required";
    if (!form.payment_mode) newErrors.payment_mode = "Payment mode is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: CreateEmployeeAdvancePayload = {
        posting_date: form.posting_date,
        employee: form.employee,
        employee_name: form.employee_name ?? employeeDisplayName,
        purpose: form.purpose,
        advance_amount: Number(form.amount),
        advance_account: form.advance_account,
        mode_of_payment: form.payment_mode,
        repay_unclaimed_amount_from_salary: form.repay_unclaimed_from_salary
          ? 1
          : 0,
      };

      if (isEditMode) {
        await updateEmployeeAdvance(form.id!, payload);
      } else {
        await createEmployeeAdvance(payload);
      }

      if (modal?.context?.onSuccess) await modal.context.onSuccess(payload);
      if (modal?.context?.callback) await modal.context.callback(payload);
      onSubmit?.({ ...form });
      reset();
      onClose();
    } catch (err) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit} loading={loading}>
        {isEditMode ? "Update" : "Submit"}
      </Button>
    </>
  );

  if (!modal) return null;

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, modalId)}
      title={isEditMode ? "Edit Employee Advance" : " Add Employee Advance"}
      subtitle={
        isEditMode
          ? "Edit and manage employee advance details"
          : "Add and manage employee advances"
      }
      icon={Wallet}
      footer={footer}
      customWidth="46vw"
      height="auto"
    >
      <form
        onSubmit={(e) => e.preventDefault()}
        className="h-full flex flex-col"
      >
        <div className="p-4 flex flex-col gap-4">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <div className="flex flex-col gap-1">
                <DatePickerInput
                  label="Posting Date"
                  name="posting_date"
                  value={form.posting_date}
                  disableFuture
                  onChange={(name, value) => {
                    setForm((prev) => ({ ...prev, [name]: value }));
                    if (errors.posting_date)
                      setErrors((prev) => ({ ...prev, posting_date: "" }));
                    markDirty();
                  }}
                />
                {errors.posting_date && (
                  <span className="text-danger text-[10px]">
                    {errors.posting_date}
                  </span>
                )}
              </div>
            </div>
            <div className="col-span-6">
              <SearchSelect2
                label="Employee"
                required
                value={employeeDisplayName}
                onChange={(val, option) => {
                  setForm((prev) => ({ ...prev, employee: val || "", employee_name: option?.label || "" }));
                  setEmployeeDisplayName(option?.label || "");
                  markDirty();
                  if (errors.employee) setErrors((prev) => ({ ...prev, employee: "" }));
                }}
                fetchOptions={fetchEmployees}
                placeholder="Select the employee"
                error={errors.employee}
              />
            </div>
          </div>

          {/* Row 2: Purpose */}
          <ModalInput
            label="Purpose"
            name="purpose"
            value={form.purpose}
            onChange={handleChange}
            error={errors.purpose}
            required
            placeholder="e.g. Travel expenses for site visit"
          />

          {/* Row 3: Amount + Advance Account */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <ModalInput
                label="Amount"
                name="amount"
                type="number"
                value={form.amount}
                onChange={handleChange}
                error={errors.amount}
                required
                placeholder="0.00"
                className="no-spinner"
              />
            </div>
            <div className="col-span-6">
              <SearchSelect2
                label="Advance Account"
                required
                value={advanceAccountDisplay}
                onChange={(val, option) => {
                  setForm((prev) => ({ ...prev, advance_account: val || "" }));
                  setAdvanceAccountDisplay(getGLNameWithoutAbbreviation(option?.label || val || ""));
                  if (errors.advance_account) setErrors((prev) => ({ ...prev, advance_account: "" }));
                  markDirty();
                }}
                fetchOptions={fetchAdvanceAccounts}
                placeholder="Select advance account"
                error={errors.advance_account}
              />
            </div>
          </div>

          {/* Row 4: Payment Mode */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <SearchSelect2
                label="Payment Mode"
                required
                value={form.payment_mode}
                onChange={(val) => {
                  setForm((prev) => ({ ...prev, payment_mode: val || "" }));
                  if (errors.payment_mode)
                    setErrors((prev) => ({ ...prev, payment_mode: "" }));
                  markDirty();
                }}
                fetchOptions={fetchPaymentModes}
                placeholder="Select payment mode"
                error={errors.payment_mode}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <input
              id="repay_unclaimed_from_salary"
              name="repay_unclaimed_from_salary"
              type="checkbox"
              checked={form.repay_unclaimed_from_salary}
              onChange={handleChange}
              className="
                w-4 h-4 rounded border border-[var(--border)]
                accent-primary cursor-pointer shrink-0
              "
            />
            <label
              htmlFor="repay_unclaimed_from_salary"
              className="text-sm text-main cursor-pointer select-none"
            >
              Repay unclaimed amount from salary
            </label>
          </div>
        </div>
      </form>
    </MinimizableModal>
  );
};

export default EmployeeAdvanceModal;
