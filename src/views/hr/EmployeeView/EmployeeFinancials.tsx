import React, { useState, useEffect } from "react";
import {
  Banknote, Shield, FileText, TrendingDown, CreditCard,
} from "lucide-react";
import { useAuth }                  from "../../../context/AuthContext";
import { getEmployeeById }          from "../../../api/employeeapi";
import { getSalarySlipsByEmployeeOnly } from "../../../api/payroll/payrollEntryApi";
import { showApiError }             from "../../../utils/alert";
import AppSkeleton                  from "../../../components/ui/AppSkeleton";
import { AppSubTabs }               from "../../../components/ui/app-shell";
import { useCompanyStore }          from "../../../store/companyStore";
import { fmt }                      from "../EmployeeManagement/detailtab/Employeehelpers";
import { SalaryStructureAssignmentsSection }  from "../EmployeeManagement/detailtab/Compensationtab";
import { SalarySlipTable }  from "../EmployeeManagement/detailtab/Salaryslip";
import type { SalarySlip }  from "../EmployeeManagement/detailtab/salarytypes";
import IncomeTax from "./Incometaxtab";

const DUMMY_INSURANCE = [
  {
    id: "1",
    name: "Group Health Insurance",
    provider: "Star Health",
    policyNo: "GHI-2026-00123",
    coverage: 500000,
    premium: 12000,
    validTill: "31 Mar 2027",
    status: "Active",
  },
  {
    id: "2",
    name: "Group Term Life Insurance",
    provider: "LIC",
    policyNo: "GTL-2026-00456",
    coverage: 2000000,
    premium: 8400,
    validTill: "31 Mar 2027",
    status: "Active",
  },
];

const DUMMY_LOANS = [
  {
    id: "1",
    type: "Salary Advance",
    amount: 50000,
    outstanding: 30000,
    emi: 5000,
    dueDate: "31 May 2026",
    status: "Active",
  },
];

// ─── Insurance Tab ────────────────────────────────────────────────────────────

const InsuranceTab: React.FC = () => (
  <div className="space-y-4 p-4">
    {DUMMY_INSURANCE.map((ins) => (
      <div
        key={ins.id}
        className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl"
              style={{
                background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                color: "var(--primary)",
              }}
            >
              <Shield size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text)]">{ins.name}</h3>
              <p className="text-xs text-[var(--muted)]">{ins.provider}</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
            {ins.status}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Policy No",  value: ins.policyNo },
            { label: "Coverage",   value: ` ${ins.coverage.toLocaleString("en-IN")}` },
            { label: "Premium/yr", value: ` ${ins.premium.toLocaleString("en-IN")}` },
            { label: "Valid Till", value: ins.validTill },
          ].map((f) => (
            <div key={f.label}>
              <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-0.5">
                {f.label}
              </p>
              <p className="text-sm font-semibold text-[var(--text)]">{f.value}</p>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ─── Income Tax — Slab Data ───────────────────────────────────────────────────

/*
const NEW_REGIME_SLABS = [
  { range: "Up to  3,00,000",           rate: "NIL", from: 0,       to: 300000   },
  { range: " 3,00,001 –  7,00,000",   rate: "5%",  from: 300001,  to: 700000   },
  { range: " 7,00,001 –  10,00,000",  rate: "10%", from: 700001,  to: 1000000  },
  { range: " 10,00,001 –  12,00,000", rate: "15%", from: 1000001, to: 1200000  },
  { range: " 12,00,001 –  15,00,000", rate: "20%", from: 1200001, to: 1500000  },
  { range: "Above  15,00,000",          rate: "30%", from: 1500001, to: Infinity },
];

const OLD_REGIME_SLABS = [
  { range: "Up to  2,50,000",          rate: "NIL", from: 0,       to: 250000   },
  { range: " 2,50,001 –  5,00,000",  rate: "5%",  from: 250001,  to: 500000   },
  { range: " 5,00,001 –  10,00,000", rate: "20%", from: 500001,  to: 1000000  },
  { range: "Above  10,00,000",         rate: "30%", from: 1000001, to: Infinity },
];

const RATE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  "NIL": { bg: "bg-green-50",  text: "text-green-700",  bar: "bg-green-400"  },
  "5%":  { bg: "bg-blue-50",   text: "text-blue-700",   bar: "bg-blue-400"   },
  "10%": { bg: "bg-yellow-50", text: "text-yellow-700", bar: "bg-yellow-400" },
  "15%": { bg: "bg-orange-50", text: "text-orange-600", bar: "bg-orange-400" },
  "20%": { bg: "bg-red-50",    text: "text-red-600",    bar: "bg-red-400"    },
  "30%": { bg: "bg-rose-100",  text: "text-rose-700",   bar: "bg-rose-500"   },
};

const TaxSlabTab: React.FC<{ taxableIncome: number; regime: "new" | "old" }> = ({
  taxableIncome,
  regime,
}) => {
  const slabs = regime === "new" ? NEW_REGIME_SLABS : OLD_REGIME_SLABS;
  const maxIncome = regime === "new" ? 1500000 : 1000000;

  const activeSlab = slabs.findIndex(
    (s) => taxableIncome >= s.from && taxableIncome <= s.to
  );

  const barWidth = (slab: (typeof slabs)[0]) => {
    if (slab.to === Infinity) return 100;
    return Math.min(Math.round((slab.to / maxIncome) * 100), 100);
  };

  return (
    <div className="space-y-3">
      <div
        className="flex items-start gap-2 rounded-xl px-4 py-3 text-xs"
        style={{
          background: "color-mix(in srgb, var(--primary) 8%, transparent)",
          color: "var(--primary)",
        }}
      >
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>
          Tax slabs for <strong>FY 2025-26</strong> under the{" "}
          <strong>{regime === "new" ? "New" : "Old"} Tax Regime</strong>.
          Your taxable income of{" "}
          <strong> {taxableIncome.toLocaleString("en-IN")}</strong> falls in
          the highlighted slab.
        </span>
      </div>

      {slabs.map((slab, idx) => {
        const colors = RATE_COLORS[slab.rate] ?? RATE_COLORS["30%"];
        const isActive = idx === activeSlab;

        return (
          <div
            key={slab.range}
            className={`rounded-xl border transition-all bg-[var(--card)] overflow-hidden ${
              isActive
                ? "border-[var(--primary)] shadow-sm"
                : "border-[var(--border)]"
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                {isActive && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: "var(--primary)" }}
                  />
                )}
                <p
                  className={`text-sm font-semibold ${
                    isActive ? "text-[var(--text)]" : "text-[var(--muted)]"
                  }`}
                >
                  {slab.range}
                </p>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${colors.bg} ${colors.text}`}
              >
                {slab.rate}
              </span>
            </div>
            <div className="px-4 pb-3">
              <div className="h-1.5 rounded-full bg-[var(--row-hover)]">
                <div
                  className={`h-full rounded-full ${colors.bar} transition-all`}
                  style={{ width: `${barWidth(slab)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Income Tax Tab ───────────────────────────────────────────────────────────

const IncomeTaxTab: React.FC = () => {
  const [subtab, setSubtab] = useState<"overview" | "slabs" | "form16" | "report">("overview");
  const d = DUMMY_TAX;
  const fmtInr = (n: number) => ` ${n.toLocaleString("en-IN")}`;
  const regime: "new" | "old" = d.regime === "New Regime" ? "new" : "old";

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "overview" as const, label: "Overview"   },
          { id: "slabs"    as const, label: "Tax Slabs"  },
          { id: "form16"   as const, label: "Form 16"    },
          { id: "report"   as const, label: "Tax Report" },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setSubtab(s.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              subtab === s.id
                ? "text-white"
                : "bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
            }`}
            style={subtab === s.id ? { background: "var(--primary)" } : {}}
          >
            {s.label}
          </button>
        ))}
      </div>

      {subtab === "overview" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "PAN",            value: d.pan                   },
            { label: "Tax Regime",     value: d.regime                },
            { label: "Total Income",   value: fmtInr(d.totalIncome)   },
            { label: "Taxable Income", value: fmtInr(d.taxableIncome) },
            { label: "Tax Liability",  value: fmtInr(d.taxLiability)  },
            { label: "TDS Paid",       value: fmtInr(d.tdsPaid)       },
          ].map((f) => (
            <div
              key={f.label}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4"
            >
              <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1">
                {f.label}
              </p>
              <p className="text-sm font-bold text-[var(--text)]">{f.value}</p>
            </div>
          ))}
        </div>
      )}

      {subtab === "slabs" && (
        <TaxSlabTab taxableIncome={d.taxableIncome} regime={regime} />
      )}

      {subtab === "form16" && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 text-center space-y-3">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
            style={{
              background: "color-mix(in srgb, var(--primary) 12%, transparent)",
              color: "var(--primary)",
            }}
          >
            <FileText size={24} />
          </div>
          <p className="text-sm font-semibold text-[var(--text)]">Form 16 — FY 2025-26</p>
          <p className="text-xs text-[var(--muted)]">
            Your Form 16 will be available after TDS filing by the employer.
          </p>
          <button
            className="mt-2 px-5 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--primary)" }}
          >
            Download Form 16
          </button>
        </div>
      )}

      {subtab === "report" && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 text-center space-y-3">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
            style={{
              background: "color-mix(in srgb, var(--primary) 12%, transparent)",
              color: "var(--primary)",
            }}
          >
            <TrendingDown size={24} />
          </div>
          <p className="text-sm font-semibold text-[var(--text)]">Tax Computation Report</p>
          <p className="text-xs text-[var(--muted)]">Detailed tax computation for FY 2025-26</p>
          <button
            className="mt-2 px-5 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--primary)" }}
          >
            Download Report
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Loan & Advance Tab ───────────────────────────────────────────────────────

*/
const LoanAdvanceTab: React.FC = () => (
  <div className="p-4 space-y-4">
    {DUMMY_LOANS.map((loan) => (
      <div
        key={loan.id}
        className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl"
              style={{
                background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                color: "var(--primary)",
              }}
            >
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text)]">{loan.type}</h3>
              <p className="text-xs text-[var(--muted)]">Due: {loan.dueDate}</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
            {loan.status}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Amount", value: ` ${loan.amount.toLocaleString("en-IN")}` },
            { label: "Outstanding",  value: ` ${loan.outstanding.toLocaleString("en-IN")}` },
            { label: "Monthly EMI",  value: ` ${loan.emi.toLocaleString("en-IN")}` },
          ].map((f) => (
            <div key={f.label}>
              <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-0.5">
                {f.label}
              </p>
              <p className="text-sm font-bold text-[var(--text)]">{f.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-[var(--muted)] mb-1">
            <span>Repaid</span>
            <span>
              {Math.round(((loan.amount - loan.outstanding) / loan.amount) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--row-hover)]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.round(((loan.amount - loan.outstanding) / loan.amount) * 100)}%`,
                background: "var(--primary)",
              }}
            />
          </div>
        </div>
      </div>
    ))}
    {DUMMY_LOANS.length === 0 && (
      <div className="text-center py-12 text-[var(--muted)] text-sm">
        No active loans or advances.
      </div>
    )}
  </div>
);

// ─── Tab config ───────────────────────────────────────────────────────────────

const FINANCIALS_TABS = [
  { id: "compensation", label: "Compensation",   icon: <Banknote size={14} /> },
  { id: "insurance",    label: "Insurance",      icon: <Shield size={14} /> },
  { id: "salary-slip",  label: "Salary Slip",    icon: <FileText size={14} /> },
  { id: "income-tax",   label: "Income Tax",     icon: <TrendingDown size={14} /> },
  { id: "loan",         label: "Loan & Advance", icon: <CreditCard size={14} /> },
];

const unwrap = (res: any): any =>
  res?.message?.data ?? res?.data ?? res;

// ─── Main Component ───────────────────────────────────────────────────────────

const EmployeeFinancials: React.FC = () => {
  const { user }     = useAuth();
  const baseCurrency = useCompanyStore((s) => s.baseCurrency);
  const [activeTab, setActiveTab] = useState("compensation");

  const [emp,          setEmp]          = useState<any>(null);
  const [empLoading,   setEmpLoading]   = useState(true);
  const [slips,        setSlips]        = useState<SalarySlip[]>([]);
  const [slipsLoading, setSlipsLoading] = useState(true);

  useEffect(() => {
    if (!user?.employeeId) {
      setEmpLoading(false);
      setSlipsLoading(false);
      return;
    }

    const loadEmp = async () => {
      try {
        setEmpLoading(true);
        const res = await getEmployeeById(user.employeeId!);
        setEmp(unwrap(res));
      } catch (err) {
        showApiError(err);
      } finally {
        setEmpLoading(false);
      }
    };

    const loadSlips = async () => {
      try {
        setSlipsLoading(true);
        const { data } = await getSalarySlipsByEmployeeOnly(user.employeeId!);
        setSlips(data || []);
      } catch {
        setSlips([]);
      } finally {
        setSlipsLoading(false);
      }
    };

    loadEmp();
    loadSlips();
  }, [user?.employeeId]);

  if (empLoading) return <AppSkeleton />;

  const currency = emp
    ? (fmt(emp.salary_currency) || baseCurrency || "")
    : (baseCurrency || "");

  const empForComp = emp
    ? {
        ...emp,
        salary_structure: emp.salary_structure || emp.salaryStructure || "",
        ctc:              emp.ctc || emp.basic_salary || emp.basicSalary || 0,
        currency,
      }
    : {};

  return (
    <div className="h-full flex flex-col">
      <AppSubTabs
        tabs={FINANCIALS_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="flex-1 overflow-y-auto mt-5">

        {activeTab === "compensation" && (
          <SalaryStructureAssignmentsSection emp={empForComp} currency={currency} />
        )}

        {activeTab === "insurance" && <InsuranceTab />}

        {activeTab === "salary-slip" && (
          <SalarySlipTable slips={slips} loading={slipsLoading} />
        )}

        {activeTab === "income-tax" && <IncomeTax />}


        {activeTab === "loan" && <LoanAdvanceTab />}

      </div>
    </div>
  );
};

export default EmployeeFinancials;
