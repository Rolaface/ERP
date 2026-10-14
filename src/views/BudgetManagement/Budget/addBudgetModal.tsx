import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Upload, FileText, X, PiggyBank } from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import ModalFooter from "../../../components/common/ModalFooter";
import { ModalInput } from "../../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import DatePickerInput from "../../../components/calendar/DatePickerInput";
import { useUnsavedChangesGuard } from "../../../hooks/useUnsavedChangesGuard";
import { showApiError } from "../../../utils/alert";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BudgetFormData {
  id?: string;
  budget_name: string;                
  financial_year: string;                                 
  period: string;
  amount: number | "";
  department: string;
  cost_center: string;
  date: string;
  description: string;
  attachments: File[];
}                           

const today = () => new Date().toISOString().split("T")[0];                                                                           

const defaultBudgetForm: BudgetFormData = {
  budget_name: "",
  financial_year: "",
  period: "",
  amount: "",
  department: "",                            
  cost_center: "",
  date: today(),
  description: "",
  attachments: [],
};

interface BudgetModalProps {
  modalId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: BudgetFormData) => void;
  isEdit?: boolean;
  initialData?: Partial<BudgetFormData>;
}
// ─── Static options ───────────────────────────────────────────────────────────

const PERIOD_OPTIONS = ["Monthly", "Quarterly", "Half-Yearly", "Yearly"];

// Current year and the next one, e.g. "2026-27", "2027-28"
const buildFinancialYears = () => {
  const start = new Date().getFullYear();
  return [start, start + 1].map((y) => `${y}-${String((y + 1) % 100).padStart(2, "0")}`);
};

const filterStatic = (list: string[], search: string) =>
  list
    .filter((o) => o.toLowerCase().includes((search || "").toLowerCase()))
    .map((o) => ({ value: o, label: o }));

// ─── Modal ────────────────────────────────────────────────────────────────────

export const BudgetModal: React.FC<BudgetModalProps> = ({
  modalId,
  isOpen,
  onClose,
  onSuccess,
  isEdit = false,
  initialData,
}) => {
  const resolvedModalId = useMemo(
    () => modalId || `budget-form-${Date.now()}`,
    [modalId],
  );
  const isEditMode = isEdit;
  const { markDirty, resetDirty, handleCloseWithConfirm } =
    useUnsavedChangesGuard();

  const [form, setForm] = useState<BudgetFormData>(defaultBudgetForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Display labels for the select fields (SearchSelect2 shows the label)
  const [departmentLabel, setDepartmentLabel] = useState("");
  const [costCenterLabel, setCostCenterLabel] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const data = initialData as any;
    setForm(
      data
        ? { ...defaultBudgetForm, ...data, attachments: data.attachments ?? [] }
        : defaultBudgetForm,
    );
    setDepartmentLabel(data?.department ?? "");
    setCostCenterLabel(data?.cost_center ?? "");
    setErrors({});
  }, [isOpen]);

  const reset = () => {
    setForm(defaultBudgetForm);
    setDepartmentLabel("");
    setCostCenterLabel("");
    setErrors({});
    resetDirty();
  };

  // ── Field handlers ─────────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    markDirty();
  };

  const setField = (name: keyof BudgetFormData, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    markDirty();
  };

  // ── Attachment (placeholder: files are only held in state) ────────────────
  const handleFile = (files: FileList | null) => {
    if (!files) return;
    const valid: File[] = [];
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          attachment: `"${file.name}" exceeds 10 MB limit`,
        }));
      } else {
        valid.push(file);
      }
    });
    if (valid.length) {
      setForm((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...valid],
      }));
      setErrors((prev) => ({ ...prev, attachment: "" }));
      markDirty();
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer.files);
  };

  const removeAttachment = (index: number) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  // ── Option fetchers ────────────────────────────────────────────────────────
  const fetchFinancialYears = useCallback(
    async (search: string) => filterStatic(buildFinancialYears(), search),
    [],
  );

  const fetchPeriods = useCallback(
    async (search: string) => filterStatic(PERIOD_OPTIONS, search),
    [],
  );

  // TODO: replace with real API calls (e.g. getAllDepartments / getAllCostCenters)
  const fetchDepartments = useCallback(async (_search: string) => {
    try {
      return [] as { value: string; label: string }[];
    } catch (err) {
      showApiError(err);
      return [];
    }
  }, []);

  const fetchCostCenters = useCallback(async (_search: string) => {
    try {
      return [] as { value: string; label: string }[];
    } catch (err) {
      showApiError(err);
      return [];
    }
  }, []);

  // ── Validate + submit ──────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.budget_name.trim()) e.budget_name = "Budget name is required";
    if (!form.financial_year) e.financial_year = "Financial year is required";
    if (!form.period) e.period = "Period is required";
    if (form.amount === "" || Number(form.amount) <= 0)
      e.amount = "Enter an amount greater than 0";
    if (!form.cost_center) e.cost_center = "Cost center is required";
    if (!form.date) e.date = "Date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // TODO: call create/update budget API here, then upload attachments.
      //   isEditMode ? await updateBudget(form.id!, payload) : await createBudget(payload)

         onSuccess?.({ ...form });
      reset();
      onClose();
    } catch (err) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

    const footer = (
    <ModalFooter
      onCancel={onClose}
      onReset={reset}
      onSubmit={handleSubmit}
      currentTab={0}
      totalTabs={1}
      isSubmitting={loading}
      submitLabel={isEditMode ? "Update Budget" : "Create Budget"}
    />
  );


  return (
    <MinimizableModal
            modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      title={isEditMode ? "Edit Budget" : "Add Budget"}
      subtitle={
        isEditMode
          ? "Edit and manage budget details"
          : "Create a budget for a cost center"
      }
      icon={PiggyBank}
      footer={footer}
      customWidth="46vw"
      height="90vh"
    >
      <form
        onSubmit={(e) => e.preventDefault()}
        className="h-full flex flex-col"
      >
        <div className="px-4 pb-4 pt-2 flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
          {/* Budget name + date */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8">
              <ModalInput
                label="Budget name"
                name="budget_name"
                value={form.budget_name}
                onChange={handleChange}
                error={errors.budget_name}
                required
                placeholder="For example: Marketing FY budget"
              />
            </div>
            <div className="col-span-4">
              <div className="flex flex-col gap-1">
                <DatePickerInput
                  label="Date"
                  name="date"
                  value={form.date}
                  onChange={(name, value) => setField(name as keyof BudgetFormData, value)}
                />
                {errors.date && (
                  <span className="text-danger text-[10px]">{errors.date}</span>
                )}
              </div>
            </div>
          </div>

          {/* Financial year + period + amount */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <SearchSelect2
                label="Financial year"
                required
                value={form.financial_year}
                onChange={(val) => setField("financial_year", val || "")}
                fetchOptions={fetchFinancialYears}
                placeholder="Select financial year"
                error={errors.financial_year}
              />
            </div>
            <div className="col-span-4">
              <SearchSelect2
                label="Period"
                required
                value={form.period}
                onChange={(val) => setField("period", val || "")}
                fetchOptions={fetchPeriods}
                placeholder="Select period"
                error={errors.period}
              />
            </div>
            <div className="col-span-4">
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

          {/* Department + cost center */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-6">
              <SearchSelect2
                label="Department"
                value={departmentLabel}
                onChange={(val, option) => {
                  setField("department", val || "");
                  setDepartmentLabel(option?.label || "");
                }}
                fetchOptions={fetchDepartments}
                placeholder="Select department"
                error={errors.department}
              />
            </div>
            <div className="col-span-6">
              <SearchSelect2
                label="Cost center"
                required
                value={costCenterLabel}
                onChange={(val, option) => {
                  setField("cost_center", val || "");
                  setCostCenterLabel(option?.label || "");
                }}
                fetchOptions={fetchCostCenters}
                placeholder="Select cost center"
                error={errors.cost_center}
              />
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <label className="block text-xs font-medium text-muted mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Add notes about what this budget covers"
                className="w-full rounded-lg border border-[var(--border)] bg-transparent
                  px-3 py-2 text-sm text-main placeholder:text-muted
                  focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          </div>

          {/* Attachment (placeholder) */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <label className="block text-xs font-medium text-muted mb-1">
                Attachment
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed
                  py-3 cursor-pointer transition-colors
                  ${
                    isDragOver
                      ? "border-primary bg-primary/5"
                      : "border-[var(--border)] hover:border-primary/50 bg-[var(--border)]/10"
                  }`}
              >
                <Upload size={22} className="text-muted" />
                <p className="text-sm text-muted">
                  Drag and drop files, or{" "}
                  <span className="text-primary font-medium">Browse</span>
                </p>
                <p className="text-xs text-muted">Max 10MB per file</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => handleFile(e.target.files)}
              />
              {errors.attachment && (
                <p className="text-xs text-danger mt-1">{errors.attachment}</p>
              )}

              {form.attachments.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  {form.attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--border)]/10"
                    >
                      <FileText size={16} className="text-primary shrink-0" />
                      <span className="text-sm text-main truncate flex-1">
                        {file.name}
                      </span>
                      <span className="text-xs text-muted shrink-0">
                        {(file.size / 1024).toFixed(0)} KB
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-muted hover:text-danger ml-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </MinimizableModal>
  );
};

export default BudgetModal;