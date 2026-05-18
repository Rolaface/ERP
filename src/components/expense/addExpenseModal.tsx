import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Receipt, Upload, X, FileText } from "lucide-react";
import { useModalStore } from "../../store/modalStore";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import { Button } from "../../components/ui/modal/formComponent";
import { ModalInput } from "../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../components/ui/modal/SearchSelect2";
import { getAllEmployees, getEmployeeById } from "../../api/employeeapi";
import { createExpenseClaim, CreateExpenseClaimPayload, getExpenseCategories,updateExpenseClaim } from "../../api/expenseClaimApi";
import { showApiError } from "../../utils/alert";
import DatePickerInput from "../calendar/DatePickerInput";
const getCurrencyFromStorage = (): string => {
  try {
    const raw = localStorage.getItem("company-info");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed?.state?.baseCurrency ?? "";
  } catch {
    return "";
  }
};


export interface ExpenseFormData {
  claim_title: string;
  id?: string; 
  category: string;
  date_incurred: string;
  amount: number | "";
  employee: string;
  employee_name?: string; 
  expense_approver?: string; 
  receipt: File | null;
  remarks: string;
}

const defaultForm: ExpenseFormData = {
  claim_title: "",
  category: "",
  date_incurred: new Date().toISOString().split("T")[0],
  amount: "",
  employee: "",
  employee_name: "", 
  expense_approver: "",
  receipt: null,
  remarks: "",
};

interface ExpenseModalProps {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: ExpenseFormData) => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  modalId,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const modals = useModalStore((state) => state.modals);
  const modal = useMemo(() => modals.find((m) => m.id === modalId), [modals, modalId]);
  const isEditMode = modal?.isEdit ?? false;
const initialData = modal?.initialData as ExpenseFormData | undefined;


  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [form, setForm] = useState<ExpenseFormData>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [employeeDisplayName, setEmployeeDisplayName] = useState("");
  

useEffect(() => {
  if (isOpen) {
    const data = modal?.initialData as ExpenseFormData | undefined;
    setForm(data ?? defaultForm);
    setErrors({});
    setSelectedEmployee(null);
    setEmployeeDisplayName(data?.employee_name ?? data?.employee ?? "");
  }
}, [isOpen]);

  const reset = () => {
    setForm(defaultForm);
    setErrors({});
    setSelectedEmployee(null);
     setEmployeeDisplayName("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? target.checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors((prev) => ({ ...prev, receipt: "File exceeds 10 MB limit" }));
      return;
    }
    setForm((prev) => ({ ...prev, receipt: file }));
    setErrors((prev) => ({ ...prev, receipt: "" }));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const removeReceipt = () => setForm((prev) => ({ ...prev, receipt: null }));

  const fetchCategories = useCallback(async (search: string) => {
    try {
      const res = await getExpenseCategories(search || undefined);
      const data: { name: string }[] = res?.data ?? [];
      return data.map((opt) => ({ value: opt.name, label: opt.name }));
    } catch(err) {
      showApiError(err);
      return [];
    }
  }, []);

  const fetchEmployees = useCallback(async (search: string) => {
    try {
      const res = await getAllEmployees(1, 50, search);
      const data = res?.results ?? res?.data ?? [];
      return data.map((emp: any) => ({
        value: emp.name,
        label: emp.employee_name,
      }));
    } catch(err) {
      showApiError(err);
      return [];
    }
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.claim_title.trim()) newErrors.claim_title = "Title is required";
    if (!form.category) newErrors.category = "Category is required";
    if (!form.employee) newErrors.employee = "Employee is required";
    if (form.amount === "" || Number(form.amount) < 0)
      newErrors.amount = "Enter a valid amount";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async () => {
  if (!validate()) return;
  setLoading(true);
  try {
    const payload: CreateExpenseClaimPayload = {
      employee: form.employee,
      expense_approver: form.expense_approver?? "", 
      posting_date: new Date().toISOString().split("T")[0],
      currency: getCurrencyFromStorage(),
      exchange_rate: 1,
      expenses: [
        {
          expense_date: form.date_incurred,
          expense_type: form.category,
          description: form.claim_title,
          amount: Number(form.amount),
          sanctioned_amount: Number(form.amount),
          
        },
      ],
      remark: form.remarks,
    };

    if (isEditMode) {
  await updateExpenseClaim(form.id!, payload);
} else {
  await createExpenseClaim(payload);
}
    if (modal?.context?.callback) {
      await modal.context.callback(payload);
    }
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
      onClose={onClose}
      title={isEditMode ? "Edit Expense Claim" : "Expense Claim Form"}
      subtitle={isEditMode ? "Update expense claim" : "Submit a new expense claim"}
      icon={Receipt}
      footer={footer}
      customWidth="46vw"
      height="auto"
    >
      <form onSubmit={(e) => e.preventDefault()} className="h-full flex flex-col">
        <div className="p-4 flex flex-col gap-4">

          <ModalInput
            label="Claim title"
            name="claim_title"
            value={form.claim_title}
            onChange={handleChange}
            error={errors.claim_title}
            required
            placeholder="For example: Client meeting lunch"
          />

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <SearchSelect2
                label="Category"
                required
                value={form.category}
                onChange={(val) => {
                  setForm((prev) => ({ ...prev, category: val || "" }));
                  if (errors.category) setErrors((prev) => ({ ...prev, category: "" }));
                }}
                fetchOptions={fetchCategories}
                placeholder="Select a category"
                error={errors.category}
              />
            </div>
            <div className="col-span-6">
  <div className="flex flex-col gap-1">
    <DatePickerInput
      label="Date incurred"
      name="date_incurred"
      value={form.date_incurred}
      onChange={(name, value) => {
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors.date_incurred) setErrors((prev) => ({ ...prev, date_incurred: "" }));
      }}
    />
    {errors.date_incurred && (
      <span className="text-danger text-[10px]">{errors.date_incurred}</span>
    )}
  </div>
</div>
          </div>

          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-6">
              <SearchSelect2
                label="Employee"
                required
                value={employeeDisplayName}
onChange={async (val, option) => {
  setForm((prev) => ({ ...prev, employee: val || "", expense_approver: "" }));
  setEmployeeDisplayName(option?.label || "");
  if (errors.employee) setErrors((prev) => ({ ...prev, employee: "" }));
  if (val) {
    try {
      const employee = await getEmployeeById(val);
      setSelectedEmployee(employee);
      setForm((prev) => ({
        ...prev,
        expense_approver: employee?.message?.data?.expense_approver ?? "",
      }));
    } catch (err) {
      showApiError(err);
      setSelectedEmployee(null);
    }
  } else {
    setSelectedEmployee(null);
  }
}}
                fetchOptions={fetchEmployees}
                placeholder="Select the employee"
                error={errors.employee}
              />
            </div>
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
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Upload Receipt
            </label>
            {form.receipt ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--border)]/10">
                <FileText size={16} className="text-primary shrink-0" />
                <span className="text-sm text-main truncate flex-1">{form.receipt.name}</span>
                <span className="text-xs text-muted shrink-0">
                  {(form.receipt.size / 1024).toFixed(0)} KB
                </span>
                <button type="button" onClick={removeReceipt} className="text-muted hover:text-danger ml-1">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed
                  py-6 cursor-pointer transition-colors
                  ${isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-[var(--border)] hover:border-primary/50 bg-[var(--border)]/10"
                  }
                `}
              >
                <Upload size={22} className="text-muted" />
                <p className="text-sm text-muted">
                  Drag and drop a file, or{" "}
                  <span className="text-primary font-medium cursor-pointer">Browse</span>
                </p>
                <p className="text-xs text-muted">Max file size is 10MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            {errors.receipt && <p className="text-xs text-danger mt-1">{errors.receipt}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Remarks (optional)
            </label>
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              rows={3}
              placeholder="Add any context for the approver"
              className="
                w-full rounded-lg border border-[var(--border)] bg-transparent
                px-3 py-2 text-sm text-main placeholder:text-muted
                focus:outline-none focus:ring-1 focus:ring-primary resize-none
              "
            />
          </div>

        </div>
      </form>
    </MinimizableModal>
  );
};

export default ExpenseModal;