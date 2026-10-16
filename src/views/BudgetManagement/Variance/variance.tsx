import React, { useMemo, useState } from "react";
import { Segmented, sectionCard, inputCls, fmt, inr, StatusPill, LIVE_PLANS, Field } from "../sharedbudget";

interface VarRow {
  name: string;
  sub: string;
  original: number;
  adjustments: number;
  actual: number;
}

const BY_UNIT: VarRow[] = [
  { name: "Meerut Main", sub: "BR-0101", original: 2400000, adjustments: -40000, actual: 1650000 },
  { name: "Meerut Cantt", sub: "BR-0102", original: 1500000, adjustments: 40000, actual: 1210000 },
  { name: "Dehradun Central", sub: "BR-0201", original: 2900000, adjustments: 0, actual: 1900000,  },
  { name: "Dehradun Rajpur Road", sub: "BR-0202", original: 1800000, adjustments: 100000, actual: 1420000 },
  { name: "Haridwar", sub: "BR-0301", original: 1600000, adjustments: -25000, actual: 1050000,  },
  { name: "Roorkee", sub: "BR-0302", original: 1200000, adjustments: 25000, actual: 1320000,  },
  { name: "Agra Sadar", sub: "BR-0401", original: 2200000, adjustments: 0, actual: 1380000,  },
  { name: "Mathura", sub: "BR-0402", original: 1400000, adjustments: 0, actual: 790000, },
  { name: "Information Technology", sub: "DP-01", original: 4200000, adjustments: 1200000, actual: 3100000},
  { name: "Human Resources", sub: "DP-02", original: 2100000, adjustments: 0, actual: 1350000},
  { name: "Operations", sub: "DP-03", original: 3100000, adjustments: 0, actual: 2150000 },
  { name: "Finance & Accounts", sub: "DP-04", original: 1700000, adjustments: 0, actual: 980000},
];

const BY_HEAD: VarRow[] = [
  { name: "Office Rent", sub: "OPX-001 · Operating Expenses", original: 9600000, adjustments: 0, actual: 6400000, },
  { name: "Electricity", sub: "OPX-002 · Operating Expenses", original: 1400000, adjustments: 80000, actual: 1180000,},
  { name: "Housekeeping & Security", sub: "OPX-003 · Operating Expenses", original: 1100000, adjustments: -60000, actual: 720000, },
  { name: "Stationery & Printing", sub: "OPX-004 · Operating Expenses", original: 600000, adjustments: 0, actual: 380000,  },
  { name: "IT Equipment", sub: "CPX-001 · Capital Expenditure Items", original: 4500000, adjustments: 1300000, actual: 3600000, },
  { name: "Staff Training", sub: "STF-001 · Staff Costs", original: 1200000, adjustments: 0, actual: 640000, },
  { name: "Travel Expenses", sub: "STF-002 · Staff Costs", original: 1000000, adjustments: -25000, actual: 780000, },
  { name: "Overtime", sub: "STF-003 · Staff Costs", original: 800000, adjustments: 0, actual: 690000,},
];

const flagOf = (util: number) => (util >= 100 ? "Over" : util >= 90 ? "Watch" : "On track");

const Variance: React.FC = () => {
  const [plan, setPlan] = useState(LIVE_PLANS[0]);
  const [view, setView] = useState<"Branch / Department" | "Budget head">("Branch / Department");

  const rows = useMemo(() => {
    const src = view === "Budget head" ? BY_HEAD : BY_UNIT;
    return src.map((r) => {
      const revised = r.original + r.adjustments;
      const used = r.actual;
      const available = revised - used;
      const util = revised > 0 ? (used / revised) * 100 : 0;
      return { ...r, revised, available, util, flag: flagOf(util) };
    });
  }, [view]);

  const total = rows.reduce(
    (t, r) => ({ original: t.original + r.original, adjustments: t.adjustments + r.adjustments, revised: t.revised + r.revised, actual: t.actual + r.actual, available: t.available + r.available }),
    { original: 0, adjustments: 0, revised: 0, actual: 0, available: 0 },
  );
  const totalUtil = total.revised ? ((total.actual) / total.revised) * 100 : 0;

  const cards = [
    ["Revised budget", inr(total.revised)],
    ["Actual", inr(total.actual)],
    ["Available", inr(total.available)],
    ["Utilisation", `${totalUtil.toFixed(1)}%`],
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto">
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-[340px]">
          <Field label="Budget plan">
            <select value={plan} onChange={(e) => setPlan(e.target.value)} className={inputCls} aria-label="Budget plan">
              {LIVE_PLANS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
        </div>
        <div className="w-[320px]">
          <Field label="View by">
            <Segmented<"Branch / Department" | "Budget head"> value={view} options={["Branch / Department", "Budget head"]} onChange={setView} />
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map(([k, v]) => (
          <div key={k} className={`${sectionCard} px-4 py-3`}>
            <div className="text-xs text-muted">{k}</div>
            <div className="mt-0.5 text-lg font-semibold text-main">{v}</div>
          </div>
        ))}
      </div>

      <section className={`${sectionCard} overflow-x-auto`}>
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="bg-[var(--border)]/15 text-left text-xs font-medium text-muted">
              <th className="px-3 py-2">{view === "Budget head" ? "Budget head" : "Branch / Department"}</th>
              <th className="px-3 py-2 text-right">Original</th>
              <th className="px-3 py-2 text-right">Adjustments</th>
              <th className="px-3 py-2 text-right">Revised</th>
              <th className="px-3 py-2 text-right">Actual</th>
              <th className="px-3 py-2 text-right">Available</th>
              <th className="w-48 px-3 py-2">Utilisation</th>
              <th className="px-3 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-[var(--border)] text-main">
                <td className="px-3 py-2">
                  <span className="block font-medium">{r.name}</span>
                  <span className="block text-xs text-muted">{r.sub}</span>
                </td>
                <td className="px-3 py-2 text-right">{fmt(r.original)}</td>
                <td className={`px-3 py-2 text-right ${r.adjustments < 0 ? "text-danger" : r.adjustments > 0 ? "text-emerald-600" : "text-muted"}`}>
                  {r.adjustments > 0 ? "+" : ""}{r.adjustments ? fmt(r.adjustments) : "—"}
                </td>
                <td className="px-3 py-2 text-right font-medium">{fmt(r.revised)}</td>
                <td className="px-3 py-2 text-right">{fmt(r.actual)}</td>
                <td className={`px-3 py-2 text-right font-medium ${r.available < 0 ? "text-danger" : ""}`}>{fmt(r.available)}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-[var(--border)]/40">
                      <div
                        className={`h-1.5 rounded-full ${r.flag === "Over" ? "bg-red-500" : r.flag === "Watch" ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(100, r.util)}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs text-muted">{r.util.toFixed(1)}%</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-center"><StatusPill value={r.flag} /></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[var(--border)] bg-[var(--border)]/10 font-semibold text-main">
              <td className="px-3 py-2">Total</td>
              <td className="px-3 py-2 text-right">{fmt(total.original)}</td>
              <td className="px-3 py-2 text-right">{total.adjustments > 0 ? "+" : ""}{fmt(total.adjustments)}</td>
              <td className="px-3 py-2 text-right">{fmt(total.revised)}</td>
              <td className="px-3 py-2 text-right">{fmt(total.actual)}</td>
              <td className="px-3 py-2 text-right">{fmt(total.available)}</td>
              <td className="px-3 py-2 text-right text-xs">{totalUtil.toFixed(1)}%</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </section>
    </div>
  );
};

export default Variance;