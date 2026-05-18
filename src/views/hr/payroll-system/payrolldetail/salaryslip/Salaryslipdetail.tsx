import React, { useState } from "react";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Layers,
  BarChart2,
  CheckCircle2,
  Download,
  Share2,
  Printer,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Eye,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { type SalarySlip, type SalaryDetail } from "../../../../../api/payroll/payrollEntryApi";
import { StatusBadge } from "../Payrollsharedcomponents";
import {
  CHART_PALETTE,
  MIN_SLICE_DEG,
  fmtINR,
  fmtCurrency,
  fmtPct,
  exactPct,
  initials,
} from "./Salarysliphelpers ";

const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`relative overflow-hidden rounded-lg ${className}`}
    style={{ background: "var(--skeleton-base, #e5e7eb)" }}
  >
    <div className="absolute inset-0 skeleton-shimmer" />
  </div>
);

export const DetailSkeleton: React.FC = () => (
  <div className="p-5 space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-8 w-28" />
    </div>
    <Skeleton className="h-24 w-full rounded-xl" />
    <div className="grid grid-cols-4 gap-2.5">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl p-3.5 space-y-2" style={{ border: "1px solid var(--border)" }}>
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>
    <Skeleton className="h-44 w-full rounded-xl" />
    <Skeleton className="h-36 w-full rounded-xl" />
  </div>
);

export const EmptyDetail: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full py-24 px-8 gap-4">
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center"
      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
    >
      <Eye className="w-6 h-6" style={{ color: "var(--muted)", opacity: 0.3 }} />
    </div>
    <div className="text-center">
      <p className="text-sm font-semibold" style={{ color: "var(--text)", opacity: 0.5 }}>
        Select a slip to view
      </p>
      <p
        className="text-xs mt-1 max-w-[200px] leading-relaxed"
        style={{ color: "var(--muted)" }}
      >
        Click any salary slip from the list on the left.
      </p>
    </div>
  </div>
);

const KpiCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  valueStyle?: React.CSSProperties;
  icon: React.ReactNode;
}> = ({ label, value, sub, valueStyle, icon }) => (
  <div
    className="flex flex-col gap-1 p-3.5 rounded-xl"
    style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
  >
    <div className="flex items-center justify-between mb-0.5">
      <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
        {label}
      </p>
      <span style={{ color: "var(--muted)", opacity: 0.4 }}>{icon}</span>
    </div>
    <p className="text-sm font-semibold" style={valueStyle ?? { color: "var(--text)" }}>
      {value}
    </p>
    {sub && (
      <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
        {sub}
      </p>
    )}
  </div>
);

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
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ background: "var(--bg)" }}
      >
        <span
          className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          {title}
          {badge}
        </span>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5" style={{ color: "var(--muted)" }} />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" style={{ color: "var(--muted)" }} />
        )}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
};

const MetaRow: React.FC<{
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div
    className="flex items-center justify-between py-2 last:border-0"
    style={{ borderBottom: "1px solid var(--border)" }}
  >
    <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
      {icon}
      {label}
    </span>
    <span className="text-xs font-medium text-right max-w-[55%]" style={{ color: "var(--text)" }}>
      {value}
    </span>
  </div>
);

const DualComponentRow: React.FC<{
  earning: SalaryDetail | null;
  deduction: SalaryDetail | null;
  currency: string;
  grossTotal: number;
  earningColor: string;
}> = ({ earning, deduction, currency, grossTotal, earningColor }) => {
  const eAmt = earning ? Number(earning.amount) || 0 : null;
  const dAmt = deduction ? Number(deduction.amount) || 0 : null;
  const eBarPct =
    eAmt != null && grossTotal > 0 && eAmt > 0
      ? Math.max(1, (eAmt / grossTotal) * 100)
      : 0;

  return (
    <div className="grid grid-cols-2 divide-x" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2 px-3 py-2 min-w-0">
        {earning ? (
          <>
            <span
              className="text-[9px] font-bold uppercase px-1 py-0.5 rounded shrink-0"
              style={{
                color: "var(--muted)",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                minWidth: 26,
                textAlign: "center",
              }}
            >
              {earning.abbr}
            </span>
            <span className="flex-1 text-xs truncate min-w-0" style={{ color: "var(--text)" }}>
              {earning.salary_component}
            </span>
            <div className="w-10 h-1 rounded-full overflow-hidden shrink-0" style={{ background: "var(--border)" }}>
              <div className="h-full rounded-full" style={{ width: `${eBarPct}%`, backgroundColor: earningColor }} />
            </div>
            <span
              className="text-xs font-semibold shrink-0 w-20 text-right"
              style={{ color: eAmt === 0 ? "var(--muted)" : "var(--success)" }}
            >
              {fmtCurrency(currency, eAmt!)}
            </span>
          </>
        ) : (
          <span className="text-xs" style={{ color: "var(--border)" }}>—</span>
        )}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 min-w-0">
        {deduction ? (
          <>
            <span
              className="text-[9px] font-bold uppercase px-1 py-0.5 rounded shrink-0"
              style={{
                color: "var(--muted)",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                minWidth: 26,
                textAlign: "center",
              }}
            >
              {deduction.abbr}
            </span>
            <span className="flex-1 text-xs truncate min-w-0" style={{ color: "var(--text)" }}>
              {deduction.salary_component}
            </span>
            <span
              className="text-xs font-semibold shrink-0 w-20 text-right"
              style={{ color: dAmt === 0 ? "var(--muted)" : "var(--danger)" }}
            >
              {dAmt === 0 ? "—" : `− ${fmtCurrency(currency, dAmt!)}`}
            </span>
          </>
        ) : (
          <span className="text-xs" style={{ color: "var(--border)" }}>—</span>
        )}
      </div>
    </div>
  );
};

interface PieEntry {
  name: string;
  value: number;
  realValue: number;
  total: number;
  color: string;
}

function buildPieData(earnings: SalaryDetail[]): PieEntry[] {
  const withAmt = earnings.filter((e) => Number(e.amount) > 0);
  if (!withAmt.length) return [];

  const totalReal = withAmt.reduce((s, e) => s + Number(e.amount), 0);
  const items = withAmt.map((e, i) => ({
    name: e.salary_component,
    realValue: Number(e.amount),
    color: CHART_PALETTE[i % CHART_PALETTE.length],
    naturalDeg: (Number(e.amount) / totalReal) * 360,
  }));

  const smallCount = items.filter((it) => it.naturalDeg < MIN_SLICE_DEG).length;
  const boostedDeg = smallCount * MIN_SLICE_DEG;
  const naturalLargeDeg = items
    .filter((it) => it.naturalDeg >= MIN_SLICE_DEG)
    .reduce((s, it) => s + it.naturalDeg, 0);
  const remainingDeg = 360 - boostedDeg;

  return items.map((it) => {
    const renderDeg =
      it.naturalDeg < MIN_SLICE_DEG
        ? MIN_SLICE_DEG
        : naturalLargeDeg > 0
          ? (it.naturalDeg / naturalLargeDeg) * remainingDeg
          : it.naturalDeg;
    return {
      name: it.name,
      value: (renderDeg / 360) * totalReal,
      realValue: it.realValue,
      total: totalReal,
      color: it.color,
    };
  });
}

export interface DetailPanelProps {
  slip: SalarySlip;
  onDownload: () => void;
  onView: () => void;
  onPrint: () => void;
  pdfLoading: boolean;
  onBack?: () => void;
  isMobile?: boolean;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  slip,
  onDownload,
  onView,
  onPrint,
  pdfLoading,
  onBack,
  isMobile,
}) => {
  const gross = Number(slip.gross_pay) || 0;
  const net = Number(slip.net_pay) || 0;
  const totalDeduction = Number(slip.total_deduction) || 0;
  const ctc = Number(slip.ctc) || 0;
  const rounded = Number(slip.rounded_total) || net;

  const earnings: SalaryDetail[] = slip.earnings ?? [];
  const deductions: SalaryDetail[] = slip.deductions ?? [];
  const activeDeductions = deductions.filter((d) => Number(d.amount) > 0);
  const isNonTaxable = !slip.annual_taxable_amount && !slip.total_income_tax;

  const earningsWithAmt = earnings.filter((e) => Number(e.amount) > 0);
  const totalReal = earningsWithAmt.reduce((s, e) => s + Number(e.amount), 0);
  const pieData = buildPieData(earnings);

  const maxRows = Math.max(earnings.length, activeDeductions.length);
  const dualRows = Array.from({ length: maxRows }, (_, i) => ({
    earning: earnings[i] ?? null,
    deduction: activeDeductions[i] ?? null,
  }));

  return (
    <div className="overflow-y-auto h-full" style={{ background: "var(--card)" }}>
      <div
        className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
        style={{
          background: "var(--card)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex items-center gap-3">
          {isMobile && onBack && (
            <button onClick={onBack} className="btn btn-outline p-1.5">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
            style={{ background: "rgba(192,132,61,0.1)", color: "var(--primary)" }}
          >
            {initials(slip.employee_name)}
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight" style={{ color: "var(--text)" }}>
              {slip.employee_name}
            </p>
            <p className="text-[10px]" style={{ color: "var(--muted)" }}>
              {slip.start_date} – {slip.end_date} · {slip.payroll_frequency}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge status={slip.status} />
          <button
            onClick={onDownload}
            disabled={pdfLoading}
            className="btn btn-primary inline-flex items-center gap-1 text-[11px] py-1.5 px-3 disabled:opacity-50"
          >
            <Download className="w-3 h-3" />
            {pdfLoading ? "..." : "Download"}
          </button>
          <button
            onClick={onView}
            disabled={pdfLoading}
            className="btn btn-outline inline-flex items-center gap-1 text-[11px] py-1.5 px-2.5 disabled:opacity-50"
          >
            <Share2 className="w-3 h-3" />
            View
          </button>
          <button
            onClick={onPrint}
            disabled={pdfLoading}
            className="btn btn-outline inline-flex items-center gap-1 text-[11px] py-1.5 px-2.5 disabled:opacity-50"
          >
            <Printer className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div
          className="rounded-xl p-4 flex items-center justify-between flex-wrap gap-4"
          style={{
            background: "linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(34,197,94,0.02) 100%)",
            border: "1px solid rgba(34,197,94,0.15)",
          }}
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Net Take-Home
            </p>
            <p className="text-2xl font-semibold mt-0.5" style={{ color: "var(--success)" }}>
              {fmtCurrency(slip.currency, rounded)}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
              {slip.total_in_words}
            </p>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full self-end"
              style={{ color: "var(--primary)", background: "rgba(192,132,61,0.08)", border: "1px solid var(--border)" }}
            >
              <Layers className="w-3 h-3" />
              {slip.salary_structure}
            </span>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full self-end"
              style={{ color: "var(--muted)", background: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <CreditCard className="w-3 h-3" />
              {slip.mode_of_payment}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <KpiCard
            label="Gross Pay"
            value={fmtCurrency(slip.currency, gross)}
            sub="Before deductions"
            valueStyle={{ color: "var(--info)" }}
            icon={<TrendingUp className="w-3.5 h-3.5" />}
          />
          <KpiCard
            label="Total Deductions"
            value={totalDeduction === 0 ? "—" : fmtCurrency(slip.currency, totalDeduction)}
            valueStyle={totalDeduction === 0 ? { color: "var(--muted)" } : { color: "var(--danger)" }}
            icon={<TrendingDown className="w-3.5 h-3.5" />}
          />
          <KpiCard
            label="Annual CTC"
            value={ctc ? fmtCurrency(slip.currency, ctc) : "—"}
            sub={ctc ? `≈ ${fmtCurrency(slip.currency, Math.round(ctc / 12))}/mo` : undefined}
            icon={<BarChart2 className="w-3.5 h-3.5" />}
          />
          <KpiCard
            label="Paid Days"
            value={`${slip.payment_days} / ${slip.total_working_days}`}
            sub={slip.absent_days ? `${slip.absent_days} absent` : "Full attendance"}
            valueStyle={{ color: "var(--success)" }}
            icon={<Calendar className="w-3.5 h-3.5" />}
          />
        </div>

        {pieData.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
            <div
              className="px-4 py-2.5 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1.5"
                style={{ color: "var(--muted)" }}
              >
                <BarChart2 className="w-3 h-3" style={{ color: "var(--info)" }} />
                Earnings Composition
              </p>
              <span className="text-[11px] font-semibold" style={{ color: "var(--info)" }}>
                {fmtCurrency(slip.currency, gross)}
              </span>
            </div>
            <div className="p-3 flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={33} outerRadius={55} paddingAngle={2} dataKey="value">
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as PieEntry;
                      return (
                        <div
                          className="rounded-lg px-3 py-2 text-xs shadow-sm"
                          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
                        >
                          <p className="font-semibold">{d.name}</p>
                          <p className="mt-0.5" style={{ color: "var(--muted)" }}>{fmtINR(d.realValue)}</p>
                          <p style={{ color: "var(--primary)" }}>{exactPct(d.realValue, d.total)}</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                {earningsWithAmt.map((e, i) => (
                  <div key={e.name} className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-sm shrink-0"
                      style={{ backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] }}
                    />
                    <span className="text-[10px] truncate flex-1 min-w-0" style={{ color: "var(--muted)" }}>
                      {e.salary_component}
                    </span>
                    <span className="text-[10px] font-semibold shrink-0" style={{ color: "var(--text)" }}>
                      {fmtPct(Number(e.amount), totalReal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
          <div
            className="grid grid-cols-2 divide-x"
            style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}
          >
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--success)" }}>
                <TrendingUp className="w-3 h-3" />
                Earnings
              </span>
              <span className="text-[11px] font-semibold" style={{ color: "var(--success)" }}>
                {fmtCurrency(slip.currency, gross)}
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--danger)" }}>
                <TrendingDown className="w-3 h-3" />
                Deductions
              </span>
              <span
                className="text-[11px] font-semibold"
                style={totalDeduction === 0 ? { color: "var(--muted)" } : { color: "var(--danger)" }}
              >
                {totalDeduction === 0 ? "—" : `− ${fmtCurrency(slip.currency, totalDeduction)}`}
              </span>
            </div>
          </div>

          <div
            className="grid grid-cols-2 divide-x"
            style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)", opacity: 0.7 }}
          >
            {["Earnings", "Deductions"].map((side) => (
              <div key={side} className="flex items-center gap-2 px-3 py-1.5">
                <span className="text-[8px] font-semibold uppercase tracking-wider w-6" style={{ color: "var(--muted)" }}>Abbr</span>
                <span className="flex-1 text-[8px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Component</span>
                <span className="w-20 text-[8px] font-semibold uppercase tracking-wider text-right" style={{ color: "var(--muted)" }}>Amount</span>
              </div>
            ))}
          </div>

          {dualRows.map((row, i) => (
            <DualComponentRow
              key={i}
              earning={row.earning}
              deduction={row.deduction}
              currency={slip.currency}
              grossTotal={gross}
              earningColor={CHART_PALETTE[i % CHART_PALETTE.length]}
            />
          ))}

          <div
            className="grid grid-cols-2 divide-x"
            style={{ borderTop: "2px solid var(--border)", background: "var(--bg)" }}
          >
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text)" }}>Gross Pay</span>
              <span className="text-sm font-semibold" style={{ color: "var(--success)" }}>{fmtCurrency(slip.currency, gross)}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text)" }}>Total Deductions</span>
              <span
                className="text-sm font-semibold"
                style={totalDeduction === 0 ? { color: "var(--muted)" } : { color: "var(--danger)" }}
              >
                {totalDeduction === 0 ? "—" : `− ${fmtCurrency(slip.currency, totalDeduction)}`}
              </span>
            </div>
          </div>

          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: "1px solid var(--border)", background: "rgba(34,197,94,0.04)" }}
          >
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text)" }}>Net Pay</span>
              <span className="text-[10px] ml-2" style={{ color: "var(--muted)" }}>(Gross − Deductions)</span>
            </div>
            <span className="text-base font-semibold" style={{ color: "var(--success)" }}>
              {fmtCurrency(slip.currency, rounded)}
            </span>
          </div>
        </div>

        <Accordion
          defaultOpen={!isNonTaxable}
          title={<><BarChart2 className="w-3.5 h-3.5" />Income Tax Analysis</>}
          badge={
            isNonTaxable ? (
              <span
                className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ml-2 normal-case tracking-normal"
                style={{ color: "var(--success)", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
              >
                <CheckCircle2 className="w-2.5 h-2.5" />
                Non-taxable
              </span>
            ) : undefined
          }
        >
          {isNonTaxable ? (
            <p className="text-xs py-3" style={{ color: "var(--muted)" }}>
              Tax not applicable for this payroll period.
            </p>
          ) : (
            <div className="py-1">
              {(
                [
                  { key: "annual_taxable_amount", label: "Annual taxable amount" },
                  { key: "non_taxable_earnings", label: "Non-taxable earnings" },
                  { key: "standard_tax_exemption_amount", label: "Standard tax exemption" },
                  { key: "tax_exemption_declaration", label: "Tax exemption declaration" },
                  { key: "deductions_before_tax_calculation", label: "Deductions before tax" },
                  { key: "income_from_other_sources", label: "Income from other sources" },
                  { key: "income_tax_deducted_till_date", label: "Tax deducted till date" },
                  { key: "current_month_income_tax", label: "Current month income tax" },
                  { key: "future_income_tax_deductions", label: "Future income tax" },
                  { key: "total_income_tax", label: "Total income tax" },
                ] as { key: keyof SalarySlip; label: string }[]
              )
                .filter(({ key }) => typeof slip[key] === "number")
                .map(({ key, label }) => (
                  <MetaRow
                    key={key}
                    label={label}
                    value={
                      <span style={(slip[key] as number) === 0 ? { color: "var(--muted)" } : { color: "var(--text)", fontWeight: 500 }}>
                        {fmtCurrency(slip.currency, slip[key] as number)}
                      </span>
                    }
                    icon={<BarChart2 className="w-3 h-3" />}
                  />
                ))}
            </div>
          )}
        </Accordion>

        <Accordion title={<><FileText className="w-3.5 h-3.5" />Additional Payroll Details</>}>
          <div className="py-1">
            <MetaRow label="Payroll Entry" icon={<FileText className="w-3 h-3" />} value={<span className="font-mono text-[10px]">{slip.payroll_entry}</span>} />
            {slip.current_payroll_period && (
              <MetaRow label="Payroll Period" value={slip.current_payroll_period} icon={<Calendar className="w-3 h-3" />} />
            )}
            <MetaRow label="Posting Date" value={slip.posting_date} icon={<Calendar className="w-3 h-3" />} />
            <MetaRow label="Mode of Payment" value={slip.mode_of_payment} icon={<CreditCard className="w-3 h-3" />} />
            <MetaRow label="Salary Structure" value={slip.salary_structure} icon={<Layers className="w-3 h-3" />} />
            <MetaRow label="Department" value={slip.department} icon={<Layers className="w-3 h-3" />} />
            <MetaRow label="Designation" value={slip.designation} icon={<FileText className="w-3 h-3" />} />
          </div>
        </Accordion>
      </div>
    </div>
  );
};