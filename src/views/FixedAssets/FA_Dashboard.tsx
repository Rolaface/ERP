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
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { Warehouse, PackagePlus, IndianRupee, TrendingUp, Banknote } from "lucide-react";
import { AppMetricCard, AppSectionCard } from "../../components/ui/app-shell";
import { ChartSkeleton } from "../../components/ChartSkeleton";
import { useCompanyStore } from "../../store/companyStore";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface AssetDashboardSummary {
  totalAssets: number;
  newAssetsThisYear: number;
  totalAssetValue: number;
  assetValueTrend: { month: string; value: number }[];
  categoryBreakdown: { name: string; value: number }[];
  locationBreakdown: { location: string; value: number }[];
}

/* ─────────────────────────────────────────────
   MOCK DATA (replace with real API call)
───────────────────────────────────────────── */
const MOCK_SUMMARY: AssetDashboardSummary = {
  totalAssets: 0,
  newAssetsThisYear: 0,
  totalAssetValue: 0,
  assetValueTrend: [],
  categoryBreakdown: [],
  locationBreakdown: [],
};

const CATEGORY_COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
];
 

const chartPlaneStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(rgba(229,231,235,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(229,231,235,0.7) 1px, transparent 1px)",
  backgroundSize: "24px 24px",
  backgroundPosition: "-1px -1px",
};

const tooltipStyle = {
  contentStyle: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: "8px 12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  itemStyle: { color: "var(--text)", fontSize: 12, fontWeight: 600 },
  cursor: { fill: "var(--primary)", opacity: 0.1 },
};

/* ─────────────────────────────────────────────
   EMPTY CHART STATE
───────────────────────────────────────────── */
const EmptyChart: React.FC<{ message?: string }> = ({
  message = "No Data",
}) => (
  <div className="flex h-full w-full items-center justify-center">
    <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>
      {message}
    </span>
  </div>
);

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
const FixedAssetDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AssetDashboardSummary | null>(null);

const baseCurrency = useCompanyStore((state) => state.baseCurrency) || 'INR';

  // 2. Create the formatter function dynamically
  const formatCurrency = useMemo(() => {
    const locale = baseCurrency === 'INR' ? 'en-IN' : 'en-US'; 
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: baseCurrency,
      maximumFractionDigits: 2,
    });
    // Return a function so it works exactly like your old helper
    return (val: number) => formatter.format(val); 
  }, [baseCurrency]);  const chartsLoading = loading || (!summary && !error);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        setSummary(null);
        // ── Replace this with your real API call ──────────────────────────
        // const data = await getFixedAssetDashboardSummary();
        await new Promise((r) => setTimeout(r, 800)); // simulate network
        if (!mounted) return;
        setSummary(MOCK_SUMMARY);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Failed to load asset dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  /* ── KPI cards ─────────────────────────────────────────────────────── */
  const kpiCards = useMemo(
    () => [
      {
        label: "Total Assets",
        value: String(summary?.totalAssets ?? 0),
        icon: Warehouse,
        gradient: "from-blue-500 to-blue-600",
      },
      {
        label: "New Assets (This Year)",
        value: String(summary?.newAssetsThisYear ?? 0),
        icon: PackagePlus,
        gradient: "from-purple-500 to-purple-600",
      },
      {
        label: "Asset Value",
        value: formatCurrency(summary?.totalAssetValue ?? 0),
        icon: Banknote, // Changed from IndianRupee
        gradient: "from-emerald-500 to-emerald-600",
      },
      {
        label: "YoY Growth",
        value: "+12%",
        icon: TrendingUp,
        gradient: "from-amber-500 to-amber-600",
      },
    ],
    [summary, formatCurrency] // <-- Added formatCurrency here
  );
  const hasTrendData = (summary?.assetValueTrend ?? []).length > 0;
  const hasCategoryData = (summary?.categoryBreakdown ?? []).length > 0;
  const hasLocationData = (summary?.locationBreakdown ?? []).length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {chartsLoading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="app-surface min-h-[124px] animate-pulse p-6"
              >
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

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* ── Asset Value Analytics (full width line / area chart) ─────────── */}
      <AppSectionCard title="Asset Value Analytics">
        <div
          className="h-72 rounded-xl border border-[var(--border)] bg-card"
          style={chartPlaneStyle}
        >
          {chartsLoading ? (
            <ChartSkeleton variant="bar" />
          ) : !hasTrendData ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={summary!.assetValueTrend}
                margin={{ top: 16, right: 24, left: 8, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="assetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--primary)"
                      stopOpacity={0.18}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  width={60}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                  }
                />
                <Tooltip
                  formatter={(v: any) => formatCurrency(Number(v ?? 0))}
                  {...tooltipStyle}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  fill="url(#assetGrad)"
                  dot={{ r: 4, fill: "var(--primary)", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  name="Asset Value"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </AppSectionCard>

      {/* ── Bottom Two Charts ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Category-wise Asset Value — Donut */}
        <AppSectionCard title="Category-wise Asset Value">
          <div
            className="h-72 rounded-xl border border-[var(--border)] bg-card"
            style={chartPlaneStyle}
          >
            {chartsLoading ? (
              <ChartSkeleton variant="pie" />
            ) : !hasCategoryData ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
                  <Tooltip
                    formatter={(v: any) => formatCurrency(Number(v ?? 0))}
                    contentStyle={tooltipStyle.contentStyle}
                    itemStyle={tooltipStyle.itemStyle}
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
                    data={summary!.categoryBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={82}
                    paddingAngle={2}
                    labelLine={false}
                  >
                    {summary!.categoryBreakdown.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </AppSectionCard>

        {/* Location-wise Asset Value — Bar */}
        <AppSectionCard title="Location-wise Asset Value">
          <div
            className="h-72 rounded-xl border border-[var(--border)] bg-card"
            style={chartPlaneStyle}
          >
            {chartsLoading ? (
              <ChartSkeleton variant="bar" />
            ) : !hasLocationData ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summary!.locationBreakdown}
                  margin={{ top: 16, right: 16, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="location" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    width={60}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                    }
                  />
                  <Tooltip
                    formatter={(v: any) => formatCurrency(Number(v ?? 0))}
                    {...tooltipStyle}
                  />
                  <Bar
                    dataKey="value"
                    radius={[6, 6, 0, 0]}
                    name="Asset Value"
                  >
                    {summary!.locationBreakdown.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                      />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="top"
                      offset={8}
                      fill="#6b7280"
                      fontSize={10}
                      formatter={(v: any) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                      }
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

export default FixedAssetDashboard;