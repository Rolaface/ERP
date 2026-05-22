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
// Make sure to export these two from your api file
import { getRecentSales, getMonthlySalesBreakdown, getSalesCounts, getMonthlySales } from "../../api/salesDashboardApi";
import { ChartSkeleton } from "../../components/ChartSkeleton";
import { AppMetricCard, AppSectionCard } from "../../components/ui/app-shell";
import { MonthlySalesBarChart } from "../../components/charts/MonthlySalesBarChart";
import { useCompanyStore } from "../../store/companyStore";

interface RecentSale {
  name: string;
  customer_name: string;
  posting_date: string;
  base_grand_total: number;
  outstanding_amount: number;
  status: string;
  currency: string;
}

interface MonthlySales {
  month: string;
  totalSales: number;
  totalReceived: number;
  totalPending: number;
}

const SalesDashboard: React.FC = () => {
  const [chartsLoading, setChartsLoading] = useState(true);
 const [monthlyEchartsData, setMonthlyEchartsData] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
  const [salesCounts, setSalesCounts] = useState({
    proforma_invoices: 0,
    quotations: 0,
    sales_invoices: 0,
    credit_notes: 0,
    debit_notes: 0
  });

  const baseCurrency = useCompanyStore((state) => state.baseCurrency) || 'INR';

  const currencyINR = useMemo(() => {
    const locale = baseCurrency === 'INR' ? 'en-IN' : 'en-US'; 
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: baseCurrency,
      maximumFractionDigits: 2,
    });
  }, [baseCurrency]);

  const currencyINRCompact = useMemo(() => {
    const locale = baseCurrency === 'INR' ? 'en-IN' : 'en-US'; 
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: baseCurrency,
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    });
  }, [baseCurrency]);
 

  const dateWithDay = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [],
  );

  const customerSharePieData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of recentSales) {
      const key = r.customer_name ?? "Unknown";
      map.set(key, (map.get(key) ?? 0) + Number(r.base_grand_total ?? 0));
    }
    const base = Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

    if (!base.length) return [];
    const top = base.slice(0, 5);
    const restTotal = base.slice(5).reduce((sum, r) => sum + Number(r.total ?? 0), 0);
    return restTotal > 0 ? [...top, { name: "Others", total: restTotal }] : top;
  }, [recentSales]);

  // 2. Sales Status Breakdown Pie (Using Received vs Pending)
  const salesStatusPieData = useMemo(() => {
    let received = 0;
    let pending = 0;
    
    monthlySales.forEach(m => {
      received += Number(m.totalReceived || 0);
      pending += Number(m.totalPending || 0);
    });

    if (received === 0 && pending === 0) return [];
    return [
      { name: "Total Received", total: received },
      { name: "Total Pending", total: pending }
    ];
  }, [monthlySales]);

  const pieColors = ["#8b5cf6", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#14b8a6"];

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setChartsLoading(true);
        // Fetch both APIs concurrently
        const [recentRes, monthlyRes, countsRes, echartsMonthlyRes] = await Promise.all([
          getRecentSales(),
          getMonthlySalesBreakdown(),
          getSalesCounts(),
          getMonthlySales()
        ]);

        if (!mounted) return;
        setRecentSales(recentRes?.data || []);
        // setMonthlySales(monthlyRes?.data || []);
        setMonthlySales(
  (monthlyRes?.data || []).map((item: any) => ({
    month: item.month,
    totalSales: item.totalSales ?? 0,
    totalReceived: item.totalReceived ?? 0,
    totalPending: item.totalPending ?? 0,
  }))
);
if (countsRes?.data) {
          setSalesCounts(countsRes.data);
        }
        if (echartsMonthlyRes?.data) {
          setMonthlyEchartsData(echartsMonthlyRes.data);
        }
      } catch (e: any) {
        console.error("Failed to load sales dashboard charts:", e);
      } finally {
        if (mounted) setChartsLoading(false);
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

  const renderCurrencyDonutLabel = (props: any) => {
    const { x, y, name, value } = props;
    return (
      <text x={x} y={y} fill="#374151" fontSize={11} textAnchor="middle" dominantBaseline="central">
        {String(name)}: {currencyINRCompact.format(Number(value ?? 0))}
      </text>
    );
  };

const stats = [
    { label: "Proforma Invoices", value: salesCounts.proforma_invoices, icon: FileSignature, gradient: "from-blue-500 to-blue-600" },
    { label: "Quotations", value: salesCounts.quotations, icon: ScrollText, gradient: "from-amber-500 to-amber-600" },
    { label: "Sales Invoices", value: salesCounts.sales_invoices, icon: Receipt, gradient: "from-emerald-500 to-emerald-600" },
    { label: "Credit Notes", value: salesCounts.credit_notes, icon: FileText, gradient: "from-sky-500 to-sky-600" },
    { label: "Debit Notes", value: salesCounts.debit_notes, icon: Banknote, gradient: "from-purple-500 to-purple-600" },
  ];

  // Component for 'No Data' Fallback
  const NoDataOverlay = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-xl z-10 text-sm text-gray-500 font-medium">
      No data available
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* --- TOP METRIC CARDS --- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <AppMetricCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            accentClassName={stat.gradient}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* --- MONTHLY SALES (LINE CHART) --- */}
      <AppSectionCard title="Monthly Sales Overview">
          <div className="relative h-72 rounded-xl border border-[var(--border)] bg-card" style={chartPlaneStyle}>
            {chartsLoading ? (
              <ChartSkeleton variant="bar" />
            ) : monthlyEchartsData.length === 0 ? (
              <NoDataOverlay />
            ) : (
              <MonthlySalesBarChart data={monthlyEchartsData} />
            )}
          </div>
        </AppSectionCard>

        {/* --- TOP 10 RECENT SALES (BAR CHART) --- */}
        <AppSectionCard title="Top 10 Recent Sales">
          <div className="relative h-72 rounded-xl border border-[var(--border)] bg-card" style={chartPlaneStyle}>
            {chartsLoading ? (
              <ChartSkeleton variant="bar" />
            ) : recentSales.length === 0 ? (
              <NoDataOverlay />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recentSales} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="customer_name"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={54}
                  />
                  <YAxis tick={{ fontSize: 12 }} width={52} tickFormatter={(v) => currencyINRCompact.format(Number(v))} />
                  <Tooltip
                    formatter={(v: any) => currencyINR.format(Number(v ?? 0))}
                    labelFormatter={(
                      _label: any,
                      payload: readonly { payload?: { name?: string; customer_name?: string; posting_date?: string; status?: string } }[],
                    ) => {
                      const p = payload?.[0]?.payload;
                      if (!p) return "";
                      return (
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-gray-800">{p.name}</span>
                          <span className="text-gray-600">{p.customer_name}</span>
                          <span className="text-xs text-gray-500">
                            {p.posting_date ? dateWithDay.format(new Date(p.posting_date)) : ""} • <span className={p.status === "Unpaid" ? "text-red-500" : "text-emerald-500"}>{p.status}</span>
                          </span>
                        </div>
                      );
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
                  <Bar dataKey="base_grand_total" fill="#10b981" radius={[6, 6, 0, 0]} name="Grand Total">
                    <LabelList
                      dataKey="base_grand_total"
                      position="top"
                      formatter={(v: any) => currencyINRCompact.format(Number(v ?? 0))}
                      fill="#6b7280"
                      fontSize={10}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </AppSectionCard>
       {/* --- SALES BREAKDOWN (PIE CHART) --- */}
        <AppSectionCard title="Sales Breakdown">
          <div className="relative h-72 rounded-xl border border-[var(--border)] bg-card" style={chartPlaneStyle}>
            {chartsLoading ? (
              <ChartSkeleton variant="pie" />
            ) : customerSharePieData.length === 0 ? (
              <NoDataOverlay />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Tooltip
                    formatter={(v: any) => currencyINR.format(Number(v ?? 0))}
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

        {/* --- INVOICE BREAKDOWN (PIE CHART) --- */}
        <AppSectionCard title="Invoice Breakdown">
          <div className="relative h-72 rounded-xl border border-[var(--border)] bg-card">
            {chartsLoading ? (
              <ChartSkeleton variant="pie" />
            ) : customerSharePieData.length === 0 ? (
              <NoDataOverlay />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Tooltip
                    formatter={(v: any) => currencyINR.format(Number(v ?? 0))}
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