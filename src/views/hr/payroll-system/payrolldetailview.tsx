import React, { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  Users,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  Calendar,
  CreditCard,
  Eye,
  ChevronRight,
  Loader2,
  Search,
} from "lucide-react";
import {
  getPayrollEntryDetail,
  type PayrollEntryDetail as PayrollEntryDetailType,
  type PayrollEmployeeDetail,
  // TODO: import when salary slip API is ready:
  // getSalarySlipsForEntry,
  // type SalarySlip,
} from "../../../api/payroll/payrollEntryApi";
import { getGLNameWithoutAbbreviation } from "../../../api/utils/glAccountUtils";
// ─── Types ────────────────────────────────────────────────────────────────────

// TODO: Remove this stub and import SalarySlip from payrollEntryApi once ready
interface SalarySlip {
  name: string;
  employee: string;
  employee_name: string;
  gross_pay: number;
  net_pay: number;
  status: string;
  start_date: string;
  end_date: string;
}

type ActiveTab = "overview" | "salary_slip" | "details";

interface Props {
  payrollEntryId: string;
  onBack: () => void;
  /** Wire this when salary slip view is ready */
  onViewSalarySlip?: (slip: SalarySlip) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  Draft: {
    label: "Draft",
    color: "text-amber-600 bg-amber-50 border-amber-200",
    icon: <Clock className="w-3 h-3" />,
  },
  Submitted: {
    label: "Submitted",
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  Failed: {
    label: "Failed",
    color: "text-red-600 bg-red-50 border-red-200",
    icon: <XCircle className="w-3 h-3" />,
  },
  Cancelled: {
    label: "Cancelled",
    color: "text-gray-500 bg-gray-50 border-gray-200",
    icon: <XCircle className="w-3 h-3" />,
  },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = statusConfig[status] ?? {
    label: status,
    color: "text-gray-500 bg-gray-50 border-gray-200",
    icon: <Clock className="w-3 h-3" />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

// ─── Info Tile (top cards like customer screen) ───────────────────────────────

const InfoTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  value: React.ReactNode;
}> = ({ icon, label, sublabel, value }) => (
  <div className="flex flex-col gap-1 p-4 rounded-xl border border-theme bg-surface">
    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/8 text-primary mb-1">
      {icon}
    </div>
    <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted">
      {label}
    </p>
    {sublabel && (
      <p className="text-[9px] text-muted/70 uppercase tracking-wider">
        {sublabel}
      </p>
    )}
    <p className="text-sm font-bold text-main mt-0.5">{value || "—"}</p>
  </div>
);

// ─── Detail Row ───────────────────────────────────────────────────────────────

const DetailRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex items-center justify-between py-3 border-b border-theme last:border-0">
    <div className="flex items-center gap-2 text-muted">
      <span className="text-primary/60">{icon}</span>
      <span className="text-[10px] font-extrabold uppercase tracking-wider">
        {label}
      </span>
    </div>
    <span className="text-xs font-semibold text-main text-right max-w-[55%] truncate">
      {value || "—"}
    </span>
  </div>
);

// ─── Employee Overview Tab ────────────────────────────────────────────────────

const EmployeeOverviewTab: React.FC<{
  employee: PayrollEmployeeDetail;
  entry: PayrollEntryDetailType;
}> = ({ employee, entry }) => (
  <div className="space-y-5">
    {/* Top info tiles */}
    <div className="grid grid-cols-3 gap-3">
      <InfoTile
        icon={<Users className="w-4 h-4" />}
        label="Employee ID"
        sublabel=""
        value={employee.employee}
      />
      <InfoTile
        icon={<Building2 className="w-4 h-4" />}
        label="Department"
        sublabel=""
        value={getGLNameWithoutAbbreviation(employee.department)}
      />
      <InfoTile
        icon={<FileText className="w-4 h-4" />}
        label="Designation"
        sublabel=""
        value={employee.designation}
      />
    </div>

    {/* Employee details section */}
    <div className="rounded-xl border border-theme overflow-hidden">
      <div className="px-4 py-3 bg-app border-b border-theme">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-primary/60" />
          Employee Details
        </p>
      </div>
      <div className="px-4">
        <DetailRow
          icon={<Users className="w-3 h-3" />}
          label="Full Name"
          value={employee.employee_name}
        />
        <DetailRow
          icon={<FileText className="w-3 h-3" />}
          label="Employee ID"
          value={employee.employee}
        />
        <DetailRow
          icon={<Building2 className="w-3 h-3" />}
          label="Department"
          value={getGLNameWithoutAbbreviation(employee.department)}
        />
        <DetailRow
          icon={<Building2 className="w-3 h-3" />}
          label="Designation"
          value={employee.designation}
        />
        <DetailRow
          icon={<Clock className="w-3 h-3" />}
          label="Salary Withheld"
          value={
            employee.is_salary_withheld ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
                Yes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                No
              </span>
            )
          }
        />
      </div>
    </div>

    {/* Payroll period section */}
    <div className="rounded-xl border border-theme overflow-hidden">
      <div className="px-4 py-3 bg-app border-b border-theme">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-primary/60" />
          Payroll Period
        </p>
      </div>
      <div className="px-4">
        <DetailRow
          icon={<Calendar className="w-3 h-3" />}
          label="Start Date"
          value={entry.start_date}
        />
        <DetailRow
          icon={<Calendar className="w-3 h-3" />}
          label="End Date"
          value={entry.end_date}
        />
        <DetailRow
          icon={<CreditCard className="w-3 h-3" />}
          label="Frequency"
          value={entry.payroll_frequency}
        />
        <DetailRow
          icon={<CreditCard className="w-3 h-3" />}
          label="Currency"
          value={`${entry.currency} (${entry.exchange_rate})`}
        />
      </div>
    </div>
  </div>
);

// ─── Salary Slip Tab (integration-ready placeholder) ─────────────────────────

const SalarySlipTab: React.FC<{
  employee: PayrollEmployeeDetail;
  payrollEntryId: string;
}> = ({ employee, payrollEntryId }) => {


  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted">
      <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center">
        <FileText className="w-7 h-7 text-primary/40" />
      </div>
      <p className="text-sm font-semibold text-main">Salary Slip</p>
      <p className="text-xs text-center max-w-xs leading-relaxed">
        Salary slip for <strong>{employee.employee_name}</strong> will appear
        here once the API integration is complete.
      </p>
      <span className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
        <Clock className="w-3 h-3" />
        Coming Soon
      </span>
    </div>
  );
};

// ─── Payroll Details Tab ──────────────────────────────────────────────────────

const PayrollDetailsTab: React.FC<{ entry: PayrollEntryDetailType }> = ({
  entry,
}) => (
  <div className="space-y-4">
    <div className="rounded-xl border border-theme overflow-hidden">
      <div className="px-4 py-3 bg-app border-b border-theme">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-primary/60" />
          Payroll Entry
        </p>
      </div>
      <div className="px-4">
        {[
          { label: "Entry ID", value: entry.name },
          { label: "Company", value: entry.company },
          { label: "Posting Date", value: entry.posting_date },
          { label: "Cost Center", value: getGLNameWithoutAbbreviation(entry.cost_center) },
          { label: "Payable Account", value: getGLNameWithoutAbbreviation(entry.payroll_payable_account) },
          { label: "Slips Created", value: String(entry.salary_slips_created) },
          {
            label: "Slips Submitted",
            value: String(entry.salary_slips_submitted),
          },
          {
            label: "Deduct Tax (Unsubmitted)",
            value: entry.deduct_tax_for_unsubmitted_tax_exemption_proof
              ? "Yes"
              : "No",
          },
          {
            label: "Based on Timesheet",
            value: entry.salary_slip_based_on_timesheet ? "Yes" : "No",
          },
        ].map(({ label, value }) => (
          <DetailRow
            key={label}
            icon={<FileText className="w-3 h-3" />}
            label={label}
            value={value}
          />
        ))}
      </div>
    </div>

    {entry.error_message && (
      <div className="p-4 rounded-xl border border-red-200 bg-red-50">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-red-700 mb-1">Error Details</p>
            <p
              className="text-[11px] text-red-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: entry.error_message }}
            />
          </div>
        </div>
      </div>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const PayrollEntryDetail: React.FC<Props> = ({
  payrollEntryId,
  onBack,
  onViewSalarySlip,
}) => {
  const [entry, setEntry] = useState<PayrollEntryDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] =
    useState<PayrollEmployeeDetail | null>(null);
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
        err?.response?.data?.exception ||
          err?.message ||
          "Failed to load payroll entry.",
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

  const tabs: Array<{ id: ActiveTab; label: string; icon: React.ReactNode }> = [
    {
      id: "overview",
      label: "Overview",
      icon: <Users className="w-3.5 h-3.5" />,
    },
    {
      id: "salary_slip",
      label: "Salary Slip",
      icon: <FileText className="w-3.5 h-3.5" />,
    },
    {
      id: "details",
      label: "Payroll Details",
      icon: <Building2 className="w-3.5 h-3.5" />,
    },
  ];

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

        {/* Entry badge */}
        <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
          P
        </div>
        <span className="text-sm font-bold text-main">{entry.name}</span>
        <span className="px-2 py-0.5 rounded-md bg-app border border-theme text-[10px] font-bold text-muted">
          {entry.company}
        </span>
        <StatusBadge status={entry.status} />

        {/* Error pill */}
        {entry.error_message && entry.status === "Failed" && (
          <div className="ml-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-red-200 bg-red-50 text-[10px] font-semibold text-red-600">
            <AlertCircle className="w-3 h-3" />
            Error — see Payroll Details
          </div>
        )}
      </div>

      {/* ── Body: left sidebar + right content ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Left sidebar ── */}
        <div className="w-72 shrink-0 border-r border-theme flex flex-col bg-surface">
          {/* Sidebar header */}
          <div className="px-4 pt-4 pb-3 border-b border-theme">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted mb-2.5">
              All Employees&nbsp;
              <span className="font-bold text-main">
                {entry.employees.length}
              </span>
            </p>
            {/* Search */}
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

          {/* Employee list */}
          <div className="flex-1 overflow-y-auto py-1">
            {filteredEmployees.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted">
                No employees found
              </div>
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
                      isSelected
                        ? "bg-primary text-white"
                        : "hover:bg-app text-main"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {getInitials(emp.employee_name)}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold truncate ${
                          isSelected ? "text-white" : "text-main"
                        }`}
                      >
                        {emp.employee_name}
                      </p>
                      <p
                        className={`text-[10px] truncate ${
                          isSelected ? "text-white/70" : "text-muted"
                        }`}
                      >
                        {emp.employee}
                      </p>
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
                {tabs.map((tab) => (
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
                  <EmployeeOverviewTab
                    employee={selectedEmployee}
                    entry={entry}
                  />
                )}
                {activeTab === "salary_slip" && (
                  <SalarySlipTab
                    employee={selectedEmployee}
                    payrollEntryId={entry.name}
                  />
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