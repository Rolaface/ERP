import React, { useEffect, useState } from "react";
import {
  FileText,
  Loader2,
  TrendingUp,
  TrendingDown,
  Layers,
  Calendar,
  Building2,
  CreditCard,
  DollarSign,
  BarChart2,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  getSalarySlipsByEmployee,
  type SalarySlip,
  type PayrollEmployeeDetail,
} from "../../../../api/payroll/payrollEntryApi";
import { StatusBadge } from "./Payrollsharedcomponents";

// ─── Replace with your actual API import ──────────────────────────────────────
// import { getSalaryStructureById } from "../../../api/payrollConfigApi";
// Stubbed below for portability — swap with your real API call.
async function getSalaryStructureById(name: string): Promise<SalaryStructureDetail | null> {
  // TODO: Replace with real API call, e.g.:
  // const resp = await api.get(`/api/resource/Salary Structure/${encodeURIComponent(name)}`);
  // return resp.data?.data ?? null;
  return null;
}

// ─── Salary Structure type ────────────────────────────────────────────────────
// Adjust fields to match your actual API response shape.
interface StructureComponent {
  salary_component: string;
  amount?: number;
  formula?: string;
}

interface SalaryStructureDetail {
  name: string;
  is_active: "Yes" | "No";
  earnings: StructureComponent[];
  deductions: StructureComponent[];
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  employee: PayrollEmployeeDetail;
  payrollEntryId: string;
}

// ─── Design tokens ────────────────────────────────────────────────────────────
// Subtle, professional palette — no bright/flashy colors.
const PALETTE = {
  earnings: [
    "#2563eb", // blue-600
    "#0891b2", // cyan-600
    "#0d9488", // teal-600
    "#059669", // emerald-600
    "#7c3aed", // violet-600
  ],
  deductions: [
    "#dc2626", // red-600
    "#ea580c", // orange-600
    "#ca8a04", // yellow-600
    "#9f1239", // rose-800
  ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SummaryCard: React.FC<{
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent?: "green" | "red" | "blue" | "default";
}> = ({ label, value, icon, accent = "default" }) => {
  const accentClasses: Record<string, string> = {
    green: "text-emerald-600",
    red: "text-red-500",
    blue: "text-blue-600",
    default: "text-main",
  };
  return (
    <div className="rounded-xl border border-theme bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase font-bold tracking-wider text-muted">{label}</p>
        <span className="text-muted/50">{icon}</span>
      </div>
      <p className={`text-xl font-bold ${accentClasses[accent]}`}>{value}</p>
    </div>
  );
};

const ComponentRow: React.FC<{
  name: string;
  color: string;
  percent: number;
  amount: string;
}> = ({ name, color, percent, amount }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-theme last:border-0">
    <div className="flex items-center gap-2.5 min-w-0">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs font-medium text-main truncate">{name}</span>
    </div>
    <div className="flex items-center gap-3 shrink-0 ml-2">
      <div className="w-20 h-1.5 rounded-full bg-theme overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-semibold text-main w-16 text-right">{amount}</span>
      <span className="text-[10px] text-muted w-8 text-right">{percent}%</span>
    </div>
  </div>
);

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, currency } = payload[0].payload;
  return (
    <div className="rounded-lg border border-theme bg-surface shadow-lg px-3 py-2">
      <p className="text-xs font-semibold text-main">{name}</p>
      <p className="text-xs text-muted mt-0.5">
        {currency ?? ""} {Number(value).toLocaleString()}
      </p>
    </div>
  );
};

// ─── Structure Analytics Section ─────────────────────────────────────────────

const StructureAnalytics: React.FC<{
  slip: SalarySlip;
  structure: SalaryStructureDetail | null;
}> = ({ slip, structure }) => {
  const gross = Number(slip.gross_pay) || 0;
  const net = Number(slip.net_pay) || 0;
  const totalDeduction = Number(slip.total_deduction) || gross - net;

  // Build chart data from structure components if available,
  // otherwise fall back to the slip-level gross/deduction split.
  const earningsData =
    structure && structure.earnings.length > 0
      ? structure.earnings.map((e, i) => ({
          name: e.salary_component,
          value: e.amount ?? gross / structure.earnings.length,
          color: PALETTE.earnings[i % PALETTE.earnings.length],
          currency: slip.currency,
        }))
      : [
          {
            name: "Total Earnings",
            value: gross,
            color: PALETTE.earnings[0],
            currency: slip.currency,
          },
        ];

  const deductionsData =
    structure && structure.deductions.length > 0
      ? structure.deductions.map((d, i) => ({
          name: d.salary_component,
          value: d.amount ?? totalDeduction / Math.max(structure.deductions.length, 1),
          color: PALETTE.deductions[i % PALETTE.deductions.length],
          currency: slip.currency,
        }))
      : totalDeduction > 0
      ? [
          {
            name: "Total Deductions",
            value: totalDeduction,
            color: PALETTE.deductions[0],
            currency: slip.currency,
          },
        ]
      : [];

  const allComponentsForChart = [...earningsData, ...deductionsData];
  const effectiveRate = gross > 0 ? ((net / gross) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-5">
      {/* Analytics Header */}
      <div className="rounded-2xl border border-theme bg-surface overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme bg-app">
          <div>
            <h3 className="text-sm font-bold text-main">Salary Structure Analytics</h3>
            <p className="text-xs text-muted mt-0.5">Compensation distribution · {slip.salary_structure}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/8 text-primary text-[11px] font-semibold">
              <Layers className="w-3 h-3" />
              {slip.salary_structure}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0">
          {/* Donut chart */}
          <div className="p-5 border-r border-theme">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted mb-4">
              Compensation Breakdown
            </p>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allComponentsForChart}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={88}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {allComponentsForChart.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Center label — positioned below chart */}
            <div className="text-center -mt-2">
              <p className="text-[10px] text-muted font-medium">Net Effective Rate</p>
              <p className="text-lg font-bold text-emerald-600">{effectiveRate}%</p>
            </div>
          </div>

          {/* Component breakdown */}
          <div className="p-5">
            {/* Earnings */}
            {earningsData.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">
                    Earnings
                  </p>
                </div>
                {earningsData.map((item) => (
                  <ComponentRow
                    key={item.name}
                    name={item.name}
                    color={item.color}
                    percent={gross > 0 ? Math.round((item.value / gross) * 100) : 0}
                    amount={`${slip.currency} ${Number(item.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  />
                ))}
              </div>
            )}

            {/* Deductions */}
            {deductionsData.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                  <p className="text-[10px] uppercase font-bold tracking-wider text-red-500">
                    Deductions
                  </p>
                </div>
                {deductionsData.map((item) => (
                  <ComponentRow
                    key={item.name}
                    name={item.name}
                    color={item.color}
                    percent={gross > 0 ? Math.round((item.value / gross) * 100) : 0}
                    amount={`${slip.currency} ${Number(item.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const SalarySlipTab: React.FC<Props> = ({ employee }) => {
  const [loadingSlip, setLoadingSlip] = useState(false);
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [slip, setSlip] = useState<SalarySlip | null>(null);
  const [structure, setStructure] = useState<SalaryStructureDetail | null>(null);

  // Step 1: Fetch salary slip
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingSlip(true);
        setSlip(null);
        setStructure(null);
        const slips = await getSalarySlipsByEmployee(employee.employee);
        setSlip(slips?.[0] ?? null);
      } finally {
        setLoadingSlip(false);
      }
    };
    load();
  }, [employee.employee]);

  // Step 2: Fetch salary structure once slip is available
  useEffect(() => {
    if (!slip?.salary_structure) return;
    const load = async () => {
      try {
        setLoadingStructure(true);
        const data = await getSalaryStructureById(slip.salary_structure);
        setStructure(data);
      } finally {
        setLoadingStructure(false);
      }
    };
    load();
  }, [slip?.salary_structure]);

  // ── Loading slip ──
  if (loadingSlip) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // ── No slip found ──
  if (!slip) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted">
        <FileText className="w-10 h-10 opacity-20 mb-3" />
        <p className="text-sm font-medium">No salary slip found</p>
        <p className="text-xs mt-1 text-muted/70">
          No salary slip has been generated for this employee yet.
        </p>
      </div>
    );
  }

  const gross = Number(slip.gross_pay) || 0;
  const net = Number(slip.net_pay) || 0;
  const totalDeduction = Number(slip.total_deduction) || gross - net;

  return (
    <div className="space-y-5">
      {/* ── Employee Payroll Header ── */}
      <div className="rounded-2xl border border-theme bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-main">{slip.employee_name}</h2>
              <StatusBadge status={slip.status} />
            </div>
            <p className="text-sm text-muted mt-1">{slip.employee}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted">Net Salary</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">
              {slip.currency} {Number(net).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="px-3 py-1.5 rounded-xl bg-primary/8 text-primary text-xs font-bold border border-primary/10">
            {slip.salary_structure}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-app border border-theme text-xs font-semibold text-main">
            {slip.company}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-app border border-theme text-xs font-semibold text-main">
            Posted: {slip.posting_date}
          </span>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-4 gap-3">
        <SummaryCard
          label="Gross Pay"
          value={`${slip.currency} ${Number(gross).toLocaleString()}`}
          icon={<DollarSign className="w-4 h-4" />}
          accent="blue"
        />
        <SummaryCard
          label="Net Pay"
          value={`${slip.currency} ${Number(net).toLocaleString()}`}
          icon={<TrendingUp className="w-4 h-4" />}
          accent="green"
        />
        <SummaryCard
          label="Total Deductions"
          value={`${slip.currency} ${Number(totalDeduction).toLocaleString()}`}
          icon={<TrendingDown className="w-4 h-4" />}
          accent="red"
        />
        <SummaryCard
          label="CTC"
          value={slip.ctc ? `${slip.currency} ${Number(slip.ctc).toLocaleString()}` : "—"}
          icon={<BarChart2 className="w-4 h-4" />}
          accent="default"
        />
      </div>

      {/* ── Structure Analytics (loading indicator while structure loads) ── */}
      {loadingStructure ? (
        <div className="rounded-2xl border border-theme bg-surface p-8 flex items-center justify-center gap-2 text-muted">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <p className="text-xs">Loading salary structure…</p>
        </div>
      ) : (
        <StructureAnalytics slip={slip} structure={structure} />
      )}

      {/* ── Payroll Summary ── */}
      <div className="rounded-xl border border-theme bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-theme bg-app">
          <p className="text-xs font-bold text-primary">Payroll Summary</p>
        </div>
        <div className="p-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] uppercase text-muted font-bold flex items-center gap-1.5">
              <Building2 className="w-3 h-3" /> Employee
            </p>
            <p className="mt-1 text-sm font-semibold text-main">{slip.employee_name}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted font-bold flex items-center gap-1.5">
              <FileText className="w-3 h-3" /> Salary Slip ID
            </p>
            <p className="mt-1 text-sm font-semibold text-main">{slip.name}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted font-bold flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> Tax (This Month)
            </p>
            <p className="mt-1 text-sm font-semibold text-main">
              {slip.current_month_income_tax
                ? `${slip.currency} ${Number(slip.current_month_income_tax).toLocaleString()}`
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Earnings vs Deductions Detail ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-theme bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-theme bg-app flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-xs font-bold text-emerald-600">Earnings</p>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Total Earnings</span>
              <span className="text-sm font-semibold text-main">
                {slip.currency} {Number(slip.total_earnings || gross).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-theme bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-theme bg-app flex items-center gap-2">
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            <p className="text-xs font-bold text-red-500">Deductions</p>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Total Deductions</span>
              <span className="text-sm font-semibold text-main">
                {slip.currency} {Number(totalDeduction).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};