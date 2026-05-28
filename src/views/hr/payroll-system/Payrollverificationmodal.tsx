import React, { useState, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  ChevronUp,
  ChevronDown,
  Search,
  X,
  ShieldCheck,
  ShieldAlert,
  FileSpreadsheet,
  Trash2,
  Edit2,
} from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";

import { Button } from "../../../components/ui/modal/formComponent";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VerificationEmployee {
  id: string;
  name: string;
  designation: string;
  department: string;
  basic: number;
  hra: number;
  allowances: number;
  bonus: number;
  pf: number;
  tds: number;
  esi: number;
  lop: number;
  gross: number;
  totalDeductions: number;
  netPay: number;
  bankVerified: boolean;
  salaryStructure: string;
  status: "Active" | "Inactive";
}

export interface VerificationPayrollData {
  month: string;
  period: string;
  postingDate: string;
  currency: string;
  company: string;
  payrollPayableAccount: string;
  paymentAccount: string;
  bankAccount: string;
  costCenter?: string;
  salaryStructure: string;
  status: string;
  payrollId: string;
}

interface PayrollVerificationModalProps {
  customFooter?: React.ReactNode;
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  payrollData: VerificationPayrollData;
  employees: VerificationEmployee[];
  onSubmitForApproval?: () => Promise<void>;
  onSaveAsDraft?: () => Promise<void>;
  onRemoveEmployee?: (empId: string) => void;
  onUpdateDeduction?: (
    empId: string,
    field: keyof VerificationEmployee,
    value: number,
  ) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number, currency = "₹") =>
  v === 0 ? "—" : `${currency}${v.toLocaleString("en-IN")}`;

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const AVATAR_BG = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
];

const avatarClass = (id: string) =>
  AVATAR_BG[id.charCodeAt(id.length - 1) % AVATAR_BG.length];

type SortKey = "name" | "department" | "gross" | "totalDeductions" | "netPay";
type SortDir = "asc" | "desc";

// ─── Inline Edit Cell ─────────────────────────────────────────────────────────

const EditableCell: React.FC<{
  value: number;
  onSave: (v: number) => void;
  color?: string;
}> = ({ value, onSave, color = "text-main" }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const commit = () => {
    const n = parseFloat(draft);
    if (!isNaN(n) && n >= 0) onSave(n);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-full text-right text-xs bg-card border border-primary rounded px-1 py-0.5 tabular-nums focus:outline-none no-spinner"
        style={{ color: "var(--primary)" }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(String(value));
        setEditing(true);
      }}
      title="Click to edit"
      className={`w-full text-right text-xs tabular-nums font-bold ${color} hover:underline hover:text-primary transition cursor-pointer`}
    >
      {fmt(value)}
    </button>
  );
};

// ─── Sort Th ─────────────────────────────────────────────────────────────────

const Th: React.FC<{
  label: string;
  sortKey?: SortKey;
  current: SortKey | null;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  right?: boolean;
  className?: string;
}> = ({ label, sortKey, current, dir, onSort, right, className = "" }) => {
  const active = sortKey && current === sortKey;
  return (
    <th
      onClick={() => sortKey && onSort(sortKey)}
      className={`px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-muted whitespace-nowrap select-none
        ${right ? "text-right" : "text-left"}
        ${sortKey ? "cursor-pointer hover:text-main transition-colors" : ""}
        ${className}`}
    >
      <span
        className={`inline-flex items-center gap-1 ${right ? "justify-end w-full" : ""}`}
      >
        {label}
        {sortKey && (
          <span className={active ? "opacity-100" : "opacity-20"}>
            {active && dir === "desc" ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronUp className="w-3 h-3" />
            )}
          </span>
        )}
      </span>
    </th>
  );
};

// ─── KPI chip ─────────────────────────────────────────────────────────────────

const KpiChip: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  variant?: "default" | "danger" | "success" | "warning";
}> = ({ icon, label, value, sub, variant = "default" }) => {
  const valueColor = {
    default: "text-main",
    danger: "text-danger",
    success: "text-success",
    warning: "text-warning",
  }[variant];

  return (
    <div className="bg-card border border-theme rounded-xl px-3 py-2.5 flex items-center gap-2.5 min-w-0">
      <div className="shrink-0 w-8 h-8 rounded-lg bg-app border border-theme flex items-center justify-center text-muted">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted mb-0.5 leading-none">
          {label}
        </p>
        <p
          className={`text-sm font-extrabold tabular-nums leading-tight ${valueColor}`}
        >
          {value}
        </p>
        {sub && <p className="text-[9px] text-muted mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
};

// ─── Flag row ─────────────────────────────────────────────────────────────────

const FlagRow: React.FC<{
  type: "error" | "warning" | "success";
  title: string;
  sub?: string;
}> = ({ type, title, sub }) => {
  const cfg = {
    error: {
      icon: <XCircle className="w-3.5 h-3.5 shrink-0" />,
      bg: "bg-red-50 dark:bg-red-900/20",
      text: "text-red-700 dark:text-red-400",
      sub: "text-red-500/80",
    },
    warning: {
      icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
      bg: "bg-amber-50 dark:bg-amber-900/20",
      text: "text-amber-700 dark:text-amber-400",
      sub: "text-amber-500/80",
    },
    success: {
      icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />,
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      text: "text-emerald-700 dark:text-emerald-400",
      sub: "text-emerald-500/80",
    },
  }[type];
  return (
    <div className={`flex items-start gap-2 rounded-lg px-3 py-2 ${cfg.bg}`}>
      <span className={`mt-px ${cfg.text}`}>{cfg.icon}</span>
      <div>
        <p className={`text-[11px] font-semibold leading-snug ${cfg.text}`}>
          {title}
        </p>
        {sub && <p className={`text-[10px] mt-0.5 ${cfg.sub}`}>{sub}</p>}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const PayrollVerificationModal: React.FC<
  PayrollVerificationModalProps
> = ({
  modalId,
  isOpen,
  onClose,
  payrollData,
  employees: initialEmployees,
  onSubmitForApproval,
  onSaveAsDraft,
  onRemoveEmployee,
  onUpdateDeduction,
}) => {
  const [employees, setEmployees] =
    useState<VerificationEmployee[]>(initialEmployees);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [submitting, setSubmitting] = useState(false);

  // Sync if parent changes employees
  React.useEffect(() => {
    setEmployees(initialEmployees);
  }, [initialEmployees]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalGross = employees.reduce((s, e) => s + e.gross, 0);
  const totalDeductions = employees.reduce((s, e) => s + e.totalDeductions, 0);
  const totalNetPay = employees.reduce((s, e) => s + e.netPay, 0);
  const totalPF = employees.reduce((s, e) => s + e.pf, 0);
  const totalTDS = employees.reduce((s, e) => s + e.tds, 0);
  const totalESI = employees.reduce((s, e) => s + e.esi, 0);
  const missingBank = employees.filter((e) => !e.bankVerified);
  const hasBlocker = missingBank.length > 0;
  const cur = payrollData.currency === "INR" ? "₹" : payrollData.currency + " ";

  // ── Remove employee locally + propagate ───────────────────────────────────
  const handleRemove = useCallback(
    (id: string) => {
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      onRemoveEmployee?.(id);
    },
    [onRemoveEmployee],
  );

  // ── Inline deduction edit ─────────────────────────────────────────────────
  const handleDeductionEdit = useCallback(
    (id: string, field: keyof VerificationEmployee, value: number) => {
      setEmployees((prev) =>
        prev.map((e) => {
          if (e.id !== id) return e;
          const updated = { ...e, [field]: value };
          updated.totalDeductions =
            updated.pf + updated.tds + updated.esi + updated.lop;
          updated.netPay = updated.gross - updated.totalDeductions;
          return updated;
        }),
      );
      onUpdateDeduction?.(id, field, value);
    },
    [onUpdateDeduction],
  );

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const displayed = useMemo(() => {
    let list = [...employees];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q),
      );
    }
    if (sortKey) {
      list.sort((a, b) => {
        const av = (a as any)[sortKey] ?? "";
        const bv = (b as any)[sortKey] ?? "";
        const cmp =
          typeof av === "number"
            ? av - bv
            : String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [employees, search, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // ── Excel export ──────────────────────────────────────────────────────────
  const exportExcel = () => {
    const rows = [
      [
        "ID",
        "Name",
        "Department",
        "Designation",
        "Basic",
        "HRA",
        "Allowances",
        "Bonus",
        "PF",
        "TDS",
        "ESI",
        "LOP",
        "Gross",
        "Total Deductions",
        "Net Pay",
        "Bank Status",
        "Salary Structure",
      ],
      ...employees.map((e) => [
        e.id,
        e.name,
        e.department,
        e.designation,
        e.basic,
        e.hra,
        e.allowances,
        e.bonus,
        e.pf,
        e.tds,
        e.esi,
        e.lop,
        e.gross,
        e.totalDeductions,
        e.netPay,
        e.bankVerified ? "Verified" : "Missing",
        e.salaryStructure,
      ]),
      [],
      [
        "",
        "",
        "",
        "TOTALS",
        employees.reduce((s, e) => s + e.basic, 0),
        employees.reduce((s, e) => s + e.hra, 0),
        "",
        "",
        totalPF,
        totalTDS,
        totalESI,
        "",
        totalGross,
        totalDeductions,
        totalNetPay,
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [
      14, 20, 16, 18, 12, 10, 12, 10, 10, 10, 10, 10, 12, 14, 12, 12, 16,
    ].map((w) => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Payroll ${payrollData.month}`);
    XLSX.writeFile(
      wb,
      `payroll_${payrollData.payrollId}_${payrollData.month.replace(" ", "_")}.xlsx`,
    );
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (submitting || hasBlocker) return;
    setSubmitting(true);
    try {
      await onSubmitForApproval?.();
    } finally {
      setSubmitting(false);
    }
  };
  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Back
      </Button>

      <div className="flex gap-1">
       

        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={hasBlocker || submitting}
        >
          {submitting ? "Submitting..." : "verify"}
        </Button>
      </div>
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      title={`Verify Payroll — ${payrollData.month}`}
      subtitle={`${payrollData.payrollId} · ${payrollData.period}`}
      maxWidth="6xl"
      height="90vh"
      footer={footer}
    >
      <div className="flex flex-col gap-3 pb-2">
        {/* ── 1. Payroll info bar (single compact row) ── */}
        <div className="bg-card border border-theme rounded-xl px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5">
          {[
            { label: "Period", value: payrollData.period },
            { label: "Post date", value: payrollData.postingDate },
            { label: "Currency", value: payrollData.currency },
            { label: "Structure", value: payrollData.salaryStructure },
            { label: "Company", value: payrollData.company },
            { label: "Bank", value: payrollData.bankAccount },
            { label: "Payable A/C", value: payrollData.payrollPayableAccount },
            ...(payrollData.costCenter
              ? [{ label: "Cost center", value: payrollData.costCenter }]
              : []),
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted">
                {item.label}
              </span>
              <span className="text-[11px] font-semibold text-main">
                {item.value}
              </span>
            </div>
          ))}
          <span
            className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: "var(--row-hover)", color: "var(--muted)" }}
          >
            {payrollData.status}
          </span>
        </div>

        {/* ── 2. KPI chips (compact row) ── */}
        <div className="grid grid-cols-4 gap-2.5">
          <KpiChip
            icon={<Users className="w-3.5 h-3.5" />}
            label="Employees"
            value={String(employees.length)}
            sub={
              missingBank.length > 0
                ? `${missingBank.length} bank issue`
                : "All verified"
            }
            variant={missingBank.length > 0 ? "warning" : "default"}
          />
          <KpiChip
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            label="Total gross"
            value={fmt(totalGross, cur)}
            variant="default"
          />
          <KpiChip
            icon={<TrendingDown className="w-3.5 h-3.5" />}
            label="Total deductions"
            value={fmt(totalDeductions, cur)}
            sub={`PF ${fmt(totalPF, cur)} · TDS ${fmt(totalTDS, cur)} · ESI ${fmt(totalESI, cur)}`}
            variant="danger"
          />
          <KpiChip
            icon={<Wallet className="w-3.5 h-3.5" />}
            label="Net payable"
            value={fmt(totalNetPay, cur)}
            variant="success"
          />
        </div>

        {/* ── 3. Validation flags (collapsible) ── */}
        {(hasBlocker || true) && (
          <div className="bg-card border border-theme rounded-xl px-4 py-3 space-y-1.5">
            {missingBank.length > 0 && (
              <FlagRow
                type="error"
                title={`${missingBank.length} employee${missingBank.length > 1 ? "s" : ""} missing bank details — ${missingBank.map((e) => e.name).join(", ")}`}
                sub="Payment cannot be disbursed until bank account and IFSC are added in the employee profile."
              />
            )}
            <FlagRow
              type="warning"
              title={`Attendance not finalised for ${payrollData.month}`}
              sub="HR has not locked the attendance sheet. LOP deductions may change."
            />
            {!hasBlocker && (
              <FlagRow
                type="success"
                title="All employees have verified bank accounts"
                sub="Ready to submit for approval."
              />
            )}
          </div>
        )}

        {/* ── 4. Employee table ── */}
        <div className="flex flex-col gap-2">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
              Employee breakdown
            </p>
            <div className="relative ml-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="h-7 pl-7 pr-6 bg-card border border-theme rounded-lg text-xs text-main placeholder:text-muted focus:outline-none transition w-44"
                style={{ borderColor: "var(--border)" }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-main"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <span className="text-[10px] font-bold text-muted bg-app border border-theme px-2.5 py-0.5 rounded-full">
              {employees.length} employees
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={exportExcel}
                disabled={employees.length === 0}
                className="h-7 px-3 flex items-center gap-1.5 rounded-lg border border-theme bg-card hover:bg-emerald-50 hover:border-emerald-300 text-[11px] font-bold text-muted hover:text-emerald-700 transition disabled:opacity-40"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Export Excel
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="border border-theme rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm border-collapse"
                style={{ tableLayout: "fixed", minWidth: 980 }}
              >
                <colgroup>
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "5%" }} />
                </colgroup>
                <thead className="bg-app border-b border-theme">
                  <tr>
                    <Th
                      label="Employee"
                      sortKey="name"
                      current={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                    <Th
                      label="Department"
                      sortKey="department"
                      current={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                    <Th
                      label="Basic"
                      current={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      right
                    />
                    <Th
                      label="HRA"
                      current={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      right
                    />
                    <Th
                      label="Gross"
                      sortKey="gross"
                      current={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      right
                    />
                    <Th
                      label="PF"
                      current={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      right
                    />
                    <Th
                      label="TDS"
                      current={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      right
                    />
                    <Th
                      label="ESI"
                      current={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      right
                    />
                    <Th
                      label="LOP"
                      current={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      right
                    />
                    <Th
                      label="Net pay"
                      sortKey="netPay"
                      current={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      right
                    />
                    <th className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-muted text-center">
                      Bank
                    </th>
                    <th className="px-2 py-2 text-[10px] font-extrabold uppercase tracking-wider text-muted text-center">
                      Op.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="py-10 text-center text-xs text-muted"
                      >
                        {search ? `No results for "${search}"` : "No employees"}
                      </td>
                    </tr>
                  ) : (
                    displayed.map((emp, i) => (
                      <tr
                        key={emp.id}
                        className={`border-b border-theme last:border-0 transition-colors group
                        ${i % 2 === 1 ? "bg-app" : "bg-card"} hover:bg-primary/5`}
                      >
                        {/* Employee */}
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-extrabold shrink-0 ${avatarClass(emp.id)}`}
                            >
                              {getInitials(emp.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-main truncate leading-tight">
                                {emp.name}
                              </p>
                              <p className="text-[9px] text-muted font-mono leading-tight">
                                {emp.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-2 text-[11px] text-muted truncate">
                          {emp.department}
                        </td>
                        <td className="px-3 py-2 text-[11px] text-right tabular-nums text-main">
                          {fmt(emp.basic, cur)}
                        </td>
                        <td className="px-3 py-2 text-[11px] text-right tabular-nums text-main">
                          {fmt(emp.hra, cur)}
                        </td>
                        <td className="px-3 py-2 text-[11px] text-right tabular-nums font-bold text-main">
                          {fmt(emp.gross, cur)}
                        </td>

                        {/* Editable deduction cells */}
                        <td className="px-3 py-2">
                          <EditableCell
                            value={emp.pf}
                            onSave={(v) => handleDeductionEdit(emp.id, "pf", v)}
                            color="text-danger"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <EditableCell
                            value={emp.tds}
                            onSave={(v) =>
                              handleDeductionEdit(emp.id, "tds", v)
                            }
                            color="text-danger"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <EditableCell
                            value={emp.esi}
                            onSave={(v) =>
                              handleDeductionEdit(emp.id, "esi", v)
                            }
                            color="text-danger"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <EditableCell
                            value={emp.lop}
                            onSave={(v) =>
                              handleDeductionEdit(emp.id, "lop", v)
                            }
                            color="text-warning"
                          />
                        </td>

                        {/* Net pay */}
                        <td className="px-3 py-2 text-[11px] text-right tabular-nums font-extrabold text-success">
                          {fmt(emp.netPay, cur)}
                        </td>

                        {/* Bank */}
                        <td className="px-2 py-2 text-center">
                          {emp.bankVerified ? (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                              <ShieldAlert className="w-2.5 h-2.5" />—
                            </span>
                          )}
                        </td>

                        {/* Remove */}
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemove(emp.id)}
                            title="Remove employee from this payroll run"
                            className="w-6 h-6 rounded-md flex items-center justify-center mx-auto text-muted hover:bg-red-50 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Totals footer */}
                {displayed.length > 0 && (
                  <tfoot className="border-t-2 border-theme bg-app">
                    <tr>
                      <td
                        colSpan={2}
                        className="px-3 py-2 text-[9px] font-extrabold uppercase tracking-wider text-muted"
                      >
                        {employees.length} total
                      </td>
                      <td className="px-3 py-2 text-[11px] text-right tabular-nums font-extrabold text-main">
                        {fmt(
                          employees.reduce((s, e) => s + e.basic, 0),
                          cur,
                        )}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-right tabular-nums font-extrabold text-main">
                        {fmt(
                          employees.reduce((s, e) => s + e.hra, 0),
                          cur,
                        )}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-right tabular-nums font-extrabold text-main">
                        {fmt(totalGross, cur)}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-right tabular-nums font-extrabold text-danger">
                        {fmt(totalPF, cur)}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-right tabular-nums font-extrabold text-danger">
                        {fmt(totalTDS, cur)}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-right tabular-nums font-extrabold text-danger">
                        {fmt(totalESI, cur)}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-right tabular-nums font-extrabold text-warning">
                        {fmt(
                          employees.reduce((s, e) => s + e.lop, 0),
                          cur,
                        )}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-right tabular-nums font-extrabold text-success">
                        {fmt(totalNetPay, cur)}
                      </td>
                      <td />
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
          <p className="text-[10px] text-muted">
            <Edit2 className="w-2.5 h-2.5 inline mr-1" />
            Click any PF / TDS / ESI / LOP value to edit inline. Net pay
            recalculates automatically.
          </p>
        </div>
      </div>
    </MinimizableModal>
  );
};

export default PayrollVerificationModal;
