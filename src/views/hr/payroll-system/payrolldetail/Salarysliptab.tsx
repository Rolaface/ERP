import React, { useEffect, useState } from "react";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Layers,
  BarChart2,
  DollarSign,
  CheckCircle2,
  Download,
  Share2,
  Printer,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  getSalarySlipsByEmployee,
  getSalarySlipDetail,
  type SalarySlip,
  type SalaryDetail,
  type PayrollEmployeeDetail,
} from "../../../../api/payroll/payrollEntryApi";
import { StatusBadge } from "./Payrollsharedcomponents";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  employee: PayrollEmployeeDetail;
  payrollEntryId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtINR(amount: number): string {
  return `₹${Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function fmtCurrency(currency: string, amount: number): string {
  if (currency === "INR") return fmtINR(amount);
  return `${currency} ${Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function fmtCrLakh(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(2)} L`;
  return fmtINR(amount);
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/**
 * Returns a display-friendly percentage string.
 * - amount > 0 && pct >= 1  → "71%"
 * - amount > 0 && pct < 1   → "<1%"
 * - amount === 0             → "0%"
 */
function fmtPct(amount: number, total: number): string {
  if (total <= 0 || amount <= 0) return "0%";
  const pct = (amount / total) * 100;
  if (pct < 1) return "<1%";
  return `${Math.round(pct)}%`;
}

/** Exact decimal % string for tooltip. */
function exactPct(amount: number, total: number): string {
  if (total <= 0 || amount <= 0) return "0%";
  return `${((amount / total) * 100).toFixed(2)}%`;
}

// Finance-grade chart palette — cycles for any number of components
const CHART_PALETTE = [
  "#185FA5",
  "#1D9E75",
  "#BA7517",
  "#8B5CF6",
  "#EC4899",
  "#0891B2",
  "#059669",
  "#D97706",
];

// Minimum visual arc in degrees so tiny slices are still visible in the donut
const MIN_SLICE_DEG = 4;

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`relative overflow-hidden rounded-lg ${className}`}
    style={{ background: "var(--skeleton-base, #e5e7eb)" }}
  >
    <div className="absolute inset-0 skeleton-shimmer" />
  </div>
);

const SkeletonCard: React.FC = () => (
  <div
    className="rounded-xl p-5 space-y-3"
    style={{ border: "1px solid var(--border)" }}
  >
    <Skeleton className="h-3 w-24" />
    <Skeleton className="h-7 w-36" />
    <Skeleton className="h-2 w-20" />
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-5">
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-28" />
            <div className="flex gap-2 mt-1">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-28 rounded-full" />
            </div>
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-3 w-24 ml-auto" />
          <Skeleton className="h-9 w-36 ml-auto" />
        </div>
      </div>
      <div className="flex gap-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
    <div className="grid grid-cols-4 gap-3">
      {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
    </div>
    <div className="grid grid-cols-4 gap-3">
      {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
    </div>
    <div className="grid grid-cols-2 gap-4">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-xl p-4" style={{ border: "1px solid var(--border)" }}>
          <Skeleton className="h-3 w-32 mb-4" />
          <Skeleton className="h-48 w-full" />
        </div>
      ))}
    </div>
  </div>
);

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  valueStyle?: React.CSSProperties;
  icon: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, valueStyle, icon }) => (
  <div
    className="flex flex-col gap-1 p-4 rounded-xl"
    style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
  >
    <div className="flex items-center justify-between mb-1">
      <p
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </p>
      <span style={{ color: "var(--muted)", opacity: 0.4 }}>{icon}</span>
    </div>
    <p className="text-base font-semibold" style={valueStyle ?? { color: "var(--text)" }}>
      {value}
    </p>
    {sub && (
      <p className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>
        {sub}
      </p>
    )}
  </div>
);

// ─── Accordion ────────────────────────────────────────────────────────────────

const Accordion: React.FC<{
  title: React.ReactNode;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, badge, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors"
        style={{ background: "var(--bg)" }}
      >
        <span
          className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          {title}
          {badge}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4" style={{ color: "var(--muted)" }} />
        ) : (
          <ChevronDown className="w-4 h-4" style={{ color: "var(--muted)" }} />
        )}
      </button>
      {open && <div className="px-4 pb-2">{children}</div>}
    </div>
  );
};

// ─── Meta Row ─────────────────────────────────────────────────────────────────

const MetaRow: React.FC<{
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div
    className="flex items-center justify-between py-2.5 last:border-0"
    style={{ borderBottom: "1px solid var(--border)" }}
  >
    <span className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
      {icon}
      {label}
    </span>
    <span className="text-xs font-medium text-right max-w-[60%]" style={{ color: "var(--text)" }}>
      {value}
    </span>
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  right?: React.ReactNode;
  iconColor?: string;
}> = ({ icon, title, right, iconColor }) => (
  <div
    className="px-4 py-3 flex items-center justify-between"
    style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}
  >
    <p
      className="text-[11px] font-semibold uppercase tracking-widest flex items-center gap-2"
      style={{ color: "var(--muted)" }}
    >
      <span style={{ color: iconColor ?? "var(--muted)" }}>{icon}</span>
      {title}
    </p>
    {right && <div>{right}</div>}
  </div>
);

// ─── Component Row (Earnings / Deductions) ────────────────────────────────────

const ComponentRow: React.FC<{
  component: SalaryDetail;
  currency: string;
  total: number;
  color: string;
  accent: "green" | "red";
}> = ({ component, currency, total, color, accent }) => {
  const amount = Number(component.amount) || 0;
  const ytd = Number(component.year_to_date) || 0;
  const displayPct = fmtPct(amount, total);

  // Bar fill: always at least 1px-wide if non-zero so it's visible
  const barPct =
    total > 0 && amount > 0 ? Math.max(1, (amount / total) * 100) : 0;

  const amtStyle: React.CSSProperties =
    accent === "green"
      ? amount === 0
        ? { color: "var(--muted)" }
        : { color: "var(--success)" }
      : amount === 0
      ? { color: "var(--muted)" }
      : { color: "var(--danger)" };

  return (
    <div
      className="flex items-center gap-3 py-3 last:border-0"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      {/* Abbr badge */}
      <span
        className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded shrink-0 min-w-[36px] text-center"
        style={{
          color: "var(--muted)",
          background: "var(--bg)",
          border: "1px solid var(--border)",
        }}
      >
        {component.abbr}
      </span>

      {/* Component name */}
      <span className="flex-1 text-sm truncate min-w-0" style={{ color: "var(--text)" }}>
        {component.salary_component}
      </span>

      {/* Progress bar */}
      <div
        className="w-20 h-1.5 rounded-full overflow-hidden shrink-0"
        style={{ background: "var(--border)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${barPct}%`, backgroundColor: color }}
        />
      </div>

      {/* Percentage */}
      <span
        className="text-[11px] w-8 text-right shrink-0"
        style={{ color: "var(--muted)" }}
      >
        {displayPct}
      </span>

      {/* Amount */}
      <span className="text-sm font-semibold w-28 text-right shrink-0" style={amtStyle}>
        {fmtCurrency(currency, amount)}
      </span>

      {/* YTD — XL only */}
      <span
        className="text-[11px] w-28 text-right shrink-0 hidden xl:block"
        style={{ color: "var(--muted)" }}
      >
        YTD: {fmtCurrency(currency, ytd)}
      </span>
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ employeeName: string }> = ({ employeeName }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-4">
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center"
      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
    >
      <FileText className="w-8 h-8" style={{ color: "var(--muted)", opacity: 0.4 }} />
    </div>
    <div className="text-center">
      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
        No salary slip found
      </p>
      <p className="text-xs mt-1 max-w-xs leading-relaxed" style={{ color: "var(--muted)" }}>
        No salary slip has been generated for{" "}
        <span className="font-semibold" style={{ color: "var(--text)" }}>
          {employeeName}
        </span>{" "}
        yet.
      </p>
    </div>
  </div>
);

// ─── Bar Tooltip ──────────────────────────────────────────────────────────────

const CustomBarTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-sm space-y-1"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        color: "var(--text)",
      }}
    >
      <p className="font-semibold">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmtINR(p.value)}
        </p>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const SalarySlipTab: React.FC<Props> = ({ employee }) => {
  const [loading, setLoading] = useState(false);
  const [slip, setSlip] = useState<SalarySlip | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setSlip(null);
      try {
        const list = await getSalarySlipsByEmployee(employee.employee);
        if (list?.[0]?.name) {
          const detail = await getSalarySlipDetail(list[0].name);
          setSlip(detail ?? null);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [employee.employee]);

  if (loading) return <LoadingSkeleton />;
  if (!slip) return <EmptyState employeeName={employee.employee_name} />;

  // ── Derived values ──────────────────────────────────────────────────────────
  const gross          = Number(slip.gross_pay) || 0;
  const net            = Number(slip.net_pay) || 0;
  const totalDeduction = Number(slip.total_deduction) || 0;
  const ctc            = Number(slip.ctc) || 0;
  const rounded        = Number(slip.rounded_total) || net;

  const earnings: SalaryDetail[]   = slip.earnings ?? [];
  const deductions: SalaryDetail[] = slip.deductions ?? [];
  const activeDeductions            = deductions.filter((d) => Number(d.amount) > 0);
  const isNonTaxable                = !slip.annual_taxable_amount && !slip.total_income_tax;

  // ── Pie / donut chart data ─────────────────────────────────────────────────
  // Real amounts used for legend + tooltip; inflated values used only for
  // rendering so that tiny slices still produce a visible arc.
  const earningsWithAmt = earnings.filter((e) => Number(e.amount) > 0);
  const totalReal       = earningsWithAmt.reduce((s, e) => s + Number(e.amount), 0);

  interface PieEntry {
    name: string;
    value: number;   // possibly inflated for rendering
    realValue: number;
    total: number;
    color: string;
  }

  const pieData: PieEntry[] = (() => {
    if (!earningsWithAmt.length) return [];

    const items = earningsWithAmt.map((e, i) => ({
      name: e.salary_component,
      realValue: Number(e.amount),
      color: CHART_PALETTE[i % CHART_PALETTE.length],
      naturalDeg: (Number(e.amount) / totalReal) * 360,
    }));

    const smallItems = items.filter((it) => it.naturalDeg < MIN_SLICE_DEG);
    const boostedDeg = smallItems.length * MIN_SLICE_DEG;
    const largeItems = items.filter((it) => it.naturalDeg >= MIN_SLICE_DEG);
    const naturalLargeDeg = largeItems.reduce((s, it) => s + it.naturalDeg, 0);
    const remainingDeg = 360 - boostedDeg;

    return items.map((it) => {
      let renderDeg: number;
      if (it.naturalDeg < MIN_SLICE_DEG) {
        renderDeg = MIN_SLICE_DEG;
      } else {
        renderDeg = naturalLargeDeg > 0
          ? (it.naturalDeg / naturalLargeDeg) * remainingDeg
          : it.naturalDeg;
      }
      return {
        name: it.name,
        value: (renderDeg / 360) * totalReal, // inflated render value
        realValue: it.realValue,              // always real for tooltip/legend
        total: totalReal,
        color: it.color,
      };
    });
  })();

  // ── Bar chart ──────────────────────────────────────────────────────────────
  const barData = [
    {
      month: slip.start_date?.slice(0, 7) ?? "This Month",
      "Net Pay": net,
      Deductions: totalDeduction,
    },
  ];

  return (
    <div className="space-y-5">

      {/* ════════════════════════════════════════════════════
          HERO CARD
      ════════════════════════════════════════════════════ */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)", background: "var(--card)" }}
      >
        {/* Employee identity + net pay */}
        <div className="px-5 py-5 flex items-start justify-between gap-4 flex-wrap">
          {/* Avatar + Info */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold flex-shrink-0"
              style={{
                background: "rgba(192,132,61,0.1)",
                color: "var(--primary)",
              }}
            >
              {initials(slip.employee_name)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base font-semibold" style={{ color: "var(--text)" }}>
                  {slip.employee_name}
                </p>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded"
                  style={{
                    color: "var(--muted)",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {slip.employee}
                </span>
                <StatusBadge status={slip.status} />
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {slip.designation} · {slip.department}
              </p>
              {/* Key context chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{
                    color: "var(--primary)",
                    background: "var(--gradient-subtle, rgba(192,132,61,0.06))",
                    border: "1px solid var(--border)",
                  }}
                >
                  <Layers className="w-3 h-3" />
                  {slip.salary_structure}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{
                    color: "var(--muted)",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <Calendar className="w-3 h-3" />
                  {slip.start_date} – {slip.end_date}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{
                    color: "var(--muted)",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <CreditCard className="w-3 h-3" />
                  {slip.payroll_frequency} · {slip.mode_of_payment}
                </span>
              </div>
            </div>
          </div>

          {/* Net Take-Home — visual focal point */}
          <div className="text-right flex-shrink-0">
            <p
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--muted)" }}
            >
              Net Take-Home
            </p>
            <p
              className="text-3xl font-semibold mt-1 leading-none"
              style={{ color: "var(--success)" }}
            >
              {fmtCurrency(slip.currency, net)}
            </p>
            <p
              className="text-[11px] mt-1 max-w-[240px] truncate"
              style={{ color: "var(--muted)" }}
            >
              {slip.total_in_words}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>
              Posted: {slip.posting_date}
            </p>
          </div>
        </div>

        {/* Action bar */}
        <div
          className="px-5 py-3 flex flex-wrap gap-2"
          style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}
        >
          <button className="btn btn-primary inline-flex items-center gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" />
            Download Payslip
          </button>
          <button className="btn btn-outline inline-flex items-center gap-1.5 text-xs">
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
          <button className="btn btn-outline inline-flex items-center gap-1.5 text-xs">
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          KPI CARDS
      ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label="Gross Pay"
          value={fmtCurrency(slip.currency, gross)}
          sub="Before deductions"
          valueStyle={{ color: "var(--info)" }}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <KpiCard
          label="Net Pay"
          value={fmtCurrency(slip.currency, net)}
          sub="Take-home"
          valueStyle={{ color: "var(--success)" }}
          icon={<CheckCircle2 className="w-4 h-4" />}
        />
        <KpiCard
          label="Total Deductions"
          value={fmtCurrency(slip.currency, totalDeduction)}
          sub={totalDeduction === 0 ? "No deductions" : undefined}
          valueStyle={
            totalDeduction === 0
              ? { color: "var(--muted)" }
              : { color: "var(--danger)" }
          }
          icon={<TrendingDown className="w-4 h-4" />}
        />
        <KpiCard
          label="Annual CTC"
          value={ctc ? fmtCrLakh(ctc) : "—"}
          sub={ctc ? `≈ ${fmtCurrency(slip.currency, Math.round(ctc / 12))}/mo` : undefined}
          valueStyle={{ color: "var(--text)" }}
          icon={<BarChart2 className="w-4 h-4" />}
        />
      </div>

      {/* ════════════════════════════════════════════════════
          ATTENDANCE TILES
      ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label="Working Days"
          value={String(slip.total_working_days)}
          icon={<Calendar className="w-4 h-4" />}
        />
        <KpiCard
          label="Paid Days"
          value={String(slip.payment_days)}
          valueStyle={{ color: "var(--success)" }}
          icon={<Calendar className="w-4 h-4" />}
        />
        <KpiCard
          label="Absent Days"
          value={String(slip.absent_days || 0)}
          valueStyle={
            slip.absent_days
              ? { color: "var(--danger)" }
              : { color: "var(--muted)" }
          }
          icon={<Calendar className="w-4 h-4" />}
        />
        <KpiCard
          label="Leave w/o Pay"
          value={String(slip.leave_without_pay || 0)}
          valueStyle={
            slip.leave_without_pay
              ? { color: "var(--danger)" }
              : { color: "var(--muted)" }
          }
          icon={<Calendar className="w-4 h-4" />}
        />
      </div>

      {/* ════════════════════════════════════════════════════
          ANALYTICS CHARTS
      ════════════════════════════════════════════════════ */}
      {pieData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Donut — earnings composition */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)", background: "var(--card)" }}
          >
            <SectionHeader
              icon={<BarChart2 className="w-3.5 h-3.5" />}
              title="Earnings composition"
              iconColor="var(--info)"
              right={
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: "var(--info)" }}
                >
                  {fmtCurrency(slip.currency, gross)}
                </span>
              }
            />
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  {/* Custom tooltip always shows real value + exact % */}
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as PieEntry;
                      return (
                        <div
                          className="rounded-lg px-3 py-2 text-xs shadow-sm"
                          style={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            color: "var(--text)",
                          }}
                        >
                          <p className="font-semibold">{d.name}</p>
                          <p className="mt-0.5" style={{ color: "var(--muted)" }}>
                            {fmtINR(d.realValue)}
                          </p>
                          <p style={{ color: "var(--primary)" }}>
                            {exactPct(d.realValue, d.total)}
                          </p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend — built from real data, never inflated */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                {earningsWithAmt.map((e, i) => {
                  const amt = Number(e.amount);
                  return (
                    <span
                      key={e.name}
                      className="flex items-center gap-1.5 text-[11px]"
                      style={{ color: "var(--muted)" }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] }}
                      />
                      {e.salary_component}{" "}
                      <span className="font-semibold" style={{ color: "var(--text)" }}>
                        {fmtPct(amt, totalReal)}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bar — pay breakdown */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)", background: "var(--card)" }}
          >
            <SectionHeader
              icon={<TrendingUp className="w-3.5 h-3.5" />}
              title="Pay breakdown"
              iconColor="var(--success)"
            />
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barCategoryGap="40%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v === 0
                        ? "0"
                        : v >= 100_000
                        ? `${(v / 100_000).toFixed(0)}L`
                        : `${(v / 1000).toFixed(0)}K`
                    }
                  />
                  <RechartsTooltip content={<CustomBarTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, color: "var(--muted)" }}
                    iconType="square"
                    iconSize={10}
                  />
                  <Bar dataKey="Net Pay" fill="var(--info, #3b82f6)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Deductions" fill="var(--danger, #dc2626)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          EARNINGS BREAKDOWN
      ════════════════════════════════════════════════════ */}
      {earnings.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)", background: "var(--card)" }}
        >
          <SectionHeader
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            title="Earnings breakdown"
            iconColor="var(--success)"
            right={
              <span className="text-[11px] font-semibold" style={{ color: "var(--success)" }}>
                {fmtCurrency(slip.currency, gross)}
              </span>
            }
          />

          {/* Column labels */}
          <div
            className="flex items-center gap-3 px-4 py-2"
            style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}
          >
            <span className="flex-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              Component
            </span>
            <span className="w-20" />
            <span className="w-8 text-[9px] font-semibold uppercase tracking-wider text-right" style={{ color: "var(--muted)" }}>
              %
            </span>
            <span className="w-28 text-[9px] font-semibold uppercase tracking-wider text-right" style={{ color: "var(--muted)" }}>
              This month
            </span>
            <span className="w-28 text-[9px] font-semibold uppercase tracking-wider text-right hidden xl:block" style={{ color: "var(--muted)" }}>
              Year to date
            </span>
          </div>

          <div className="px-4">
            {earnings.map((e, i) => (
              <ComponentRow
                key={e.name}
                component={e}
                currency={slip.currency}
                total={gross}
                color={CHART_PALETTE[i % CHART_PALETTE.length]}
                accent="green"
              />
            ))}
          </div>

          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text)" }}
            >
              Gross Pay
            </span>
            <span className="text-sm font-semibold" style={{ color: "var(--success)" }}>
              {fmtCurrency(slip.currency, gross)}
            </span>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          DEDUCTIONS
      ════════════════════════════════════════════════════ */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)", background: "var(--card)" }}
      >
        <SectionHeader
          icon={<TrendingDown className="w-3.5 h-3.5" />}
          title="Deductions"
          iconColor="var(--danger)"
          right={
            <span
              className="text-[11px] font-semibold"
              style={
                totalDeduction === 0
                  ? { color: "var(--muted)" }
                  : { color: "var(--danger)" }
              }
            >
              {fmtCurrency(slip.currency, totalDeduction)}
            </span>
          }
        />

        {activeDeductions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(34,197,94,0.08)" }}
            >
              <CheckCircle2 className="w-6 h-6" style={{ color: "var(--success)" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                No deductions this month
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                All deduction components are ₹0 for this payroll period
              </p>
            </div>
          </div>
        ) : (
          <>
            <div
              className="flex items-center gap-3 px-4 py-2"
              style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}
            >
              <span className="flex-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                Component
              </span>
              <span className="w-20" />
              <span className="w-8 text-[9px] font-semibold uppercase tracking-wider text-right" style={{ color: "var(--muted)" }}>
                %
              </span>
              <span className="w-28 text-[9px] font-semibold uppercase tracking-wider text-right" style={{ color: "var(--muted)" }}>
                This month
              </span>
              <span className="w-28 text-[9px] font-semibold uppercase tracking-wider text-right hidden xl:block" style={{ color: "var(--muted)" }}>
                Year to date
              </span>
            </div>
            <div className="px-4">
              {activeDeductions.map((d) => (
                <ComponentRow
                  key={d.name}
                  component={d}
                  currency={slip.currency}
                  total={gross}
                  color="var(--danger, #dc2626)"
                  accent="red"
                />
              ))}
            </div>
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}
            >
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text)" }}
              >
                Total Deductions
              </span>
              <span className="text-sm font-semibold" style={{ color: "var(--danger)" }}>
                {fmtCurrency(slip.currency, totalDeduction)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* ════════════════════════════════════════════════════
          NET PAY COMPUTATION
      ════════════════════════════════════════════════════ */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)", background: "var(--card)" }}
      >
        <SectionHeader icon={<DollarSign className="w-3.5 h-3.5" />} title="Net pay computation" />
        <div className="px-4">
          <MetaRow
            label="Gross Pay"
            value={
              <span className="font-semibold" style={{ color: "var(--info)" }}>
                {fmtCurrency(slip.currency, gross)}
              </span>
            }
            icon={<TrendingUp className="w-3 h-3" />}
          />
          <MetaRow
            label="Total Deductions"
            value={
              <span
                className={totalDeduction === 0 ? "" : "font-semibold"}
                style={
                  totalDeduction === 0
                    ? { color: "var(--muted)" }
                    : { color: "var(--danger)" }
                }
              >
                − {fmtCurrency(slip.currency, totalDeduction)}
              </span>
            }
            icon={<TrendingDown className="w-3 h-3" />}
          />
          <MetaRow
            label="Net Pay (Rounded)"
            value={
              <span className="font-semibold text-base" style={{ color: "var(--success)" }}>
                {fmtCurrency(slip.currency, rounded)}
              </span>
            }
            icon={<CheckCircle2 className="w-3 h-3" />}
          />
          <MetaRow
            label="Amount in words"
            value={
              <span
                className="text-[11px] font-normal normal-case tracking-normal"
                style={{ color: "var(--muted)" }}
              >
                {slip.total_in_words}
              </span>
            }
            icon={<FileText className="w-3 h-3" />}
          />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          YTD STATS
      ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          label="Gross YTD"
          value={fmtCurrency(slip.currency, Number(slip.gross_year_to_date) || 0)}
          valueStyle={{ color: "var(--info)" }}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <KpiCard
          label="Net YTD"
          value={fmtCurrency(slip.currency, Number(slip.year_to_date) || 0)}
          valueStyle={{ color: "var(--success)" }}
          icon={<CheckCircle2 className="w-4 h-4" />}
        />
        <KpiCard
          label="Month to Date"
          value={fmtCurrency(slip.currency, Number(slip.month_to_date) || 0)}
          icon={<Calendar className="w-4 h-4" />}
        />
      </div>

      {/* ════════════════════════════════════════════════════
          INCOME TAX ANALYSIS — accordion
      ════════════════════════════════════════════════════ */}
      <Accordion
        defaultOpen={!isNonTaxable}
        title={
          <>
            <BarChart2 className="w-3.5 h-3.5" />
            Income Tax Analysis
          </>
        }
        badge={
          isNonTaxable ? (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2 normal-case tracking-normal"
              style={{
                color: "var(--success)",
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)",
              }}
            >
              <CheckCircle2 className="w-3 h-3" />
              Non-taxable
            </span>
          ) : undefined
        }
      >
        {isNonTaxable ? (
          <p className="text-xs py-3" style={{ color: "var(--muted)" }}>
            Tax not applicable for this payroll period. All earnings are classified as
            non-taxable.
          </p>
        ) : (
          <div className="py-1">
            {(
              [
                { key: "annual_taxable_amount",             label: "Annual taxable amount" },
                { key: "non_taxable_earnings",              label: "Non-taxable earnings" },
                { key: "standard_tax_exemption_amount",     label: "Standard tax exemption" },
                { key: "tax_exemption_declaration",         label: "Tax exemption declaration" },
                { key: "deductions_before_tax_calculation", label: "Deductions before tax" },
                { key: "income_from_other_sources",         label: "Income from other sources" },
                { key: "income_tax_deducted_till_date",     label: "Tax deducted till date" },
                { key: "current_month_income_tax",          label: "Current month income tax" },
                { key: "future_income_tax_deductions",      label: "Future income tax" },
                { key: "total_income_tax",                  label: "Total income tax" },
              ] as { key: keyof SalarySlip; label: string }[]
            )
              .filter(({ key }) => typeof slip[key] === "number")
              .map(({ key, label }) => (
                <MetaRow
                  key={key}
                  label={label}
                  value={
                    <span
                      style={
                        (slip[key] as number) === 0
                          ? { color: "var(--muted)" }
                          : { color: "var(--text)", fontWeight: 500 }
                      }
                    >
                      {fmtCurrency(slip.currency, slip[key] as number)}
                    </span>
                  }
                  icon={<BarChart2 className="w-3 h-3" />}
                />
              ))}
          </div>
        )}
      </Accordion>

      {/* ════════════════════════════════════════════════════
          ADDITIONAL PAYROLL DETAILS — accordion (5 key fields only)
      ════════════════════════════════════════════════════ */}
      <Accordion
        title={
          <>
            <FileText className="w-3.5 h-3.5" />
            Additional payroll details
          </>
        }
      >
        <div className="py-1">
          <MetaRow
            label="Payroll Entry"
            value={<span className="font-mono text-[11px]">{slip.payroll_entry}</span>}
            icon={<FileText className="w-3 h-3" />}
          />
          {slip.current_payroll_period && (
            <MetaRow
              label="Payroll Period"
              value={slip.current_payroll_period}
              icon={<Calendar className="w-3 h-3" />}
            />
          )}
          <MetaRow
            label="Posting Date"
            value={slip.posting_date}
            icon={<Calendar className="w-3 h-3" />}
          />
          <MetaRow
            label="Mode of Payment"
            value={slip.mode_of_payment}
            icon={<CreditCard className="w-3 h-3" />}
          />
          <MetaRow
            label="Salary Structure"
            value={slip.salary_structure}
            icon={<Layers className="w-3 h-3" />}
          />
        </div>
      </Accordion>
    </div>
  );
};