import React, { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
  BarChart,
  Bar,
} from "recharts";
import {
  Users,
  Building2,
  User,
  Globe,
  BadgeCheck,
  BadgeX,
} from "lucide-react";

import { getCustomerDashboardSummary } from "../../api/customerDashboardApi";
import { ChartSkeleton } from "../../components/ChartSkeleton";

const CRMDashboard: React.FC = () => {
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [cards, setCards] = useState<{
    totalCustomers: number;
    totalIndividualCustomers: number;
    totalCompanyCustomers: number;
    lopCustomers: number;
    exportCustomers: number;
    nonExportCustomers: number;
  } | null>(null);

  const chartsLoading = summaryLoading || !cards;

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        setSummaryLoading(true);
        setSummaryError(null);
        setCards(null);
        const resp = await getCustomerDashboardSummary();
        if (!mounted) return;
        setCards(resp.data.cards);
      } catch (e: any) {
        if (!mounted) return;
        setSummaryError(
          e?.message ?? "Failed to load customer dashboard summary",
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

  const palette = useMemo(
    () => ({
      primary: "var(--primary)",
      blue: "var(--brand-blue-bottom)",
      blueSoft: "var(--brand-blue-top)",
      muted: "var(--muted)",
    }),
    [],
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
        label: "Total Customers",
        value: cards?.totalCustomers ?? 0,
        icon: Users,
        gradient: "from-[var(--brand-blue-top)] to-[var(--brand-blue-bottom)]",
      },
      {
        label: "Individual Customers",
        value: cards?.totalIndividualCustomers ?? 0,
        icon: User,
        gradient: "from-[var(--primary)] to-[var(--primary-700)]",
      },
      {
        label: "Company Customers",
        value: cards?.totalCompanyCustomers ?? 0,
        icon: Building2,
        gradient: "from-[var(--brand-blue-bottom)] to-[var(--primary)]",
      },
      {
        label: "Export Customers",
        value: cards?.exportCustomers ?? 0,
        icon: Globe,
        gradient: "from-[var(--brand-blue-top)] to-[var(--brand-blue-bottom)]",
      },
      {
        label: "Non-Export Customers",
        value: cards?.nonExportCustomers ?? 0,
        icon: BadgeX,
        gradient: "from-[var(--brand-blue-top)] to-[var(--brand-blue-bottom)]",
      },
      {
        label: "LOP Customers",
        value: cards?.lopCustomers ?? 0,
        icon: BadgeCheck,
        gradient: "from-[var(--primary)] to-[var(--primary-700)]",
      },
    ],
    [cards],
  );

  const customerTypeBarData = useMemo(
    () => [
      {
        name: "Individual",
        value: Number(cards?.totalIndividualCustomers ?? 0),
      },
      {
        name: "Company",
        value: Number(cards?.totalCompanyCustomers ?? 0),
      },
    ],
    [cards],
  );

  const exportDonutData = useMemo(
    () => [
      { name: "Export", value: Number(cards?.exportCustomers ?? 0) },
      { name: "Non-Export", value: Number(cards?.nonExportCustomers ?? 0) },
    ],
    [cards],
  );

  const lopPieData = useMemo(() => {
    const lop = Number(cards?.lopCustomers ?? 0);
    const total = Number(cards?.totalCustomers ?? 0);
    return [
      { name: "LOP", value: lop },
      { name: "Non-LOP", value: Math.max(0, total - lop) },
    ];
  }, [cards]);

  const totalsOverviewBarData = useMemo(
    () => [
      { name: "Total", value: Number(cards?.totalCustomers ?? 0) },
      { name: "Export", value: Number(cards?.exportCustomers ?? 0) },
      { name: "Non-Export", value: Number(cards?.nonExportCustomers ?? 0) },
      { name: "LOP", value: Number(cards?.lopCustomers ?? 0) },
    ],
    [cards],
  );

  return (
    <div className="bg-app min-h-screen px-4 sm:px-6 pb-6 pt-0">
      <div className="max-w-[1600px] mx-auto flex flex-col">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-3 -mt-3 lg:-mt-3">
          {chartsLoading
            ? Array.from({ length: 6 }).map((_, idx) => (
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

        {summaryError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
            {summaryError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-bold text-gray-900">
                Customer Types
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
                    data={customerTypeBarData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
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
                      name="Customers"
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
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-bold text-gray-900">
                Export vs Non-Export
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
                  <PieChart margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
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
                      data={exportDonutData}
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
                      {exportDonutData.map((_, idx) => (
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
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-bold text-gray-900">LOP Customers</h3>
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
                      data={lopPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={76}
                      label={renderDonutLabel}
                      labelLine={false}
                    >
                      {lopPieData.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={
                            idx === 0
                              ? "var(--primary)"
                              : "var(--brand-blue-bottom)"
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
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-bold text-gray-900">
                Totals Overview
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
                    data={totalsOverviewBarData}
                    margin={{ top: 28, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke="var(--border)"
                      strokeDasharray="3 3"
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
                      name="Customers"
                    >
                      <LabelList
                        dataKey="value"
                        position="top"
                        offset={8}
                        fill="#6b7280"
                        fontSize={10}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRMDashboard;
