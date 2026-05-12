import React, { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  emp: any;
  currency: string;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmtNum = (n: number, cur: string) =>
  fmtMoney(n, cur) ??
  `${cur} ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const monthly = (annual: number) => annual / 12;

// ─── Compact KPI Chip ─────────────────────────────────────────────────────────

interface KpiChipProps {
  label: string;
  annual: number;
  currency: string;
  icon: React.ReactNode;
  accentClass: string;       // text color for icon + value
  bgClass: string;           // background tint
  borderClass: string;       // border
  iconBgClass: string;       // icon container bg
  monoClass: string;         // monthly label color
}

const KpiChip: React.FC<KpiChipProps> = ({
  label,
  annual,
  currency,
  icon,
  accentClass,
  bgClass,
  borderClass,
  iconBgClass,
  monoClass,
}) => (
  <div
    className={`
      flex items-center gap-3 px-3.5 py-2.5
      rounded-xl border ${bgClass} ${borderClass}
      min-w-0 flex-1
    `}
  >
    {/* Icon */}
    <div
      className={`
        w-7 h-7 shrink-0 rounded-lg
        flex items-center justify-center
        ${iconBgClass}
      `}
    >
      <span className={accentClass}>{icon}</span>
    </div>

    {/* Text block */}
    <div className="min-w-0 flex-1">
      <p className="text-[9.5px] font-bold uppercase tracking-wider text-muted truncate mb-0.5">
        {label}
      </p>
      <p className={`text-[14px] font-bold tabular-nums leading-none ${accentClass} truncate`}>
        {fmtNum(annual, currency)}
        <span className="text-[9px] font-normal text-muted ml-1">p.a.</span>
      </p>
      <p className={`text-[10px] font-mono tabular-nums mt-0.5 ${monoClass} truncate`}>
        {fmtNum(monthly(annual), currency)}&thinsp;<span className="opacity-60">/ mo</span>
      </p>
    </div>
  </div>
);

// ─── Payroll KPI Strip ────────────────────────────────────────────────────────

interface PayrollKpiStripProps {
  ctcAnnual: number;
  gross: number;
  deductionsTotal: number;
  net: number;
  currency: string;
  earningsCount: number;
  deductionsCount: number;
}

const PayrollKpiStrip: React.FC<PayrollKpiStripProps> = ({
  ctcAnnual,
  gross,
  deductionsTotal,
  net,
  currency,
  earningsCount,
  deductionsCount,
}) => {
  const chips: KpiChipProps[] = [
    {
      label: "Annual CTC",
      annual: ctcAnnual,
      currency,
      icon: <DollarSign className="w-3.5 h-3.5" />,
      accentClass: "text-primary",
      bgClass: "bg-primary/5 dark:bg-primary/8",
      borderClass: "border-primary/15 dark:border-primary/20",
      iconBgClass: "bg-primary/10 dark:bg-primary/15",
      monoClass: "text-primary/50",
    },
    {
      label: `Gross · ${earningsCount} components`,
      annual: gross,
      currency,
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      accentClass: "text-emerald-600 dark:text-emerald-400",
      bgClass: "bg-emerald-50 dark:bg-emerald-900/10",
      borderClass: "border-emerald-200 dark:border-emerald-800",
      iconBgClass: "bg-emerald-100 dark:bg-emerald-900/30",
      monoClass: "text-emerald-600/50 dark:text-emerald-400/50",
    },
    {
      label: `Deductions · ${deductionsCount} components`,
      annual: deductionsTotal,
      currency,
      icon: <TrendingDown className="w-3.5 h-3.5" />,
      accentClass: "text-red-600 dark:text-red-400",
      bgClass: "bg-red-50 dark:bg-red-900/10",
      borderClass: "border-red-200 dark:border-red-800",
      iconBgClass: "bg-red-100 dark:bg-red-900/30",
      monoClass: "text-red-600/50 dark:text-red-400/50",
    },
    {
      label: "Net Pay",
      annual: net,
      currency,
      icon: <Wallet className="w-3.5 h-3.5" />,
      accentClass: "text-violet-600 dark:text-violet-400",
      bgClass: "bg-violet-50 dark:bg-violet-900/10",
      borderClass: "border-violet-200 dark:border-violet-800",
      iconBgClass: "bg-violet-100 dark:bg-violet-900/30",
      monoClass: "text-violet-600/50 dark:text-violet-400/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {chips.map((chip) => (
        <KpiChip key={chip.label} {...chip} />
      ))}
    </div>
  );
};

// ─── CSS var reader ───────────────────────────────────────────────────────────

function useCssVar(name: string, fallback: string): string {
  const [value, setValue] = React.useState(fallback);
  useEffect(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (v) setValue(v);
  }, [name]);
  return value;
}

const DED_COLOR  = "#f87171";   // red — stable across all themes
const EARN_COLOR = "#34d399";   // emerald — stable across all themes

// ─── Compact Composition Panel ────────────────────────────────────────────────

const CompositionPanel: React.FC<{
  gross: number;
  deductionsTotal: number;
  net: number;
  currency: string;
}> = ({ gross, deductionsTotal, net, currency }) => {
  const primaryColor = useCssVar("--primary", "#6366f1");

  const total = gross || 1;
  const netPct  = Math.round((net            / total) * 100);
  const dedPct  = Math.round((deductionsTotal / total) * 100);
  const earnPct = 100;

  // Three-segment donut: earnings, deductions, net-pay
  const pieData = [
    { name: "Net Pay",        value: net,            color: primaryColor },
    { name: "Deductions",     value: deductionsTotal, color: DED_COLOR   },
    { name: "Gross Earnings", value: gross,           color: EARN_COLOR  },
  ];

  // Four right-side metric chips
  const metrics = [
    {
      label:     "Gross Earnings",
      monthly:   fmtNum(monthly(gross),           currency),
      annual:    fmtNum(gross,                    currency),
      pct:       earnPct,
      dotColor:  EARN_COLOR,
      valColor:  EARN_COLOR,
      highlight: false,
    },
    {
      label:     "Deductions",
      monthly:   fmtNum(monthly(deductionsTotal), currency),
      annual:    fmtNum(deductionsTotal,           currency),
      pct:       dedPct,
      dotColor:  DED_COLOR,
      valColor:  DED_COLOR,
      highlight: false,
    },
    {
      label:     "Net Compensation",
      monthly:   fmtNum(monthly(net),             currency),
      annual:    fmtNum(net,                       currency),
      pct:       netPct,
      dotColor:  primaryColor,
      valColor:  primaryColor,
      highlight: false,
    },
    {
      label:     "Monthly In-Hand",
      monthly:   fmtNum(monthly(net),             currency),
      annual:    null,
      pct:       null,
      dotColor:  primaryColor,
      valColor:  primaryColor,
      highlight: true,
    },
  ] as const;

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0].payload;
    return (
      <div className="rounded-lg border border-[var(--border)] bg-card shadow-lg px-2.5 py-1.5">
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted mb-0.5">{name}</p>
        <p className="text-[12px] font-bold text-main tabular-nums">
          {fmtNum(monthly(value), currency)}
          <span className="text-[9px] text-muted font-normal"> /mo</span>
        </p>
        <p className="text-[9px] font-mono text-muted tabular-nums">{fmtNum(value, currency)} p.a.</p>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
      {/* Single compact row: donut LEFT · metrics RIGHT */}
      <div className="flex items-center gap-0 px-4 py-3">

        {/* ── Donut: larger, breathing room, clean ── */}
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
                  <Cell key={i} fill={entry.color} stroke="none" strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center: net % */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[8px] font-bold uppercase tracking-wider text-muted leading-none mb-0.5">Net</span>
            <span className="text-[16px] font-bold tabular-nums leading-none" style={{ color: primaryColor }}>
              {netPct}%
            </span>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="w-px self-stretch mx-4 bg-[var(--border)]" />

        {/* ── Metric chips: 2×2 grid ── */}
        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-0">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="flex items-start gap-2 py-2 border-b border-[var(--border)] last:border-0 [&:nth-last-child(2)]:border-0"
            >
              {/* Dot */}
              <span
                className="mt-[3px] shrink-0 w-1.5 h-1.5 rounded-full"
                style={{ background: m.dotColor }}
              />
              {/* Text */}
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted truncate leading-none mb-0.5">
                  {m.label}
                </p>
                <p
                  className="text-[13px] font-bold tabular-nums leading-tight"
                  style={{ color: m.valColor }}
                >
                  {m.monthly}
                  {!m.highlight && (
                    <span className="text-[9px] font-normal text-muted ml-0.5">/mo</span>
                  )}
                </p>
                {m.annual && (
                  <p className="text-[9px] font-mono text-muted tabular-nums leading-none mt-0.5">
                    {m.annual}
                    {m.pct !== null && (
                      <span className="ml-1 opacity-60">{m.pct}%</span>
                    )}
                  </p>
                )}
                {m.highlight && (
                  <p className="text-[9px] text-muted leading-none mt-0.5">take-home</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Section Wrapper ───────────────────────────────────────────────────────────

const Sec: React.FC<{
  title: string;
  icon: React.ReactNode;
  accent?: string;
  children: React.ReactNode;
  collapsible?: boolean;
}> = ({ title, icon, accent = "text-primary", children, collapsible = false }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
      <div
        className={`flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-app ${collapsible ? "cursor-pointer select-none" : ""}`}
        onClick={collapsible ? () => setOpen((v) => !v) : undefined}
      >
        <div className="flex items-center gap-2">
          <span className={`${accent}`}>{icon}</span>
          <h3 className="text-[12px] font-bold text-main uppercase tracking-wider">{title}</h3>
        </div>
        {collapsible &&
          (open ? <ChevronUp className="w-3.5 h-3.5 text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-muted" />)}
      </div>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
};

// ─── Unified Compensation Statement ──────────────────────────────────────────

const CompensationStatement: React.FC<{
  earnings: ComponentResult[];
  deductions: ComponentResult[];
  gross: number;
  deductionsTotal: number;
  net: number;
  currency: string;
  hasSalaryStructure: boolean;
}> = ({ earnings, deductions, gross, deductionsTotal, net, currency, hasSalaryStructure }) => {
  const primaryColor = useCssVar("--primary", "#6366f1");

  if (!hasSalaryStructure) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-card px-4 py-6 text-center">
        <p className="text-[12px] text-muted">No salary structure assigned to this employee.</p>
      </div>
    );
  }

  // Pad the shorter list so both columns have equal row count
  const maxLen = Math.max(earnings.length, deductions.length);
  const earnPadded  = [...earnings,   ...Array(Math.max(0, maxLen - earnings.length)).fill(null)];
  const dedPadded   = [...deductions, ...Array(Math.max(0, maxLen - deductions.length)).fill(null)];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">

      {/* ── Column headers ── */}
      <div className="grid grid-cols-2 border-b border-[var(--border)] bg-app">
        {/* Earnings header */}
        <div className="flex items-center justify-between px-3 py-2 border-r border-[var(--border)]">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: EARN_COLOR }}>
            Earnings
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted">Monthly</span>
        </div>
        {/* Deductions header */}
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: DED_COLOR }}>
            Deductions
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted">Monthly</span>
        </div>
      </div>

      {/* ── Side-by-side rows ── */}
      {maxLen === 0 ? (
        <p className="px-4 py-4 text-[11px] text-muted text-center">No components defined.</p>
      ) : (
        earnPadded.map((earn, i) => {
          const ded = dedPadded[i];
          const isLast = i === maxLen - 1;
          return (
            <div
              key={i}
              className={`grid grid-cols-2 ${!isLast ? "border-b border-[var(--border)]" : ""}`}
            >
              {/* Earning cell */}
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
                      {fmtNum(monthly(earn.amount), currency)}
                    </span>
                  </>
                ) : (
                  <span className="text-muted opacity-0 select-none text-[11px]">—</span>
                )}
              </div>

              {/* Deduction cell */}
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
                      −{fmtNum(monthly(ded.amount), currency)}
                    </span>
                  </>
                ) : (
                  <span className="text-muted opacity-0 select-none text-[11px]">—</span>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* ── Three-column totals footer ── */}
      <div className="grid grid-cols-3 border-t-2 border-[var(--border)]">
        {/* Total Earnings */}
        <div className="px-3 py-2.5 border-r border-[var(--border)] bg-app">
          <p className="text-[8.5px] font-bold uppercase tracking-wider text-muted mb-0.5">Total Earnings</p>
          <p className="text-[13px] font-bold tabular-nums leading-tight" style={{ color: EARN_COLOR }}>
            {fmtNum(monthly(gross), currency)}
          </p>
          <p className="text-[9px] font-mono text-muted tabular-nums">{fmtNum(gross, currency)}</p>
        </div>

        {/* Total Deductions */}
        <div className="px-3 py-2.5 border-r border-[var(--border)] bg-app">
          <p className="text-[8.5px] font-bold uppercase tracking-wider text-muted mb-0.5">Deductions</p>
          <p className="text-[13px] font-bold tabular-nums leading-tight" style={{ color: DED_COLOR }}>
            −{fmtNum(monthly(deductionsTotal), currency)}
          </p>
          <p className="text-[9px] font-mono text-muted tabular-nums">−{fmtNum(deductionsTotal, currency)}</p>
        </div>

        {/* Net Pay */}
        <div
          className="px-3 py-2.5"
          style={{ background: `color-mix(in srgb, ${primaryColor} 6%, transparent)` }}
        >
          <p
            className="text-[8.5px] font-bold uppercase tracking-wider mb-0.5"
            style={{ color: `color-mix(in srgb, ${primaryColor} 65%, transparent)` }}
          >
            Net Pay
          </p>
          <p className="text-[13px] font-bold tabular-nums leading-tight" style={{ color: primaryColor }}>
            {fmtNum(monthly(net), currency)}
          </p>
          <p className="text-[9px] font-mono text-muted tabular-nums">{fmtNum(net, currency)}</p>
        </div>
      </div>
    </div>
  );
};

// ── Bank Card ─────────────────────────────────────────────────────────────────

const BankCard: React.FC<{ emp: any }> = ({ emp }) => {
  const hasBank = emp.bank_name || emp.bank_ac_no;
  return (
    <div className={`rounded-xl border ${hasBank ? "border-[var(--border)]" : "border-dashed border-[var(--border)]"} overflow-hidden`}>
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black px-5 py-4">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Payout Bank</p>
            <p className="text-[15px] font-bold text-white">{fmt(emp.bank_name) || "Not configured"}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white/70" />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] text-slate-400 mb-0.5 uppercase tracking-wider">Account No.</p>
            <p className="text-[14px] font-mono font-semibold text-white tracking-widest">
              {emp.bank_ac_no ? emp.bank_ac_no.replace(/(.{4})/g, "$1 ").trim() : "•••• •••• ••••"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-slate-400 mb-0.5 uppercase tracking-wider">Type</p>
            <p className="text-[12px] font-semibold text-white">{fmt(emp.account_type) || "—"}</p>
          </div>
        </div>
      </div>
      <div className="bg-slate-100 dark:bg-slate-800 px-5 py-2.5 flex items-center justify-between">
        <div>
          <p className="text-[9px] text-muted uppercase tracking-wider">Branch Code</p>
          <p className="text-[11px] font-mono font-semibold text-main">{fmt(emp.branch_code) || "—"}</p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted">
          <CreditCard className="w-3 h-3" />
          {fmt(emp.salary_mode) || "Bank Transfer"}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const CompensationTab: React.FC<Props> = ({ emp, currency }) => {
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

  const salaryResult = useMemo(() => {
    if (!salaryStructure) return null;
    return calculateSalary(emp.ctc || 0, structureToComponents(salaryStructure));
  }, [salaryStructure, emp.ctc]);

  const earnings = salaryResult?.components.filter((c) => c.type === "Earning") ?? [];
  const deductions = salaryResult?.components.filter((c) => c.type === "Deduction") ?? [];
  const gross = salaryResult?.gross ?? 0;
  const deductionsTotal = salaryResult?.deductionsTotal ?? 0;
  const net = salaryResult?.net ?? 0;
  const ctcAnnual = emp.ctc ?? 0;

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[68px] rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
        <div className="h-36 rounded-xl bg-gray-100 dark:bg-gray-800" />
        <div className="h-52 rounded-xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── 1. Compact KPI Chips ─────────────────────────────────────────── */}
      <PayrollKpiStrip
        ctcAnnual={ctcAnnual}
        gross={gross}
        deductionsTotal={deductionsTotal}
        net={net}
        currency={currency}
        earningsCount={earnings.length}
        deductionsCount={deductions.length}
      />

      {/* ── 2. Compensation Distribution (donut + breakdown inline) ──────── */}
      {gross > 0 && (
        <CompositionPanel
          gross={gross}
          deductionsTotal={deductionsTotal}
          net={net}
          currency={currency}
        />
      )}

      {/* ── 3. Unified Compensation Statement ────────────────────────────── */}
      <CompensationStatement
        earnings={earnings}
        deductions={deductions}
        gross={gross}
        deductionsTotal={deductionsTotal}
        net={net}
        currency={currency}
        hasSalaryStructure={!!salaryStructure}
      />

      {/* ── 5. Bank & Payment Details ─────────────────────────────────────── */}
      <Sec title="Bank & Payment Details" icon={<CreditCard className="w-3.5 h-3.5" />}>
        <BankCard emp={emp} />
      </Sec>
    </div>
  );
};