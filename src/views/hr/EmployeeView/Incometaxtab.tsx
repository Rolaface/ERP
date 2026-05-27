import React, { useState, useEffect } from "react";
import {
  FileText,
  TrendingDown,
  Info,
  ChevronDown,
  Loader2,
  AlertCircle,
  Calendar,
  BadgePercent,
  ShieldCheck,
} from "lucide-react";
import { getAllTaxConfigs, getTaxConfig } from "../../../api/payrollConfigApi";
import type { TaxConfig, TaxSlabRow } from "../../../api/payrollConfigApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtAmt = (n: number, currency = "") =>
  `${currency} ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`.trim();
const rateLabel = (pct: number) => (pct === 0 ? "NIL" : `${pct}%`);

const RATE_COLORS: Record<
  string,
  { bg: string; text: string; bar: string; border: string }
> = {
  NIL: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    bar: "bg-emerald-400",
    border: "border-emerald-200",
  },
  "5%": {
    bg: "bg-sky-50",
    text: "text-sky-700",
    bar: "bg-sky-400",
    border: "border-sky-200",
  },
  "10%": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    bar: "bg-amber-400",
    border: "border-amber-200",
  },
  "15%": {
    bg: "bg-orange-50",
    text: "text-orange-600",
    bar: "bg-orange-400",
    border: "border-orange-200",
  },
  "20%": {
    bg: "bg-red-50",
    text: "text-red-600",
    bar: "bg-red-400",
    border: "border-red-200",
  },
  "30%": {
    bg: "bg-rose-100",
    text: "text-rose-700",
    bar: "bg-rose-500",
    border: "border-rose-200",
  },
};

const getRateColor = (pct: number) => {
  const key = rateLabel(pct);
  return RATE_COLORS[key] ?? RATE_COLORS["30%"];
};

const normalizeSlabs = (slabs: TaxSlabRow[]) =>
  slabs.map((s, i) => ({
    ...s,
    to_amount:
      s.to_amount === 0 && i === slabs.length - 1
        ? Infinity
        : (s.to_amount ?? Infinity),
  }));

// ─── Slab Visual ──────────────────────────────────────────────────────────────

const SlabVisual: React.FC<{
  slabs: TaxSlabRow[];
  currency: string;
  taxableIncome?: number;
}> = ({ slabs, currency, taxableIncome }) => {
  const normalized = normalizeSlabs(slabs);
  const maxAmount = normalized
    .filter((s) => s.to_amount !== Infinity)
    .reduce((m, s) => Math.max(m, s.to_amount ?? 0), 0);

  const activeSlab =
    taxableIncome != null
      ? normalized.findIndex(
          (s) =>
            taxableIncome >= (s.from_amount ?? 0) &&
            taxableIncome <= (s.to_amount ?? Infinity),
        )
      : -1;

  const barWidth = (slab: (typeof normalized)[0]) => {
    if (slab.to_amount === Infinity || !maxAmount) return 100;
    return Math.min(Math.round(((slab.to_amount ?? 0) / maxAmount) * 100), 100);
  };

  return (
    <div className="space-y-2.5">
      {normalized.map((slab, idx) => {
        const pct = slab.percent_deduction ?? 0;
        const colors = getRateColor(pct);
        const isActive = idx === activeSlab;
        const label = rateLabel(pct);

        const rangeText =
          slab.to_amount === Infinity
            ? `Above ${fmtAmt(slab.from_amount ?? 0, currency)}`
            : `${fmtAmt(slab.from_amount ?? 0, currency)} – ${fmtAmt(slab.to_amount as number, currency)}`;

        return (
          <div
            key={idx}
            className={`rounded-xl border transition-all duration-200 bg-[var(--card)] overflow-hidden ${
              isActive
                ? "border-[var(--primary)] shadow-md"
                : "border-[var(--border)]"
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {isActive ? (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: "var(--primary)" }}
                  />
                ) : (
                  <span className="w-2 h-2 rounded-full shrink-0 bg-[var(--border)]" />
                )}
                <p
                  className={`text-sm truncate ${
                    isActive
                      ? "font-semibold text-[var(--text)]"
                      : "font-medium text-[var(--muted)]"
                  }`}
                >
                  {rangeText}
                </p>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 border ${colors.bg} ${colors.text} ${colors.border}`}
              >
                {label}
              </span>
            </div>
            <div className="px-4 pb-3">
              <div className="h-1 rounded-full bg-[var(--row-hover)]">
                <div
                  className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
                  style={{ width: `${barWidth(slab)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface IncomeTaxTabProps {
  taxableIncome?: number;
}

const IncomeTaxTab: React.FC<IncomeTaxTabProps> = ({ taxableIncome }) => {
  const [subtab, setSubtab] = useState<"slabs" | "form16" | "report">("slabs");

  const [slabList, setSlabList] = useState<TaxConfig[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedName, setSelectedName] = useState<string>("");
  const [detail, setDetail] = useState<TaxConfig | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setListLoading(true);
        setListError(null);
        const res = await getAllTaxConfigs(0, 50, "");
        const active = (res.data ?? []).filter(
          (s: any) => Number(s.disabled) !== 1,
        );
        setSlabList(active);
        if (active.length > 0) setSelectedName(active[0].name);
      } catch {
        setListError("Failed to load tax slabs.");
      } finally {
        setListLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedName) return;
    const load = async () => {
      try {
        setDetailLoading(true);
        setDetailError(null);
        const res = await getTaxConfig(selectedName);
        setDetail(res);
      } catch {
        setDetailError("Failed to load slab details.");
      } finally {
        setDetailLoading(false);
      }
    };
    load();
  }, [selectedName]);

  return (
    <div className="p-4 space-y-4">
      {/* Subtabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "slabs" as const, label: "Tax Slabs" },
          { id: "form16" as const, label: "Form 16" },
          { id: "report" as const, label: "Tax Report" },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setSubtab(s.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              subtab === s.id
                ? "text-white"
                : "bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
            }`}
            style={subtab === s.id ? { background: "var(--primary)" } : {}}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Tax Slabs ── */}
      {subtab === "slabs" && (
        <>
          {listLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-[var(--muted)]">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Loading tax slabs…</span>
            </div>
          ) : listError ? (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 bg-red-50 text-red-600 text-sm border border-red-200">
              <AlertCircle size={16} /> {listError}
            </div>
          ) : slabList.length === 0 ? (
            <div className="text-center py-16 text-[var(--muted)] text-sm">
              No active tax slabs found.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selector — only if multiple */}
              {slabList.length > 1 && (
                <div className="relative">
                  <select
                    value={selectedName}
                    onChange={(e) => setSelectedName(e.target.value)}
                    className="w-full appearance-none bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--text)] pr-10 cursor-pointer focus:outline-none"
                  >
                    {slabList.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
                  />
                </div>
              )}

              {detailLoading ? (
                <div className="flex items-center justify-center py-12 gap-2 text-[var(--muted)]">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Loading details…</span>
                </div>
              ) : detailError ? (
                <div className="flex items-center gap-2 rounded-xl px-4 py-3 bg-red-50 text-red-600 text-sm border border-red-200">
                  <AlertCircle size={16} /> {detailError}
                </div>
              ) : detail ? (
                <div className="space-y-4">
                  {/* Meta cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      {
                        icon: <Calendar size={13} />,
                        label: "Effective From",
                        value: new Date(
                          detail.effective_from,
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }),
                      },
                      {
                        icon: <ShieldCheck size={13} />,
                        label: "Std. Exemption",
                        value: fmtAmt(
                          detail.standard_tax_exemption_amount ?? 0,
                          (detail as any).currency ?? "",
                        ),
                      },
                      {
                        icon: <BadgePercent size={13} />,
                        label: "Exemption Allowed",
                        value: detail.allow_tax_exemption ? "Yes" : "No",
                      },
                    ].map((f) => (
                      <div
                        key={f.label}
                        className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 flex flex-col gap-1"
                      >
                        <div className="flex items-center gap-1.5 text-[var(--muted)]">
                          {f.icon}
                          <p className="text-[10px] uppercase tracking-wider font-medium">
                            {f.label}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-[var(--text)]">
                          {f.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Info banner — only if taxableIncome passed */}
                  {taxableIncome != null && (
                    <div
                      className="flex items-start gap-2 rounded-xl px-4 py-3 text-xs"
                      style={{
                        background:
                          "color-mix(in srgb, var(--primary) 8%, transparent)",
                        color: "var(--primary)",
                      }}
                    >
                      <Info size={14} className="mt-0.5 shrink-0" />
                      <span>
                        Your taxable income of{" "}
                        <strong>
                          {fmtAmt(
                            taxableIncome,
                            (detail as any).currency ?? "",
                          )}
                        </strong>{" "}
                        is highlighted in the slab below.
                      </span>
                    </div>
                  )}

                  {/* Slab rows */}
                  <SlabVisual
                    slabs={detail.slabs ?? []}
                    currency={(detail as any).currency ?? ""}
                    taxableIncome={taxableIncome}
                  />

                  {/* Other taxes — only non-zero */}
                  {(detail.other_taxes_and_charges ?? []).filter(
                    (c) => (c.percent ?? 0) > 0,
                  ).length > 0 && (
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold px-4 pt-3 pb-2">
                        Other Taxes &amp; Charges
                      </p>
                      {detail
                        .other_taxes_and_charges!.filter(
                          (c) => (c.percent ?? 0) > 0,
                        )
                        .map((c, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border)]"
                          >
                            <p className="text-sm text-[var(--text)]">
                              {c.description}
                            </p>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                              {c.percent}%
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </>
      )}

      {/* ── Form 16 ── */}
      {subtab === "form16" && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 text-center space-y-3">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
            style={{
              background: "color-mix(in srgb, var(--primary) 12%, transparent)",
              color: "var(--primary)",
            }}
          >
            <FileText size={24} />
          </div>
          <p className="text-sm font-semibold text-[var(--text)]">
            Form 16 — FY 2025-26
          </p>
          <p className="text-xs text-[var(--muted)]">
            Your Form 16 will be available after TDS filing by the employer.
          </p>
          <button
            className="mt-2 px-5 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--primary)" }}
          >
            Download Form 16
          </button>
        </div>
      )}

      {/* ── Tax Report ── */}
      {subtab === "report" && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 text-center space-y-3">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
            style={{
              background: "color-mix(in srgb, var(--primary) 12%, transparent)",
              color: "var(--primary)",
            }}
          >
            <TrendingDown size={24} />
          </div>
          <p className="text-sm font-semibold text-[var(--text)]">
            Tax Computation Report
          </p>
          <p className="text-xs text-[var(--muted)]">
            Detailed tax computation for FY 2025-26
          </p>
          <button
            className="mt-2 px-5 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--primary)" }}
          >
            Download Report
          </button>
        </div>
      )}
    </div>
  );
};
