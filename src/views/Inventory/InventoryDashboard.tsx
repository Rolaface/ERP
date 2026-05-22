import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AlertTriangle, Boxes, Package, Warehouse } from "lucide-react";

import { 
  getInventoryDashboardSummary, 
  getInventoryItemBreakdown, 
  getInventoryTopItems 
} from "../../api/inventoryDashboardApi";
import { ChartSkeleton } from "../../components/ChartSkeleton";
import { useCompanyStore } from "../../store/companyStore";

const InventoryDashboard: React.FC = () => {
  const [chartsLoading, setChartsLoading] = useState(true);
  
  // Data States
  const [summaryData, setSummaryData] = useState<any>(null);
  const [itemBreakdown, setItemBreakdown] = useState<any[]>([]);
  const [topItems, setTopItems] = useState<any[]>([]);

  const palette = useMemo(
    () => ({
      purple: "#8b5cf6",
      blue: "#3b82f6",
      emerald: "#10b981",
      amber: "#f59e0b",
      red: "#ef4444",
      slate: "#64748b",
    }),
    [],
  );

  const pieColors = useMemo(
    () => [palette.blue, palette.emerald, palette.purple, palette.amber, palette.red, palette.slate],
    [palette],
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

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setChartsLoading(true);
        const [ breakdownRes, topItemsRes] = await Promise.all([
          // getInventoryDashboardSummary(),
          getInventoryItemBreakdown(),
          getInventoryTopItems()
        ]);

        if (!mounted) return;
        // setSummaryData(summaryRes?.data || null);
        setItemBreakdown(breakdownRes?.data || []);
        setTopItems(topItemsRes?.data || []);
      } catch (e: any) {
        console.error("Failed to load inventory dashboard data:", e);
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
  const importedVsLocalData = useMemo(() => {
    const imported = Number(summaryData?.totalImportedItems ?? 0);
    const total = Number(summaryData?.totalItems ?? 0);
    const local = Math.max(0, total - imported);
    return [
      { name: "Imported", value: imported },
      { name: "Local", value: local },
    ];
  }, [summaryData]);

  const rawVsFinishedTrendData = useMemo(
    () => [
      { name: "Raw Materials", value: Number(summaryData?.rawMaterialItems ?? 0) },
      { name: "Finished Products", value: Number(summaryData?.finishedProductsItems ?? 0) },
    ],
    [summaryData],
  );

  const kpiCards = useMemo(
    () =>
      [
        {
          label: "Total Items",
          value: String(summaryData?.totalItems ?? 0),
          icon: Package,
          gradient: "from-blue-500 to-blue-600",
        },
        {
          label: "Service Items",
          value: String(summaryData?.serviceItems ?? 0),
          icon: AlertTriangle,
          gradient: "from-purple-500 to-purple-600",
        },
        {
          label: "Raw Materials",
          value: String(summaryData?.rawMaterialItems ?? 0),
          icon: Boxes,
          gradient: "from-emerald-500 to-emerald-600",
        },
        {
          label: "Finished Products",
          value: String(summaryData?.finishedProductsItems ?? 0),
          icon: Package,
          gradient: "from-amber-500 to-amber-600",
        },
        {
          label: "Imported Items",
          value: String(summaryData?.totalImportedItems ?? 0),
          icon: Warehouse,
          gradient: "from-red-500 to-red-600",
        },
      ],
    [summaryData],
  );

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

  const renderCurrencyDonutLabel = (props: any) => {
    const { x, y, name, value } = props;
    return (
      <text x={x} y={y} fill="#374151" fontSize={11} textAnchor="middle" dominantBaseline="central">
        {String(name)}: {currencyINRCompact.format(Number(value ?? 0))}
      </text>
    );
  };

  const renderDonutLabel = (props: any) => {
    const { x, y, name, value } = props;
    return (
      <text x={x} y={y} fill="#374151" fontSize={11} textAnchor="middle" dominantBaseline="central">
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

  const NoDataOverlay = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-xl z-10 text-sm text-gray-500 font-medium">
      No data available
    </div>
  );

  return (
    <div className="bg-app pb-6 pt-3">
      <div className="max-w-[1600px] mx-auto flex flex-col">
        {/* --- KPI CARDS --- */}
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
            : kpiCards.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm min-h-[124px]"
                >
                  <div className="flex items-center justify-between h-full">
                    <div>
                      <p className="text-sm font-semibold text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-sm`}>
                      <stat.icon className="text-white" size={22} />
                    </div>
                  </div>
                </div>
              ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* --- ITEMS BREAKDOWN (PIE CHART) --- */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Items Breakdown by Group</h3>
            </div>

            <div className="relative h-72 rounded-lg border border-gray-200 bg-white" style={chartPlaneStyle}>
              {chartsLoading ? (
                <ChartSkeleton variant="pie" />
              ) : itemBreakdown.length === 0 ? (
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
                    <Legend {...legendProps} />
                    <Pie
                      data={itemBreakdown}
                      dataKey="total_value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={82}
                      paddingAngle={2}
                      label={renderCurrencyDonutLabel}
                      labelLine={false}
                    >
                      {itemBreakdown.map((_, idx) => (
                        <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* --- TOP 3 ITEMS BY SALES (BAR CHART) --- */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Top 3 Items by Sales</h3>
            </div>

            <div className="relative h-72 rounded-lg border border-gray-200 bg-white" style={chartPlaneStyle}>
              {chartsLoading ? (
                <ChartSkeleton variant="bar" />
              ) : topItems.length === 0 ? (
                <NoDataOverlay />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topItems}
                    margin={{ top: 16, right: 18, left: 6, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="item_name" 
                      tick={{ fontSize: 11 }} 
                      interval={0} 
                      angle={-10} 
                      textAnchor="end" 
                      height={48} 
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      width={52} 
                      tickFormatter={(v) => currencyINRCompact.format(Number(v))} 
                    />
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
                      cursor={{ fill: "var(--primary)", opacity: 0.1 }}
                    />
                    <Legend {...legendProps} />
                    <Bar dataKey="total_value" fill={palette.emerald} radius={[6, 6, 0, 0]} name="Total Sales">
                      <LabelList 
                        dataKey="total_value" 
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
          </div>

          {/* --- IMPORTED VS LOCAL (PIE CHART) --- */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Imported vs Local</h3>
            </div>

            <div className="relative h-72 rounded-lg border border-gray-200 bg-white" style={chartPlaneStyle}>
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
                    <Legend {...legendProps} />
                    <Pie
                      data={importedVsLocalData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={82}
                      paddingAngle={2}
                      label={renderDonutLabel}
                      labelLine={false}
                    >
                      {importedVsLocalData.map((_, idx) => (
                        <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* --- RAW MATERIALS VS FINISHED PRODUCTS (LINE CHART) --- */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Raw Materials vs Finished Products</h3>
            </div>

            <div className="relative h-72 rounded-lg border border-gray-200 bg-white" style={chartPlaneStyle}>
              {chartsLoading ? (
                <ChartSkeleton variant="line" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rawVsFinishedTrendData} margin={{ top: 16, right: 18, left: 6, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
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
                    <Legend {...legendProps} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={palette.purple}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Count"
                      label={{ position: "top", fontSize: 10, fill: "#6b7280" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;