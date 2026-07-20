import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from "recharts";

import type { MonthlySalesPoint } from "../../api/salesDashboardApi";


interface CurrencyFormatter {
  format: (value: number) => string;
}

type Period = "Monthly" | "Yearly";

interface MonthlySalesOverviewProps {
  currencyFormatter: CurrencyFormatter;
  data: MonthlySalesPoint[];
  year: string;
  years: string[];
  loading?: boolean;
  onYearChange: (year: string) => void;
}


const CHART_CONFIG = {
  received: "#4F46E5", // indigo — dashboard primary
  receivable: "#F59E0B", // amber accent
  grid: "#F1F5F9",
  axis: "#94A3B8",
};

const PERIODS: Period[] = ["Monthly", "Yearly"];


const LegendDot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span className="flex items-center gap-1.5 text-xs text-slate-500">
    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
    {label}
  </span>
);

const FilterSelect: React.FC<{
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}> = ({ value, options, onChange, disabled }) => (
  <select
    value={value}
    disabled={disabled}
    onChange={(e) => onChange(e.target.value)}
    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {options.map((opt) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
);

interface ChartPoint {
  month: string;
  received: number; 
  receivable: number;
  receivedActual: number;
  receivableActual: number;
}


const MIN_BAR_HEIGHT_RATIO = 0.03;

const ChartTooltip: React.FC<{
  active?: boolean;
  label?: string;
  payload?: { payload: ChartPoint }[];
  currencyFormatter: CurrencyFormatter;
}> = ({ active, label, payload, currencyFormatter }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  const received = row?.receivedActual ?? 0;
  const receivable = row?.receivableActual ?? 0;
  return (
    <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-slate-700">{label}</p>
      <p className="flex items-center gap-1.5 text-slate-500">
        <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: CHART_CONFIG.received }} />
        Received: <span className="font-medium text-slate-700">{currencyFormatter.format(received)}</span>
      </p>
      <p className="flex items-center gap-1.5 text-slate-500">
        <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: CHART_CONFIG.receivable }} />
        Receivable: <span className="font-medium text-slate-700">{currencyFormatter.format(receivable)}</span>
      </p>
    </div>
  );
};

const BarValueLabel = (props: {
  x?: number;
  y?: number;
  width?: number;
  payload?: ChartPoint;
  actualKey: "receivedActual" | "receivableActual";
  color: string;
  formatter: (v: number) => string;
}) => {
  const { x = 0, y = 0, width = 0, payload, actualKey, color, formatter } = props;
  const actual = payload?.[actualKey] ?? 0;
  if (!actual) return null;
  return (
    <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={10} fontWeight={600} fill={color}>
      {formatter(actual)}
    </text>
  );
};

const ChartSkeleton: React.FC = () => (
  <div className="flex h-48 items-end gap-3 px-1 pb-1">
    {Array.from({ length: 7 }).map((_, i) => (
      <div key={i} className="flex-1 animate-pulse rounded-t-md bg-slate-100" style={{ height: `${30 + ((i * 13) % 60)}%` }} />
    ))}
  </div>
);


const MonthlySalesOverview: React.FC<MonthlySalesOverviewProps> = ({
  currencyFormatter,
  data,
  year,
  years,
  loading = false,
  onYearChange,
}) => {
  const [period, setPeriod] = useState<Period>("Monthly");

  const monthlyPoints = useMemo(
    () =>
      (data ?? []).map((d) => ({
        month: d.month,
        received: d.received,
        receivable: d.receivable,
      })),
    [data],
  );

  const yearlyPoints = useMemo(() => {
    const totals = monthlyPoints.reduce(
      (acc, p) => {
        acc.received += p.received;
        acc.receivable += p.receivable;
        return acc;
      },
      { received: 0, receivable: 0 },
    );
    return [{ month: year, ...totals }];
  }, [monthlyPoints, year]);

  const rawPoints = period === "Monthly" ? monthlyPoints : yearlyPoints;
  const hasAnyValue = rawPoints.some((p) => p.received > 0 || p.receivable > 0);

  const chartPoints: ChartPoint[] = useMemo(() => {
    const maxValue = Math.max(...rawPoints.flatMap((p) => [p.received, p.receivable]), 1);
    const floor = maxValue * MIN_BAR_HEIGHT_RATIO;
    return rawPoints.map((p) => ({
      month: p.month,
      received: p.received > 0 ? Math.max(p.received, floor) : 0,
      receivable: p.receivable > 0 ? Math.max(p.receivable, floor) : 0,
      receivedActual: p.received,
      receivableActual: p.receivable,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawPoints]);

  const yAxisTickFormatter = (v: number) => currencyFormatter.format(v);

  return (
    <div className="flex flex-col gap-2">
      {/* Legend + filters */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <LegendDot color={CHART_CONFIG.received} label="Received" />
          <LegendDot color={CHART_CONFIG.receivable} label="Receivable" />
        </div>
        <div className="flex items-center gap-2">
          <FilterSelect value={year} options={years} onChange={onYearChange} disabled={loading} />
          <FilterSelect value={period} options={PERIODS} onChange={(v) => setPeriod(v as Period)} />
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <ChartSkeleton />
      ) : chartPoints.length === 0 || !hasAnyValue ? (
        <div className="flex h-32 items-center justify-center text-sm text-slate-400">No sales data yet</div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartPoints} margin={{ top: 20, right: 4, left: 0, bottom: 0 }} barGap={4} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke={CHART_CONFIG.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                axisLine={{ stroke: "#E2E8F0" }}
                tickLine={false}
                tick={{ fill: CHART_CONFIG.axis, fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: CHART_CONFIG.axis, fontSize: 10 }}
                tickFormatter={yAxisTickFormatter}
                width={56}
              />
              <Tooltip
                cursor={{ fill: "rgba(148,163,184,0.08)" }}
                content={<ChartTooltip currencyFormatter={currencyFormatter} />}
              />
              <Bar dataKey="received" name="Received" fill={CHART_CONFIG.received} radius={[4, 4, 0, 0]} maxBarSize={period === "Yearly" ? 48 : 20}>
                <LabelList
                  dataKey="received"
                  content={(p: any) => (
                    <BarValueLabel
                      {...p}
                      actualKey="receivedActual"
                      color={CHART_CONFIG.received}
                      formatter={currencyFormatter.format}
                    />
                  )}
                />
              </Bar>
              <Bar
                dataKey="receivable"
                name="Receivable"
                fill={CHART_CONFIG.receivable}
                radius={[4, 4, 0, 0]}
                maxBarSize={period === "Yearly" ? 48 : 20}
              >
                <LabelList
                  dataKey="receivable"
                  content={(p: any) => (
                    <BarValueLabel
                      {...p}
                      actualKey="receivableActual"
                      color={CHART_CONFIG.receivable}
                      formatter={currencyFormatter.format}
                    />
                  )}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default MonthlySalesOverview;