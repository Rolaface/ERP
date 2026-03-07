import { useEffect, useMemo, useState } from "react";
import { DollarSign, FileText, TrendingUp, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { SalarySlipListItem } from "../../../api/salarySlipApi";
import {
  getEmployeeAdvancesPaged,
  type EmployeeAdvanceRecord,
} from "../../../api/advanceLoanApi";

const fmtZMW = (n: number) => Number(n || 0).toLocaleString("en-ZM");

const COLORS = [
  "var(--primary)",
  "var(--primary-700)",
  "var(--primary-600)",
  "var(--primary-500)",
  "var(--primary-400)",
  "var(--primary-300)",
];

const KPI_CARD_BASE =
  "bg-card rounded-xl p-6 w-full min-w-0 flex flex-col items-stretch shadow-sm";
const CHART_CARD_BASE = KPI_CARD_BASE;

type PeriodPreset =
  | "all"
  | "this_month"
  | "last_3"
  | "last_6"
  | "last_12"
  | "custom_month";

const getMonthKey = (d: string) => {
  const s = String(d || "").trim();
  if (!s) return "";
  // Expecting YYYY-MM-DD
  return s.slice(0, 7);
};

const addMonths = (date: Date, deltaMonths: number) => {
  const d = new Date(date);
  const m = d.getMonth() + deltaMonths;
  d.setMonth(m);
  return d;
};

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const toIsoDate = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export type PayrollReportsDashboardProps = {
  slips: SalarySlipListItem[];
  loading?: boolean;
  error?: string | null;
};

export default function PayrollReportsDashboard({
  slips,
  loading,
  error,
}: PayrollReportsDashboardProps) {
  const safeSlips = Array.isArray(slips) ? slips : [];

  const [period, setPeriod] = useState<PeriodPreset>("last_12");
  const [customMonth, setCustomMonth] = useState<string>("");

  const filteredSlips = useMemo(() => {
    if (period === "all") return safeSlips;

    const today = new Date();
    const thisMonthStart = startOfMonth(today);

    const slipDateIso = (s: SalarySlipListItem) => {
      return String(s.end_date || s.start_date || "").trim();
    };

    if (period === "custom_month") {
      const mk = String(customMonth || "").trim();
      if (!mk) return safeSlips;
      return safeSlips.filter((s) => getMonthKey(slipDateIso(s)) === mk);
    }

    if (period === "this_month") {
      const mk = getMonthKey(toIsoDate(thisMonthStart));
      return safeSlips.filter((s) => getMonthKey(slipDateIso(s)) === mk);
    }

    const monthsBack =
      period === "last_3"
        ? 3
        : period === "last_6"
          ? 6
          : period === "last_12"
            ? 12
            : 12;

    const start = startOfMonth(addMonths(today, -(monthsBack - 1)));
    const startIso = toIsoDate(start);
    return safeSlips.filter((s) => {
      const d = slipDateIso(s);
      if (!d) return false;
      // ISO string compare is safe for YYYY-MM-DD
      return d >= startIso;
    });
  }, [customMonth, period, safeSlips]);

  const kpis = useMemo(() => {
    const totalGross = filteredSlips.reduce(
      (s, r) => s + Number(r.total_earnings ?? 0),
      0,
    );
    const totalDed = filteredSlips.reduce(
      (s, r) => s + Number(r.total_deduction ?? 0),
      0,
    );
    const totalNet = filteredSlips.reduce(
      (s, r) => s + Number(r.net_pay ?? 0),
      0,
    );

    return {
      slipCount: filteredSlips.length,
      totalGross,
      totalDed,
      totalNet,
    };
  }, [filteredSlips]);

  const currencyZMW = useMemo(
    () =>
      new Intl.NumberFormat("en-ZM", {
        style: "currency",
        currency: "ZMW",
        maximumFractionDigits: 2,
      }),
    [],
  );

  const statusData = useMemo(() => {
    const map = filteredSlips.reduce((acc: Record<string, number>, r) => {
      const raw = String(r.status ?? "").trim();
      const normalized =
        raw.toLowerCase() === "submitted" ? "Paid" : raw || "Unknown";
      acc[normalized] = (acc[normalized] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(map)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredSlips]);

  const topEmployees = useMemo(() => {
    const netByEmployee = filteredSlips.reduce(
      (acc: Record<string, number>, r) => {
        const emp = String(r.employee ?? "").trim() || "Unknown";
        acc[emp] = (acc[emp] || 0) + Number(r.net_pay ?? 0);
        return acc;
      },
      {},
    );

    return Object.entries(netByEmployee)
      .map(([employee, net]) => ({ employee, net: Math.round(net) }))
      .sort((a, b) => b.net - a.net)
      .slice(0, 8);
  }, [filteredSlips]);

  const [advancesLoading, setAdvancesLoading] = useState(false);
  const [advancesError, setAdvancesError] = useState<string | null>(null);
  const [advances, setAdvances] = useState<EmployeeAdvanceRecord[]>([]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setAdvancesLoading(true);
      setAdvancesError(null);
      try {
        const res = await getEmployeeAdvancesPaged({
          page: 1,
          page_size: 1000,
        });
        if (!mounted) return;
        setAdvances(Array.isArray(res?.records) ? res.records : []);
      } catch (e: any) {
        if (!mounted) return;
        setAdvances([]);
        setAdvancesError(e?.message || "Failed to load advances");
      } finally {
        if (!mounted) return;
        setAdvancesLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

  const advancesKpis = useMemo(() => {
    const totalAdvance = advances.reduce(
      (s, r) => s + Number(r.advance_amount ?? 0),
      0,
    );
    return {
      count: advances.length,
      totalAdvance,
    };
  }, [advances]);

  const monthlyTrend = useMemo(() => {
    const map: Record<
      string,
      {
        month: string;
        gross: number;
        deductions: number;
        net: number;
        advances: number;
        slips: number;
      }
    > = {};

    filteredSlips.forEach((r) => {
      const key =
        getMonthKey(r.end_date) || getMonthKey(r.start_date) || "Unknown";
      if (!map[key])
        map[key] = {
          month: key,
          gross: 0,
          deductions: 0,
          net: 0,
          advances: 0,
          slips: 0,
        };
      map[key].gross += Number(r.total_earnings ?? 0);
      map[key].deductions += Number(r.total_deduction ?? 0);
      map[key].net += Number(r.net_pay ?? 0);
      map[key].slips += 1;
    });

    advances.forEach((r) => {
      const key = getMonthKey(String(r.posting_date ?? "").trim()) || "Unknown";
      if (!map[key])
        map[key] = {
          month: key,
          gross: 0,
          deductions: 0,
          net: 0,
          advances: 0,
          slips: 0,
        };
      map[key].advances += Number(r.advance_amount ?? 0);
    });

    return Object.values(map)
      .filter((r) => r.month !== "Unknown")
      .sort((a, b) => String(a.month).localeCompare(String(b.month)))
      .slice(-12);
  }, [filteredSlips, advances]);

  const kpiCards = useMemo(
    () => [
      {
        label: "Salary Slips",
        value: loading ? "—" : String(kpis.slipCount.toLocaleString("en-ZM")),
        icon: FileText,
        color: "text-primary bg-primary/10 border-[var(--primary)]/20",
      },
      {
        label: "Total Earnings",
        value: loading ? "—" : currencyZMW.format(kpis.totalGross),
        icon: TrendingUp,
        color: "text-success bg-success/10 border-success/20",
      },
      {
        label: "Total Deductions",
        value: loading ? "—" : currencyZMW.format(kpis.totalDed),
        icon: Users,
        color: "text-warning bg-warning/10 border-warning/20",
      },
      {
        label: "Total Net Pay",
        value: loading ? "—" : currencyZMW.format(kpis.totalNet),
        icon: DollarSign,
        color: "text-primary bg-primary/10 border-[var(--primary)]/20",
      },
      {
        label: "Total Advances",
        value: advancesLoading
          ? "—"
          : currencyZMW.format(advancesKpis.totalAdvance),
        icon: TrendingUp,
        color: "text-success bg-success/10 border-success/20",
      },
    ],
    [
      advancesKpis.totalAdvance,
      advancesLoading,
      currencyZMW,
      kpis.slipCount,
      kpis.totalDed,
      kpis.totalGross,
      kpis.totalNet,
      loading,
    ],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2 flex-wrap">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodPreset)}
          className="h-10 px-3 bg-card border border-theme rounded-xl text-sm text-main shadow-sm focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(204,0,0,0.12)]"
        >
          <option value="last_12">Last 12 months</option>
          <option value="last_6">Last 6 months</option>
          <option value="last_3">Last 3 months</option>
          <option value="this_month">This month</option>
          <option value="custom_month">Select month…</option>
          <option value="all">All time</option>
        </select>

        {period === "custom_month" && (
          <input
            type="month"
            value={customMonth}
            onChange={(e) => setCustomMonth(e.target.value)}
            className="h-10 px-3 bg-card border border-theme rounded-xl text-sm text-main shadow-sm focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(204,0,0,0.12)]"
          />
        )}

        {period === "custom_month" && customMonth && (
          <button
            type="button"
            onClick={() => setCustomMonth("")}
            className="h-10 px-3 rounded-xl border border-theme bg-card text-sm font-semibold text-main hover:bg-muted/5"
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="bg-danger/5 border border-danger/20 text-danger rounded-lg px-4 py-3 text-sm font-semibold">
          {error}
        </div>
      )}

      {advancesError && (
        <div className="bg-danger/5 border border-danger/20 text-danger rounded-lg px-4 py-3 text-sm font-semibold">
          {advancesError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={KPI_CARD_BASE}>
              <div className="flex items-start justify-between w-full">
                <div>
                  <div className="text-xs font-semibold text-muted tracking-wide uppercase">
                    {c.label}
                  </div>
                  <div className="text-xl font-bold text-main mt-1.5 tabular-nums">
                    {c.value}
                  </div>
                </div>
                <div
                  className={`h-10 w-10 rounded-md flex items-center justify-center ${c.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={CHART_CARD_BASE}>
          <div>
            <div className="text-sm font-extrabold text-main">
              Status Distribution
            </div>
          </div>
          <div className="h-[280px] mt-4 w-full min-w-0">
            {loading ? (
              <div className="h-full rounded-lg bg-muted/5 animate-pulse" />
            ) : statusData.length === 0 ? (
              <div className="text-sm text-muted mt-6">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      borderColor: "var(--border)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {statusData.map((_, idx) => (
                      <Cell
                        key={String(idx)}
                        fill={COLORS[idx % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className={CHART_CARD_BASE}>
          <div>
            <div className="text-sm font-extrabold text-main">
              Top Employees (Net Pay)
            </div>
          </div>
          <div className="h-[280px] mt-4 w-full min-w-0">
            {loading ? (
              <div className="h-full rounded-lg bg-muted/5 animate-pulse" />
            ) : topEmployees.length === 0 ? (
              <div className="text-sm text-muted mt-6">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topEmployees}
                  margin={{ top: 8, right: 12, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="employee"
                    angle={-25}
                    textAnchor="end"
                    height={55}
                    interval={0}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      borderColor: "var(--border)",
                    }}
                    formatter={(v: any) => [
                      `ZMW ${fmtZMW(Number(v || 0))}`,
                      "Net Pay",
                    ]}
                  />
                  <Bar
                    dataKey="net"
                    fill="var(--primary)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className={`${CHART_CARD_BASE} lg:col-span-2`}>
        <div>
          <div className="text-sm font-extrabold text-main">
            Unified Monthly Trend (Net Pay, Deductions, Advances)
          </div>
        </div>
        <div className="h-[320px] mt-4 w-full min-w-0">
          {loading || advancesLoading ? (
            <div className="h-full rounded-lg bg-muted/5 animate-pulse" />
          ) : monthlyTrend.length === 0 ? (
            <div className="text-sm text-muted mt-6">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyTrend}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--primary)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="colorDed" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--primary-700)"
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--primary-700)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="colorAdv" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--primary-500)"
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--primary-500)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                  tickMargin={10}
                  minTickGap={20}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tickFormatter={(value) => {
                    if (value >= 1000000)
                      return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                    return value;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    boxShadow:
                      "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                  }}
                  itemStyle={{ fontSize: 13, fontWeight: 500 }}
                  labelStyle={{
                    fontSize: 12,
                    color: "var(--muted)",
                    marginBottom: 4,
                  }}
                  formatter={(v: any, name: string) => {
                    return [`ZMW ${fmtZMW(Number(v || 0))}`, name];
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: "15px" }}
                  iconType="circle"
                />
                <Area
                  type="monotone"
                  dataKey="net"
                  name="Net Pay"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorNet)"
                  activeDot={{ r: 6, strokeWidth: 0, fill: "var(--primary)" }}
                  yAxisId="left"
                />
                <Area
                  type="monotone"
                  dataKey="deductions"
                  name="Deductions"
                  stroke="var(--primary-700)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDed)"
                  activeDot={{
                    r: 5,
                    strokeWidth: 0,
                    fill: "var(--primary-700)",
                  }}
                  yAxisId="left"
                />
                <Area
                  type="monotone"
                  dataKey="advances"
                  name="Advances"
                  stroke="var(--primary-500)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAdv)"
                  activeDot={{
                    r: 5,
                    strokeWidth: 0,
                    fill: "var(--primary-500)",
                  }}
                  yAxisId="left"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
