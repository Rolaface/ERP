import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
  Line,
} from "recharts";
import {
  FileText,
  ShoppingCart,
  Truck,
  Users,
  UsersRound,
} from "lucide-react";
import { getProcurementDetails, getProcurementSummary } from "../../api/procurementDashboardApi";
import { ChartSkeleton } from "../../components/ChartSkeleton";
import { AppMetricCard, AppSectionCard } from "../../components/ui/app-shell";
import { useCompanyStore } from "../../store/companyStore";

const ProcurementDashboard: React.FC = () => {
  const [chartsLoading, setChartsLoading] = useState(true);
  
  // Data States
  const [summaryData, setSummaryData] = useState<any>(null);
  const [detailsData, setDetailsData] = useState<any>(null);

  const palette = useMemo(
    () => ({
      purple: "#8b5cf6",
      blue: "#3b82f6",
      emerald: "#10b981",
      amber: "#f59e0b",
      slate: "#64748b",
    }),
    [],
  );
 
  const baseCurrency = useCompanyStore((state) => state.baseCurrency) || 'INR';

  const currencyINR = useMemo(() => {
    const locale = baseCurrency === 'INR' ? 'en-IN' : 'en-US'; 
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: baseCurrency,
      maximumFractionDigits: 2,
    });
  }, [baseCurrency]);

  const currencySymbol = useCompanyStore((state) => state.currencySymbol || '');
     
    const currencyFormatter = useMemo(() => {
      const locale = baseCurrency === 'INR' ? 'en-IN' : 'en-US'; 
      
      const numberFormatter = new Intl.NumberFormat(locale, {
        style: 'decimal', 
        maximumFractionDigits: 2, 
        notation: "compact"
      });
  
      return {
        format: (value: number) => {
          const num = Number(value) || 0;
          const formattedNumber = numberFormatter.format(Math.abs(num));
          
           const sign = num < 0 ? '-' : '';
          
           const space = currencySymbol.length > 1 ? ' ' : '';
          
          return `${sign}${currencySymbol}${space}${formattedNumber}`;
        }
      };
    }, [baseCurrency, currencySymbol]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setChartsLoading(true);
        const [summaryRes, detailsRes] = await Promise.all([
          getProcurementSummary(),
          getProcurementDetails(),
        ]);

        if (!mounted) return;
        setSummaryData(summaryRes?.data || null);
        setDetailsData(detailsRes?.data || null);
      } catch (e: any) {
        console.error("Failed to load procurement dashboard data:", e);
      } finally {
        if (mounted) setChartsLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

  // ----------------------------------------------------
  // DATA MEMOS
  // ----------------------------------------------------
  const stats = useMemo(() => [
    {
      label: "Total Suppliers",
      value: String(summaryData?.totalSuppliers ?? 0),
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      label: "Active Suppliers",
      value: String(summaryData?.activeSuppliers ?? 0),
      icon: UsersRound,
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Inactive Suppliers",
      value: String(summaryData?.inactiveSuppliers ?? 0),
      icon: UsersRound,
      gradient: "from-slate-500 to-slate-600",
    },
    {
      label: "Purchase Orders",
      value: String(summaryData?.totalPurchaseOrders ?? 0), // Updated key based on new API
      icon: ShoppingCart,
      gradient: "from-purple-500 to-purple-600",
    },
    {
      label: "Purchase Invoices",
      value: String(summaryData?.totalPurchaseInvoices ?? 0), // Updated key based on new API
      icon: FileText,
      gradient: "from-amber-500 to-amber-600",
    },
  ], [summaryData]);

  const procurementBarData = useMemo(() => [
    { name: "Total Suppliers", value: Number(summaryData?.totalSuppliers ?? 0) },
    { name: "Active", value: Number(summaryData?.activeSuppliers ?? 0) },
    { name: "Inactive", value: Number(summaryData?.inactiveSuppliers ?? 0) },
    { name: "Purchase Orders", value: Number(summaryData?.totalPurchaseOrders ?? 0) },
    { name: "Purchase Invoices", value: Number(summaryData?.totalPurchaseInvoices ?? 0) },
  ], [summaryData]);

  const supplierStatusDonutData = useMemo(() => [
    { name: "Active", value: Number(summaryData?.activeSuppliers ?? 0) },
    { name: "Inactive", value: Number(summaryData?.inactiveSuppliers ?? 0) },
  ], [summaryData]);

  // Merge Monthly Trends for the Composed Chart
  const documentsComposedData = useMemo(() => {
    if (!detailsData) return [];
    
    const poTrend = detailsData.purchaseOrders?.monthlyTrend || [];
    const piTrend = detailsData.purchaseInvoices?.monthlyTrend || [];

    // Map through the 12 months and combine PO and PI amounts
    return poTrend.map((po: any, index: number) => ({
      month: po.month,
      poAmount: Number(po.amount || 0),
      piAmount: Number(piTrend[index]?.amount || 0),
    }));
  }, [detailsData]);

  // ----------------------------------------------------
  // RENDER HELPERS
  // ----------------------------------------------------
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

  const TableSkeleton = () => (
    <div className="space-y-3 animate-pulse">
      <div className="h-3 w-28 rounded bg-gray-100" />
      <div className="h-3 w-full rounded bg-gray-100" />
      <div className="h-3 w-5/6 rounded bg-gray-100" />
      <div className="h-3 w-2/3 rounded bg-gray-100" />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* --- METRIC CARDS --- */}
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* --- PROCUREMENT OVERVIEW (BAR) --- */}
        <AppSectionCard title="Procurement Overview">
          <div className="h-72 rounded-xl border border-[var(--border)] bg-card" style={chartPlaneStyle}>
            {chartsLoading ? (
              <ChartSkeleton variant="bar" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={procurementBarData} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={48} />
                  <YAxis tick={{ fontSize: 12 }} width={52} />
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
                    cursor={{ fill: "var(--primary)", opacity: 0.1 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="value" fill={palette.blue} radius={[6, 6, 0, 0]} name="Count">
                    <LabelList dataKey="value" position="top" fill="#6b7280" fontSize={10} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </AppSectionCard>

        {/* --- SUPPLIER STATUS (PIE) --- */}
        <AppSectionCard title="Supplier Status">
          <div className="h-72 rounded-xl border border-[var(--border)] bg-card" style={chartPlaneStyle}>
            {chartsLoading ? (
              <ChartSkeleton variant="pie" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
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
                    data={supplierStatusDonutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={82}
                    paddingAngle={2}
                    label={renderDonutLabel}
                    labelLine={false}
                  >
                    {supplierStatusDonutData.map((_, idx) => (
                      <Cell key={idx} fill={idx === 0 ? palette.emerald : palette.slate} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </AppSectionCard>

        {/* --- DOCUMENTS (COMPOSED CHART: BAR + LINE) --- */}
        <AppSectionCard title="Documents Trend">
          <div className="h-72 rounded-xl border border-[var(--border)] bg-card" style={chartPlaneStyle}>
            {chartsLoading ? (
              <ChartSkeleton variant="line" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={documentsComposedData} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    width={52} 
                    tickFormatter={(v) => currencyFormatter.format(Number(v))}
                  />
                  <Tooltip
                    formatter={(v: any) => currencyFormatter.format(Number(v ?? 0))}
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
                  <Bar dataKey="poAmount" name="Purchase Orders" fill={palette.purple} radius={[4, 4, 0, 0]} barSize={20} />
                  <Line type="monotone" dataKey="piAmount" name="Purchase Invoices" stroke={palette.amber} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </AppSectionCard>

        {/* --- DOCUMENTS SUMMARY (TABLE) --- */}
        <AppSectionCard title="Documents Summary">
          <div className="rounded-xl border border-[var(--border)] bg-card px-4 py-4 h-72 flex flex-col justify-center">
            {chartsLoading ? (
              <TableSkeleton />
            ) : (
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-muted">
                    <th className="py-3 font-semibold">Document</th>
                    <th className="py-3 text-right font-semibold">Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border)]/70">
                    <td className="py-3 text-main">Purchase Orders</td>
                    <td className="py-3 text-right font-semibold text-main">
                      {Number(summaryData?.totalPurchaseOrders ?? 0)}
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--border)]/70">
                    <td className="py-3 text-main">Purchase Invoices</td>
                    <td className="py-3 text-right font-semibold text-main">
                      {Number(summaryData?.totalPurchaseInvoices ?? 0)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 text-main">Total Suppliers</td>
                    <td className="py-3 text-right font-semibold text-main">
                      {Number(summaryData?.totalSuppliers ?? 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </AppSectionCard>
      </div>
    </div>
  );
};

export default ProcurementDashboard;