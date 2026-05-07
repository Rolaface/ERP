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
  RefreshCw,
  Eye,
  ChevronRight,
  Loader2,
} from "lucide-react";
// import {
//   getPayrollEntryDetail,
//   type PayrollEntryDetail as PayrollEntryDetailType,
//   type PayrollEmployeeDetail,
// } from "../../../api/payrollEntryApi";

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

type ActiveTab = "employees" | "salary_slips" | "details";

interface Props {
  payrollEntryId: string;
  onBack: () => void;
  /** Wire this when salary slip view is ready */
  onViewSalarySlip?: (slip: SalarySlip) => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

const InfoCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex flex-col gap-1 p-4 rounded-xl border border-theme bg-app">
    <div className="flex items-center gap-2 text-muted mb-0.5">
      <span className="text-primary/70">{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider">
        {label}
      </span>
    </div>
    <div className="text-sm font-semibold text-main truncate">{value}</div>
  </div>
);

const SectionHeader: React.FC<{ title: string; count?: number }> = ({
  title,
  count,
}) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-sm font-bold text-main flex items-center gap-2">
      {title}
      {count !== undefined && (
        <span className="text-xs font-semibold text-muted bg-app border border-theme px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </h3>
  </div>
);

// ─── Employees Tab ────────────────────────────────────────────────────────────

const EmployeesTab: React.FC<{
  employees: PayrollEmployeeDetail[];
  onViewSalarySlip?: (emp: PayrollEmployeeDetail) => void;
}> = ({ employees, onViewSalarySlip }) => {
  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted">
        <Users className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">No employees in this payroll entry.</p>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Employees" count={employees.length} />
      <div className="rounded-xl border border-theme overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-app border-b border-theme">
              <th className="text-left px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-muted">
                #
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-muted">
                Employee
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-muted">
                Department
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-muted">
                Designation
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-muted">
                Salary Withheld
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr
                key={emp.name}
                className="border-b border-theme last:border-0 hover:bg-app/50 transition-colors"
              >
                <td className="px-4 py-3 text-muted text-xs">{emp.idx}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {emp.employee_name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-main text-xs">
                        {emp.employee_name}
                      </p>
                      <p className="text-[10px] text-muted">{emp.employee}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {emp.department || "—"}
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {emp.designation || "—"}
                </td>
                <td className="px-4 py-3">
                  {emp.is_salary_withheld ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
                      Withheld
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {/* Wire this when salary slip API is ready */}
                  <button
                    onClick={() => onViewSalarySlip?.(emp)}
                    disabled={!onViewSalarySlip}
                    title={
                      onViewSalarySlip
                        ? "View Salary Slip"
                        : "Salary slip API coming soon"
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold border border-theme text-muted hover:border-primary hover:text-primary transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Slip
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Salary Slips Tab (integration-ready placeholder) ─────────────────────────

const SalarySlipsTab: React.FC<{
  payrollEntryId: string;
  onViewSalarySlip?: (slip: SalarySlip) => void;
}> = ({ payrollEntryId, onViewSalarySlip }) => {
  // TODO: Uncomment once salary slip API is ready in payrollEntryApi.ts
  // const [slips, setSlips] = useState<SalarySlip[]>([]);
  // const [loading, setLoading] = useState(false);
  // useEffect(() => {
  //   setLoading(true);
  //   getSalarySlipsForEntry(payrollEntryId)
  //     .then(setSlips)
  //     .finally(() => setLoading(false));
  // }, [payrollEntryId]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted gap-3">
      <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center">
        <FileText className="w-7 h-7 text-primary/40" />
      </div>
      <p className="text-sm font-semibold text-main">Salary Slips</p>
      <p className="text-xs text-center max-w-xs leading-relaxed">
        Salary slip integration is in progress. Once the API is ready, slips for
        this payroll entry will appear here.
      </p>
      <span className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
        <Clock className="w-3 h-3" />
        Coming Soon
      </span>
    </div>
  );
};

// ─── Details Tab ──────────────────────────────────────────────────────────────

const DetailsTab: React.FC<{ entry: PayrollEntryDetailType }> = ({ entry }) => {
  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "Payroll Entry ID", value: entry.name },
    { label: "Company", value: entry.company },
    { label: "Posting Date", value: entry.posting_date },
    { label: "Start Date", value: entry.start_date },
    { label: "End Date", value: entry.end_date },
    { label: "Frequency", value: entry.payroll_frequency },
    { label: "Currency", value: entry.currency },
    { label: "Exchange Rate", value: entry.exchange_rate },
    { label: "Payroll Payable Account", value: entry.payroll_payable_account },
    { label: "Cost Center", value: entry.cost_center || "—" },
    { label: "Salary Slips Created", value: entry.salary_slips_created },
    { label: "Salary Slips Submitted", value: entry.salary_slips_submitted },
    {
      label: "Deduct Tax for Unsubmitted Proof",
      value: entry.deduct_tax_for_unsubmitted_tax_exemption_proof ? "Yes" : "No",
    },
    {
      label: "Salary Slip Based on Timesheet",
      value: entry.salary_slip_based_on_timesheet ? "Yes" : "No",
    },
  ];

  return (
    <div>
      <SectionHeader title="Entry Details" />
      <div className="rounded-xl border border-theme overflow-hidden">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center px-4 py-3 text-sm border-b border-theme last:border-0 ${
              i % 2 === 0 ? "bg-transparent" : "bg-app/40"
            }`}
          >
            <span className="w-64 text-[10px] font-extrabold uppercase tracking-wider text-muted shrink-0">
              {row.label}
            </span>
            <span className="text-xs font-medium text-main">{row.value}</span>
          </div>
        ))}
      </div>

      {entry.error_message && (
        <div className="mt-4 p-4 rounded-xl border border-red-200 bg-red-50">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-700 mb-1">
                Error Details
              </p>
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
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const PayrollEntryDetail: React.FC<Props> = ({
  payrollEntryId,
  onBack,
  onViewSalarySlip,
}) => {
  const [entry, setEntry] = useState<PayrollEntryDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("employees");

  const fetchEntry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPayrollEntryDetail(payrollEntryId);
      setEntry(data);
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

  const tabs: Array<{ id: ActiveTab; label: string; icon: React.ReactNode }> = [
    { id: "employees", label: "Employees", icon: <Users className="w-3.5 h-3.5" /> },
    { id: "salary_slips", label: "Salary Slips", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "details", label: "Details", icon: <Building2 className="w-3.5 h-3.5" /> },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32 gap-3 text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Loading payroll entry…</p>
      </div>
    );
  }

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
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ── Header ── */}
      <div className="shrink-0 px-6 pt-5 pb-0 border-b border-theme">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted mb-3 font-medium">
          <button
            onClick={onBack}
            className="hover:text-primary transition flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Payroll
          </button>
          <ChevronRight className="w-3 h-3 opacity-50" />
          <span className="text-main font-semibold">{entry.name}</span>
        </div>

        {/* Title row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-main leading-tight">
                {entry.name}
              </h1>
              <p className="text-xs text-muted mt-0.5">{entry.company}</p>
            </div>
            <StatusBadge status={entry.status} />
          </div>

          <button
            onClick={fetchEntry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-theme text-xs text-muted hover:text-primary hover:border-primary transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <InfoCard
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="Period"
            value={`${entry.start_date} → ${entry.end_date}`}
          />
          <InfoCard
            icon={<CreditCard className="w-3.5 h-3.5" />}
            label="Frequency"
            value={entry.payroll_frequency}
          />
          <InfoCard
            icon={<Users className="w-3.5 h-3.5" />}
            label="Employees"
            value={entry.number_of_employees}
          />
          <InfoCard
            icon={<FileText className="w-3.5 h-3.5" />}
            label="Currency"
            value={`${entry.currency} (${entry.exchange_rate})`}
          />
        </div>

        {/* Error banner */}
        {entry.error_message && entry.status === "Failed" && (
          <div className="mb-4 px-3 py-2.5 rounded-lg border border-red-200 bg-red-50 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-600 leading-relaxed line-clamp-2">
              <span className="font-bold">Error: </span>
              <span
                dangerouslySetInnerHTML={{
                  __html: entry.error_message.replace(/<[^>]+>/g, " "),
                }}
              />
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-0 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-main"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === "employees" && (
                <span
                  className={`ml-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === "employees"
                      ? "bg-primary/10 text-primary"
                      : "bg-app text-muted"
                  }`}
                >
                  {entry.employees.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
        {activeTab === "employees" && (
          <EmployeesTab
            employees={entry.employees}
            // Wire this when salary slip modal/page is ready:
            // onViewSalarySlip={(emp) => { /* navigate to slip for emp.employee */ }}
          />
        )}

        {activeTab === "salary_slips" && (
          <SalarySlipsTab
            payrollEntryId={entry.name}
            onViewSalarySlip={onViewSalarySlip}
          />
        )}

        {activeTab === "details" && <DetailsTab entry={entry} />}
      </div>
    </div>
  );
};

export default PayrollEntryDetail;