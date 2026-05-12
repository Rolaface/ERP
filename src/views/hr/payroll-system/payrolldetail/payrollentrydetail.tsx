import React, { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  Users,
  FileText,
  AlertCircle,
  Building2,
  Loader2,
  Search,
} from "lucide-react";
import {
  getPayrollEntryDetail,
  type PayrollEntryDetail as PayrollEntryDetailType,
  type PayrollEmployeeDetail,
} from "../../../../api/payroll/payrollEntryApi";

// ── Shared ──────────────────────────────────────────────────────────────────
import { StatusBadge, type ActiveTab } from "../payrolldetail/Payrollsharedcomponents";

// ── Tabs ────────────────────────────────────────────────────────────────────
import { EmployeeOverviewTab } from "../payrolldetail/Employeeoverviewtab";
import { SalarySlipTab } from "../payrolldetail/Salarysliptab";
import { PayrollDetailsTab } from "../payrolldetail/Payrolldetailstab";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TAB_CONFIG: Array<{ id: ActiveTab; label: string; icon: React.ReactNode }> = [
  { id: "overview", label: "Overview", icon: <Users className="w-3.5 h-3.5" /> },
  { id: "salary_slip", label: "Salary Slip", icon: <FileText className="w-3.5 h-3.5" /> },
  { id: "details", label: "Payroll Details", icon: <Building2 className="w-3.5 h-3.5" /> },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  payrollEntryId: string;
  onBack: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const PayrollEntryDetail: React.FC<Props> = ({ payrollEntryId, onBack }) => {
  const [entry, setEntry] = useState<PayrollEntryDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollEmployeeDetail | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [search, setSearch] = useState("");

  const fetchEntry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPayrollEntryDetail(payrollEntryId);
      setEntry(data);
      if (data.employees?.length > 0) {
        setSelectedEmployee(data.employees[0]);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.exception || err?.message || "Failed to load payroll entry.",
      );
    } finally {
      setLoading(false);
    }
  }, [payrollEntryId]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  const filteredEmployees =
    entry?.employees.filter(
      (e) =>
        e.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        e.employee.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32 gap-3 text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Loading payroll entry…</p>
      </div>
    );
  }

  // ── Error ──
  if (error || !entry) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32 gap-4 text-muted">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <p className="text-sm font-semibold text-main">Failed to load</p>
        <p className="text-xs text-center max-w-xs">{error}</p>
        <button
          onClick={fetchEntry}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* ── Top header bar ── */}
      <div className="shrink-0 flex items-center gap-3 px-5 py-3 border-b border-theme bg-surface">
        <button
          onClick={onBack}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-theme text-muted hover:text-primary hover:border-primary transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
          P
        </div>
        <span className="text-sm font-bold text-main">{entry.name}</span>
        <span className="px-2 py-0.5 rounded-md bg-app border border-theme text-[10px] font-bold text-muted">
          {entry.company}
        </span>
        <StatusBadge status={entry.status} />
      </div>

      {/* ── Body: left sidebar + right content ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Left sidebar ── */}
        <div className="w-72 shrink-0 border-r border-theme flex flex-col bg-surface">
          <div className="px-4 pt-4 pb-3 border-b border-theme">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted mb-2.5">
              All Employees&nbsp;
              <span className="font-bold text-main">{entry.employees.length}</span>
            </p>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Quick find..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-theme bg-app text-main placeholder:text-muted focus:outline-none focus:border-primary transition"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {filteredEmployees.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted">No employees found</div>
            ) : (
              filteredEmployees.map((emp) => {
                const isSelected = selectedEmployee?.name === emp.name;
                return (
                  <button
                    key={emp.name}
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setActiveTab("overview");
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isSelected ? "bg-primary text-white" : "hover:bg-app text-main"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                      }`}
                    >
                      {getInitials(emp.employee_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-semibold truncate ${isSelected ? "text-white" : "text-main"}`}>
                          {emp.employee_name}
                        </p>
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            entry.status === "Submitted"
                              ? "bg-emerald-400"
                              : entry.status === "Draft"
                              ? "bg-amber-400"
                              : "bg-gray-300"
                          }`}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className={`text-[10px] truncate ${isSelected ? "text-white/70" : "text-muted"}`}>
                          {emp.employee}
                        </p>
                        <span className={`text-[10px] ${isSelected ? "text-white/40" : "text-muted/40"}`}>•</span>
                        <p className={`text-[10px] truncate ${isSelected ? "text-white/70" : "text-muted"}`}>
                          {emp.department || "No Department"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right content ── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {selectedEmployee ? (
            <>
              {/* Tab bar */}
              <div className="shrink-0 flex items-center border-b border-theme px-6 bg-surface">
                {TAB_CONFIG.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted hover:text-main"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {activeTab === "overview" && (
                  <EmployeeOverviewTab employee={selectedEmployee} entry={entry} />
                )}
                {activeTab === "salary_slip" && (
                  <SalarySlipTab employee={selectedEmployee} payrollEntryId={entry.name} />
                )}
                {activeTab === "details" && (
                  <PayrollDetailsTab entry={entry} />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted">
              <Users className="w-10 h-10 opacity-20" />
              <p className="text-sm">Select an employee to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollEntryDetail;