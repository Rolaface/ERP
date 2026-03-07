import { useEffect, useMemo, useState } from "react";
import { getDashboardSummary } from "../api/dashboardApi";
import { getHrDashboardSummary } from "../api/hrDashboardApi";
import { getInventoryDashboardSummary } from "../api/inventoryDashboardApi";
import { ChartSkeleton } from "../components/ChartSkeleton";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { FileText, Receipt, TrendingUp, Users } from "lucide-react";

const Dashboard = () => {
  const chartColors = useMemo(
    () => ({
      primary: "var(--primary)",
      blue: "var(--brand-blue-bottom)",
      blueSoft: "var(--brand-blue-top)",
      grid: "var(--border)",
    }),
    [],
  );

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<{
    totalCustomers: number;
    totalSuppliers: number;
    totalSalesInvoices: number;
    totalPurchaseInvoices: number;
    totalSalesAmount: number;
    monthlySalesGraph: { labels: string[]; data: number[] };
    recentSales: Array<{
      name: string;
      customer: string;
      posting_date: string;
      grand_total: number;
    }>;
  } | null>(null);

  const [hrSummaryData, setHrSummaryData] = useState<{
    total: number;
    active: number;
    inactive: number;
    onLeave: number;
    totalLeaveTypes: number;
  } | null>(null);

  const [inventorySummaryData, setInventorySummaryData] = useState<{
    totalItems: number;
    serviceItems: number;
    rawMaterialItems: number;
    finishedProductsItems: number;
    totalImportedItems: number;
  } | null>(null);

  const [monthlyTrendData, setMonthlyTrendData] = useState<
    Array<{ name: string; revenue: number }>
  >([]);

  const chartsLoading =
    summaryLoading || !summaryData || !hrSummaryData || !inventorySummaryData;

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setSummaryLoading(true);
        setSummaryError(null);
        setSummaryData(null);
        setHrSummaryData(null);
        setInventorySummaryData(null);
        setMonthlyTrendData([]);

        const [resp, hrResp, invResp] = await Promise.all([
          getDashboardSummary(),
          getHrDashboardSummary(),
          getInventoryDashboardSummary(),
        ]);
        if (!mounted) return;
        const d = resp.data;
        const hr = hrResp.data;
        const inv = invResp.data;
        setSummaryData({
          totalCustomers: d.totalCustomers,
          totalSuppliers: d.totalSuppliers,
          totalSalesInvoices: d.totalSalesInvoices,
          totalPurchaseInvoices: d.totalPurchaseInvoices,
          totalSalesAmount: d.totalSalesAmount,
          monthlySalesGraph: d.monthlySalesGraph,
          recentSales: d.recentSales,
        });

        setHrSummaryData({
          total: Number(hr.total ?? 0),
          active: Number(hr.active ?? 0),
          inactive: Number(hr.inactive ?? 0),
          onLeave: Number(hr.onLeave ?? 0),
          totalLeaveTypes: Number(hr.totalLeaveTypes ?? 0),
        });

        setInventorySummaryData({
          totalItems: Number(inv.totalItems ?? 0),
          serviceItems: Number(inv.serviceItems ?? 0),
          rawMaterialItems: Number(inv.rawMaterialItems ?? 0),
          finishedProductsItems: Number(inv.finishedProductsItems ?? 0),
          totalImportedItems: Number(inv.totalImportedItems ?? 0),
        });

        const labels = d.monthlySalesGraph?.labels ?? [];
        const values = d.monthlySalesGraph?.data ?? [];
        if (labels.length && labels.length === values.length) {
          setMonthlyTrendData(
            labels.map((name, i) => ({
              name,
              revenue: Number(values[i] ?? 0),
            })),
          );
        }
      } catch (e: any) {
        if (!mounted) return;
        setSummaryError(e?.message ?? "Failed to load dashboard summary");
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

  const currencyZMW = useMemo(
    () =>
      new Intl.NumberFormat("en-ZM", {
        style: "currency",
        currency: "ZMW",
        maximumFractionDigits: 2,
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

  const kpiCards = [
    {
      label: "Total Customers",
      value: String(summaryData?.totalCustomers ?? 0),
      icon: Users,
      gradient: "from-[var(--brand-blue-top)] to-[var(--brand-blue-bottom)]",
    },
    {
      label: "Total Suppliers",
      value: String(summaryData?.totalSuppliers ?? 0),
      icon: FileText,
      gradient: "from-[var(--brand-blue-bottom)] to-[var(--primary)]",
    },
    {
      label: "Sales Invoices",
      value: String(summaryData?.totalSalesInvoices ?? 0),
      icon: TrendingUp,
      gradient: "from-[var(--primary)] to-[var(--primary-700)]",
    },
    {
      label: "Purchase Invoices",
      value: String(summaryData?.totalPurchaseInvoices ?? 0),
      icon: FileText,
      gradient: "from-[var(--brand-blue-top)] to-[var(--brand-blue-bottom)]",
    },
    {
      label: "Total Sales Amount",
      value: currencyZMW.format(summaryData?.totalSalesAmount ?? 0),
      icon: Receipt,
      gradient: "from-[var(--primary)] to-[var(--primary-700)]",
    },
  ];

  const recentSalesRows = summaryData?.recentSales ?? [];

  const recentSalesChartData = useMemo(
    () =>
      [...recentSalesRows]
        .sort((a, b) => Number(b.grand_total ?? 0) - Number(a.grand_total ?? 0))
        .slice(0, 10)
        .map((r) => ({
          name: r.name,
          total: Number(r.grand_total ?? 0),
          customer: r.customer,
          posting_date: r.posting_date,
        })),
    [recentSalesRows],
  );

  const salesByCustomerChartData = useMemo(() => {
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

  const totalsOverviewChartData = useMemo(
    () => [
      { name: "Customers", value: Number(summaryData?.totalCustomers ?? 0) },
      { name: "Suppliers", value: Number(summaryData?.totalSuppliers ?? 0) },
      {
        name: "Sales Invoices",
        value: Number(summaryData?.totalSalesInvoices ?? 0),
      },
      {
        name: "Purchase Invoices",
        value: Number(summaryData?.totalPurchaseInvoices ?? 0),
      },
    ],
    [summaryData],
  );

  const employeeStatusChartData = useMemo(
    () => [
      { name: "Active", value: Number(hrSummaryData?.active ?? 0) },
      { name: "On Leave", value: Number(hrSummaryData?.onLeave ?? 0) },
      { name: "Inactive", value: Number(hrSummaryData?.inactive ?? 0) },
    ],
    [hrSummaryData],
  );

  const employeeStatusColors = useMemo(
    () => [chartColors.primary, chartColors.blueSoft, chartColors.blue],
    [chartColors],
  );

  const inventoryPieColors = useMemo(
    () => [
      chartColors.blue,
      chartColors.primary,
      chartColors.blueSoft,
      "var(--primary-700)",
    ],
    [chartColors],
  );

  const itemsBreakdownChartData = useMemo(
    () => [
      {
        name: "Raw Material",
        value: Number(inventorySummaryData?.rawMaterialItems ?? 0),
      },
      {
        name: "Service",
        value: Number(inventorySummaryData?.serviceItems ?? 0),
      },
      {
        name: "Imported",
        value: Number(inventorySummaryData?.totalImportedItems ?? 0),
      },
      {
        name: "Finished Products",
        value: Number(inventorySummaryData?.finishedProductsItems ?? 0),
      },
    ],
    [inventorySummaryData],
  );

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

  const legendProps = useMemo(
    () => ({
      wrapperStyle: { fontSize: 12 },
      layout: "horizontal" as const,
      verticalAlign: "bottom" as const,
      align: "center" as const,
      iconType: "square" as const,
      height: 36,
    }),
    [],
  );

  return (
    <div className="p-6 bg-app min-h-screen">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600 text-xs md:text-sm">
            Business overview and key performance trends
          </p>
        </div>
      </div>

      {summaryLoading && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-4 py-3 text-sm font-semibold">
          Loading dashboard summary...
        </div>
      )}

      {summaryError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
          {summaryError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-5">
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
          : kpiCards.map((card, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm min-h-[124px]"
              >
                <div className="flex items-center justify-between h-full">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">
                      {card.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`p-3 bg-gradient-to-br ${card.gradient} rounded-xl shadow-sm`}
                  >
                    <card.icon className="text-white" size={22} />
                  </div>
                </div>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Monthly Sales</h3>
          </div>
          <div className="h-72 rounded-lg border border-gray-200 bg-white">
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
                    stroke={chartColors.grid}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "var(--muted)" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--muted)" }}
                    width={52}
                  />
                  <Tooltip
                    formatter={(v: any) => currencyZMW.format(Number(v ?? 0))}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={chartColors.blue}
                    strokeWidth={2}
                    dot={false}
                    name="Sales"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Top 10 Invoices</h3>
          </div>
          <div className="h-72 rounded-lg border border-gray-200 bg-white">
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
                    stroke={chartColors.grid}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={48}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--muted)" }}
                    width={52}
                  />
                  <Tooltip
                    formatter={(v: any) => currencyZMW.format(Number(v ?? 0))}
                    labelFormatter={(
                      _label: any,
                      payload: readonly {
                        payload?: {
                          name?: string;
                          customer?: string;
                          posting_date?: string;
                        };
                      }[],
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
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="total"
                    fill={chartColors.primary}
                    radius={[6, 6, 0, 0]}
                    name="Total"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">
              Top 10 Customers
            </h3>
          </div>
          <div className="h-72 rounded-lg border border-gray-200 bg-white">
            {chartsLoading ? (
              <ChartSkeleton variant="bar" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salesByCustomerChartData}
                  margin={{ top: 16, right: 18, left: 6, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartColors.grid}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={52}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--muted)" }}
                    width={52}
                  />
                  <Tooltip
                    formatter={(v: any) => currencyZMW.format(Number(v ?? 0))}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="total"
                    fill={chartColors.blueSoft}
                    radius={[6, 6, 0, 0]}
                    name="Total"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Totals Overview</h3>
          </div>
          <div className="h-72 rounded-lg border border-gray-200 bg-white">
            {chartsLoading ? (
              <ChartSkeleton variant="bar" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={totalsOverviewChartData}
                  margin={{ top: 16, right: 18, left: 6, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartColors.grid}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                    interval={0}
                    angle={-10}
                    textAnchor="end"
                    height={44}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--muted)" }}
                    width={52}
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="value"
                    fill={chartColors.blue}
                    radius={[6, 6, 0, 0]}
                    name="Count"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Items Breakdown</h3>
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
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      fontSize: 12,
                    }}
                  />
                  <Legend {...legendProps} />
                  <Pie
                    data={itemsBreakdownChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="44%"
                    innerRadius={55}
                    outerRadius={82}
                    paddingAngle={2}
                    label={renderDonutLabel}
                    labelLine={false}
                  >
                    {itemsBreakdownChartData.map((_, idx) => (
                      <Cell
                        key={`items-${idx}`}
                        fill={
                          inventoryPieColors[idx % inventoryPieColors.length]
                        }
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
            <h3 className="text-sm font-bold text-gray-900">Employee Status</h3>
          </div>
          <div
            className="h-72 rounded-lg border border-gray-200 bg-white"
            style={chartPlaneStyle}
          >
            {chartsLoading ? (
              <ChartSkeleton variant="bar" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(v: any) => Number(v ?? 0)}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Pie
                    data={employeeStatusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {employeeStatusChartData.map((entry, idx) => (
                      <Cell
                        key={`${entry.name}-${idx}`}
                        fill={
                          employeeStatusColors[
                            idx % employeeStatusColors.length
                          ]
                        }
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
  );
};

export default Dashboard;
