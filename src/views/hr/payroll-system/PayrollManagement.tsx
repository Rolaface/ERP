import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  ChevronLeft,
  FileText,
  Users,
  CheckCircle,
  Layers,
  X,
  Download,
  CreditCard,
  ExternalLink,
  Eye,
} from "lucide-react";

import type { PayrollEntry, Employee } from "../../../types/payrolltypes";
import { getAllEmployees, getEmployee } from "../../../api/employeeapi";
import {
  getSalarySlipById,
  getSalarySlips,
  type SalarySlipDetail,
  type SalarySlipListItem,
} from "../../../api/salarySlipApi";

// ── Components ────────────────────────────────────────────────────────────────
import { KPICards } from "./KPICards";
import { EmployeesTab } from "./EntryFormTabs";
import SalaryStructureTab from "../tabs/SalaryStructureTab";
import SalaryStructureAssignmentsDashboardTab from "./SalaryStructureAssignmentsDashboardTab";
import PayrollReportsDashboard from "./PayrollReportsDashboard";
import AdditionalSalaryTab from "./AdditionalSalaryTab";

// ── Views ─────────────────────────────────────────────────────────────────────
import EmployeeDetailView from "../EmployeeManagement/EmployeeDetailView";

// ─────────────────────────────────────────────────────────────────────────────
// TOAST NOTIFICATION (inline, lightweight)
// ─────────────────────────────────────────────────────────────────────────────
interface ToastState {
  msg: string;
  type: "success" | "error" | "info";
}

const Toast: React.FC<{ toast: ToastState | null }> = ({ toast }) => {
  if (!toast) return null;
  const colors = {
    success: "bg-success text-white",
    error: "bg-danger  text-white",
    info: "bg-primary text-white",
  };
  return (
    <div
      className={`fixed bottom-5 right-5 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold ${colors[toast.type]} animate-[slideUp_0.2s_ease]`}
    >
      <CheckCircle className="w-4 h-4 shrink-0" />
      {toast.msg}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED BUTTON
// ─────────────────────────────────────────────────────────────────────────────
const Btn: React.FC<{
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "primary" | "outline" | "success" | "ghost";
  size?: "sm" | "md";
  className?: string;
}> = ({
  onClick,
  disabled,
  children,
  icon,
  variant = "primary",
  size = "md",
  className = "",
}) => {
  const v: Record<string, string> = {
    primary: "bg-primary text-white hover:bg-primary/90",
    outline: "bg-card text-main border border-theme hover:bg-muted/5",
    success: "bg-success text-white hover:opacity-90",
    ghost: "text-muted hover:text-main hover:bg-muted/5",
  };
  const s = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-md font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed ${v[variant]} ${s} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TOP NAVIGATION BAR (shared across views)
// ─────────────────────────────────────────────────────────────────────────────
type View =
  | "dashboard"
  | "newEntry"
  | "salaryStructure"
  | "assignments"
  | "reports"
  | "advanceLoan";

type EmployeeApiRow = {
  id?: string;
  employeeId?: string;
  employee_id?: string;
  name?: string;
  email?: string;
  status?: string;
  department?: string;
  jobTitle?: string;
  workLocation?: string;
  grossSalary?: number | string;
};

type EmployeeSummaryApi = {
  totalEmployees?: number | string;
  active?: number | string;
  onLeave?: number | string;
  inactive?: number | string;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

const toCsv = (rows: Array<Record<string, any>>): string => {
  const colSet = new Set<string>();
  rows.forEach((r) => {
    Object.keys(r || {}).forEach((k) => colSet.add(k));
  });
  const cols = Array.from(colSet);

  const esc = (v: unknown) => {
    let s = "";
    if (v === null || v === undefined) {
      s = "";
    } else if (typeof v === "string") {
      s = v;
    } else if (typeof v === "number" || typeof v === "boolean") {
      s = String(v);
    } else {
      try {
        s = JSON.stringify(v) ?? "";
      } catch {
        s = "";
      }
    }
    const needs = /[\n\r,"]/g.test(s);
    const out = s.replace(/"/g, '""');
    return needs ? `"${out}"` : out;
  };

  const header = cols.map(esc).join(",");
  const lines = rows.map((r) => cols.map((c) => esc(r[c])).join(","));
  return [header, ...lines].join("\n");
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const downloadCsv = (filename: string, csvContent: string) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const TopBar: React.FC<{
  view: View;
  setView: (v: View) => void;
  onNewPayroll: () => void;
  totalEmployees?: number;
}> = ({ view, setView, onNewPayroll, totalEmployees }) => {
  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    {
      id: "salaryStructure",
      label: "Salary Structure",
      icon: <Users className="w-3.5 h-3.5" />,
    },
    {
      id: "assignments",
      label: "Salary Assignments",
      icon: <Users className="w-3.5 h-3.5" />,
    },
    {
      id: "advanceLoan",
      label: "Additional Salary",
      icon: <CreditCard className="w-3.5 h-3.5" />,
    },
    {
      id: "reports",
      label: "Reports",
      icon: <FileText className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <header className="h-14 shrink-0 bg-card border-b border-theme px-6 flex items-center justify-between z-30 sticky top-0">
      <div className="flex items-center gap-6">
        {/* Brand */}
        <button
          type="button"
          onClick={() => setView("dashboard")}
          className={`flex items-center gap-2 rounded px-1.5 py-1 transition-colors ${
            view === "dashboard"
              ? "text-primary"
              : "text-main hover:text-primary"
          }`}
        >
          <div className="w-8 h-8 rounded bg-muted/10 text-primary flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-base font-bold">Payroll</span>
        </button>
        <span className="text-border select-none">|</span>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === item.id
                  ? "bg-muted/10 text-primary"
                  : "text-muted hover:text-main hover:bg-muted/5"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {view === "dashboard" && typeof totalEmployees === "number" && (
          <div className="hidden md:flex items-center gap-2 mr-2 px-3 py-1.5 rounded-lg bg-app border border-theme">
            <span className="text-[10px] font-extrabold text-muted uppercase tracking-wider">
              Total Employees
            </span>
            <span className="text-xs font-extrabold text-main tabular-nums">
              {totalEmployees}
            </span>
          </div>
        )}
        {view === "dashboard" && (
          <Btn
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={onNewPayroll}
          >
            New Payroll
          </Btn>
        )}
      </div>
    </header>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW PAYROLL ENTRY — 2-step wizard
// ─────────────────────────────────────────────────────────────────────────────
const NewPayrollEntry: React.FC<{
  employees: Employee[];
  loading?: boolean;
  onBack: () => void;
  onCreatePayroll: (empIds: string[]) => void;
  onViewEmployee: (employeeId: string) => void;
}> = ({ employees, loading, onBack, onCreatePayroll, onViewEmployee }) => {
  const [formData, setFormData] = useState<PayrollEntry>({
    payrollName: "",
    postingDate: new Date().toISOString().slice(0, 10),
    currency: "ZMW",
    company: "Izyane",
    payrollPayableAccount: "Payroll Payable - Izyane - I",
    status: "Draft",
    salarySlipTimesheet: false,
    deductTaxForProof: false,

    payrollFrequency: "Monthly",
    startDate: "",
    endDate: "",
    paymentAccount: "",
    costCenter: "",
    project: "",
    letterHead: "",
    employeeSelectionMode: "multiple",
    selectedEmployees: [],
  });

  const handleFormChange = (field: string, value: any) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  return (
    <div className="h-screen flex flex-col bg-app overflow-hidden">
      {/* Header */}
      <header className="h-12 shrink-0 bg-card border-b border-theme px-5 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            title="Back"
            aria-label="Go back"
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-app text-muted hover:text-main transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-theme opacity-40" />
          <span className="text-sm font-extrabold text-main">
            New Payroll Entry
          </span>
          <span className="text-xs text-muted opacity-60">
            · Fill all details to create a payroll run
          </span>
        </div>
      </header>

      <div className="flex-1 min-h-0 px-6 py-4 flex flex-col">
        <div className="flex-1 min-h-0 bg-card border border-theme rounded-xl overflow-hidden shadow-sm flex flex-col">
          {/* Tab content */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            <EmployeesTab
              data={formData}
              onChange={handleFormChange}
              employees={employees}
              loading={loading}
              onViewEmployee={onViewEmployee}
              onCreatePayroll={() =>
                onCreatePayroll(formData.selectedEmployees)
              }
            />
          </div>

          <div className="shrink-0" />
        </div>
      </div>
    </div>
  );
};

const StatusChip: React.FC<{ status?: string }> = ({ status }) => {
  const raw = String(status ?? "").trim();
  const s = raw.toLowerCase();
  const cls =
    s === "paid" || s === "submitted"
      ? "bg-success/10 text-success border-success/20"
      : s === "draft"
        ? "bg-warning/10 text-warning border-warning/20"
        : "bg-row-hover/40 text-main border-theme";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${cls}`}
    >
      {raw || "—"}
    </span>
  );
};

const derivePayslipStatus = (
  napsaStatus?: string,
  payslipStatus?: string,
): string => {
  const ns = String(napsaStatus ?? "")
    .trim()
    .toLowerCase();

  if (ns === "pending") return "Pending";
  if (ns === "failed") return "Failed";
  if (ns === "approved") return "Submitted";

  return String(payslipStatus ?? "").trim();
};

const getSlipNapsaStatus = (s: unknown): string | undefined => {
  if (!s || typeof s !== "object") return undefined;
  const rec = s as Record<string, unknown>;
  const v =
    rec["custom_napsa_status"] ??
    rec["customNapsaStatus"] ??
    rec["napsaStatus"] ??
    rec["napsa_status"];
  const raw = typeof v === "string" ? v.trim() : "";
  return raw || undefined;
};

type SlipStatusFallback = {
  napsaStatus?: string;
  payslipStatus?: string;
};

const SalarySlipDetailsModal: React.FC<{
  open: boolean;
  slipId: string | null;
  onClose: () => void;
  statusFallback?: SlipStatusFallback | null;
}> = ({ open, slipId, onClose, statusFallback }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SalarySlipDetail | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!open || !slipId) return;
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const resp = await getSalarySlipById(slipId);
        if (!mounted) return;
        setData(resp);
      } catch (error: unknown) {
        if (mounted) {
          setError(getErrorMessage(error, "Failed to load salary slip"));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [open, slipId]);

  if (!open) return null;

  const earningsRaw = data?.earnings;
  const deductionsRaw = data?.deductions;
  const earnings: Array<{ component: string; amount: number }> = Array.isArray(
    earningsRaw,
  )
    ? earningsRaw
    : [];
  const deductions: Array<{ component: string; amount: number }> =
    Array.isArray(deductionsRaw) ? deductionsRaw : [];
  const paySlipUrl = String(
    (data as any)?.custom_slip_url ?? (data as any)?.paySlipUrl ?? "",
  ).trim();
  const referenceNumber = String(
    (data as any)?.custom_reference_number ??
      (data as any)?.referenceNumber ??
      "",
  ).trim();
  const dataRec: Record<string, unknown> =
    data && typeof data === "object"
      ? (data as unknown as Record<string, unknown>)
      : {};
  const pickString = (v: unknown): string | undefined =>
    typeof v === "string" ? v : undefined;
  const modalNapsaStatus =
    pickString(dataRec["napsaStatus"]) ?? pickString(dataRec["napsa_status"]);
  const modalPayslipStatus =
    pickString(dataRec["status"]) ?? pickString(dataRec["payslip_status"]);

  const modalCustomNapsaStatus =
    pickString(dataRec["custom_napsa_status"]) ??
    pickString(dataRec["customNapsaStatus"]);
  const napsaFailMessageRaw =
    pickString(dataRec["napsaFailMessage"]) ??
    pickString(dataRec["napsa_fail_message"]) ??
    pickString(dataRec["custom_napsa_fail_message"]);

  const modalPayslipStatusClean = String(modalPayslipStatus ?? "").trim();
  const useFallbackPayslipStatus =
    !modalPayslipStatusClean ||
    modalPayslipStatusClean.toLowerCase() === "draft";
  const payslipStatusForDerive = useFallbackPayslipStatus
    ? String(statusFallback?.payslipStatus ?? modalPayslipStatusClean).trim()
    : modalPayslipStatusClean;

  const docstatusRaw = dataRec["docstatus"];
  const docstatus =
    typeof docstatusRaw === "number" ? docstatusRaw : Number.NaN;
  const docstatusStatus = Number.isFinite(docstatus)
    ? docstatus === 0
      ? "Draft"
      : docstatus === 1
        ? "Submitted"
        : docstatus === 2
          ? "Cancelled"
          : undefined
    : undefined;

  const statusToShow = derivePayslipStatus(
    modalCustomNapsaStatus ?? modalNapsaStatus ?? statusFallback?.napsaStatus,
    payslipStatusForDerive || docstatusStatus,
  );

  const isNapsaFailed =
    String(
      modalCustomNapsaStatus ??
        modalNapsaStatus ??
        statusFallback?.napsaStatus ??
        "",
    )
      .trim()
      .toLowerCase() === "failed";
  const napsaFailMessage = String(napsaFailMessageRaw ?? "").trim();

  const roInputCls =
    "w-full h-10 px-3 bg-app border border-theme rounded-lg text-sm text-main focus:outline-none";
  const sectionTitleCls =
    "text-[11px] font-extrabold text-muted uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-theme">
        <div className="px-6 py-4 flex items-center justify-between border-b border-theme bg-primary text-white">
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Salary Slip {String((data as any)?.name ?? slipId ?? "")}
            </h3>
            <div className="text-xs text-white/80 mt-1 break-words">
              {String((data as any)?.employee_name ?? "")} (
              {String((data as any)?.employee ?? "")})
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/15 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger font-semibold">
              {error}
            </div>
          )}
          {loading && <div className="text-sm text-muted">Loading...</div>}

          {!loading && data && (
            <>
              {isNapsaFailed && napsaFailMessage ? (
                <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl">
                  <div className="text-xs font-extrabold text-danger uppercase tracking-wider">
                    NAPSA Submission Failed
                  </div>
                  <div className="mt-1 text-sm font-semibold text-danger">
                    {napsaFailMessage}
                  </div>
                </div>
              ) : null}

              <div className="bg-app/30 border border-theme rounded-xl p-6">
                <div className={sectionTitleCls}>Basic Information</div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <div className={sectionTitleCls}>Slip No</div>
                    <input
                      readOnly
                      value={String((data as any)?.name ?? "")}
                      className={roInputCls}
                    />
                  </div>
                  <div>
                    <div className={sectionTitleCls}>Posting Date</div>
                    <input
                      readOnly
                      value={String((data as any)?.posting_date ?? "")}
                      className={roInputCls}
                    />
                  </div>
                  <div>
                    <div className={sectionTitleCls}>Status</div>
                    <div className="mt-1">
                      <StatusChip status={statusToShow} />
                    </div>
                  </div>

                  <div>
                    <div className={sectionTitleCls}>Employee</div>
                    <input
                      readOnly
                      value={String((data as any)?.employee ?? "")}
                      className={roInputCls}
                    />
                  </div>
                  <div>
                    <div className={sectionTitleCls}>Employee Name</div>
                    <input
                      readOnly
                      value={String((data as any)?.employee_name ?? "")}
                      className={roInputCls}
                    />
                  </div>
                  <div>
                    <div className={sectionTitleCls}>Department</div>
                    <input
                      readOnly
                      value={String((data as any)?.department ?? "")}
                      className={roInputCls}
                    />
                  </div>

                  <div>
                    <div className={sectionTitleCls}>NRC</div>
                    <input
                      readOnly
                      value={String((data as any)?.nrc ?? "")}
                      className={roInputCls}
                    />
                  </div>
                  <div>
                    <div className={sectionTitleCls}>SSN</div>
                    <input
                      readOnly
                      value={String((data as any)?.ssn ?? "")}
                      className={roInputCls}
                    />
                  </div>
                  <div>
                    <div className={sectionTitleCls}>Company</div>
                    <input
                      readOnly
                      value={String((data as any)?.company ?? "")}
                      className={roInputCls}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-app/30 border border-theme rounded-xl p-6">
                <div className={sectionTitleCls}>Payroll & Period</div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <div className={sectionTitleCls}>Salary Structure</div>
                    <input
                      readOnly
                      value={String((data as any)?.salary_structure ?? "")}
                      className={roInputCls}
                    />
                  </div>
                  <div>
                    <div className={sectionTitleCls}>Start Date</div>
                    <input
                      readOnly
                      value={String((data as any)?.start_date ?? "")}
                      className={roInputCls}
                    />
                  </div>
                  <div>
                    <div className={sectionTitleCls}>End Date</div>
                    <input
                      readOnly
                      value={String((data as any)?.end_date ?? "")}
                      className={roInputCls}
                    />
                  </div>

                  <div>
                    <div className={sectionTitleCls}>Payroll Entry</div>
                    <input
                      readOnly
                      value={String((data as any)?.payroll_entry ?? "")}
                      className={roInputCls}
                    />
                  </div>
                  <div>
                    <div className={sectionTitleCls}>Currency</div>
                    <input
                      readOnly
                      value={String((data as any)?.currency ?? "")}
                      className={roInputCls}
                    />
                  </div>
                  <div>
                    <div className={sectionTitleCls}>Exchange Rate</div>
                    <input
                      readOnly
                      value={String((data as any)?.exchange_rate ?? "")}
                      className={roInputCls}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-app/30 border border-theme rounded-xl p-6">
                <div className={sectionTitleCls}>Payment Information</div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <div className={sectionTitleCls}>Bank Name</div>
                    <input
                      readOnly
                      value={String((data as any)?.bank_name ?? "")}
                      className={roInputCls}
                    />
                  </div>
                  <div>
                    <div className={sectionTitleCls}>Bank Account No</div>
                    <input
                      readOnly
                      value={String((data as any)?.bank_account_no ?? "")}
                      className={roInputCls}
                    />
                  </div>
                  <div>
                    <div className={sectionTitleCls}>Reference No</div>
                    <input
                      readOnly
                      value={referenceNumber || ""}
                      className={roInputCls}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <div className={sectionTitleCls}>Payslip PDF</div>
                    <div className="mt-2">
                      {paySlipUrl ? (
                        <a
                          href={paySlipUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full inline-flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-theme bg-card text-sm font-semibold text-primary hover:bg-muted/5 transition-colors"
                        >
                          <span>Open Payslip</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <div className="text-sm text-muted">
                          No payslip PDF available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-app/30 border border-theme rounded-xl p-6">
                <div className={sectionTitleCls}>Totals</div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div>
                    <div className={sectionTitleCls}>Gross Pay</div>
                    <input
                      readOnly
                      value={`${String((data as any)?.currency ?? "ZMW")} ${Number((data as any)?.gross_pay ?? 0).toLocaleString("en-ZM")}`}
                      className={roInputCls}
                    />
                  </div>
                  <div>
                    <div className={sectionTitleCls}>Total Deduction</div>
                    <input
                      readOnly
                      value={`${String((data as any)?.currency ?? "ZMW")} ${Number((data as any)?.total_deduction ?? 0).toLocaleString("en-ZM")}`}
                      className={roInputCls}
                    />
                  </div>
                  <div>
                    <div className={sectionTitleCls}>Net Pay</div>
                    <input
                      readOnly
                      value={`${String((data as any)?.currency ?? "ZMW")} ${Number((data as any)?.net_pay ?? 0).toLocaleString("en-ZM")}`}
                      className={roInputCls}
                    />
                  </div>
                  <div>
                    <div className={sectionTitleCls}>Rounded Total</div>
                    <input
                      readOnly
                      value={`${String((data as any)?.currency ?? "ZMW")} ${Number((data as any)?.rounded_total ?? (data as any)?.net_pay ?? 0).toLocaleString("en-ZM")}`}
                      className={roInputCls}
                    />
                  </div>
                  <div className="md:col-span-4">
                    <div className={sectionTitleCls}>Total in Words</div>
                    <input
                      readOnly
                      value={String((data as any)?.total_in_words ?? "")}
                      className={roInputCls}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl overflow-hidden bg-card shadow-sm border border-theme">
                  <div className="px-5 py-4 bg-app border-b border-theme flex items-center justify-between">
                    <div className="text-sm font-extrabold text-main">
                      Earnings
                    </div>
                    <div className="text-sm font-extrabold text-main">
                      {String((data as any)?.currency ?? "ZMW")}{" "}
                      {Number((data as any)?.gross_pay ?? 0).toLocaleString(
                        "en-ZM",
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-card">
                        <tr>
                          <th className="px-5 py-3 text-[11px] font-extrabold text-muted uppercase tracking-wider text-left">
                            Component
                          </th>
                          <th className="px-5 py-3 text-[11px] font-extrabold text-muted uppercase tracking-wider text-right">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {earnings.length === 0 ? (
                          <tr>
                            <td
                              colSpan={2}
                              className="px-5 py-8 text-center text-sm text-muted"
                            >
                              No earnings
                            </td>
                          </tr>
                        ) : (
                          earnings.map((r: any, idx: number) => (
                            <tr
                              key={`${r?.component}-${idx}`}
                              className="border-t border-theme/60"
                            >
                              <td className="px-5 py-3 text-sm font-medium text-main">
                                {String(r?.component ?? "")}
                              </td>
                              <td className="px-5 py-3 text-right text-sm font-semibold text-main tabular-nums">
                                {Number(r?.amount ?? 0).toLocaleString("en-ZM")}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden bg-card shadow-sm border border-theme">
                  <div className="px-5 py-4 bg-app border-b border-theme flex items-center justify-between">
                    <div className="text-sm font-extrabold text-main">
                      Deductions
                    </div>
                    <div className="text-sm font-extrabold text-main">
                      {String((data as any)?.currency ?? "ZMW")}{" "}
                      {Number(
                        (data as any)?.total_deduction ?? 0,
                      ).toLocaleString("en-ZM")}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-card">
                        <tr>
                          <th className="px-5 py-3 text-[11px] font-extrabold text-muted uppercase tracking-wider text-left">
                            Component
                          </th>
                          <th className="px-5 py-3 text-[11px] font-extrabold text-muted uppercase tracking-wider text-right">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {deductions.length === 0 ? (
                          <tr>
                            <td
                              colSpan={2}
                              className="px-5 py-8 text-center text-sm text-muted"
                            >
                              No deductions
                            </td>
                          </tr>
                        ) : (
                          deductions.map((r: any, idx: number) => (
                            <tr
                              key={`${r?.component}-${idx}`}
                              className="border-t border-theme/60"
                            >
                              <td className="px-5 py-3 text-sm font-medium text-main">
                                {String(r?.component ?? "")}
                              </td>
                              <td className="px-5 py-3 text-right text-sm font-semibold text-main tabular-nums">
                                {Number(r?.amount ?? 0).toLocaleString("en-ZM")}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default function PayrollManagement() {
  const [view, setView] = useState<View>("dashboard");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState<string | null>(null);

  const [employeesSummary, setEmployeesSummary] = useState<{
    totalEmployees: number;
    active: number;
    onLeave: number;
    inactive: number;
  } | null>(null);

  const [detailEmployeeId, setDetailEmployeeId] = useState<string | null>(null);

  const [detailEmployee, setDetailEmployee] = useState<any>(null);
  const [detailEmployeeLoading, setDetailEmployeeLoading] = useState(false);
  const [detailEmployeeError, setDetailEmployeeError] = useState<string | null>(
    null,
  );

  const refetchDetailEmployee = useCallback(async () => {
    const id = String(detailEmployeeId ?? "").trim();
    if (!id) return;

    setDetailEmployeeLoading(true);
    setDetailEmployeeError(null);
    try {
      const resp = await getEmployee(id);
      setDetailEmployee(resp);
    } catch (e: any) {
      setDetailEmployee(null);
      setDetailEmployeeError(e?.message || "Failed to load employee details");
    } finally {
      setDetailEmployeeLoading(false);
    }
  }, [detailEmployeeId]);

  useEffect(() => {
    if (!detailEmployeeId) {
      setDetailEmployee(null);
      setDetailEmployeeError(null);
      setDetailEmployeeLoading(false);
      return;
    }

    refetchDetailEmployee();
  }, [detailEmployeeId, refetchDetailEmployee]);

  const [toast, setToast] = useState<ToastState | null>(null);
  const showToast = (msg: string, type: ToastState["type"] = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [lastCreatedPayroll, setLastCreatedPayroll] = useState<{
    createdAtIso: string;
    employees: { id: string; name: string; employeeId?: string }[];
  } | null>(null);

  const [salarySlips, setSalarySlips] = useState<SalarySlipListItem[]>([]);
  const [slipsLoading, setSlipsLoading] = useState(false);
  const [slipsError, setSlipsError] = useState<string | null>(null);
  const [slipsPage, setSlipsPage] = useState(1);
  const [slipsPageSize] = useState(10);
  const [slipsTotalPages, setSlipsTotalPages] = useState(1);
  const [slipDetailsOpen, setSlipDetailsOpen] = useState(false);
  const [slipDetailsId, setSlipDetailsId] = useState<string | null>(null);
  const [slipDetailsStatusFallback, setSlipDetailsStatusFallback] =
    useState<SlipStatusFallback | null>(null);
  const [slipsSearch, setSlipsSearch] = useState("");
  const [slipsMonth, setSlipsMonth] = useState("");

  useEffect(() => {
    setSlipsPage(1);
  }, [slipsSearch]);

  useEffect(() => {
    setSlipsPage(1);
  }, [slipsMonth]);

  const filteredSalarySlips = useMemo(() => {
    const q = String(slipsSearch ?? "")
      .trim()
      .toLowerCase();
    const month = String(slipsMonth ?? "").trim();

    let monthStart: Date | null = null;
    let monthEnd: Date | null = null;
    if (/^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split("-").map((v) => Number(v));
      if (y && m) {
        monthStart = new Date(y, m - 1, 1);
        monthEnd = new Date(y, m, 0);
      }
    }

    return salarySlips.filter((s) => {
      if (monthStart && monthEnd) {
        const sStart = new Date(String(s.start_date));
        const sEnd = new Date(String(s.end_date));
        if (!(sStart <= monthEnd && sEnd >= monthStart)) return false;
      }

      const status = String(s.status ?? "").trim();
      const normalizedStatus = status || "Unknown";
      const hay = [
        String(s.name ?? ""),
        String(s.employee ?? ""),
        String(s.salary_structure ?? ""),
        normalizedStatus,
      ]
        .join(" ")
        .toLowerCase();

      if (!q) return true;
      return hay.includes(q);
    });
  }, [salarySlips, slipsMonth, slipsSearch]);

  useEffect(() => {
    if (!employeesError) return;
    showToast(employeesError, "error");
  }, [employeesError]);

  useEffect(() => {
    if (!slipsError) return;
    showToast(slipsError, "error");
  }, [slipsError]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setSlipsLoading(true);
        setSlipsError(null);

        const month = String(slipsMonth ?? "").trim();
        const monthMode = /^\d{4}-\d{2}$/.test(month);
        const params: { page: number } & Record<string, number> = {
          page: monthMode ? 1 : slipsPage,
        };
        params["page_size"] = monthMode ? 2000 : slipsPageSize;
        const resp = await getSalarySlips(params);
        if (!mounted) return;
        const list = Array.isArray(resp?.salary_slips) ? resp.salary_slips : [];
        setSalarySlips(list);
        setSlipsTotalPages(
          monthMode ? 1 : Number(resp?.pagination?.total_pages ?? 1) || 1,
        );
        if (monthMode) setSlipsPage(1);
      } catch (error: unknown) {
        if (mounted) {
          setSalarySlips([]);
          setSlipsTotalPages(1);
          setSlipsError(getErrorMessage(error, "Failed to load salary slips"));
        }
      } finally {
        if (mounted) {
          setSlipsLoading(false);
        }
      }
    };

    if (view === "dashboard" || view === "reports") {
      void run();
    }
    return () => {
      mounted = false;
    };
  }, [view, slipsMonth, slipsPage, slipsPageSize]);

  useEffect(() => {
    let mounted = true;

    const loadEmployees = async () => {
      setEmployeesLoading(true);
      setEmployeesError(null);
      try {
        const resp = await getAllEmployees(1, 200);
        const responseRecord = asRecord(resp);
        const employeesRaw = responseRecord.employees;
        const summaryRaw = responseRecord.summary;
        const list: EmployeeApiRow[] = Array.isArray(employeesRaw)
          ? employeesRaw.map((row) => asRecord(row) as EmployeeApiRow)
          : [];
        const summary: EmployeeSummaryApi | null = summaryRaw
          ? (asRecord(summaryRaw) as EmployeeSummaryApi)
          : null;

        const mapped: Employee[] = list.map((e) => {
          const status = String(e.status ?? "");
          return {
            id: String(e.id ?? e.employeeId ?? e.employee_id ?? ""),
            employeeId: String(e.employeeId ?? ""),
            name: String(e.name ?? ""),
            email: String(e.email ?? ""),
            status: status || undefined,
            department: String(e.department ?? ""),
            jobTitle: String(e.jobTitle ?? ""),
            workLocation: String(e.workLocation ?? ""),
            grossSalary: Number(e.grossSalary ?? 0),
            isActive: status.toLowerCase() === "active",
          };
        });

        if (!mounted) return;
        setEmployees(mapped.filter((e) => !!e.id));
        setEmployeesSummary(
          summary
            ? {
                totalEmployees: Number(summary?.totalEmployees ?? 0),
                active: Number(summary?.active ?? 0),
                onLeave: Number(summary?.onLeave ?? 0),
                inactive: Number(summary?.inactive ?? 0),
              }
            : null,
        );
      } catch (error: unknown) {
        if (mounted) {
          setEmployeesError(getErrorMessage(error, "Failed to load employees"));
        }
      } finally {
        if (mounted) {
          setEmployeesLoading(false);
        }
      }
    };

    void loadEmployees();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCreatePayroll = (empIds: string[]) => {
    if (!empIds.length) return;

    const createdEmployees = employees
      .filter((e) => empIds.includes(e.id))
      .map((e) => ({ id: e.id, name: e.name, employeeId: e.employeeId }))
      .filter((e) => empIds.includes(e.id))
      .map((e) => ({ id: e.id, name: e.name, employeeId: e.employeeId }))
      .slice(0, 30);

    setLastCreatedPayroll({
      createdAtIso: new Date().toISOString(),
      employees: createdEmployees,
    });

    showToast(
      `Payroll created for ${empIds.length} employee${empIds.length > 1 ? "s" : ""}`,
    );
  };

  const topBarProps = {
    view,
    setView,
    onNewPayroll: () => setView("newEntry"),
    totalEmployees: employeesSummary?.totalEmployees ?? employees.length,
  };

  if (detailEmployeeId) {
    if (detailEmployeeLoading) {
      return (
        <div className="min-h-screen bg-app">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
            <div className="rounded-2xl border border-theme bg-card p-6 text-sm text-muted shadow-sm">
              Loading employee details…
            </div>
          </div>
        </div>
      );
    }

    if (detailEmployeeError) {
      return (
        <div className="min-h-screen bg-app">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
            <div className="rounded-lg border border-danger/30 bg-danger/5 p-6 text-sm font-semibold text-danger">
              {detailEmployeeError}
            </div>
            <div className="mt-4">
              <Btn
                variant="outline"
                size="sm"
                onClick={() => setDetailEmployeeId(null)}
              >
                Back
              </Btn>
            </div>
          </div>
        </div>
      );
    }

    if (!detailEmployee) {
      return (
        <div className="min-h-screen bg-app">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
            <div className="rounded-2xl border border-theme bg-card p-6 text-sm text-muted shadow-sm">
              No employee data.
            </div>
            <div className="mt-4">
              <Btn
                variant="outline"
                size="sm"
                onClick={() => setDetailEmployeeId(null)}
              >
                Back
              </Btn>
            </div>
          </div>
        </div>
      );
    }

    return (
      <EmployeeDetailView
        employee={detailEmployee}
        onBack={() => setDetailEmployeeId(null)}
        onDocumentUploaded={refetchDetailEmployee}
      />
    );
  }

  if (view === "newEntry") {
    return (
      <NewPayrollEntry
        employees={employees}
        loading={employeesLoading}
        onBack={() => setView("dashboard")}
        onCreatePayroll={(ids) => {
          handleCreatePayroll(ids);
          setView("dashboard");
        }}
        onViewEmployee={(id) => setDetailEmployeeId(id)}
      />
    );
  }

  if (view === "salaryStructure") {
    return (
      <div className="h-screen flex flex-col bg-app overflow-hidden">
        <TopBar {...topBarProps} />
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5">
          <SalaryStructureTab />
        </div>
      </div>
    );
  }

  if (view === "assignments") {
    return (
      <div className="h-screen flex flex-col bg-app overflow-hidden">
        <TopBar {...topBarProps} />
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5">
          <SalaryStructureAssignmentsDashboardTab />
        </div>
      </div>
    );
  }

  if (view === "reports") {
    return (
      <div className="h-screen flex flex-col bg-app overflow-hidden">
        <TopBar {...topBarProps} />
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <PayrollReportsDashboard
            slips={filteredSalarySlips}
            loading={slipsLoading}
            error={slipsError}
          />
        </div>
      </div>
    );
  }

  if (view === "advanceLoan") {
    return (
      <div className="h-screen flex flex-col bg-app overflow-hidden">
        <TopBar {...topBarProps} />
        <div className="flex-1 min-h-0 overflow-y-auto w-full">
          <AdditionalSalaryTab />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-app overflow-hidden">
      <Toast toast={toast} />

      <TopBar {...topBarProps} />

      <div className="shrink-0 px-5 pt-4 pb-3">
        <KPICards
          totalEmployees={employeesSummary?.totalEmployees ?? employees.length}
          activeEmployees={
            employeesSummary?.active ??
            employees.filter((e) => e.isActive).length
          }
          inactiveEmployees={
            employeesSummary?.inactive ??
            employees.filter((e) => !e.isActive).length
          }
          onLeaveEmployees={employeesSummary?.onLeave ?? 0}
        />
      </div>

      <div className="flex-1 min-h-0 px-5 pb-4 flex flex-col">
        <div className="flex-1 min-h-0 bg-card border border-theme rounded-2xl overflow-hidden shadow-sm flex flex-col">
          {lastCreatedPayroll && (
            <div className="shrink-0 border-b border-theme bg-app px-5 py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-main">
                  Payroll created for {lastCreatedPayroll.employees.length}{" "}
                  employee{lastCreatedPayroll.employees.length === 1 ? "" : "s"}
                </div>
                <div className="mt-1 text-[11px] text-muted leading-relaxed break-words">
                  {lastCreatedPayroll.employees.map((e, idx) => (
                    <React.Fragment key={e.id}>
                      <span className="font-semibold text-main">
                        {e.name || e.employeeId || e.id}
                      </span>
                      {idx < lastCreatedPayroll.employees.length - 1
                        ? ", "
                        : ""}
                    </React.Fragment>
                  ))}
                  {lastCreatedPayroll.employees.length >= 30 ? "…" : ""}
                </div>
              </div>
              <Btn
                variant="outline"
                size="sm"
                icon={<X className="w-3.5 h-3.5" />}
                onClick={() => setLastCreatedPayroll(null)}
              >
                Clear
              </Btn>
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            <div className="mt-4 rounded-xl overflow-hidden bg-card shadow-sm">
              <div className="px-4 py-3 bg-app border-b border-theme flex items-center justify-between">
                <div>
                  <div className="text-xs font-extrabold text-main uppercase tracking-wide">
                    Salary Slips
                  </div>
                  <div className="text-[11px] text-muted mt-0.5">
                    Latest payroll runs
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="month"
                    value={slipsMonth}
                    onChange={(e) => setSlipsMonth(e.target.value)}
                    aria-label="Filter salary slips by month"
                    title="Filter salary slips by month"
                    className="w-40 px-2.5 py-2 bg-card border border-theme rounded-lg text-xs text-main focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(204,0,0,0.12)] transition"
                  />
                  <Btn
                    variant="outline"
                    size="sm"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => {
                      const rows = filteredSalarySlips.map((s) => ({
                        napsa_status: getSlipNapsaStatus(s) ?? "",
                        slipId: s.name,
                        employee: s.employee,
                        reference_number: s.referenceNumber ?? "",
                        salary_structure: s.salary_structure,
                        start_date: s.start_date,
                        end_date: s.end_date,
                        payslip_status: derivePayslipStatus(
                          getSlipNapsaStatus(s),
                          s.status,
                        ),
                        total_earnings: s.total_earnings,
                        total_deduction: s.total_deduction,
                        net_pay: s.net_pay,
                      }));
                      downloadCsv(
                        `salary_slips_${new Date().toISOString().slice(0, 10)}.csv`,
                        toCsv(rows),
                      );
                    }}
                    disabled={filteredSalarySlips.length === 0 || slipsLoading}
                  >
                    Export CSV
                  </Btn>
                  <input
                    type="text"
                    value={slipsSearch}
                    onChange={(e) => setSlipsSearch(e.target.value)}
                    placeholder="Search slips…"
                    aria-label="Search salary slips"
                    title="Search salary slips"
                    className="w-64 px-2.5 py-2 bg-card border border-theme rounded-lg text-xs text-main placeholder:text-muted focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(204,0,0,0.12)] transition"
                  />
                  <div className="text-xs text-muted whitespace-nowrap">
                    Page {slipsPage} of {slipsTotalPages}
                  </div>
                </div>
              </div>

              {slipsError && (
                <div className="px-4 py-3 bg-danger/10 text-danger text-sm border-b border-theme">
                  {slipsError}
                </div>
              )}

              <div className="overflow-auto">
                <table className="w-full">
                  <thead className="bg-muted/5">
                    <tr>
                      {[
                        "Slip ID",
                        "Employee",
                        "Full Name",
                        "NRC",
                        "SSN",
                        "Reference #",
                        "Start",
                        "End",
                        "Payslip Status",
                        "NAPSA Status",
                        "Net Pay",
                        "",
                      ].map((h, i) => (
                        <th
                          key={String(i)}
                          className={`px-4 py-3 text-xs font-semibold text-muted whitespace-nowrap ${
                            i === 10 ? "text-right" : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {slipsLoading ? (
                      Array.from({ length: 6 }).map((_, skIdx) => (
                        <tr
                          key={`sk-${skIdx}`}
                          className={skIdx % 2 === 1 ? "bg-app" : "bg-card"}
                        >
                          <td className="px-4 py-3">
                            <div className="h-3 w-28 bg-theme/60 rounded animate-pulse" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-3 w-20 bg-theme/60 rounded animate-pulse" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-3 w-32 bg-theme/60 rounded animate-pulse" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-3 w-24 bg-theme/60 rounded animate-pulse" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-3 w-20 bg-theme/60 rounded animate-pulse" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-3 w-24 bg-theme/60 rounded animate-pulse" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-3 w-16 bg-theme/60 rounded animate-pulse" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-3 w-16 bg-theme/60 rounded animate-pulse" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-3 w-28 bg-theme/60 rounded animate-pulse" />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="h-3 w-16 bg-theme/60 rounded animate-pulse ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : filteredSalarySlips.length === 0 ? (
                      <tr>
                        <td
                          colSpan={12}
                          className="px-4 py-10 text-center text-sm text-muted"
                        >
                          {String(slipsSearch ?? "").trim()
                            ? "No matching salary slips"
                            : "No salary slips found"}
                        </td>
                      </tr>
                    ) : (
                      filteredSalarySlips.map((s) => (
                        <tr
                          key={s.name}
                          className={`hover:bg-muted/5 transition-colors`}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-main break-words">
                            {s.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">
                            {s.employee}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">
                            {s.full_name || "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                            {s.nrc || "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                            {s.ssn || "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                            {s.referenceNumber || "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                            {s.start_date}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                            {s.end_date}
                          </td>
                          <td className="px-4 py-3">
                            <StatusChip
                              status={derivePayslipStatus(
                                getSlipNapsaStatus(s),
                                s.status,
                              )}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <StatusChip status={getSlipNapsaStatus(s)} />
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-main tabular-nums">
                            {Number(s.net_pay ?? 0).toLocaleString("en-ZM")}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSlipDetailsId(s.name);
                                setSlipDetailsStatusFallback({
                                  napsaStatus: getSlipNapsaStatus(s),
                                  payslipStatus: s.status,
                                });
                                setSlipDetailsOpen(true);
                              }}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-theme bg-card text-primary hover:bg-row-hover hover:text-primary transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-3 bg-app border-t border-theme flex items-center justify-between">
                <div className="text-xs text-muted">
                  Showing {filteredSalarySlips.length} slips
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSlipsPage((p) => Math.max(1, p - 1))}
                    disabled={slipsPage <= 1}
                    className="px-3 py-2 text-xs font-bold rounded-lg border border-theme bg-card text-main disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSlipsPage((p) => Math.min(slipsTotalPages, p + 1))
                    }
                    disabled={slipsPage >= slipsTotalPages}
                    className="px-3 py-2 text-xs font-bold rounded-lg border border-theme bg-card text-main disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SalarySlipDetailsModal
        open={slipDetailsOpen}
        slipId={slipDetailsId}
        statusFallback={slipDetailsStatusFallback}
        onClose={() => {
          setSlipDetailsOpen(false);
          setSlipDetailsId(null);
          setSlipDetailsStatusFallback(null);
        }}
      />
    </div>
  );
}
