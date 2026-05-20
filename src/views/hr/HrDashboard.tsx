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
import { Users, UserCheck, UserX, ClipboardList, Layers } from "lucide-react";

import { ChartSkeleton } from "../../components/ChartSkeleton";
import { AppMetricCard, AppSectionCard } from "../../components/ui/app-shell";
import { getEmployeeStatusCount } from "../../api/hrDashboardApi";
import { parseFrappeError } from "./tabs/leave-config/hooks/parseFrappeError";

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

  const chartsLoading = summaryLoading || (!summaryData && !summaryError);

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
    () => [
      palette.emerald,
      palette.slate,
      palette.amber,
      palette.purple,
      palette.blue,
      palette.red,
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
      wrapperStyle: { fontSize: 12 },
      layout: "horizontal" as const,
      verticalAlign: "bottom" as const,
      align: "center" as const,
      iconType: "square" as const,
      height: 36,
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
        const resp = await getEmployeeStatusCount();
        if (!mounted) return;
        
        const data = resp.data;
        setSummaryData({
          total: (data?.total_active || 0) + (data?.inactive || 0),  
          active: data?.total_active || 0,
          inactive: data?.inactive || 0,
          onLeave: data?.on_leave || 0,
          totalLeaveTypes: data?.total_leave_types || 0,
        });
      } catch (e: any) {
        if (!mounted) return;
        setSummaryError(parseFrappeError(e) || "Failed to load HR dashboard summary");
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

  const stats = [
    {
      label: "Total Employees",
      value: String(summaryData?.total ?? 0),
      icon: Users,
      accentClassName: "from-blue-500 to-blue-600",
    },
    {
      label: "Active",
      value: String(summaryData?.active ?? 0),
      icon: UserCheck,
      accentClassName: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Inactive",
      value: String(summaryData?.inactive ?? 0),
      icon: UserX,
      accentClassName: "from-slate-500 to-slate-600",
    },
    {
      label: "On Leave",
      value: String(summaryData?.onLeave ?? 0),
      icon: ClipboardList,
      accentClassName: "from-amber-500 to-amber-600",
    },
    {
      label: "Leave Types",
      value: String(summaryData?.totalLeaveTypes ?? 0),
      icon: Layers,
      accentClassName: "from-purple-500 to-purple-600",
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
                accentClassName={stat.accentClassName}
              />
            ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AppSectionCard title="Employee Status (Bar)">
          <div className="h-72 rounded-xl border border-[var(--border)] bg-card" style={chartPlaneStyle}>
            {chartsLoading ? (
              <ChartSkeleton variant="bar" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={employeeStatusData}
                  margin={{ top: 28, right: 18, left: 6, bottom: 4 }}
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
                    itemStyle={{ color: "var(--text)", fontSize: 12, fontWeight: 600 }}
                    cursor={{ fill: "var(--primary)", opacity: 0.1 }}
                  />
                  <Legend {...legendProps} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Employees">
                    {employeeStatusData.map((_, idx) => (
                      <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                    ))}
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
        </AppSectionCard>

        <AppSectionCard title="Employee Status (Donut)">
          <div className="h-72 rounded-xl border border-[var(--border)] bg-card" style={chartPlaneStyle}>
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
                    itemStyle={{ color: "var(--text)", fontSize: 12, fontWeight: 600 }}
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
                      <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </AppSectionCard>

        <AppSectionCard title="Active Rate">
          <div className="h-72 rounded-xl border border-[var(--border)] bg-card" style={chartPlaneStyle}>
            {chartsLoading ? (
              <ChartSkeleton variant="pie" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 8, right: 12, bottom: 24, left: 12 }}>
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
                      <Cell key={idx} fill={idx === 0 ? palette.emerald : palette.slate} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </AppSectionCard>

        <AppSectionCard title="Employees vs Leave Types">
          <div className="h-72 rounded-xl border border-[var(--border)] bg-card" style={chartPlaneStyle}>
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
                    itemStyle={{ color: "var(--text)", fontSize: 12, fontWeight: 600 }}
                    cursor={{ fill: "var(--primary)", opacity: 0.1 }}
                  />
                  <Legend {...legendProps} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Count">
                    {totalsVsLeaveTypesData.map((_, idx) => (
                      <Cell key={idx} fill={idx === 0 ? palette.blue : palette.purple} />
                    ))}
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
        </AppSectionCard>
      </div>
    </div>
  );
};

export default HrDashboard;