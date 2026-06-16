import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Upload,
  X,
  FileText,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useModalStore } from "../../store/modalStore";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import { Button } from "../../components/ui/modal/formComponent";
import { ModalInput } from "../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../components/ui/modal/SearchSelect2";
import {  getEmployeeById } from "../../api/employeeapi";
import EmployeeAdvanceList from "../../views/ExpenseManagement/advanceList";
import { useHRView } from "../../hooks/permission/useHRView";
import { useAuth } from "../../context/AuthContext";
import {
  createExpenseClaim,
  CreateExpenseClaimPayload,
  getExpenseCategories,
  updateExpenseClaim,
  getAdvancesByEmployee,
  getExpenseClaimById,
  type MappedEmployeeAdvance,
  attachDocumentToExpenseClaim,
  getAllEmployees,
} from "../../api/expenseClaimApi";
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
  receipts: File[];
  existingAttachments: {
    name: string;
    file_name: string;
    file_url: string;
    file_size: number;
    file_type: string;
    is_private: number;
  }[];
  remarks: string;
}

export interface AdvanceFormData {
  advance_account: string;
  advance_amount: number | "";
  purpose: string;
  repayment_date: string;
  mode_of_payment: string;
  advance_remarks: string;
}

type ActiveTab = "expense" | "advance";

const defaultExpenseForm: ExpenseFormData = {
  claim_title: "",
  category: "",
  date_incurred: new Date().toISOString().split("T")[0],
  amount: "",
  employee: "",
  employee_name: "",
  expense_approver: "",
  receipts: [],
  existingAttachments: [],
  remarks: "",
};

const defaultAdvanceForm: AdvanceFormData = {
  advance_account: "",
  advance_amount: "",
  purpose: "",
  repayment_date: new Date().toISOString().split("T")[0],
  mode_of_payment: "",
  advance_remarks: "",
};

interface ExpenseModalProps {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: ExpenseFormData) => void;
}

// ─── tab strip ───────────────────────────────────────────────────────────────
interface TabStripProps {
  active: ActiveTab;
  onChange: (tab: ActiveTab) => void;
  advanceBadge?: number;
}

const TabStrip: React.FC<TabStripProps> = ({
  active,
  onChange,
  advanceBadge,
}) => {
  const tabs: { key: ActiveTab; label: string }[] = [
    { key: "expense", label: "Expense" },
    { key: "advance", label: "Advance" },
  ];

  return (
    <div
      className="flex border-b border-[var(--border)]"
      style={{ marginBottom: 0 }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            style={{
              padding: "10px 20px",
              fontSize: "13px",
              fontWeight: isActive ? 600 : 400,
              color: isActive
                ? "var(--color-primary, #4f46e5)"
                : "var(--color-muted)",
              borderBottom: isActive
                ? "2px solid var(--color-primary, #4f46e5)"
                : "2px solid transparent",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              transition: "color 0.15s, border-color 0.15s",
              outline: "none",
              marginBottom: "-1px",
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {tab.label}
            {tab.key === "advance" &&
              advanceBadge !== undefined &&
              advanceBadge > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "18px",
                    height: "18px",
                    padding: "0 4px",
                    borderRadius: "9px",
                    background: "var(--color-primary, #4f46e5)",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: 600,
                    lineHeight: 1,
                  }}
                >
                  {advanceBadge}
                </span>
              )}
          </button>
        );
      })}
    </div>
  );
};

// ─── advance summary banner (shown on Expense tab) ────────────────────────────
interface AdvanceSummaryBannerProps {
  totalAvailable: number;
  totalAllocated: number;
  expenseAmount: number;
  currency: string;
  advanceCount: number;
  onViewAdvances: () => void;
}

const AdvanceSummaryBanner: React.FC<AdvanceSummaryBannerProps> = ({
  totalAvailable,
  totalAllocated,
  expenseAmount,
  currency,
  advanceCount,
  onViewAdvances,
}) => {
  const shortfall = expenseAmount - totalAllocated;
  const isFullyCovered = shortfall <= 0 && totalAllocated > 0;
  const fmt = (n: number) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  if (totalAvailable === 0 || totalAllocated === 0) return null;

  return (
    <div
      style={{
        borderRadius: "8px",
        border: `1px solid ${isFullyCovered ? "var(--color-success-border, #bbf7d0)" : "var(--color-warning-border, #fde68a)"}`,
        background: isFullyCovered
          ? "var(--color-success-bg, #f0fdf4)"
          : "var(--color-warning-bg, #fffbeb)",
        padding: "10px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
      }}
    >
      <div style={{ marginTop: "1px", flexShrink: 0 }}>
        {isFullyCovered ? (
          <CheckCircle2
            size={16}
            style={{ color: "var(--color-success, #16a34a)" }}
          />
        ) : (
          <AlertTriangle
            size={16}
            style={{ color: "var(--color-warning, #d97706)" }}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: isFullyCovered
              ? "var(--color-success, #16a34a)"
              : "var(--color-warning, #d97706)",
            margin: 0,
          }}
        >
          {isFullyCovered
            ? "Fully covered by advances"
            : `Shortfall of ${currency} ${fmt(shortfall)}`}
        </p>
        <p
          style={{
            fontSize: "11px",
            color: "var(--color-muted)",
            margin: "2px 0 0",
          }}
        >
          {currency} {fmt(totalAllocated)} allocated from {advanceCount} advance
          {advanceCount !== 1 ? "s" : ""} · {currency} {fmt(totalAvailable)}{" "}
          total available
        </p>
      </div>
      <button
        type="button"
        onClick={onViewAdvances}
        style={{
          fontSize: "11px",
          fontWeight: 500,
          color: "var(--color-primary, #4f46e5)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 0,
          flexShrink: 0,
          textDecoration: "underline",
          alignSelf: "center",
        }}
      >
        View
      </button>
    </div>
  );
};

// ─── main modal ──────────────────────────────────────────────────────────────
export const ExpenseModal: React.FC<ExpenseModalProps> = ({
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
  const { viewMode } = useHRView();
  const { user } = useAuth();
  const isEmployeeView = viewMode === "employee";


  const [activeTab, setActiveTab] = useState<ActiveTab>("expense");
  const [useAdvance, setUseAdvance] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [form, setForm] = useState<ExpenseFormData>(defaultExpenseForm);
  const [advanceForm, setAdvanceForm] =
    useState<AdvanceFormData>(defaultAdvanceForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [advanceListLoading, setAdvanceListLoading] = useState(false);
  const [employeeDisplayName, setEmployeeDisplayName] = useState("");

  // ── advance list state ────────────────────────────────────────────────────
  const [employeeAdvances, setEmployeeAdvances] = useState<
    MappedEmployeeAdvance[]
  >([]);
  const [advancesFetchLoading, setAdvancesFetchLoading] = useState(false);
  const [advancesFetchError, setAdvancesFetchError] = useState<
    string | undefined
  >();
  const [advanceAllocations, setAdvanceAllocations] = useState<
    Record<string, number>
  >({});


  const currency = getCurrencyFromStorage();

  const advanceSummary = useMemo(() => {
    const totalAvailable = employeeAdvances.reduce(
      (sum, adv) => sum + (adv.unclaimedAmount ?? 0),
      0,
    );
    const totalAllocated = Object.values(advanceAllocations).reduce(
      (sum, v) => sum + v,
      0,
    );
    const expenseAmount = form.amount === "" ? 0 : Number(form.amount);
    const activeAdvanceCount = Object.values(advanceAllocations).filter(
      (v) => v > 0,
    ).length;
    return {
      totalAvailable,
      totalAllocated,
      expenseAmount,
      activeAdvanceCount,
    };
  }, [employeeAdvances, advanceAllocations, form.amount]);
  useEffect(() => {
    if (isOpen) {
      const data = modal?.initialData as any;

      setForm(data ? {
        ...defaultExpenseForm,
        ...data,
        receipts: data.receipts ?? [],
        existingAttachments: data.existingAttachments ?? [],
      } : defaultExpenseForm);
      setAdvanceForm(defaultAdvanceForm);
      setErrors({});
      setSelectedEmployee(null);
      setEmployeeDisplayName(data?.employee_name ?? data?.employee ?? "");
      setActiveTab("expense");

      setEmployeeAdvances([]);
      setAdvancesFetchError(undefined);
      if (data?.advances?.length) {
        const allocations: Record<string, number> = {};

        data.advances.forEach((adv: any) => {
          allocations[adv.employee_advance] = adv.allocated_amount || 0;
        });

        setAdvanceAllocations(allocations);
        setUseAdvance(true);
      } else {
        setAdvanceAllocations({});
        setUseAdvance(false);
      }
      if (data?.employee) {
        fetchAdvancesForEmployee(data.employee);

        if (isEmployeeView) {
          getEmployeeById(data.employee)
            .then((employee) => {
              setSelectedEmployee(employee);

              setForm((prev) => ({
                ...prev,
                expense_approver:
                  employee?.message?.data?.expense_approver ?? "",
              }));
            })
            .catch(() => { });
        }
      }
    }
  }, [isOpen]);

  const reset = () => {
    setForm(defaultExpenseForm);
    setAdvanceForm(defaultAdvanceForm);
    setErrors({});
    setSelectedEmployee(null);
    setEmployeeDisplayName("");
    setActiveTab("expense");
    setUseAdvance(false);
    setAdvanceAllocations({});
    setEmployeeAdvances([]);
    setAdvancesFetchError(undefined);
  };

  const fetchAdvancesForEmployee = useCallback(async (employeeId: string) => {
    setAdvancesFetchLoading(true);
    setAdvancesFetchError(undefined);
    setEmployeeAdvances([]);
    try {
      const mapped = await getAdvancesByEmployee(employeeId);
      setEmployeeAdvances(mapped);
    } catch (err) {
      setAdvancesFetchError("Failed to load advances for this employee.");
    } finally {
      setAdvancesFetchLoading(false);
    }
  }, []);

  // ── expense field handlers ────────────────────────────────────────────────
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
  };

  const handleFile = (files: FileList | null) => {
    if (!files) return;
    const valid: File[] = [];
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          receipt: `"${file.name}" exceeds 10 MB limit`,
        }));
      } else {
        valid.push(file);
      }
    });
    if (valid.length) {
      setForm((prev) => ({ ...prev, receipts: [...prev.receipts, ...valid] }));
      setErrors((prev) => ({ ...prev, receipt: "" }));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer.files);
  };

  const removeNewReceipt = (index: number) => {
    setForm((prev) => ({
      ...prev,
      receipts: prev.receipts.filter((_, i) => i !== index),
    }));
  };

  const removeExistingAttachment = (name: string) => {
    setForm((prev) => ({
      ...prev,
      existingAttachments: prev.existingAttachments.filter(
        (a) => a.name !== name,
      ),
    }));
  };

  const handleAdvanceAllocationChange = (id: string, newAllocated: number) => {
    setAdvanceAllocations((prev) => ({ ...prev, [id]: newAllocated }));
  };

  // ── fetch helpers ─────────────────────────────────────────────────────────
  const fetchCategories = useCallback(async (search: string) => {
    try {
      const res = await getExpenseCategories(search || undefined);
      const data: { name: string }[] = res?.data ?? [];
      return data.map((opt) => ({ value: opt.name, label: opt.name }));
    } catch (err) {
      showApiError(err);
      return [];
    }
  }, []);

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

  const validateExpense = () => {
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
    await handleExpenseSubmit();
  };

  const handleExpenseSubmit = async () => {
    if (!validateExpense()) return;
    setLoading(true);
    try {
      const activeAdvances = Object.entries(advanceAllocations)
        .filter(([, allocated]) => allocated > 0)
        .map(([employee_advance, allocated_amount]) => {
          const advRow = employeeAdvances.find(
            (a) => a.id === employee_advance,
          );
          return {
            employee_advance,
            allocated_amount,
            base_allocated_amount: allocated_amount,
            unclaimed_amount: advRow?.unclaimedAmount,
            advance_paid: advRow?.allocatedAmount ?? allocated_amount,
            posting_date: advRow?.advanceDate ?? "",
            parentfield: "advances",
            parenttype: "Expense Claim",
            doctype: "Expense Claim Advance",
            exchange_rate: 1,
          };
        });

      const payload: CreateExpenseClaimPayload = {
        employee: form.employee,
        expense_approver: form.expense_approver ?? "",
        posting_date: new Date().toISOString().split("T")[0],
        currency: getCurrencyFromStorage(),
        exchange_rate: 1,
        approval_status: "Draft",
        expenses: [
          {
            expense_date: form.date_incurred,
            expense_type: form.category,
            description: form.claim_title,
            amount: Number(form.amount),
            sanctioned_amount: Number(form.amount),
          },
        ],
        ...(useAdvance &&
          activeAdvances.length > 0 && { advances: activeAdvances as any[] }),
        remark: form.remarks,
      };

      let claimId: string;

      if (isEditMode) {
        await updateExpenseClaim(form.id!, payload);
        claimId = form.id!;
      } else {
        const createRes = await createExpenseClaim(payload);
        const rawId = createRes?.name ?? createRes?.data?.name;
        if (!rawId) throw new Error("Could not determine new expense claim ID");
        const fetched = await getExpenseClaimById(rawId);
        claimId = fetched?.name ?? rawId;
      }

      if (form.receipts.length > 0) {
        await Promise.allSettled(
          form.receipts.map((file) =>
            attachDocumentToExpenseClaim(claimId, file).catch((err) => {

            }),
          ),
        );
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
      title={isEditMode ? "Edit Expense Claim" : " Add Expense Claim"}
      subtitle={
        isEditMode ? "Update expense claim" : "Submit a new expense claim"
      }
      icon={CreditCard}
      footer={footer}
      customWidth="46vw"
      height="460px"
    >
      <form
        onSubmit={(e) => e.preventDefault()}
        className="h-full flex flex-col"
      >
        {/* ── tab strip ── */}
        <div className="px-4 pt-0">
          <TabStrip
            active={activeTab}
            onChange={setActiveTab}
            advanceBadge={useAdvance ? advanceSummary.activeAdvanceCount : 0}
          />
        </div>

        {activeTab === "expense" && (
          <div
            className="px-4 pb-4 pt-2 flex flex-col gap-4 overflow-y-auto"
            style={{ height: "360px" }}
          >
<div className="grid grid-cols-12 gap-4">
              <div className="col-span-6">
                <ModalInput
                  label="Claim title"
                  name="claim_title"
                  value={form.claim_title}
                  onChange={handleChange}
                  error={errors.claim_title}
                  required
                  placeholder="For example: Client meeting lunch"
                />
              </div>
              <div className="col-span-6">
                <div className="flex flex-col gap-1">
                  <DatePickerInput
                    label="Date incurred"
                    name="date_incurred"
                    value={form.date_incurred}
                    disableFuture
                    onChange={(name, value) => {
                      setForm((prev) => ({ ...prev, [name]: value }));
                      if (errors.date_incurred)
                        setErrors((prev) => ({ ...prev, date_incurred: "" }));
                    }}
                  />
                  {errors.date_incurred && (
                    <span className="text-danger text-[10px]">
                      {errors.date_incurred}
                    </span>
                  )}
                </div>
              </div>

            </div>

            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                {isEmployeeView ? (
                  <ModalInput
                    label="Employee"
                    value={employeeDisplayName}
                    disabled
                  />
                ) : (
                  <SearchSelect2
                    label="Employee"
                    required
                    value={employeeDisplayName}
                    onChange={async (val, option) => {
                      setForm((prev) => ({
                        ...prev,
                        employee: val || "",
                        expense_approver: "",
                      }));

                      setEmployeeDisplayName(option?.label || "");

                      if (errors.employee)
                        setErrors((prev) => ({
                          ...prev,
                          employee: "",
                        }));

                      setEmployeeAdvances([]);
                      setAdvanceAllocations({});
                      setAdvancesFetchError(undefined);

                      if (val) {
                        try {
                          const [employee] = await Promise.all([
                            getEmployeeById(val),
                            fetchAdvancesForEmployee(val),
                          ]);

                          setSelectedEmployee(employee);

                          setForm((prev) => ({
                            ...prev,
                            expense_approver:
                              employee?.message?.data?.expense_approver ?? "",
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
                )}
              </div>
                            <div className="col-span-4">
                <SearchSelect2
                  label="Category"
                  required
                  value={form.category}
                  onChange={(val) => {
                    setForm((prev) => ({ ...prev, category: val || "" }));
                    if (errors.category)
                      setErrors((prev) => ({ ...prev, category: "" }));
                  }}
                  fetchOptions={fetchCategories}
                  placeholder="Select a category"
                  error={errors.category}
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

            {form.employee && employeeAdvances.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={useAdvance}
                  
onClick={() => {
  const next = !useAdvance;
  setUseAdvance(next);
  if (!next) {
    const cleared: Record<string, number> = {};
    employeeAdvances.forEach((a) => { cleared[a.id] = 0; });
    setAdvanceAllocations(cleared);
  } else {

    const expAmt = form.amount === "" ? 0 : Number(form.amount);
    const autoAlloc: Record<string, number> = {};
    let remaining = expAmt;
    const sorted = [...employeeAdvances].sort((a, b) =>
      (a.advanceDate ?? "").localeCompare(b.advanceDate ?? "")
    );
    for (const adv of sorted) {
      autoAlloc[adv.id] = 0;
    }
    for (const adv of sorted) {
      if (remaining <= 0) break;
      const available = adv.unclaimedAmount ?? 0;
      const allocated = Math.min(available, remaining);
      autoAlloc[adv.id] = allocated;
      remaining -= allocated;
    }
    setAdvanceAllocations(autoAlloc);
    setActiveTab("advance");
  }
}}
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "4px",
                    border: `2px solid ${useAdvance ? "var(--color-primary, #4f46e5)" : "var(--border-color, #d1d5db)"}`,
                    background: useAdvance
                      ? "var(--color-primary, #4f46e5)"
                      : "transparent",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {useAdvance && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path
                        d="M1 3.5L3.5 6L8 1"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
                <label
                  className="text-xs font-medium text-main cursor-pointer select-none"
                  onClick={() => {
  const next = !useAdvance;
  setUseAdvance(next);
  if (!next) {
    const cleared: Record<string, number> = {};
    employeeAdvances.forEach((a) => { cleared[a.id] = 0; });
    setAdvanceAllocations(cleared);
  } else {
    const expAmt = form.amount === "" ? 0 : Number(form.amount);
    const sorted = [...employeeAdvances].sort((a, b) =>
      (a.advanceDate ?? "").localeCompare(b.advanceDate ?? ""),
    );
    const autoAlloc: Record<string, number> = {};
    for (const adv of sorted) { autoAlloc[adv.id] = 0; }
    let remaining = expAmt;
    for (const adv of sorted) {
      if (remaining <= 0) break;
      const allocated = Math.min(adv.unclaimedAmount ?? 0, remaining);
      autoAlloc[adv.id] = allocated;
      remaining -= allocated;
    }
    setAdvanceAllocations(autoAlloc);
    setActiveTab("advance");
  }
}}
                >
                  Settle Against Advance
                </label>
                {advancesFetchLoading && (
                  <span className="text-[11px] text-muted ml-1">
                    Loading advances…
                  </span>
                )}
              </div>
            )}

            {/* ── advance summary banner (only when toggled on and allocations exist) ── */}
            {useAdvance &&
              form.employee &&
              !advancesFetchLoading &&
              advanceSummary.totalAvailable > 0 &&
              advanceSummary.totalAllocated > 0 &&
              form.amount !== "" &&
              Number(form.amount) > 0 && (
                <AdvanceSummaryBanner
                  totalAvailable={advanceSummary.totalAvailable}
                  totalAllocated={advanceSummary.totalAllocated}
                  expenseAmount={advanceSummary.expenseAmount}
                  currency={currency}
                  advanceCount={advanceSummary.activeAdvanceCount}
                  onViewAdvances={() => setActiveTab("advance")}
                />
              )}
              
           <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12">
                <label className="block text-xs font-medium text-muted mb-1">
                  Description
                </label>
                <textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Add any context for the approver"
                  className="w-full rounded-lg border border-[var(--border)] bg-transparent
                    px-3 py-2 text-sm text-main placeholder:text-muted
                    focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>


        {/* receipt upload */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12">
              <label className="block text-xs font-medium text-muted mb-1">
                Upload Receipt
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
                  py-1 cursor-pointer transition-colors
                  ${isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-[var(--border)] hover:border-primary/50 bg-[var(--border)]/10"
                  }`}
              >
                <Upload size={22} className="text-muted" />
                <p className="text-sm text-muted">
                  Drag and drop files, or{" "}
                  <span className="text-primary font-medium cursor-pointer">
                    Browse
                  </span>
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
              {errors.receipt && (
                <p className="text-xs text-danger mt-1">{errors.receipt}</p>
              )}

              {form.existingAttachments.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  {form.existingAttachments.map((att) => (
                    <div
                      key={att.name}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--border)]/10"
                    >
                      <FileText size={16} className="text-primary shrink-0" />
                      <span className="text-sm text-main truncate flex-1">
                        {att.file_name}
                      </span>
                      <span className="text-xs text-muted shrink-0">
                        {(att.file_size / 1024).toFixed(0)} KB
                      </span>
                      
                        <a
                        href={att.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline shrink-0"
                      >
                        View
                      </a>
                      <button
                        type="button"
                        onClick={() => removeExistingAttachment(att.name)}
                        className="text-muted hover:text-danger ml-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {form.receipts.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  {form.receipts.map((file, index) => (
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
                        onClick={() => removeNewReceipt(index)}
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
        )}

        {activeTab === "advance" && (
          <div className="p-4 overflow-y-auto" style={{ height: "360px" }}>
            {!form.employee ? (
              <div className="flex items-center justify-center h-full text-muted">
                <span className="text-sm">
                  Select an employee in the Expense tab to view advances.
                </span>
              </div>
            ) : (
              <EmployeeAdvanceList
                advances={employeeAdvances}
                loading={advancesFetchLoading}
                fetchError={advancesFetchError}
                onRetry={() => fetchAdvancesForEmployee(form.employee)}
                onAllocationChange={handleAdvanceAllocationChange}
                onLoadingChange={setAdvanceListLoading}
                allocations={advanceAllocations}
                expenseAmount={form.amount === "" ? 0 : Number(form.amount)}
              />
            )}
          </div>
        )}
      </form>
    </MinimizableModal>
  );
};

export default ExpenseModal;
