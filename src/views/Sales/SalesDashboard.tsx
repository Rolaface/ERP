import React, { useEffect, useMemo, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  LineChart,
  PieChart,
  Pie,
  Cell,
  Bar,
  BarChart,
} from "recharts";

import { FileText, FileSignature, Receipt } from "lucide-react";

import { getSalesDashboardSummary } from "../../api/salesDashboardApi";
import { ChartSkeleton } from "../../components/ChartSkeleton";

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

  const chartsLoading = summaryLoading || !summaryData;

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

  const pieColors = [
    "var(--primary)",
    "var(--brand-blue-bottom)",
    "var(--brand-blue-top)",
    "var(--primary-700)",
    "var(--primary-600)",
    "var(--brand-blue-bottom)",
  ];

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
      <text
        x={x}
        y={y}
        fill="#374151"
        fontSize={11}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {String(name)}: {String(value)}
      </text>
    );
  };

  const renderCurrencyDonutLabel = (props: any) => {
    const { x, y, name, value } = props;
    return (
      <text
        x={x}
        y={y}
        fill="#374151"
        fontSize={11}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {String(name)}: {currencyZMWCompact.format(Number(value ?? 0))}
      </text>
    );
  };

  return (
    <div className="bg-app min-h-screen px-4 sm:px-6 pb-6 pt-3">
      <div className="max-w-[1600px] mx-auto flex flex-col">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
          {chartsLoading
            ? Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm min-h-[124px] animate-pulse"
                >
                  <div className="flex items-center justify-between h-full">
                    <div>
                      <div className="h-3 w-28 bg-gray-300 rounded" />
                      <div className="h-7 w-20 bg-gray-300 rounded mt-2" />
                    </div>
                    <div className="h-12 w-12 bg-gray-300 rounded-xl border border-gray-400" />
                  </div>
                </div>
              ))
            : [
                {
                  label: "Proforma Invoices",
                  value: String(summaryData?.totalProformaInvoices ?? 0),
                  icon: FileSignature,
                  gradient:
                    "from-[var(--brand-blue-top)] to-[var(--brand-blue-bottom)]",
                },
                {
                  label: "Quotations",
                  value: String(summaryData?.totalQuotations ?? 0),
                  icon: Receipt,
                  gradient:
                    "from-[var(--brand-blue-bottom)] to-[var(--primary)]",
                },
                {
                  label: "Sales Invoices",
                  value: String(summaryData?.totalSalesInvoices ?? 0),
                  icon: Receipt,
                  gradient: "from-[var(--primary)] to-[var(--primary-700)]",
                },
                {
                  label: "Credit Notes",
                  value: String(summaryData?.totalSalesCreditNotes ?? 0),
                  icon: FileText,
                  gradient:
                    "from-[var(--brand-blue-top)] to-[var(--brand-blue-bottom)]",
                },
                {
                  label: "Debit Notes",
                  value: String(summaryData?.totalSalesDebitNotes ?? 0),
                  icon: Receipt,
                  gradient: "from-[var(--primary)] to-[var(--primary-700)]",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm min-h-[124px]"
                >
                  <div className="flex items-center justify-between h-full">
                    <div>
                      <p className="text-sm font-semibold text-gray-600">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-sm`}
                    >
                      <stat.icon className="text-white" size={22} />
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {summaryError && (
          <div className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
            {summaryError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Monthly Sales</h3>
            </div>

            <div
              className="h-72 rounded-lg border border-gray-200 bg-white"
              style={chartPlaneStyle}
            >
              {chartsLoading ? (
                <ChartSkeleton variant="line" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyTrendData}
                    margin={{ top: 16, right: 18, left: 6, bottom: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      width={52}
                      tickFormatter={(v) =>
                        currencyZMWCompact.format(Number(v))
                      }
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
                      itemStyle={{
                        color: "var(--text)",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                      cursor={{ fill: "var(--primary)", opacity: 0.1 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--brand-blue-bottom)"
                      strokeWidth={3}
                      dot={false}
                      name="Sales"
                      label={{
                        position: "top",
                        fontSize: 10,
                        fill: "var(--muted)",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">
                Top 10 Recent Sales
              </h3>
            </div>
            <div
              className="h-72 rounded-lg border border-gray-200 bg-white"
              style={chartPlaneStyle}
            >
              {chartsLoading ? (
                <ChartSkeleton variant="bar" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={recentSalesChartData}
                    margin={{ top: 16, right: 18, left: 6, bottom: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={56}
                    />
                    <Tooltip
                      formatter={(v: any) => currencyZMW.format(Number(v ?? 0))}
                      labelFormatter={(label: any) => String(label ?? "")}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      width={52}
                      tickFormatter={(v) =>
                        currencyZMWCompact.format(Number(v))
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      dataKey="total"
                      name="Amount"
                      fill="var(--primary)"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">
                sales breakdown
              </h3>
            </div>

            <div
              className="h-72 rounded-lg border border-gray-200 bg-white"
              style={chartPlaneStyle}
            >
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
                      itemStyle={{
                        color: "var(--text)",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
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
                        <Cell
                          key={idx}
                          fill={pieColors[idx % pieColors.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">
                Invoice breakdown
              </h3>
            </div>

            <div className="h-72 rounded-lg border border-gray-200 bg-white">
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
                      itemStyle={{
                        color: "var(--text)",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
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
                        <Cell
                          key={idx}
                          fill={pieColors[idx % pieColors.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
