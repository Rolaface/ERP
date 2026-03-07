import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Users, UserCheck, BadgeCheck, ClipboardList } from "lucide-react";

import { ChartSkeleton } from "../../components/ChartSkeleton";
import { getHrDashboardSummary } from "../../api/hrDashboardApi";

const HrDashboard: React.FC = () => {
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<{
    total: number;
    active: number;
    inactive: number;
    onLeave: number;
    totalLeaveTypes: number;
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

  const chartPlaneStyle = useMemo(
    () => ({
      backgroundImage:
        "linear-gradient(rgba(229,231,235,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(229,231,235,0.7) 1px, transparent 1px)",
      backgroundSize: "24px 24px",
      backgroundPosition: "-1px -1px",
    }),
    [],
  );

  const legendProps = useMemo(
    () => ({
      wrapperStyle: { fontSize: 11 },
      layout: "horizontal" as const,
      verticalAlign: "bottom" as const,
      align: "center" as const,
      iconType: "square" as const,
      height: 28,
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
        const resp = await getHrDashboardSummary();
        if (!mounted) return;
        setSummaryData(resp.data);
      } catch (e: any) {
        if (!mounted) return;
        setSummaryError(e?.message ?? "Failed to load HR dashboard summary");
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

  const employeeStatusData = useMemo(
    () => [
      { name: "Active", value: Number(summaryData?.active ?? 0) },
      { name: "Inactive", value: Number(summaryData?.inactive ?? 0) },
      { name: "On Leave", value: Number(summaryData?.onLeave ?? 0) },
    ],
    [summaryData],
  );

  const activeRateDonutData = useMemo(() => {
    const total = Number(summaryData?.total ?? 0);
    const active = Number(summaryData?.active ?? 0);
    const notActive = Math.max(0, total - active);
    return [
      { name: "Active", value: active },
      { name: "Not Active", value: notActive },
    ];
  }, [summaryData]);

  const totalsVsLeaveTypesData = useMemo(
    () => [
      { name: "Employees", value: Number(summaryData?.total ?? 0) },
      { name: "Leave Types", value: Number(summaryData?.totalLeaveTypes ?? 0) },
    ],
    [summaryData],
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
        label: "Total Employees",
        value: String(summaryData?.total ?? 0),
        icon: Users,
        gradient: "from-[var(--brand-blue-top)] to-[var(--brand-blue-bottom)]",
      },
      {
        label: "Active",
        value: String(summaryData?.active ?? 0),
        icon: UserCheck,
        gradient: "from-[var(--primary)] to-[var(--primary-700)]",
      },
      {
        label: "Inactive",
        value: String(summaryData?.inactive ?? 0),
        icon: BadgeCheck,
        gradient: "from-[var(--brand-blue-bottom)] to-[var(--primary)]",
      },
      {
        label: "On Leave",
        value: String(summaryData?.onLeave ?? 0),
        icon: ClipboardList,
        gradient: "from-[var(--brand-blue-top)] to-[var(--brand-blue-bottom)]",
      },
      {
        label: "Leave Types",
        value: String(summaryData?.totalLeaveTypes ?? 0),
        icon: ClipboardList,
        gradient: "from-[var(--primary)] to-[var(--primary-700)]",
      },
    ],
    [summaryData],
  );

  return (
    <div className="bg-app min-h-screen px-4 sm:px-6 pb-6 pt-3">
      <div className="max-w-[1600px] mx-auto flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">HR Dashboard</h2>
            <p className="text-sm text-gray-500">Employee overview</p>
          </div>
        </div>

        {summaryError && (
          <div className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
            {summaryError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-3">
          {chartsLoading
            ? Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm min-h-[96px] animate-pulse"
                >
                  <div className="flex items-center justify-between h-full">
                    <div>
                      <div className="h-3 w-24 bg-gray-300 rounded" />
                      <div className="h-6 w-16 bg-gray-300 rounded mt-2" />
                    </div>
                    <div className="h-10 w-10 bg-gray-300 rounded-xl border border-gray-400" />
                  </div>
                </div>
              ))
            : kpiCards.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm min-h-[96px]"
                >
                  <div className="flex items-center justify-between h-full">
                    <div>
                      <p className="text-xs font-semibold text-gray-600">
                        {stat.label}
                      </p>
                      <p className="text-xl font-bold text-gray-900 mt-1">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">
                Employee Status (Bar)
              </h3>
            </div>

            <div
              className="h-64 rounded-lg border border-gray-200 bg-white"
              style={chartPlaneStyle}
            >
              {chartsLoading ? (
                <ChartSkeleton variant="bar" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={employeeStatusData}
                    margin={{ top: 28, right: 18, left: 6, bottom: 4 }}
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
                      name="Employees"
                    >
                      <LabelList
                        dataKey="value"
                        position="top"
                        offset={8}
                        fill="var(--muted)"
                        fontSize={10}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">
                Employee Status{" "}
              </h3>
            </div>

            <div
              className="h-64 rounded-lg border border-gray-200 bg-white"
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
                    <Legend {...legendProps} />
                    <Pie
                      data={employeeStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={2}
                      label={renderDonutLabel}
                      labelLine={false}
                    >
                      {employeeStatusData.map((_, idx) => (
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

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Active Rate</h3>
            </div>

            <div
              className="h-72 rounded-lg border border-gray-200 bg-white"
              style={chartPlaneStyle}
            >
              {chartsLoading ? (
                <ChartSkeleton variant="pie" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart
                    margin={{ top: 8, right: 12, bottom: 24, left: 12 }}
                  >
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
                      data={activeRateDonutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="42%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={2}
                      label={renderDonutLabel}
                      labelLine={false}
                    >
                      {activeRateDonutData.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={idx === 0 ? palette.primary : palette.blueSoft}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">
                Employees vs Leave Types
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
                    data={totalsVsLeaveTypesData}
                    margin={{ top: 28, right: 18, left: 6, bottom: 16 }}
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
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Count">
                      {totalsVsLeaveTypesData.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={idx === 0 ? palette.blue : palette.primary}
                        />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="top"
                        offset={8}
                        fill="var(--muted)"
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

export default HrDashboard;
