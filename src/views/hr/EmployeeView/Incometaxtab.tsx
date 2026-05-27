import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  AlertCircle,
  ArrowLeftRight,
  BadgePercent,
  CheckCircle2,
  ChevronDown,
  FileText,
  Info,
  Loader2,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { getAllTaxConfigs, getTaxConfig } from "../../../api/payrollConfigApi";
import type { TaxConfig, TaxSlabRow } from "../../../api/payrollConfigApi";
import { SalarySlipTable } from "../EmployeeManagement/detailtab/Salaryslip";
import type { SalarySlip } from "../EmployeeManagement/detailtab/salarytypes";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IncomeTaxTabProps {
  taxableIncome?: number;
  slips?: SalarySlip[];
  slipsLoading?: boolean;
  currency?: string;
}

type TaxSubtab = "overview" | "form16" | "report";

interface RegimeSnapshot {
  name: string;
  grossSalary: number;
  totalExemptions: number;
  standardDeduction: number;
  taxableIncome: number;
  estimatedAnnualTax: number;
  monthlyTds: number;
  netInHand: number;
  estimatedSavings: number;
}

type RequestStatus = "idle" | "confirm" | "submitting" | "submitted";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const INR = (n: number, currency = "") =>
  `${currency} ${Math.round(Math.abs(n || 0)).toLocaleString("en-IN")}`.trim();

const fmtDate = (date?: string) => {
  if (!date) return "—";
  const p = new Date(date);
  if (isNaN(p.getTime())) return date;
  return p.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeSlabs = (slabs: TaxSlabRow[]) =>
  slabs.map((s, i) => ({
    ...s,
    to_amount:
      s.to_amount === 0 && i === slabs.length - 1
        ? Infinity
        : (s.to_amount ?? Infinity),
  }));

/** Calculate tax due on a given income using slabs */
const calcTaxOnSlabs = (
  income: number,
  slabs: ReturnType<typeof normalizeSlabs>,
): number =>
  slabs.reduce((total, slab) => {
    const from = slab.from_amount ?? 0;
    const to = slab.to_amount ?? Infinity;
    const rate = (slab.percent_deduction ?? 0) / 100;
    if (income <= from) return total;
    const applicable = Math.min(income, to === Infinity ? income : to) - from;
    return total + Math.max(0, applicable) * rate;
  }, 0);

// ─── Small reusable components ────────────────────────────────────────────────

const Divider = () => <div className="border-b border-[var(--border)]" />;

const Tag: React.FC<{
  children: React.ReactNode;
  variant?: "success" | "warning" | "info" | "muted";
}> = ({ children, variant = "muted" }) => {
  const cls = {
    success: "bg-success text-white",
    warning: "bg-warning text-white",
    info: "bg-info text-white",
    muted: "bg-[var(--row-hover)] text-muted",
  }[variant];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}
    >
      {children}
    </span>
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
    {children}
  </p>
);

const MetaValue: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <p className={`text-xs font-semibold text-main ${className}`}>{children}</p>
);

// ─── Progress bar ─────────────────────────────────────────────────────────────

const TaxProgressBar: React.FC<{
  paid: number;
  total: number;
  currency: string;
}> = ({ paid, total, currency }) => {
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const remaining = Math.max(0, total - paid);

  return (
    <div className="card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={13} className="text-primary" />
          <span className="text-xs font-semibold text-main">
            Annual tax progress
          </span>
        </div>
        <span className="text-[11px] text-muted">{pct}% paid</span>
      </div>

      {/* Track */}
      <div
        className="relative h-2 overflow-hidden rounded-full"
        style={{ background: "var(--row-hover)" }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-0.5">
        <div>
          <SectionLabel>Paid</SectionLabel>
          <MetaValue className="text-success">{INR(paid, currency)}</MetaValue>
        </div>
        <div>
          <SectionLabel>Remaining</SectionLabel>
          <MetaValue
            className={remaining > 0 ? "text-warning" : "text-success"}
          >
            {remaining > 0 ? INR(remaining, currency) : "Fully paid"}
          </MetaValue>
        </div>
        <div>
          <SectionLabel>Annual total</SectionLabel>
          <MetaValue>{INR(total, currency)}</MetaValue>
        </div>
      </div>
    </div>
  );
};

// ─── Regime comparison modal ──────────────────────────────────────────────────

const RegimeCard: React.FC<{
  regime: RegimeSnapshot;

  currency: string;
  isCurrent: boolean;
}> = ({ regime, currency, isCurrent }) => {
  const rows: [string, string, string?][] = [
    ["Gross salary", INR(regime.grossSalary, currency)],
    ["Total exemptions", INR(regime.totalExemptions, currency)],
    ["Standard deduction", INR(regime.standardDeduction, currency)],
    ["Taxable income", INR(regime.taxableIncome, currency)],
    [
      "Estimated annual tax",
      INR(regime.estimatedAnnualTax, currency),
      "text-danger",
    ],
    ["Monthly TDS", INR(regime.monthlyTds, currency), "text-warning"],
    [
      "Net in-hand (monthly)",
      INR(regime.netInHand / 12, currency),
      "text-success",
    ],
  ];

  return (
    <div className="flex flex-col rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-main">{regime.name}</p>
          {isCurrent && <Tag variant="muted">Current regime</Tag>}
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 divide-y divide-[var(--border)]">
        {rows.map(([label, value, colorClass]) => (
          <div
            key={label}
            className="flex items-center justify-between px-4 py-2 gap-3"
          >
            <span className="text-[11px] text-muted">{label}</span>
            <span
              className={`text-[11px] font-semibold ${colorClass ?? "text-main"}`}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Savings footer */}
      <div className="px-4 py-2.5 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted">
            Estimated savings vs. other
          </span>
          <span
            className={`text-xs font-bold ${regime.estimatedSavings >= 0 ? "text-success" : "text-danger"}`}
          >
            {regime.estimatedSavings >= 0 ? "+" : "−"}{" "}
            {INR(Math.abs(regime.estimatedSavings), currency)}
          </span>
        </div>
      </div>
    </div>
  );
};

const CompareModal: React.FC<{
  onClose: () => void;
  onRequestChange: () => void;
  oldRegime: RegimeSnapshot;
  newRegime: RegimeSnapshot;
  currency: string;
  currentRegimeName: string;
}> = ({
  onClose,
  onRequestChange,
  oldRegime,
  newRegime,
  currency,
  currentRegimeName,
}) => {
  const recommended =
    oldRegime.estimatedAnnualTax <= newRegime.estimatedAnnualTax
      ? oldRegime.name
      : newRegime.name;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", zIndex: "var(--z-modal)" }}
    >
      <div
        className="bg-card rounded-xl border border-[var(--border)] w-full max-w-2xl flex flex-col"
        style={{ maxHeight: "90vh" }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={16} className="text-primary" />
            <p className="text-sm font-semibold text-main">Regime comparison</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[var(--row-hover)] text-muted transition-colors"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Side by side cards */}
          <div className="grid grid-cols-2 gap-3">
            <RegimeCard
              regime={oldRegime}
              currency={currency}
              isCurrent={currentRegimeName === oldRegime.name}
            />
            <RegimeCard
              regime={newRegime}
              currency={currency}
              isCurrent={currentRegimeName === newRegime.name}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] bg-card px-4 py-1.5 text-xs font-semibold text-muted hover:text-main transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Tax breakdown accordion ──────────────────────────────────────────────────

interface BreakdownItem {
  label: string;
  amount: number;
  icon: React.ReactNode;
}

const TaxBreakdownAccordion: React.FC<{
  currency: string;
  taxableIncome: number;
  exemption: number;
}> = ({ currency, exemption }) => {
  const [open, setOpen] = useState(false);

  const items: BreakdownItem[] = [
    {
      label: "80C Investments",
      amount: Math.round(exemption * 0.45),
      icon: <ShieldCheck size={12} />,
    },
    {
      label: "HRA Exemption",
      amount: Math.round(exemption * 0.25),
      icon: <Wallet size={12} />,
    },
    {
      label: "PF Contribution",
      amount: Math.round(exemption * 0.15),
      icon: <BadgePercent size={12} />,
    },
    { label: "Professional Tax", amount: 2400, icon: <FileText size={12} /> },
    {
      label: "Health Insurance",
      amount: Math.round(exemption * 0.1),
      icon: <ShieldCheck size={12} />,
    },
    {
      label: "Other deductions",
      amount: Math.round(exemption * 0.05),
      icon: <Info size={12} />,
    },
  ];

  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--row-hover)] transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <BadgePercent size={14} className="text-primary" />
          <span className="text-xs font-semibold text-main">
            Tax deduction breakdown
          </span>
          <Tag variant="muted">{INR(total, currency)} total</Tag>
        </div>
        <ChevronDown
          size={14}
          className="text-muted transition-transform"
          style={{ transform: open ? "rotate(180deg)" : undefined }}
        />
      </button>

      {open && (
        <>
          <Divider />
          <div className="divide-y divide-[var(--border)]">
            {items.map(({ label, amount, icon }) => (
              <div
                key={label}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <div className="flex items-center gap-2 text-muted">
                  {icon}
                  <span className="text-[11px]">{label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="h-1 rounded-full bg-primary"
                    style={{
                      width: Math.max(20, Math.round((amount / total) * 80)),
                    }}
                    aria-hidden
                  />
                  <span className="text-[11px] font-semibold text-main w-24 text-right">
                    {INR(amount, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div
            className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border)]"
            style={{ background: "var(--row-hover)" }}
          >
            <span className="text-[11px] font-semibold text-main">
              Total deductions claimed
            </span>
            <span className="text-[11px] font-bold text-primary">
              {INR(total, currency)}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Current regime card ──────────────────────────────────────────────────────

const CurrentRegimeCard: React.FC<{
  detail: TaxConfig | null;
  summary: ReturnType<typeof buildSummary>;
  onCompare: () => void;
  onRequestChange: () => void;
}> = ({ detail, summary, onCompare, onRequestChange }) => {
  const monthlyTds = Math.round(summary.totalTax / 12);
  const monthlyGross = Math.round(summary.totalIncome / 12);
  const monthlyNet = Math.round((summary.totalIncome - summary.totalTax) / 12);

  const tiles: [string, string, string][] = [
    ["Total tax paid", INR(summary.taxPaid, summary.currency), "text-success"],
    [
      "Remaining tax",
      INR(Math.max(0, summary.balance), summary.currency),
      summary.balance > 0 ? "text-warning" : "text-success",
    ],
    ["Monthly TDS", INR(monthlyTds, summary.currency), "text-danger"],
    [
      "Est. annual tax",
      INR(summary.totalTax, summary.currency),
      "text-warning",
    ],
    ["Monthly gross", INR(monthlyGross, summary.currency), "text-main"],
    ["Monthly net in-hand", INR(monthlyNet, summary.currency), "text-success"],
  ];

  return (
    <div className="card overflow-hidden">
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-primary" />
          <p className="text-sm font-semibold text-main">Current tax regime</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onCompare}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-card px-3 py-1.5 text-xs font-semibold text-muted hover:text-main transition-colors"
          >
            <ArrowLeftRight size={12} />
            Compare regimes
          </button>
        </div>
      </div>

      {/* Meta strip */}
      <div className="grid grid-cols-4 divide-x divide-[var(--border)] border-b border-[var(--border)]">
        {[
          ["Regime", detail?.name ?? "—"],
          ["Financial year", "2025–26"],
          ["Effective from", fmtDate(detail?.effective_from)],
          [
            "Exemption",
            INR(detail?.standard_tax_exemption_amount ?? 0, summary.currency),
          ],
        ].map(([label, value]) => (
          <div key={label} className="px-4 py-2.5">
            <SectionLabel>{label}</SectionLabel>
            <MetaValue>{value}</MetaValue>
          </div>
        ))}
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-3 divide-x divide-[var(--border)] sm:grid-cols-6">
        {tiles.map(([label, value, cls]) => (
          <div key={label} className="px-3 py-3">
            <SectionLabel>{label}</SectionLabel>
            <p className={`text-sm font-semibold mt-0.5 ${cls}`}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Summary builder (pure fn, memoized outside render) ───────────────────────

function buildSummary(
  currency: string,
  detail: TaxConfig | null,
  latestSlip: SalarySlip | undefined,
  slips: SalarySlip[],
  taxableIncome?: number,
) {
  const cur = latestSlip?.currency || currency;
  const totalIncome =
    latestSlip?.gross_year_to_date ||
    slips.reduce((s, sl) => s + (Number(sl.gross_pay) || 0), 0);
  const exemption = detail?.standard_tax_exemption_amount ?? 0;
  const effectiveTaxable =
    taxableIncome !== undefined
      ? taxableIncome
      : latestSlip?.annual_taxable_amount ||
        Math.max(totalIncome - exemption, 0);
  const taxPaid =
    latestSlip?.income_tax_deducted_till_date ||
    slips.reduce(
      (s, sl) =>
        s +
        (Number(sl.current_month_income_tax) ||
          Number(sl.total_income_tax) ||
          0),
      0,
    );
  const totalTax =
    latestSlip?.total_income_tax ||
    (latestSlip?.future_income_tax_deductions ?? 0) + taxPaid ||
    taxPaid;
  const balance = totalTax - taxPaid;
  const otherTax = (detail?.other_taxes_and_charges ?? []).reduce(
    (s, c) => s + (effectiveTaxable * (c.percent ?? 0)) / 100,
    0,
  );
  return {
    currency: cur,
    totalIncome,
    taxableIncome: effectiveTaxable,
    totalTax,
    taxPaid,
    balance,
    otherTax,
  };
}

// ─── Placeholder panel ────────────────────────────────────────────────────────

const PlaceholderPanel: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="card p-10 text-center">
    <div
      className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg text-primary"
      style={{
        background: "color-mix(in srgb, var(--primary) 10%, transparent)",
      }}
    >
      {icon}
    </div>
    <p className="text-sm font-semibold text-main">{title}</p>
    <p className="mt-1 text-xs text-muted">{description}</p>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const IncomeTaxTab: React.FC<IncomeTaxTabProps> = ({
  taxableIncome,
  slips = [],
  slipsLoading = false,
  currency = "",
}) => {
  const [subtab, setSubtab] = useState<TaxSubtab>("overview");
  const [slabList, setSlabList] = useState<TaxConfig[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [detail, setDetail] = useState<TaxConfig | null>(null);
  const [altDetail, setAltDetail] = useState<TaxConfig | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("idle");

  // Load all active configs
  useEffect(() => {
    const load = async () => {
      try {
        setListLoading(true);
        setListError(null);
        const res = await getAllTaxConfigs(0, 50, "");
        const active = (res.data ?? []).filter((c) => Number(c.disabled) !== 1);
        setSlabList(active);
        setSelectedName((cur) => cur || active[0]?.name || "");
      } catch {
        setListError("Failed to load tax configurations.");
      } finally {
        setListLoading(false);
      }
    };
    load();
  }, []);

  // Load current detail
  useEffect(() => {
    if (!selectedName) {
      setDetail(null);
      return;
    }
    const load = async () => {
      try {
        setDetailLoading(true);
        setDetailError(null);
        setDetail(await getTaxConfig(selectedName));
      } catch {
        setDetailError("Failed to load slab details.");
      } finally {
        setDetailLoading(false);
      }
    };
    load();
  }, [selectedName]);

  // Load alternate config for comparison (second in list)
  useEffect(() => {
    const alt = slabList.find((c) => c.name !== selectedName);
    if (!alt) {
      setAltDetail(null);
      return;
    }
    getTaxConfig(alt.name)
      .then(setAltDetail)
      .catch(() => setAltDetail(null));
  }, [slabList, selectedName]);

  const latestSlip = slips[0];

  const summary = useMemo(
    () => buildSummary(currency, detail, latestSlip, slips, taxableIncome),
    [currency, detail, latestSlip, slips, taxableIncome],
  );

  // Build regime snapshots for comparison
  const buildSnapshot = useCallback(
    (cfg: TaxConfig | null, label: string): RegimeSnapshot => {
      if (!cfg)
        return {
          name: label,
          grossSalary: summary.totalIncome,
          totalExemptions: 0,
          standardDeduction: 0,
          taxableIncome: summary.totalIncome,
          estimatedAnnualTax: 0,
          monthlyTds: 0,
          netInHand: summary.totalIncome,
          estimatedSavings: 0,
        };
      const exempt = cfg.standard_tax_exemption_amount ?? 0;
      const deductions = exempt;
      const taxable = Math.max(summary.totalIncome - deductions, 0);
      const slabs = normalizeSlabs(cfg.slabs ?? []);
      const annualTax = calcTaxOnSlabs(taxable, slabs);
      const monthlyTds = Math.round(annualTax / 12);
      const netInHand = summary.totalIncome - annualTax;
      return {
        name: cfg.name,
        grossSalary: summary.totalIncome,
        totalExemptions: exempt,
        standardDeduction: exempt,
        taxableIncome: taxable,
        estimatedAnnualTax: annualTax,
        monthlyTds,
        netInHand,
        estimatedSavings: 0, // filled below
      };
    },
    [summary.totalIncome],
  );

  const oldSnapshot = useMemo(
    () => buildSnapshot(detail, "Old regime"),
    [buildSnapshot, detail],
  );
  const newSnapshot = useMemo(
    () => buildSnapshot(altDetail, "New regime"),
    [buildSnapshot, altDetail],
  );

  // Fill cross-savings
  oldSnapshot.estimatedSavings =
    newSnapshot.estimatedAnnualTax - oldSnapshot.estimatedAnnualTax;
  newSnapshot.estimatedSavings =
    oldSnapshot.estimatedAnnualTax - newSnapshot.estimatedAnnualTax;

  const subtabs: { id: TaxSubtab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "form16", label: "Form 16" },
    { id: "report", label: "Tax report" },
  ];

  return (
    <div className="space-y-3">
      {/* Subtab bar */}
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {subtabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubtab(tab.id)}
            className={`whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
              subtab === tab.id
                ? "bg-primary text-white"
                : "border border-[var(--border)] bg-card text-muted hover:text-main"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subtab === "overview" ? (
        <>
          {/* Loading / error for configs */}
          {listLoading || detailLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted">
              <Loader2 size={14} className="animate-spin" />
              Loading tax details…
            </div>
          ) : listError || detailError ? (
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-danger">
              <AlertCircle size={13} />
              {listError || detailError}
            </div>
          ) : (
            <>
              {/* 1 — Current regime card */}
              <CurrentRegimeCard
                detail={detail}
                summary={summary}
                onCompare={() => setShowCompare(true)}
                onRequestChange={() => {
                  setRequestStatus("idle");
                  setShowRequest(true);
                }}
              />

              {/* 2 — Tax progress */}
              <TaxProgressBar
                paid={summary.taxPaid}
                total={summary.totalTax}
                currency={summary.currency}
              />

              {/* 3 — Breakdown accordion */}
              <TaxBreakdownAccordion
                currency={summary.currency}
                taxableIncome={summary.taxableIncome}
                exemption={detail?.standard_tax_exemption_amount ?? 0}
              />
            </>
          )}

          {/* 4 — Salary slips */}
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-main">Salary slips</h3>
              <span className="text-xs text-muted">
                Payroll history and tax deducted
              </span>
            </div>
            <SalarySlipTable
              slips={slips}
              loading={slipsLoading}
              tableBodyMaxHeight="calc(100vh - 380px)"
            />
          </section>
        </>
      ) : subtab === "form16" ? (
        <PlaceholderPanel
          icon={<FileText size={20} />}
          title="Form 16 not yet available"
          description="Your Form 16 will appear here after TDS filing by your employer — typically after March 31."
        />
      ) : (
        <PlaceholderPanel
          icon={<TrendingDown size={20} />}
          title="Tax computation report"
          description="Detailed tax computation for FY 2025–26 will be available at year end."
        />
      )}

      {/* Compare modal */}
      {showCompare && (
        <CompareModal
          onClose={() => setShowCompare(false)}
          onRequestChange={() => {
            setRequestStatus("idle");
            setShowRequest(true);
          }}
          oldRegime={oldSnapshot}
          newRegime={newSnapshot}
          currency={summary.currency}
          currentRegimeName={selectedName}
        />
      )}
    </div>
  );
};

export default IncomeTaxTab;
