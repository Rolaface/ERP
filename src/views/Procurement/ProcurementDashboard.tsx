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
} from "recharts";

import { FileText, ShoppingCart, Truck, Users, UsersRound } from "lucide-react";

import { getProcurementDashboardSummary } from "../../api/procurementDashboardApi";
import { ChartSkeleton } from "../../components/ChartSkeleton";

const ProcurementDashboard: React.FC = () => {
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<{
    totalSuppliers: number;
    activeSuppliers: number;
    inactiveSuppliers: number;
    totalPurchaseInvoice: number;
    totalPurchaseOrder: number;
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

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setSummaryLoading(true);
        setSummaryError(null);
        setSummaryData(null);
        const resp = await getProcurementDashboardSummary();
        if (!mounted) return;
        setSummaryData(resp.data);
      } catch (e: any) {
        if (!mounted) return;
        setSummaryError(
          e?.message ?? "Failed to load procurement dashboard summary",
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

  const TableSkeleton = () => (
    <div className="animate-pulse space-y-3">
      <div className="h-3 w-28 bg-gray-100 rounded" />
      <div className="h-3 w-full bg-gray-100 rounded" />
      <div className="h-3 w-5/6 bg-gray-100 rounded" />
      <div className="h-3 w-2/3 bg-gray-100 rounded" />
    </div>
  );

  const kpiCards = useMemo(
    () => [
      {
        label: "Total Suppliers",
        value: String(summaryData?.totalSuppliers ?? 0),
        icon: Users,
        gradient: "from-[var(--brand-blue-top)] to-[var(--brand-blue-bottom)]",
      },
      {
        label: "Active Suppliers",
        value: String(summaryData?.activeSuppliers ?? 0),
        icon: UsersRound,
        gradient: "from-[var(--brand-blue-top)] to-[var(--brand-blue-bottom)]",
      },
      {
        label: "Inactive Suppliers",
        value: String(summaryData?.inactiveSuppliers ?? 0),
        icon: UsersRound,
        gradient: "from-[var(--brand-blue-bottom)] to-[var(--primary)]",
      },
      {
        label: "Purchase Orders",
        value: String(summaryData?.totalPurchaseOrder ?? 0),
        icon: ShoppingCart,
        gradient: "from-[var(--primary)] to-[var(--primary-700)]",
      },
      {
        label: "Purchase Invoices",
        value: String(summaryData?.totalPurchaseInvoice ?? 0),
        icon: FileText,
        gradient: "from-[var(--primary)] to-[var(--primary-700)]",
      },
    ],
    [summaryData],
  );

  const supplierStatusDonutData = useMemo(
    () => [
      { name: "Active", value: Number(summaryData?.activeSuppliers ?? 0) },
      { name: "Inactive", value: Number(summaryData?.inactiveSuppliers ?? 0) },
    ],
    [summaryData],
  );

  const documentsPieData = useMemo(
    () => [
      {
        name: "Purchase Orders",
        value: Number(summaryData?.totalPurchaseOrder ?? 0),
      },
      {
        name: "Purchase Invoices",
        value: Number(summaryData?.totalPurchaseInvoice ?? 0),
      },
    ],
    [summaryData],
  );

  const procurementBarData = useMemo(
    () => [
      {
        name: "Total Suppliers",
        value: Number(summaryData?.totalSuppliers ?? 0),
      },
      { name: "Active", value: Number(summaryData?.activeSuppliers ?? 0) },
      { name: "Inactive", value: Number(summaryData?.inactiveSuppliers ?? 0) },
      {
        name: "Purchase Orders",
        value: Number(summaryData?.totalPurchaseOrder ?? 0),
      },
      {
        name: "Purchase Invoices",
        value: Number(summaryData?.totalPurchaseInvoice ?? 0),
      },
    ],
    [summaryData],
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
                Procurement Overview
              </h3>
              <Truck className="text-gray-400" size={18} />
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
                    data={procurementBarData}
                    margin={{ top: 16, right: 18, left: 6, bottom: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "var(--muted)" }}
                      interval={0}
                      angle={-12}
                      textAnchor="end"
                      height={48}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "var(--muted)" }}
                      width={52}
                    />
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
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      dataKey="value"
                      fill={palette.blue}
                      radius={[6, 6, 0, 0]}
                      name="Count"
                    >
                      <LabelList
                        dataKey="value"
                        position="top"
                        fill="#6b7280"
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
                Supplier Status
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
                        <Cell
                          key={idx}
                          fill={
                            idx === 0
                              ? "var(--brand-blue-bottom)"
                              : "var(--primary)"
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
              <h3 className="text-sm font-bold text-gray-900">Documents</h3>
            </div>

            <div
              className="h-72 rounded-lg border border-gray-200 bg-white"
              style={chartPlaneStyle}
            >
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
                      data={documentsPieData}
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
                      {documentsPieData.map((_, idx) => (
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
                Documents Summary
              </h3>
            </div>

            <div
              className="h-72 rounded-lg border border-gray-200 bg-white overflow-auto"
              style={chartPlaneStyle}
            >
              {chartsLoading ? (
                <div className="p-4">
                  <TableSkeleton />
                </div>
              ) : (
                <div className="p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="py-2 font-semibold">Document</th>
                        <th className="py-2 font-semibold text-right">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="py-2 text-gray-700">Purchase Orders</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {Number(summaryData?.totalPurchaseOrder ?? 0)}
                        </td>
                      </tr>
                      <tr className="border-t">
                        <td className="py-2 text-gray-700">
                          Purchase Invoices
                        </td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {Number(summaryData?.totalPurchaseInvoice ?? 0)}
                        </td>
                      </tr>
                      <tr className="border-t">
                        <td className="py-2 text-gray-700">Total Suppliers</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {Number(summaryData?.totalSuppliers ?? 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcurementDashboard;
