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
import { Users, Building2, User, XCircle } from "lucide-react";
import {
  getCustomerDashboardSummary,
  type CustomerDashboardSummary,
} from "../../api/customerDashboardApi";
import { ChartSkeleton } from "../../components/ChartSkeleton";
import { AppMetricCard, AppSectionCard } from "../../components/ui/app-shell";

const TAX_CATEGORY_COLORS = [
  "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b",
  "#ef4444", "#06b6d4", "#f97316", "#84cc16",
];

const CRMDashboard: React.FC = () => {
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CustomerDashboardSummary | null>(null);

  const chartsLoading = summaryLoading || !summary;

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setSummaryLoading(true);
        setSummaryError(null);
        setSummary(null);
        const data = await getCustomerDashboardSummary();
        if (!mounted) return;
        setSummary(data);
      } catch (e: any) {
        if (!mounted) return;
        setSummaryError(e?.message ?? "Failed to load customer dashboard summary");
      } finally {
        if (mounted) setSummaryLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, []);

  const palette = useMemo(() => ({
    purple: "#8b5cf6",
    blue: "#3b82f6",
    emerald: "#10b981",
    amber: "#f59e0b",
    slate: "#64748b",
  }), []);

  const chartPlaneStyle = useMemo(() => ({
    backgroundImage:
      "linear-gradient(rgba(229,231,235,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(229,231,235,0.7) 1px, transparent 1px)",
    backgroundSize: "24px 24px",
    backgroundPosition: "-1px -1px",
  }), []);

  const renderDonutLabel = (props: any) => {
    const { x, y, name, value } = props;
    return (
      <text x={x} y={y} fill="#374151" fontSize={11} textAnchor="middle" dominantBaseline="central">
        {String(name)}: {String(value)}
      </text>
    );
  };

  // ── KPI cards — fixed fields only ──────────────────────────────────────────
  const kpiCards = [
    {
      label: "Total Customers",
      value: String(summary?.totalCustomers ?? 0),
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      label: "Individual Customers",
      value: String(summary?.totalIndividualCustomers ?? 0),
      icon: User,
      gradient: "from-purple-500 to-purple-600",
    },
    {
      label: "Company Customers",
      value: String(summary?.totalCompanyCustomers ?? 0),
      icon: Building2,
      gradient: "from-emerald-500 to-emerald-600",
    },
  
  ];

  // ── Chart data ─────────────────────────────────────────────────────────────
  const customerTypeBarData = [
    { name: "Individual", value: summary?.totalIndividualCustomers ?? 0 },
    { name: "Company",    value: summary?.totalCompanyCustomers ?? 0 },
  ];

  // Dynamic tax-category bar chart — built from the taxCategories array
  const taxCategoryBarData = (summary?.taxCategories ?? []).map(({ name, count }) => ({
    name,
    value: count,
  }));

  // Customer type donut
  const customerTypeDonutData = [
    { name: "Individual", value: summary?.totalIndividualCustomers ?? 0 },
    { name: "Company",    value: summary?.totalCompanyCustomers ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {chartsLoading
          ? Array.from({ length: 4 }).map((_, idx) => (
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

      {/* ── Charts ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Customer Types bar */}
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
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "8px 12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
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

        {/* Customer type donut */}
        <AppSectionCard title="Individual vs Company">
          <div className="h-72 rounded-xl border border-[var(--border)] bg-card" style={chartPlaneStyle}>
            {chartsLoading ? (
              <ChartSkeleton variant="pie" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
                  <Tooltip
                    formatter={(v: any) => Number(v ?? 0)}
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "8px 12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    itemStyle={{ color: "var(--text)", fontSize: 12, fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} layout="horizontal" verticalAlign="bottom" align="center" iconType="square" height={36} />
                  <Pie
                    data={customerTypeDonutData}
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
                    {customerTypeDonutData.map((_, idx) => (
                      <Cell key={idx} fill={idx === 0 ? palette.purple : palette.emerald} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </AppSectionCard>

        {/* Dynamic tax categories bar — full width */}
        <AppSectionCard title="Customers by Tax Category" className="lg:col-span-2">
          <div className="h-72 rounded-xl border border-[var(--border)] bg-card" style={chartPlaneStyle}>
            {chartsLoading ? (
              <ChartSkeleton variant="bar" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taxCategoryBarData} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} width={52} />
                  <Tooltip
                    formatter={(v: any) => Number(v ?? 0)}
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "8px 12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    itemStyle={{ color: "var(--text)", fontSize: 12, fontWeight: 600 }}
                    cursor={{ fill: "var(--primary)", opacity: 0.1 }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Customers">
                    {taxCategoryBarData.map((_, idx) => (
                      <Cell key={idx} fill={TAX_CATEGORY_COLORS[idx % TAX_CATEGORY_COLORS.length]} />
                    ))}
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