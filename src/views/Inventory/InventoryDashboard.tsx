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

import { getInventoryDashboardSummary } from "../../api/inventoryDashboardApi";
import { ChartSkeleton } from "../../components/ChartSkeleton";

const InventoryDashboard: React.FC = () => {
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<{
    totalItems: number;
    serviceItems: number;
    rawMaterialItems: number;
    finishedProductsItems: number;
    totalImportedItems: number;
  } | null>(null);

  const chartsLoading = summaryLoading || !summaryData;

  const palette = useMemo(
    () => ({
      primary: "var(--primary)",
      blue: "var(--brand-blue-bottom)",
      blueSoft: "var(--brand-blue-top)",
      muted: "var(--muted)",
    }),
    [],
  );

  const pieColors = useMemo(
    () => [
      palette.primary,
      palette.blue,
      palette.blueSoft,
      "var(--primary-700)",
      "var(--primary-600)",
    ],
    [palette],
  );

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setSummaryLoading(true);
        setSummaryError(null);
        setSummaryData(null);
        const resp = await getInventoryDashboardSummary();
        if (!mounted) return;
        setSummaryData(resp.data);
      } catch (e: any) {
        if (!mounted) return;
        setSummaryError(
          e?.message ?? "Failed to load inventory dashboard summary",
        );
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

  const itemTypeBreakdownData = useMemo(
    () => [
      { name: "Service", value: Number(summaryData?.serviceItems ?? 0) },
      {
        name: "Raw Material",
        value: Number(summaryData?.rawMaterialItems ?? 0),
      },
      {
        name: "Finished Products",
        value: Number(summaryData?.finishedProductsItems ?? 0),
      },
      { name: "Imported", value: Number(summaryData?.totalImportedItems ?? 0) },
    ],
    [summaryData],
  );

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
      {
        name: "Raw Materials",
        value: Number(summaryData?.rawMaterialItems ?? 0),
      },
      {
        name: "Finished Products",
        value: Number(summaryData?.finishedProductsItems ?? 0),
      },
    ],
    [summaryData],
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

  const kpiCards = useMemo(
    () => [
      {
        label: "Total Items",
        value: String(summaryData?.totalItems ?? 0),
        icon: Package,
        gradient: "from-[var(--brand-blue-top)] to-[var(--brand-blue-bottom)]",
      },
      {
        label: "Service Items",
        value: String(summaryData?.serviceItems ?? 0),
        icon: AlertTriangle,
        gradient: "from-[var(--primary)] to-[var(--primary-700)]",
      },
      {
        label: "Raw Materials",
        value: String(summaryData?.rawMaterialItems ?? 0),
        icon: Boxes,
        gradient: "from-[var(--brand-blue-bottom)] to-[var(--primary)]",
      },
      {
        label: "Finished Products",
        value: String(summaryData?.finishedProductsItems ?? 0),
        icon: Package,
        gradient: "from-[var(--brand-blue-top)] to-[var(--brand-blue-bottom)]",
      },
      {
        label: "Imported Items",
        value: String(summaryData?.totalImportedItems ?? 0),
        icon: Warehouse,
        gradient: "from-[var(--primary)] to-[var(--primary-700)]",
      },
    ],
    [summaryData],
  );

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
    <div className="bg-app px-4 sm:px-6 pb-6 pt-3">
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
            : kpiCards.map((stat) => (
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
              <h3 className="text-sm font-bold text-gray-900">
                Items Breakdown
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
                    <Legend {...legendProps} />
                    <Pie
                      data={itemTypeBreakdownData}
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
                      {itemTypeBreakdownData.map((_, idx) => (
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
                Items Breakdown (Bar)
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
                    data={itemTypeBreakdownData}
                    margin={{ top: 16, right: 18, left: 6, bottom: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
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
                      itemStyle={{
                        color: "var(--text)",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                      cursor={{ fill: "var(--primary)", opacity: 0.1 }}
                    />
                    <Legend {...legendProps} />
                    <Bar
                      dataKey="value"
                      fill={palette.blue}
                      radius={[6, 6, 0, 0]}
                      name="Count"
                    >
                      <LabelList
                        dataKey="value"
                        position="top"
                        fill="var(--muted)"
                        fontSize={10}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">
                Imported vs Local
              </h3>
            </div>

            <div
              className="h-72 rounded-lg border border-gray-200 bg-white"
              style={chartPlaneStyle}
            >
              {summaryLoading ? (
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
                Raw Materials vs Finished Products
              </h3>
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
                    data={rawVsFinishedTrendData}
                    margin={{ top: 16, right: 18, left: 6, bottom: 8 }}
                  >
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
                      itemStyle={{
                        color: "var(--text)",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                      cursor={{ fill: "var(--primary)", opacity: 0.1 }}
                    />
                    <Legend {...legendProps} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={palette.primary}
                      strokeWidth={3}
                      dot={false}
                      name="Count"
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
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;
