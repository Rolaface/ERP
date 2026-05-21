import React, { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Copy, Landmark, UserRound } from "lucide-react";
import {
  Banknote,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { fmt, fmtMoney } from "../detailtab/Employeehelpers";
import { getSalaryStructure } from "../../../../api/payrollConfigApi";
import {
  calculateSalary,
  structureToComponents,
  type ComponentResult,
} from "../../../../components/Hr/employeedirectorymodal/salaryengine";
import { getAllBankAccounts } from "../../../../api/BankAccountApi";

import { showApiError } from "../../../../utils/alert";

interface Props {
  emp: any;
  currency: string;
}

const DED_COLOR = "#f87171";
const EARN_COLOR = "#34d399";

const fmtNum = (n: number, cur: string): string =>
  fmtMoney(n, cur) ??
  `${cur} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function useCssVar(name: string, fallback: string): string {
  const [val, setVal] = React.useState(fallback);
  useEffect(() => {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    if (v) setVal(v);
  }, [name]);
  return val;
}

// ─── KPI Chip ─────────────────────────────────────────────────────────────────

interface KpiChipProps {
  label: string;
  monthly: number;
  currency: string;
  icon: React.ReactNode;
  accentClass: string;
  bgClass: string;
  borderClass: string;
  iconBgClass: string;
  monoClass: string;
}

const KpiChip: React.FC<KpiChipProps> = ({
  label,
  monthly,
  currency,
  icon,
  accentClass,
  bgClass,
  borderClass,
  iconBgClass,
  monoClass,
}) => (
  <div
    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border ${bgClass} ${borderClass} min-w-0 flex-1`}
  >
    <div
      className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center ${iconBgClass}`}
    >
      <span className={accentClass}>{icon}</span>
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9.5px] font-bold uppercase tracking-wider text-muted truncate mb-0.5">
        {label}
      </p>
      <p
        className={`text-[14px] font-bold tabular-nums leading-none ${accentClass} truncate`}
      >
        {fmtNum(monthly * 12, currency)}
        <span className="text-[9px] font-normal text-muted ml-1">p.a.</span>
      </p>
      <p
        className={`text-[10px] font-mono tabular-nums mt-0.5 ${monoClass} truncate`}
      >
        {fmtNum(monthly, currency)}
        <span className="opacity-60"> / month</span>
      </p>
    </div>
  </div>
);

// ─── KPI Strip ────────────────────────────────────────────────────────────────

const PayrollKpiStrip: React.FC<{
  monthlyBase: number;
  gross: number;
  deductionsTotal: number;
  net: number;
  currency: string;
  earningsCount: number;
  deductionsCount: number;
}> = ({
  monthlyBase,
  gross,
  deductionsTotal,
  net,
  currency,
  earningsCount,
  deductionsCount,
}) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
    {(
      [
        {
          label: "Base Salary",
          monthly: monthlyBase,
          icon: <Banknote className="w-3.5 h-3.5" />,
          accentClass: "text-primary",
          bgClass: "bg-primary/5 dark:bg-primary/8",
          borderClass: "border-primary/15 dark:border-primary/20",
          iconBgClass: "bg-primary/10 dark:bg-primary/15",
          monoClass: "text-primary/50",
        },
        {
          label: `Gross Earnings · ${earningsCount}`,
          monthly: gross,
          icon: <TrendingUp className="w-3.5 h-3.5" />,
          accentClass: "text-emerald-600 dark:text-emerald-400",
          bgClass: "bg-emerald-50 dark:bg-emerald-900/10",
          borderClass: "border-emerald-200 dark:border-emerald-800",
          iconBgClass: "bg-emerald-100 dark:bg-emerald-900/30",
          monoClass: "text-emerald-600/50 dark:text-emerald-400/50",
        },
        {
          label: `Total Deductions · ${deductionsCount}`,
          monthly: deductionsTotal,
          icon: <TrendingDown className="w-3.5 h-3.5" />,
          accentClass: "text-red-600 dark:text-red-400",
          bgClass: "bg-red-50 dark:bg-red-900/10",
          borderClass: "border-red-200 dark:border-red-800",
          iconBgClass: "bg-red-100 dark:bg-red-900/30",
          monoClass: "text-red-600/50 dark:text-red-400/50",
        },
        {
          label: "Net Salary",
          monthly: net,
          icon: <Wallet className="w-3.5 h-3.5" />,
          accentClass: "text-violet-600 dark:text-violet-400",
          bgClass: "bg-violet-50 dark:bg-violet-900/10",
          borderClass: "border-violet-200 dark:border-violet-800",
          iconBgClass: "bg-violet-100 dark:bg-violet-900/30",
          monoClass: "text-violet-600/50 dark:text-violet-400/50",
        },
      ] as KpiChipProps[]
    ).map((chip) => (
      <KpiChip key={chip.label} {...chip} currency={currency} />
    ))}
  </div>
);

// ─── Composition Panel ────────────────────────────────────────────────────────

const CompositionPanel: React.FC<{
  gross: number;
  deductionsTotal: number;
  net: number;
  currency: string;
}> = ({ gross, deductionsTotal, net, currency }) => {
  const primaryColor = useCssVar("--primary", "#6366f1");
  const total = gross || 1;
  const netPct = Math.round((net / total) * 100);
  const dedPct = Math.round((deductionsTotal / total) * 100);

  const pieData = [
    { name: "Net Salary", value: net, color: primaryColor },
    { name: "Total Deductions", value: deductionsTotal, color: DED_COLOR },
    { name: "Gross Earnings", value: gross, color: EARN_COLOR },
  ];

  const metrics = [
    {
      label: "Gross Earnings",
      val: gross,
      annual: gross * 12,
      pct: 100,
      dotColor: EARN_COLOR,
      valColor: EARN_COLOR,
      highlight: false,
    },
    {
      label: "Total Deductions",
      val: deductionsTotal,
      annual: deductionsTotal * 12,
      pct: dedPct,
      dotColor: DED_COLOR,
      valColor: DED_COLOR,
      highlight: false,
    },
    {
      label: "Net Compensation",
      val: net,
      annual: net * 12,
      pct: netPct,
      dotColor: primaryColor,
      valColor: primaryColor,
      highlight: false,
    },
    {
      label: "In-Hand Salary",
      val: net,
      annual: null,
      pct: null,
      dotColor: primaryColor,
      valColor: primaryColor,
      highlight: true,
    },
  ] as const;

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const { name, value, color } = payload[0].payload;
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-md shadow-2xl px-3 py-2 min-w-[148px]">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <p className="text-[10px] font-semibold text-main leading-none">
            {name}
          </p>
        </div>
        <p className="text-[15px] font-bold tabular-nums text-main leading-tight">
          {fmtNum(value, currency)}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-muted">/ month</span>
          <span className="text-[9px] font-mono text-muted">
            p.a. {fmtNum(value * 12, currency)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
      <div className="flex items-center px-4 py-3">
        <div className="shrink-0 relative" style={{ width: 100, height: 100 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={46}
                stroke="none"
                strokeWidth={0}
                paddingAngle={1.5}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                isAnimationActive={false}
              >
                {pieData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.color}
                    stroke="none"
                    strokeWidth={0}
                  />
                ))}
              </Pie>
              <Tooltip
                content={<CustomTooltip />}
                cursor={false}
                wrapperStyle={{ outline: "none", zIndex: 50 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[8px] font-bold uppercase tracking-wider text-muted leading-none mb-0.5">
              Net
            </span>
            <span
              className="text-[16px] font-bold tabular-nums leading-none"
              style={{ color: primaryColor }}
            >
              {netPct}%
            </span>
          </div>
        </div>

        <div className="w-px self-stretch mx-4 bg-[var(--border)]" />

        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-0">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="flex items-start gap-2 py-2 border-b border-[var(--border)] last:border-0 [&:nth-last-child(2)]:border-0"
            >
              <span
                className="mt-[3px] shrink-0 w-1.5 h-1.5 rounded-full"
                style={{ background: m.dotColor }}
              />
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted truncate leading-none mb-0.5">
                  {m.label}
                </p>
                <p
                  className="text-[13px] font-bold tabular-nums leading-tight"
                  style={{ color: m.valColor }}
                >
                  {fmtNum(m.val, currency)}
                  {!m.highlight && (
                    <span className="text-[9px] font-normal text-muted ml-0.5">
                      / month
                    </span>
                  )}
                </p>
                {m.annual != null && (
                  <p className="text-[9px] font-mono text-muted tabular-nums leading-none mt-0.5">
                    {fmtNum(m.annual, currency)} p.a.
                    {m.pct != null && (
                      <span className="ml-1 opacity-60">· {m.pct}%</span>
                    )}
                  </p>
                )}
                {m.highlight && (
                  <p className="text-[9px] text-muted leading-none mt-0.5">
                    take-home / month
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Section Wrapper ──────────────────────────────────────────────────────────

const Sec: React.FC<{
  title: string;
  icon: React.ReactNode;
  accent?: string;
  children: React.ReactNode;
  collapsible?: boolean;
}> = ({
  title,
  icon,
  accent = "text-primary",
  children,
  collapsible = false,
}) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
      <div
        className={`flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-app ${collapsible ? "cursor-pointer select-none" : ""}`}
        onClick={collapsible ? () => setOpen((v) => !v) : undefined}
      >
        <div className="flex items-center gap-2">
          <span className={accent}>{icon}</span>
          <h3 className="text-[12px] font-bold text-main uppercase tracking-wider">
            {title}
          </h3>
        </div>
        {collapsible &&
          (open ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted" />
          ))}
      </div>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
};

// ─── Compensation Statement ───────────────────────────────────────────────────

const CompensationStatement: React.FC<{
  earnings: ComponentResult[];
  deductions: ComponentResult[];
  gross: number;
  deductionsTotal: number;
  net: number;
  currency: string;
  hasSalaryStructure: boolean;
}> = ({
  earnings,
  deductions,
  gross,
  deductionsTotal,
  net,
  currency,
  hasSalaryStructure,
}) => {
  const primaryColor = useCssVar("--primary", "#6366f1");

  if (!hasSalaryStructure)
    return (
      <div className="rounded-xl border border-[var(--border)] bg-card px-4 py-6 text-center">
        <p className="text-[12px] text-muted">
          No salary structure assigned to this employee.
        </p>
      </div>
    );

  const maxLen = Math.max(earnings.length, deductions.length);
  const earnPadded = [
    ...earnings,
    ...Array(Math.max(0, maxLen - earnings.length)).fill(null),
  ];
  const dedPadded = [
    ...deductions,
    ...Array(Math.max(0, maxLen - deductions.length)).fill(null),
  ];

  const footer = [
    {
      label: "Gross Earnings",
      val: gross,
      color: EARN_COLOR,
      prefix: "",
      borderRight: true,
      bg: "bg-app",
    },
    {
      label: "Total Deductions",
      val: deductionsTotal,
      color: DED_COLOR,
      prefix: "−",
      borderRight: true,
      bg: "bg-app",
    },
    {
      label: "Net Salary",
      val: net,
      color: primaryColor,
      prefix: "",
      borderRight: false,
      bg: "",
    },
  ];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
      <div className="grid grid-cols-2 border-b border-[var(--border)] bg-app">
        <div className="flex items-center justify-between px-3 py-2 border-r border-[var(--border)]">
          <span
            className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color: EARN_COLOR }}
          >
            Earnings
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted">
            Monthly
          </span>
        </div>
        <div className="flex items-center justify-between px-3 py-2">
          <span
            className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color: DED_COLOR }}
          >
            Deductions
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted">
            Monthly
          </span>
        </div>
      </div>

      {maxLen === 0 ? (
        <p className="px-4 py-4 text-[11px] text-muted text-center">
          No components defined.
        </p>
      ) : (
        earnPadded.map((earn, i) => {
          const ded = dedPadded[i];
          return (
            <div
              key={i}
              className={`grid grid-cols-2 ${i < maxLen - 1 ? "border-b border-[var(--border)]" : ""}`}
            >
              <div className="flex items-center justify-between px-3 py-1.5 border-r border-[var(--border)] hover:bg-[var(--row-hover)] transition-colors min-w-0">
                {earn ? (
                  <>
                    <span className="text-[11.5px] font-medium text-main truncate pr-2 leading-snug">
                      {earn.name}
                    </span>
                    <span
                      className="text-[11.5px] font-semibold tabular-nums shrink-0"
                      style={{ color: EARN_COLOR }}
                    >
                      {fmtNum(earn.amount, currency)}
                    </span>
                  </>
                ) : (
                  <span className="opacity-0 text-[11px]">—</span>
                )}
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 hover:bg-[var(--row-hover)] transition-colors min-w-0">
                {ded ? (
                  <>
                    <span className="text-[11.5px] font-medium text-main truncate pr-2 leading-snug">
                      {ded.name}
                    </span>
                    <span
                      className="text-[11.5px] font-semibold tabular-nums shrink-0"
                      style={{ color: DED_COLOR }}
                    >
                      −{fmtNum(ded.amount, currency)}
                    </span>
                  </>
                ) : (
                  <span className="opacity-0 text-[11px]">—</span>
                )}
              </div>
            </div>
          );
        })
      )}

      <div className="grid grid-cols-3 border-t-2 border-[var(--border)]">
        {footer.map(({ label, val, color, prefix, borderRight, bg }) => (
          <div
            key={label}
            className={`px-3 py-2.5 ${borderRight ? "border-r border-[var(--border)]" : ""} ${bg}`}
            style={
              !bg
                ? {
                    background: `color-mix(in srgb, ${primaryColor} 6%, transparent)`,
                  }
                : undefined
            }
          >
            <p className="text-[8.5px] font-bold uppercase tracking-wider text-muted mb-0.5">
              {label}
            </p>
            <p
              className="text-[13px] font-bold tabular-nums leading-tight"
              style={{ color }}
            >
              {prefix}
              {fmtNum(val, currency)}
            </p>
            <p className="text-[9px] font-mono text-muted tabular-nums">
              {prefix}
              {fmtNum(val * 12, currency)} p.a.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Bank Card ────────────────────────────────────────────────────────────────
const BankCard: React.FC<{
  emp: any;
  defaultAccount?: any;
}> = ({ emp, defaultAccount }) => (
  <div
    className={`rounded-xl border ${
      defaultAccount
        ? "border-[var(--border)]"
        : "border-dashed border-[var(--border)]"
    } overflow-hidden`}
  >
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black px-5 py-4">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            Payout Bank
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-[18px] font-bold text-white">
              {defaultAccount?.bankName || "Not configured"}
            </p>

            {Number(defaultAccount?.isDefault) === 1 && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />

                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Default Account
                </span>
              </div>
            )}
          </div>

          {defaultAccount?.accountHolderName && (
            <div className="mt-2 inline-flex items-center rounded-md bg-white/10 px-2 py-1">
              <p className="text-[10px] font-medium text-slate-200">
                {defaultAccount.accountHolderName}
              </p>
            </div>
          )}
        </div>

        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-white/70" />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] text-slate-400 mb-0.5 uppercase tracking-wider">
            Account No.
          </p>

          <p className="text-[14px] font-mono font-semibold text-white tracking-widest">
            {defaultAccount?.accountNo
              ? defaultAccount.accountNo.replace(/(.{4})/g, "$1 ").trim()
              : "•••• •••• ••••"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[9px] text-slate-400 mb-0.5 uppercase tracking-wider">
            Type
          </p>

          <p className="text-[12px] font-semibold text-white">
            {emp.salary_mode || "—"}
          </p>
        </div>
      </div>
    </div>

    <div className="bg-slate-100 dark:bg-slate-800 px-5 py-2.5 flex items-center justify-between">
      <div>
        <p className="text-[9px] text-muted uppercase tracking-wider">
          Sort Code
        </p>

        <p className="text-[11px] font-mono font-semibold text-main">
          {defaultAccount?.sortCode || "—"}
        </p>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-muted">
        <CreditCard className="w-3 h-3" />
        {emp.salary_mode || "Bank Transfer"}
      </div>
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

export const CompensationTab: React.FC<Props> = ({ emp, currency }) => {
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [salaryStructure, setSalaryStructure] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!emp.salary_structure) return;

    setLoading(true);
    getSalaryStructure(emp.salary_structure)
      .then(setSalaryStructure)
      .catch((e) => console.error("Salary structure fetch failed", e))
      .finally(() => setLoading(false));
  }, [emp.salary_structure]);
  useEffect(() => {
    console.log("EMP FULL OBJECT", emp);
    if (!emp?.employee) return;

    const fetchEmployeeBankAccounts = async () => {
      try {
        setBankLoading(true);

        const res = await getAllBankAccounts({
          party_type: "Employee",
          party: emp.employee,
          page: 1,
          page_size: 10,
        });

        setBankAccounts(res?.data || []);
      } catch (err: any) {
        showApiError(err);
      } finally {
        setBankLoading(false);
      }
    };

    fetchEmployeeBankAccounts();
  }, [emp?.employee]);
  //default key function for default acc
  const defaultBankAccount = bankAccounts.find(
    (acc) => Number(acc.isDefault) === 1,
  );

  const monthlyBase = emp.base_salary ?? emp.ctc ?? 0;

  const salaryResult = useMemo(() => {
    if (!salaryStructure) return null;
    return calculateSalary(monthlyBase, structureToComponents(salaryStructure));
  }, [salaryStructure, monthlyBase]);

  const earnings =
    salaryResult?.components.filter((c) => c.type === "Earning") ?? [];
  const deductions =
    salaryResult?.components.filter((c) => c.type === "Deduction") ?? [];
  const gross = salaryResult?.gross ?? 0;
  const deductionsTotal = salaryResult?.deductionsTotal ?? 0;
  const net = salaryResult?.net ?? 0;

  if (loading)
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[68px] rounded-xl bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
        <div className="h-36 rounded-xl bg-gray-100 dark:bg-gray-800" />
        <div className="h-52 rounded-xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <PayrollKpiStrip
        monthlyBase={monthlyBase}
        gross={gross}
        deductionsTotal={deductionsTotal}
        net={net}
        currency={currency}
        earningsCount={earnings.length}
        deductionsCount={deductions.length}
      />
      {gross > 0 && (
        <CompositionPanel
          gross={gross}
          deductionsTotal={deductionsTotal}
          net={net}
          currency={currency}
        />
      )}
      <CompensationStatement
        earnings={earnings}
        deductions={deductions}
        gross={gross}
        deductionsTotal={deductionsTotal}
        net={net}
        currency={currency}
        hasSalaryStructure={!!salaryStructure}
      />
      <Sec
        title="Bank & Payment Details"
        icon={<CreditCard className="w-3.5 h-3.5" />}
      >
        <div className="flex flex-col gap-4">
          <BankCard emp={emp} defaultAccount={defaultBankAccount} />
        </div>
      </Sec>
    </div>
  );
};
