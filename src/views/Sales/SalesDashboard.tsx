import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  FileText,
  FileSignature,
  FileStack,
  FileBadge,
  ScrollText,
  TrendingUp,
  AlertTriangle,
  Users,
  ArrowUpRight,
  Activity,
  BellRing,
  CheckCircle2,
  Sparkles,
  RefreshCcw,
  ShoppingCart,
} from "lucide-react";

import { EChart } from "../../components/charts/EChart";
import MonthlySalesOverview from "../../components/charts/monthlysalesoverview";
import { useCompanyStore } from "../../store/companyStore";
import {
  getSalesDashboard,
  type SalesDashboardData,
  type InvoiceStatusCount,
} from "../../api/salesDashboardApi";


const COLORS = {
  primary: "#4F46E5",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  purple: "#8B5CF6",
  slate: "#94A3B8",
};


const STATUS_COLOR_MAP: Record<string, string> = {
  green: COLORS.success,
  red: COLORS.danger,
  orange: COLORS.warning,
  blue: COLORS.info,
  purple: COLORS.purple,
  gray: COLORS.slate,
  grey: COLORS.slate,
};

const statusColor = (status: InvoiceStatusCount) =>
  STATUS_COLOR_MAP[status.color?.toLowerCase()] ?? COLORS.slate;

const AGING_BUCKET_COLORS = ["#FBBF24", "#FB923C", "#F87171", "#DC2626"];

const KPI_TAB_MAP: Record<string, string> = {
  "Proforma Invoices": "proformaInvoice",
  "Quotations": "quotations",
  "Sales Invoices": "invoices",
  "Credit Notes": "creditNotes",
  "Debit Notes": "salesDebitNotes",
  "Sales Orders": "salesOrder",
};

const CardShell: React.FC<{
  title: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon: Icon, action, children, className = "" }) => (
  <div
    className={`flex flex-col rounded-xl border border-[var(--border)] bg-card shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
  >
    <div className="flex items-center justify-between px-4 pt-3 pb-2">
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      {action}
    </div>
    <div className="min-h-0 flex-1 px-4 pb-3">{children}</div>
  </div>
);

const EmptyState: React.FC<{ label?: string; icon?: React.ElementType }> = ({
  label = "No data available",
  icon: Icon = FileText,
}) => (
  <div className="flex h-full min-h-[100px] flex-col items-center justify-center gap-2 text-slate-400">
    <Icon className="h-5 w-5" />
    <span className="text-xs font-medium">{label}</span>
  </div>
);

const timeAgo = (isoDate: string) => {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const KpiTile: React.FC<{
  label: string;
  count: number;
  worth?: number;
  currencyFormatter?: { format: (v: number) => string };
  loading?: boolean;
  onDoubleClick?: () => void;
}> = ({ label, count, worth, currencyFormatter, loading, onDoubleClick }) => (
  <div
    onDoubleClick={onDoubleClick}
    className={`rounded-xl border border-[var(--border)] bg-card px-3 py-2.5 shadow-sm ${onDoubleClick ? "cursor-pointer select-none" : ""}`}
    title={onDoubleClick ? "Double-click to view details" : undefined}
  >
    <p className="text-xs text-slate-500">{label}</p>
    {loading ? (
      <div className="mt-1.5 h-5 w-10 animate-pulse rounded bg-slate-100" />
    ) : count === 0 ? (
      <>
        <p className="mt-0.5 text-xl font-bold text-slate-800">0</p>
        <p className="mt-0.5 text-xs font-medium text-slate-400">
          No {label}
        </p>
      </>
    ) : (
      <>
        <p className="mt-0.5 text-xl font-bold text-slate-800">{count}</p>
        {typeof worth === "number" && worth > 0 && currencyFormatter && (
          <p className="mt-0.5 text-xs font-bold text-slate-700">
            {currencyFormatter.format(worth)}
          </p>
        )}
      </>
    )}
  </div>
);

const CardSkeleton: React.FC<{ height?: string }> = ({ height = "h-40" }) => (
  <div className={`w-full animate-pulse rounded-lg bg-slate-100 ${height}`} />
);

interface SalesDashboardProps {
  onNavigateTab?: (tabId: string) => void;
  availableTabIds?: string[];
}

const SalesDashboard: React.FC<SalesDashboardProps> = ({ onNavigateTab, availableTabIds }) => {
  const baseCurrency = useCompanyStore((state) => state.baseCurrency) || "";
  const currencySymbol = useCompanyStore((state) => state.currencySymbol || "");

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(
    () => [currentYear, currentYear - 1, currentYear - 2].map(String),
    [currentYear],
  );

  const [year, setYear] = useState<string>(String(currentYear));
  const [dashboard, setDashboard] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(
    async (targetYear: string, isYearSwitch = false) => {
      isYearSwitch ? setChartLoading(true) : setLoading(true);
      setError(null);
      try {
        const res = await getSalesDashboard({
          year: Number(targetYear),
          granularity: "monthly",
        });
        if (res.status_code !== 200) {
          throw new Error(res.message || "Failed to load sales dashboard");
        }
        setDashboard(res.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong while loading the sales dashboard.",
        );
      } finally {
        isYearSwitch ? setChartLoading(false) : setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchDashboard(year);
  }, []);

  const handleYearChange = (nextYear: string) => {
    setYear(nextYear);
    fetchDashboard(nextYear, true);
  };

  const currencyFormatter = useMemo(() => {
    const locale = baseCurrency === "INR" ? "en-IN" : "en-US";
    const numberFormatter = new Intl.NumberFormat(locale, {
      style: "decimal",
      maximumFractionDigits: 2,
      notation: "compact",
    });
    return {
      format: (value: number) => {
        const num = Number(value) || 0;
        const formatted = numberFormatter.format(Math.abs(num));
        const sign = num < 0 ? "-" : "";
        const space = currencySymbol.length > 1 ? " " : "";
        return `${sign}${currencySymbol}${space}${formatted}`;
      },
    };
  }, [baseCurrency, currencySymbol]);


  const summary = dashboard?.summary;
  const monthlySalesOverview = dashboard?.monthly_sales_overview ?? [];
  const quotationConversion = dashboard?.quotation_conversion ?? null;
  const customerConcentration = dashboard?.customer_concentration ?? null;
  const actionItems = dashboard?.action_items ?? [];
  const topRecentSales = dashboard?.top_recent_sales ?? [];
  const invoiceStatus = dashboard?.invoice_status ?? null;
  const overdueAging = dashboard?.overdue_invoice_aging ?? null;
  const recentActivity = dashboard?.recent_sales_activity ?? [];
  const stats = [
    { label: "Sales Orders", count: summary?.sales_orders?.count ?? 0, worth: summary?.sales_orders?.value ?? 0, icon: ShoppingCart },
    { label: "Quotations", count: summary?.quotations?.count ?? 0, worth: summary?.quotations?.value ?? 0, icon: ScrollText },
    { label: "Proforma Invoices", count: summary?.proforma_invoices?.count ?? 0, worth: summary?.proforma_invoices?.value ?? 0, icon: FileSignature },
    { label: "Sales Invoices", count: summary?.sales_invoices?.count ?? 0, worth: summary?.sales_invoices?.value ?? 0, icon: FileStack },
    { label: "Credit Notes", count: summary?.credit_notes?.count ?? 0, worth: summary?.credit_notes?.value ?? 0, icon: FileText },
    { label: "Debit Notes", count: summary?.debit_notes?.count ?? 0, worth: summary?.debit_notes?.value ?? 0, icon: Banknote },
  ];


  const topSalesOption = useMemo(() => {
    const top = [...topRecentSales].sort((a, b) => b.amount - a.amount).slice(0, 5);

    const maxTotal = Math.max(...top.map((s) => s.amount), 1);
    const floor = maxTotal * 0.05;
    const barData = top
      .map((s) => ({ value: Math.max(s.amount, floor), actualValue: s.amount }))
      .reverse();

    return {
      grid: { left: 8, right: 56, top: 4, bottom: 4, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const p = params[0];
          return `<b>${p.name}</b><br/>${currencyFormatter.format(p.data.actualValue)}`;
        },
      },
      xAxis: { type: "value", show: false },
      yAxis: {
        type: "category",
        data: top.map((s) => s.customer_name).reverse(),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontSize: 10, color: "#334155", width: 150, overflow: "break", lineHeight: 12 },
      },
      series: [
        {
          type: "bar",
          data: barData,
          barMaxWidth: 12,
          itemStyle: { color: COLORS.primary, borderRadius: [0, 4, 4, 0] },
          label: {
            show: true,
            position: "right",
            fontSize: 10,
            color: "#64748B",
            formatter: (p: any) => currencyFormatter.format(p.data.actualValue),
          },
        },
      ],
    };
  }, [topRecentSales, currencyFormatter]);

  const invoiceStatusOption = useMemo(() => {
    const entries = (invoiceStatus?.statuses ?? []).filter((s) => s.count > 0);
    return {
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: {
        orient: "vertical",
        right: 0,
        top: "center",
        itemWidth: 9,
        itemHeight: 9,
        textStyle: { fontSize: 10, color: "#475569" },
      },
      series: [
        {
          type: "pie",
          radius: ["55%", "80%"],
          center: ["36%", "50%"],
          avoidLabelOverlap: true,
          label: { show: false },
          labelLine: { show: false },
          data: entries.map((s) => ({
            name: s.status,
            value: s.count,
            itemStyle: { color: statusColor(s) },
          })),
        },
      ],
    };
  }, [invoiceStatus]);

  const conversionGaugeOption = useMemo(() => {
    const rate = quotationConversion?.conversion_rate_percent ?? 0;
    return {
      series: [
        {
          type: "gauge",
          startAngle: 220,
          endAngle: -40,
          min: 0,
          max: 100,
          radius: "95%",
          center: ["50%", "62%"],
          progress: { show: true, width: 10, itemStyle: { color: COLORS.primary } },
          axisLine: { lineStyle: { width: 10, color: [[1, "#E2E8F0"]] } },
          pointer: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          detail: {
            valueAnimation: true,
            formatter: `{value}%`,
            fontSize: 22,
            fontWeight: 700,
            color: "#1E293B",
            offsetCenter: [0, "-4%"],
          },
          data: [{ value: rate }],
        },
      ],
    };
  }, [quotationConversion]);

  const agingOption = useMemo(() => {
    const buckets = overdueAging?.buckets ?? [];
    const reversed = [...buckets].reverse();
    return {
      grid: { left: 4, right: 12, top: 2, bottom: 2, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const p = params[0];
          return `<b>${p.name}</b><br/>${currencyFormatter.format(p.value)}`;
        },
      },
      xAxis: { type: "value", show: false },
      yAxis: {
        type: "category",
        data: reversed.map((b) => b.range),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontSize: 10, color: "#334155" },
      },
      series: [
        {
          type: "bar",
          data: reversed.map((b) => b.amount),
          barMaxWidth: 14,
          barCategoryGap: "20%",
          itemStyle: {
            color: (p: any) => [...AGING_BUCKET_COLORS].reverse()[p.dataIndex] ?? COLORS.warning,
            borderRadius: [0, 4, 4, 0],
          },
          label: {
            show: true,
            position: "right",
            fontSize: 10,
            color: "#64748B",
            formatter: (p: any) => (p.value > 0 ? currencyFormatter.format(p.value) : ""),
          },
        },
      ],
    };
  }, [overdueAging, currencyFormatter]);

  const activityIcon = (type: string) => {
    if (type.startsWith("quotation")) return { Icon: ScrollText, tint: "bg-amber-50 text-amber-600" };
    if (type.startsWith("payment")) return { Icon: CheckCircle2, tint: "bg-emerald-50 text-emerald-600" };
    return { Icon: FileStack, tint: "bg-indigo-50 text-indigo-600" };
  };

  const actionItemIcon = (type: string) => {
    if (type === "overdue_invoices") return { Icon: AlertTriangle, tint: "bg-rose-50 text-rose-600" };
    if (type === "high_outstanding") return { Icon: Users, tint: "bg-blue-50 text-blue-600" };
    return { Icon: BellRing, tint: "bg-slate-50 text-slate-500" };
  };


  if (error && !dashboard) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-card p-6 text-center">
        <AlertTriangle className="h-6 w-6 text-rose-500" />
        <p className="text-sm font-medium text-slate-700">{error}</p>
        <button
          type="button"
          onClick={() => fetchDashboard(year)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-3 pb-4 min-h-0">
      {/* KPI ROW */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => {
          const targetTab = KPI_TAB_MAP[stat.label];
          const canNavigate =
            !!targetTab && (!availableTabIds || availableTabIds.includes(targetTab));
          return (
            <KpiTile
              key={stat.label}
              label={stat.label}
              count={stat.count}
              worth={stat.worth}
              currencyFormatter={currencyFormatter}
              loading={loading}
              onDoubleClick={canNavigate && onNavigateTab ? () => onNavigateTab(targetTab) : undefined}
            />
          );
        })}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* LEFT + CENTER (2 cols worth) */}
        <div className="flex flex-col gap-3 lg:col-span-2">
          <CardShell title="Monthly Sales Overview" icon={TrendingUp}>
            {loading ? (
              <CardSkeleton height="h-48" />
            ) : (
              <MonthlySalesOverview
                currencyFormatter={currencyFormatter}
                data={monthlySalesOverview}
                year={year}
                years={yearOptions}
                loading={chartLoading}
                onYearChange={handleYearChange}
              />
            )}
          </CardShell>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CardShell title="Top 5 Recent Sales" icon={ArrowUpRight}>
              <div className="h-48">
                {loading ? (
                  <CardSkeleton height="h-48" />
                ) : topRecentSales.length === 0 ? (
                  <EmptyState label="No recent sales" />
                ) : (
                  <EChart option={topSalesOption} height={192} />
                )}
              </div>
            </CardShell>

            <CardShell title="Invoice Status" icon={FileBadge}>
              <div className="h-40">
                {loading ? (
                  <CardSkeleton height="h-40" />
                ) : !invoiceStatus || invoiceStatus.statuses.every((s) => s.count === 0) ? (
                  <EmptyState label="No invoices yet" />
                ) : (
                  <EChart option={invoiceStatusOption} height={160} />
                )}
              </div>
            </CardShell>
          </div>

          <CardShell
            title="Overdue Invoice Aging"
            icon={AlertTriangle}
            className="h-96"
            action={
              !loading && overdueAging && overdueAging.invoices.length > 0 ? (
                <span className="text-xs font-semibold text-rose-600">
                  {currencyFormatter.format(overdueAging.total_overdue)} total
                </span>
              ) : null
            }
          >
            {loading ? (
              <CardSkeleton height="h-full" />
            ) : !overdueAging || overdueAging.invoices.length === 0 ? (
              <EmptyState label="No overdue invoices" icon={CheckCircle2} />
            ) : (
              <div className="flex h-full flex-col gap-1">
                <div className="h-20 shrink-0">
                  <EChart option={agingOption} height={80} />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto border-t border-slate-100 pr-1">
                  <div className="flex flex-col divide-y divide-slate-100">
                    {[...overdueAging.invoices]
                      .sort((a, b) => b.days_overdue - a.days_overdue)
                      .map((inv) => (
                        <div key={inv.invoice_id} className="flex items-center justify-between py-1.5 text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-700">{inv.customer_name}</span>
                            <span className="text-xs text-slate-400">{inv.invoice_id}</span>
                          </div>
                          <div className="flex shrink-0 flex-col items-end">
                            <span className="font-semibold text-slate-800">
                              {currencyFormatter.format(inv.amount)}
                            </span>
                            <span
                              className={`text-xs font-medium ${inv.days_overdue > 90
                                ? "text-rose-600"
                                : inv.days_overdue > 60
                                  ? "text-red-500"
                                  : inv.days_overdue > 30
                                    ? "text-orange-500"
                                    : "text-amber-500"
                                }`}
                            >
                              {inv.days_overdue}d overdue
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </CardShell>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <CardShell title="Quotation Conversion" icon={Sparkles}>
              {loading ? (
                <CardSkeleton height="h-24" />
              ) : !quotationConversion || quotationConversion.total_quotations === 0 ? (
                <EmptyState label="No quotations yet" />
              ) : (
                <div className="flex flex-col items-center">
                  <div className="h-24 w-full">
                    <EChart option={conversionGaugeOption} height={96} />
                  </div>
                  <div className="mt-1 flex w-full justify-between text-xs text-slate-500">
                    <span>{quotationConversion.total_quotations} quotations</span>
                    <span>{quotationConversion.converted_quotations} converted</span>
                  </div>
                </div>
              )}
            </CardShell>

            <CardShell title="Customer Concentration" icon={Users}>
              {loading ? (
                <CardSkeleton height="h-24" />
              ) : !customerConcentration ? (
                <EmptyState label="No customer data" />
              ) : (
                <div className="flex h-24 flex-col justify-center gap-2">
                  <div>
                    <span className="text-xl font-bold text-slate-800">
                      {customerConcentration.top_customer_revenue_percent}%
                    </span>
                    <p className="mt-0.5 text-xs leading-snug text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {customerConcentration.top_customer_name}
                      </span>{" "}
                      contributes {customerConcentration.top_customer_revenue_percent}% of tracked revenue
                    </p>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      style={{ width: `${customerConcentration.top_customer_revenue_percent}%` }}
                    />
                  </div>
                </div>
              )}
            </CardShell>
          </div>

          <CardShell title="Needs Attention" icon={BellRing} className="h-64">
            {loading ? (
              <CardSkeleton height="h-full" />
            ) : actionItems.length === 0 ? (
              <EmptyState label="Nothing needs attention" icon={CheckCircle2} />
            ) : (
              <div className="flex h-full flex-col divide-y divide-slate-100 overflow-y-auto pr-1">
                {actionItems.map((item) => {
                  const { Icon, tint } = actionItemIcon(item.type);
                  return (
                    <div key={item.type} className="flex items-center justify-between py-1.5 text-sm">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tint}`}>
                          <Icon className="h-3 w-3" />
                        </span>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700">{item.label}</span>
                          <span className="text-xs text-slate-400">{item.title}</span>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardShell>

          <CardShell title="Recent Sales Activity" icon={Activity}>
            {loading ? (
              <CardSkeleton height="h-48" />
            ) : recentActivity.length === 0 ? (
              <EmptyState label="No recent activity" />
            ) : (
              <div className="relative flex flex-col gap-2.5 pl-1">
                {recentActivity.slice(0, 5).map((item, idx) => {
                  const { Icon, tint } = activityIcon(item.type);
                  const isLast = idx === Math.min(recentActivity.length, 5) - 1;
                  return (
                    <div key={`${item.reference_id}-${item.timestamp}`} className="relative flex gap-2.5">
                      {!isLast && (
                        <span className="absolute left-[11px] top-6 h-[calc(100%+2px)] w-px bg-slate-100" />
                      )}
                      <span className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tint}`}>
                        <Icon className="h-3 w-3" />
                      </span>
                      <div className="flex flex-1 items-center justify-between gap-2 pb-0.5">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700">{item.title}</span>
                          <span className="text-xs text-slate-400">
                            {item.customer_name} • {item.reference_id}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          {item.amount != null && (
                            <span className="text-xs font-semibold text-slate-600">
                              {currencyFormatter.format(item.amount)}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">{timeAgo(item.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardShell>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;