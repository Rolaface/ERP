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
import { AppMetricCard, AppSectionCard } from "../../components/ui/app-shell";

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
        setSummaryError(e?.message ?? "Failed to load customer dashboard summary");
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
      purple: "#8b5cf6",
      blue: "#3b82f6",
      emerald: "#10b981",
      amber: "#f59e0b",
      slate: "#64748b",
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
      <text x={x} y={y} fill="#374151" fontSize={11} textAnchor="middle" dominantBaseline="central">
        {String(name)}: {String(value)}
      </text>
    );
  };

  const kpiCards = [
    {
      label: "Total Customers",
      value: String(cards?.totalCustomers ?? 0),
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      label: "Individual Customers",
      value: String(cards?.totalIndividualCustomers ?? 0),
      icon: User,
      gradient: "from-purple-500 to-purple-600",
    },
    {
      label: "Company Customers",
      value: String(cards?.totalCompanyCustomers ?? 0),
      icon: Building2,
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Export Customers",
      value: String(cards?.exportCustomers ?? 0),
      icon: Globe,
      gradient: "from-amber-500 to-amber-600",
    },
    {
      label: "Non-Export Customers",
      value: String(cards?.nonExportCustomers ?? 0),
      icon: BadgeX,
      gradient: "from-sky-500 to-sky-600",
    },
    {
      label: "LOP Customers",
      value: String(cards?.lopCustomers ?? 0),
      icon: BadgeCheck,
      gradient: "from-indigo-500 to-indigo-600",
    },
  ];

  const customerTypeBarData = [
    { name: "Individual", value: Number(cards?.totalIndividualCustomers ?? 0) },
    { name: "Company", value: Number(cards?.totalCompanyCustomers ?? 0) },
  ];

  const exportDonutData = [
    { name: "Export", value: Number(cards?.exportCustomers ?? 0) },
    { name: "Non-Export", value: Number(cards?.nonExportCustomers ?? 0) },
  ];

  const lopPieData = (() => {
    const lop = Number(cards?.lopCustomers ?? 0);
    const total = Number(cards?.totalCustomers ?? 0);
    return [
      { name: "LOP", value: lop },
      { name: "Non-LOP", value: Math.max(0, total - lop) },
    ];
  })();

  const totalsOverviewBarData = [
    { name: "Total", value: Number(cards?.totalCustomers ?? 0) },
    { name: "Export", value: Number(cards?.exportCustomers ?? 0) },
    { name: "Non-Export", value: Number(cards?.nonExportCustomers ?? 0) },
    { name: "LOP", value: Number(cards?.lopCustomers ?? 0) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {chartsLoading
          ? Array.from({ length: 6 }).map((_, idx) => (
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
          : kpiCards.map((card) => (
              <AppMetricCard
                key={card.label}
                label={card.label}
                value={card.value}
                icon={card.icon}
                accentClassName={card.gradient}
              />
            ))}
      </div>

      {summaryError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
          {summaryError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AppSectionCard title="Customer Types">
          <div className="h-72 rounded-xl border border-[var(--border)] bg-card" style={chartPlaneStyle}>
            {chartsLoading ? (
              <ChartSkeleton variant="bar" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerTypeBarData} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
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
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="value" fill={palette.purple} radius={[6, 6, 0, 0]} name="Customers">
                    <LabelList dataKey="value" position="top" fill="#6b7280" fontSize={10} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </AppSectionCard>

        <AppSectionCard title="Export vs Non-Export">
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
                      <Cell key={idx} fill={idx === 0 ? palette.emerald : palette.slate} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </AppSectionCard>

        <AppSectionCard title="LOP Customers">
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
                      <Cell key={idx} fill={idx === 0 ? palette.amber : palette.blue} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </AppSectionCard>

        <AppSectionCard title="Totals Overview">
          <div className="h-72 rounded-xl border border-[var(--border)] bg-card" style={chartPlaneStyle}>
            {chartsLoading ? (
              <ChartSkeleton variant="bar" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={totalsOverviewBarData} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
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
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="value" fill={palette.blue} radius={[6, 6, 0, 0]} name="Customers">
                    <LabelList dataKey="value" position="top" offset={8} fill="#6b7280" fontSize={10} />
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

export default CRMDashboard;
