import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
  Line,
  LineChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Banknote,
  FileText,
  FileSignature,
  Receipt,
  ScrollText,
} from "lucide-react";
import { getSalesDashboardSummary } from "../../api/salesDashboardApi";
import { ChartSkeleton } from "../../components/ChartSkeleton";
import { AppMetricCard, AppSectionCard } from "../../components/ui/app-shell";

const SalesDashboard: React.FC = () => {
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<{
    totalProformaInvoices: number;
    totalQuotations: number;
    totalSalesInvoices: number;
    totalSalesCreditNotes: number;
    totalSalesDebitNotes: number;
    recentSales: Array<{
      name: string;
      customer: string;
      posting_date: string;
      grand_total: number;
    }>;
    monthlySalesGraph: { labels: string[]; data: number[] };
  } | null>(null);

  // const chartsLoading = summaryLoading || !summaryData;
  const chartsLoading = summaryLoading || (!summaryData && !summaryError);

  const currencyZMW = useMemo(
    () =>
      new Intl.NumberFormat("en-ZM", {
        style: "currency",
        currency: "ZMW",
        maximumFractionDigits: 2,
      }),
    [],
  );

  const currencyZMWCompact = useMemo(
    () =>
      new Intl.NumberFormat("en-ZM", {
        style: "currency",
        currency: "ZMW",
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 1,
      }),
    [],
  );

  const dateWithDay = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [],
  );

  const recentSalesRows = summaryData?.recentSales ?? [];

  const monthlyTrendData = useMemo(() => {
    const labels = summaryData?.monthlySalesGraph?.labels ?? [];
    const values = summaryData?.monthlySalesGraph?.data ?? [];
    if (!labels.length || labels.length !== values.length) return [];
    return labels.map((name, i) => ({ name, revenue: Number(values[i] ?? 0) }));
  }, [summaryData]);

  const topCustomersChartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of recentSalesRows) {
      const key = r.customer ?? "Unknown";
      map.set(key, (map.get(key) ?? 0) + Number(r.grand_total ?? 0));
    }
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [recentSalesRows]);

  const recentSalesChartData = useMemo(() => {
    const invoiceNumber = (name?: string) => {
      const match = String(name ?? "").match(/(\d+)/g);
      if (!match?.length) return 0;
      return Number.parseInt(match[match.length - 1] ?? "0", 10) || 0;
    };

    return [...recentSalesRows]
      .sort((a, b) => {
        const na = invoiceNumber(a.name);
        const nb = invoiceNumber(b.name);
        if (nb !== na) return nb - na;

        const da = new Date(a.posting_date ?? "");
        const db = new Date(b.posting_date ?? "");
        const ta = Number.isNaN(da.getTime()) ? 0 : da.getTime();
        const tb = Number.isNaN(db.getTime()) ? 0 : db.getTime();
        if (tb !== ta) return tb - ta;

        return Number(b.grand_total ?? 0) - Number(a.grand_total ?? 0);
      })
      .slice(0, 10)
      .map((r) => ({
        name: r.name,
        total: Number(r.grand_total ?? 0),
        customer: r.customer,
        posting_date: r.posting_date,
      }));
  }, [recentSalesRows]);

  const customerSharePieData = useMemo(() => {
    const base = topCustomersChartData;
    if (!base.length) return [];

    const top = base.slice(0, 5);
    const restTotal = base
      .slice(5)
      .reduce((sum, r) => sum + Number(r.total ?? 0), 0);
    return restTotal > 0 ? [...top, { name: "Others", total: restTotal }] : top;
  }, [topCustomersChartData]);

  const documentTotalsDonutData = useMemo(
    () => [
      {
        name: "Proforma Invoices",
        total: Number(summaryData?.totalProformaInvoices ?? 0),
      },
      {
        name: "Quotations",
        total: Number(summaryData?.totalQuotations ?? 0),
      },
      {
        name: "Sales Invoices",
        total: Number(summaryData?.totalSalesInvoices ?? 0),
      },
      {
        name: "Credit Notes",
        total: Number(summaryData?.totalSalesCreditNotes ?? 0),
      },
      {
        name: "Debit Notes",
        total: Number(summaryData?.totalSalesDebitNotes ?? 0),
      },
    ],
    [summaryData],
  );

  const pieColors = ["#8b5cf6", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#14b8a6"];

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setSummaryLoading(true);
        setSummaryError(null);
        setSummaryData(null);
        const resp = await getSalesDashboardSummary();

        if (!mounted) return;
        const d = resp.data;

        setSummaryData({
          totalProformaInvoices: d.totalProformaInvoices,
          totalQuotations: d.totalQuotations,
          totalSalesInvoices: d.totalSalesInvoices,
          totalSalesCreditNotes: d.totalSalesCreditNotes,
          totalSalesDebitNotes: d.totalSalesDebitNotes,
          recentSales: d.recentSales,
          monthlySalesGraph: d.monthlySalesGraph,
        });
      } catch (e: any) {
        if (!mounted) return;
        setSummaryError(e?.message ?? "Failed to load sales dashboard summary");
      } finally {
        if (!mounted) return;
        setSummaryLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

  const chartPlaneStyle = useMemo(
    () => ({
      backgroundImage:
        "linear-gradient(rgba(229,231,235,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(229,231,235,0.7) 1px, transparent 1px)",
      backgroundSize: "24px 24px",
      backgroundPosition: "-1px -1px",
    }),
    [],
  );

  const renderDonutLabel = (props: any) => {
    const { x, y, name, value } = props;
    return (
      <text x={x} y={y} fill="#374151" fontSize={11} textAnchor="middle" dominantBaseline="central">
        {String(name)}: {String(value)}
      </text>
    );
  };

  const renderCurrencyDonutLabel = (props: any) => {
    const { x, y, name, value } = props;
    return (
      <text x={x} y={y} fill="#374151" fontSize={11} textAnchor="middle" dominantBaseline="central">
        {String(name)}: {currencyZMWCompact.format(Number(value ?? 0))}
      </text>
    );
  };

  const stats = [
    {
      label: "Proforma Invoices",
      value: String(summaryData?.totalProformaInvoices ?? 0),
      icon: FileSignature,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      label: "Quotations",
      value: String(summaryData?.totalQuotations ?? 0),
      icon: ScrollText,
      gradient: "from-amber-500 to-amber-600",
    },
    {
      label: "Sales Invoices",
      value: String(summaryData?.totalSalesInvoices ?? 0),
      icon: Receipt,
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Credit Notes",
      value: String(summaryData?.totalSalesCreditNotes ?? 0),
      icon: FileText,
      gradient: "from-sky-500 to-sky-600",
    },
    {
      label: "Debit Notes",
      value: String(summaryData?.totalSalesDebitNotes ?? 0),
      icon: Banknote,
      gradient: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {chartsLoading
          ? Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="app-surface min-h-[124px] animate-pulse p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-3 w-28 rounded bg-gray-300" />
                    <div className="mt-3 h-8 w-20 rounded bg-gray-300" />
                  </div>
                  <div className="h-12 w-12 rounded-xl border border-gray-300 bg-gray-300" />
                </div>
              </div>
            ))
          : stats.map((stat) => (
              <AppMetricCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                accentClassName={stat.gradient}
              />
            ))}
      </div>

      {summaryError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
          {summaryError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AppSectionCard title="Monthly Sales">
          <div className="h-72 rounded-xl border border-[var(--border)] bg-card" style={chartPlaneStyle}>
            {chartsLoading ? (
              <ChartSkeleton variant="line" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    width={52}
                    tickFormatter={(v) => currencyZMWCompact.format(Number(v))}
                  />
                  <Tooltip
                    formatter={(v: any) => currencyZMW.format(Number(v ?? 0))}
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: "8px 12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    itemStyle={{ color: "var(--text)", fontSize: 12, fontWeight: 600 }}
                    cursor={{ fill: "var(--primary)", opacity: 0.1 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={false}
                    name="Sales"
                    label={{ position: "top", fontSize: 10, fill: "#6b7280" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </AppSectionCard>

        <AppSectionCard title="Top 10 Recent Sales">
          <div className="h-72 rounded-xl border border-[var(--border)] bg-card" style={chartPlaneStyle}>
            {chartsLoading ? (
              <ChartSkeleton variant="bar" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recentSalesChartData} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={54}
                  />
                  <YAxis tick={{ fontSize: 12 }} width={52} />
                  <Tooltip
                    formatter={(v: any) => currencyZMW.format(Number(v ?? 0))}
                    labelFormatter={(
                      _label: any,
                      payload: readonly { payload?: { name?: string; customer?: string; posting_date?: string } }[],
                    ) => {
                      const p = payload?.[0]?.payload;
                      const labelParts: string[] = [];
                      if (p?.name) labelParts.push(p.name);
                      if (p?.customer) labelParts.push(p.customer);
                      if (p?.posting_date) {
                        const d = new Date(p.posting_date);
                        if (!Number.isNaN(d.getTime())) {
                          labelParts.push(dateWithDay.format(d));
                        }
                      }
                      return labelParts.join(" • ");
                    }}
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: "8px 12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    itemStyle={{ color: "var(--text)", fontSize: 12, fontWeight: 600 }}
                    cursor={{ fill: "var(--primary)", opacity: 0.1 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} name="Sales">
                    <LabelList
                      dataKey="total"
                      position="top"
                      formatter={(v: any) => currencyZMWCompact.format(Number(v ?? 0))}
                      fill="#6b7280"
                      fontSize={10}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </AppSectionCard>

        <AppSectionCard title="Sales Breakdown">
          <div className="h-72 rounded-xl border border-[var(--border)] bg-card" style={chartPlaneStyle}>
            {chartsLoading ? (
              <ChartSkeleton variant="pie" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Tooltip
                    formatter={(v: any) => Number(v ?? 0)}
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: "8px 12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    itemStyle={{ color: "var(--text)", fontSize: 12, fontWeight: 600 }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconType="square"
                    height={36}
                  />
                  <Pie
                    data={documentTotalsDonutData}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={82}
                    paddingAngle={2}
                    label={renderDonutLabel}
                    labelLine={false}
                  >
                    {documentTotalsDonutData.map((_, idx) => (
                      <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </AppSectionCard>

        <AppSectionCard title="Invoice Breakdown">
          <div className="h-72 rounded-xl border border-[var(--border)] bg-card">
            {chartsLoading ? (
              <ChartSkeleton variant="pie" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Tooltip
                    formatter={(v: any) => currencyZMW.format(Number(v ?? 0))}
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: "8px 12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    itemStyle={{ color: "var(--text)", fontSize: 12, fontWeight: 600 }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconType="square"
                    height={36}
                  />
                  <Pie
                    data={customerSharePieData}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={82}
                    paddingAngle={2}
                    label={renderCurrencyDonutLabel}
                    labelLine={false}
                  >
                    {customerSharePieData.map((_, idx) => (
                      <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </AppSectionCard>
      </div>
    </div>
  );
};

export default SalesDashboard;
