import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useCompanyStore } from "../../store/companyStore";
import {
  Trophy,
  TrendingUp,
  Repeat,
  CreditCard,
  Bell,
  CalendarClock,
  Wallet,
  ShieldAlert,
  LineChart as LineChartIcon,
  RefreshCcw,
} from "lucide-react";
import {
  getCustomerDashboardData,
  type CustomerDashboardDataRaw,
} from "../../api/customerDashboardApi";

const palette = {
  purple: "#8b5cf6",
  blue: "#3b82f6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#ef4444",
  cyan: "#06b6d4",
  slate: "#64748b",
  orange: "#f97316",
};

const RANK_BADGE_COLOR = palette.amber;
const DEFAULT_DORMANT_DAYS = 90;


const ROW2_H = 220;
const ROW4_H = 236;

// ── Compact KPI card ─────────────────────────────────────────────────────────
const KpiCard: React.FC<{ label: string; value: string; sub?: string; onDoubleClick?: () => void }> = ({
  label,
  value,
  sub,
  onDoubleClick,
}) => (
  <div
    onDoubleClick={onDoubleClick}
    title={onDoubleClick ? "Double-click to view details" : undefined}
    className={`flex flex-col justify-center rounded-xl border border-[var(--border)] bg-card px-3 py-2 shadow-sm ${onDoubleClick ? "cursor-pointer transition-colors hover:border-primary/40 hover:bg-primary/5" : ""
      }`}
  >
    <p className="truncate text-[11px] font-medium text-gray-500">{label}</p>
    <p className="text-base font-bold leading-tight text-gray-800">{value}</p>
    {sub && <p className="truncate text-[10px] text-gray-400">{sub}</p>}
  </div>
);

// ── Local replacement for AppSectionCard — no divider line, no extra padding ─
const SectionCard: React.FC<{
  title: string;
  icon: React.ElementType;
  className?: string;
  children: React.ReactNode;
}> = ({ title, icon: Icon, className = "", children }) => (
  <div className={`rounded-xl border border-[var(--border)] bg-card px-3 py-2.5 shadow-sm ${className}`}>
    <div className="mb-1.5 flex items-center gap-1.5">
      <Icon size={14} className="text-gray-500" />
      <h3 className="text-[13px] font-semibold text-gray-800">{title}</h3>
    </div>
    {children}
  </div>
);


const formatShortCurrency = (value: number, symbol: string) => {
  const n = Math.abs(value ?? 0);
  const sign = value < 0 ? "-" : "";

  if (n >= 1_000_000_000) return `${sign}${symbol}${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${sign}${symbol}${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${sign}${symbol}${(n / 1_000).toFixed(1)}K`;
  return `${sign}${symbol}${n.toFixed(0)}`;
};

const EmptyState: React.FC<{ message: string; height?: number }> = ({ message, height }) => (
  <div
    className="flex items-center justify-center text-center text-[11px] text-gray-400"
    style={height ? { height } : undefined}
  >
    {message}
  </div>
);

const baseGrid = { strokeDashArray: 3, borderColor: "#e5e7eb" };
const smallFont = { style: { fontSize: "10px" } };

const CRMDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currencySymbol = useCompanyStore((state) => state.currencySymbol);

  // Year comes from URL query param (?year=2026), defaults to current year.
  const year = useMemo(() => {
    const q = searchParams.get("year");
    const parsed = q ? parseInt(q, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : new Date().getFullYear();
  }, [searchParams]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CustomerDashboardDataRaw | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await getCustomerDashboardData(year, DEFAULT_DORMANT_DAYS);
        if (!mounted) return;
        setData(resp);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Failed to load customer dashboard data");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [year]);

  const chartsLoading = loading || !data;

  // ── Derived / mapped data ───────────────────────────────────────────────
  const months = data?.customer_growth.map((m) => m.month) ?? [];
  const growthSeries = data?.customer_growth.map((m) => m.count) ?? [];

  const topPerformers = data?.top_performing_customers ?? [];
  const top3Names = data?.top_performers_trend.customers ?? [];
  const top3Months = data?.top_performers_trend.series.map((s) => s.month) ?? [];
  const top3Series = top3Names.map((name) => ({
    name,
    data: (data?.top_performers_trend.series ?? []).map((point) => Number(point[name] ?? 0)),
  }));

  const creditLines = data?.credit_limit_utilization ?? [];
  const onTimeRecovery = data?.recovery_time.on_time ?? [];
  const lateRecovery = data?.recovery_time.late ?? [];
  const NEEDS_ATTENTION_LIMIT = 8;
  const dormantCustomers = (data?.needs_attention.dormant_customers ?? []).slice(0, NEEDS_ATTENTION_LIMIT);
  const topOutstanding = (data?.needs_attention.top_outstanding_customers ?? []).slice(0, NEEDS_ATTENTION_LIMIT);
  const maxOutstanding = Math.max(...topOutstanding.map((o) => o.outstanding), 1);

  const newVsRepeatSeries = data
    ? [data.new_vs_repeat.new_percent, data.new_vs_repeat.repeat_percent]
    : [0, 0];

  // ── Chart configs ────────────────────────────────────────────────────────
  const growthOptions: ApexOptions = {
    chart: { type: "area", toolbar: { show: false }, zoom: { enabled: false }, sparkline: { enabled: false } },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 } },
    colors: [palette.blue],
    grid: { ...baseGrid, padding: { left: 4, right: 4 } },
    xaxis: { categories: months, labels: smallFont, axisBorder: { show: false } },
    yaxis: { labels: smallFont },
    tooltip: { y: { formatter: (v: number) => `${v} new` } },
  };

  const top3TrendOptions: ApexOptions = {
    chart: { type: "line", toolbar: { show: false }, zoom: { enabled: false } },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 3 },
    markers: { size: 0, strokeWidth: 0, hover: { size: 6 } },
    colors: [palette.purple, palette.blue, palette.emerald],
    grid: { borderColor: "#f1f5f9", strokeDashArray: 0, xaxis: { lines: { show: false } }, padding: { left: 4, right: 8 } },
    xaxis: { categories: top3Months, labels: smallFont, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: smallFont, title: { text: "Orders", style: { fontSize: "10px", color: "#9ca3af" } } },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontSize: "11px",
      fontWeight: 600,
      markers: { size: 6 } as any,
      itemMargin: { horizontal: 10, vertical: 4 },
    },
    tooltip: { shared: true, intersect: false, y: { formatter: (v: number) => `${v} orders` } },
  };

  const donutOptions: ApexOptions = {
    chart: { type: "donut" },
    labels: ["New", "Repeat"],
    colors: [palette.cyan, palette.amber],
    legend: { position: "bottom", fontSize: "11px", markers: { size: 6 } as any },
    dataLabels: { enabled: true, formatter: (v: number) => `${v.toFixed(0)}%`, style: { fontSize: "11px" } },
    stroke: { width: 0 },
    plotOptions: { pie: { donut: { size: "62%", labels: { show: false } } } },
  };

  const kpis = data
    ? [
      {
        label: "Total Customers",
        value: String(data.summary.total_customers),
        sub: `${data.summary.company_customers} Company / ${data.summary.individual_customers} Individual`,
        onDoubleClick: () => navigate("/crm?tab=customer-managment"),
      },
      { label: "Overdue Payments", value: String(data.summary.overdue_payments) },
      { label: "Dormant Customers", value: String(data.summary.dormant_customers) },
      { label: "Total Revenue", value: formatShortCurrency(data.summary.total_revenue, currencySymbol) },
      { label: "Avg Payment Delay", value: `${data.summary.avg_payment_delay_days}d` },
      { label: "Avg Order Value", value: formatShortCurrency(data.summary.avg_order_value, currencySymbol) },
    ]
    : [];

  return (
    <div className="flex flex-col gap-2.5">
      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {chartsLoading
          ? Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-[48px] animate-pulse rounded-xl bg-gray-100" />
          ))
          : kpis.map((k) => (
            <KpiCard
              key={k.label}
              label={k.label}
              value={k.value}
              sub={(k as any).sub}
              onDoubleClick={(k as any).onDoubleClick}
            />
          ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* ── Customer Growth / Top 5 Performers / New vs Repeat ──────────────── */}
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-12">
        <SectionCard title="Customer Growth" icon={TrendingUp} className="lg:col-span-6">
          <div style={{ height: ROW2_H }}>
            {!chartsLoading && (
              <ReactApexChart
                type="area"
                height="100%"
                width="100%"
                options={growthOptions}
                series={[{ name: "New Customers", data: growthSeries }]}
              />
            )}
          </div>
        </SectionCard>

        <SectionCard title="Top 5 Performing Customers" icon={Trophy} className="lg:col-span-3">
          <div className="flex flex-col justify-between gap-1 overflow-hidden" style={{ height: ROW2_H }}>
            {chartsLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="h-8 animate-pulse rounded-lg bg-gray-100" />
              ))
            ) : topPerformers.length === 0 ? (
              <EmptyState message="No revenue data yet" height={ROW2_H} />
            ) : (
              topPerformers.map((perf, idx) => (
                <div key={perf.customer_id} className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-2 py-0.5">
                  <div
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md text-[9px] font-bold"
                    style={{ backgroundColor: `${RANK_BADGE_COLOR}1A`, color: RANK_BADGE_COLOR }}
                  >
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold leading-tight text-gray-800">{perf.customer_name}</p>
                    <p className="text-[9.5px] leading-tight text-gray-500">{formatShortCurrency(perf.revenue, currencySymbol)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="New vs Repeat" icon={Repeat} className="lg:col-span-3">
          <div style={{ height: ROW2_H }}>
            {!chartsLoading && (
              <ReactApexChart type="donut" height="100%" width="100%" options={donutOptions} series={newVsRepeatSeries} />
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── Credit Utilization + Top 3 Performers Sales Trend ───────────────── */}
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-12">
        <SectionCard title="Credit Limit Utilization" icon={CreditCard} className="lg:col-span-5">
          <div className="flex flex-col justify-center gap-1.5 overflow-y-auto pr-1" style={{ height: ROW4_H }}>
            {chartsLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-7 animate-pulse rounded-lg bg-gray-100" />
              ))
            ) : creditLines.length === 0 ? (
              <EmptyState message="No active credit limits" />
            ) : (
              creditLines.map((line) => {
                const pct = line.utilization_percent;
                const color = pct >= 100 ? palette.rose : pct >= 80 ? palette.amber : palette.emerald;
                return (
                  <div key={line.customer_id}>
                    <div className="mb-0.5 flex items-center justify-between text-[11px]">
                      <span className="truncate font-medium text-gray-700">{line.customer_name}</span>
                      <span className="flex shrink-0 items-center gap-1 font-semibold" style={{ color }}>
                        {pct >= 80 && <ShieldAlert size={11} />}
                        {pct}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>

        <SectionCard title="Top 3 Performers – Sales Trend" icon={LineChartIcon} className="lg:col-span-7">
          <div style={{ height: ROW4_H }}>
            {!chartsLoading && top3Names.length > 0 ? (
              <ReactApexChart type="line" height="100%" width="100%" options={top3TrendOptions} series={top3Series} />
            ) : (
              !chartsLoading && <EmptyState message="No trend data yet" height={ROW4_H} />
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── Recovery Time (narrow) + Needs Attention (wide) ─────────────────── */}
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-12">
        <SectionCard title="Recovery Time per Customer" icon={RefreshCcw} className="lg:col-span-5">
          {chartsLoading ? (
            <div className="grid grid-cols-2 gap-2" style={{ height: ROW4_H }}>
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-7 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : onTimeRecovery.length === 0 && lateRecovery.length === 0 ? (
            <EmptyState message="No payment recovery data yet" height={ROW4_H} />
          ) : (
            <div className="grid grid-cols-2 gap-2 overflow-y-auto" style={{ height: ROW4_H }}>
              <div className="min-w-0">
                <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-600">On Time</p>
                <div className="flex flex-col gap-1">
                  {onTimeRecovery.length === 0 ? (
                    <EmptyState message="No data" />
                  ) : (
                    onTimeRecovery.map((r) => (
                      <div key={r.customer_id} className="rounded-lg bg-emerald-50 px-1.5 py-1">
                        <p className="truncate text-[10.5px] font-medium text-gray-700">{r.customer_name}</p>
                        <p className="text-[9px] font-semibold text-emerald-600">
                          {r.avg_delay_days <= 0 ? "On time" : `${r.avg_delay_days}d late`}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-rose-600">Late Payers</p>
                <div className="flex flex-col gap-1">
                  {lateRecovery.length === 0 ? (
                    <EmptyState message="No data" />
                  ) : (
                    lateRecovery.map((r) => (
                      <div key={r.customer_id} className="rounded-lg bg-rose-50 px-1.5 py-1">
                        <p className="truncate text-[10.5px] font-medium text-gray-700">{r.customer_name}</p>
                        <p className="text-[9px] font-semibold text-rose-600">{r.avg_delay_days}d late</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Needs Attention" icon={Bell} className="lg:col-span-7">
          <div className="grid grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2" style={{ maxHeight: ROW4_H }}>
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-gray-700">
                <CalendarClock size={13} className="text-red-500" />
                Dormant Customers (90+ days)
                <span className="ml-auto rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                  {dormantCustomers.length}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {chartsLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="h-6 animate-pulse rounded-lg bg-gray-100" />
                  ))
                ) : dormantCustomers.length === 0 ? (
                  <EmptyState message="No dormant customers" />
                ) : (
                  dormantCustomers.map((c) => (
                    <div key={c.customer_id} className="flex items-center justify-between rounded-lg bg-red-50 px-2.5 py-1">
                      <span className="truncate text-xs font-medium text-gray-700">{c.customer_name}</span>
                      <span className="shrink-0 text-[10px] font-semibold text-red-600">
                        {c.last_order_days_ago === null ? "Never ordered" : `${c.last_order_days_ago}d inactive`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-gray-700">
                <Wallet size={13} className="text-amber-500" />
                Top Outstanding Customers
                <span className="ml-auto rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                  {topOutstanding.length}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {chartsLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="h-6 animate-pulse rounded-lg bg-gray-100" />
                  ))
                ) : topOutstanding.length === 0 ? (
                  <EmptyState message="No outstanding balances" />
                ) : (
                  topOutstanding.map((o) => {
                    const widthPct = Math.round((o.outstanding / maxOutstanding) * 100);
                    return (
                      <div key={o.customer_id}>
                        <div className="mb-0.5 flex items-center justify-between text-[11px]">
                          <span className="truncate font-medium text-gray-700">{o.customer_name}</span>
                          <span className="font-semibold text-amber-600">{formatShortCurrency(o.outstanding, currencySymbol)}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-amber-500" style={{ width: `${widthPct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default CRMDashboard;