import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { ModalSelect } from "../../ui/modal/modalComponent";
import { getAllSalaryStructures } from "../../../api/utils/frappeUtilsApi";
import { getCurrencyList } from "../../../api/lookupApi";
import { useCompanyStore } from "../../../store/companyStore";
import {
  getSalaryStructure,
  getTaxConfig,
  type SalaryStructure,
  type TaxConfig,
  getAllTaxConfigs,
} from "../../../api/payrollConfigApi";
import SearchSelect2 from "../../ui/modal/SearchSelect2";
import { NumericInput } from "../../ui/modal/modalComponent";
import {
  calculateSalary,
  solveBaseFromGross,
  buildCompensationPayload,
  type SalaryComponentDef,
  type SalaryResult,
  type ComponentResult,
} from "./salaryengine";
import DatePickerInput from "../../calendar/DatePickerInput";

export { buildCompensationPayload };

// ─── Types ────────────────────────────────────────────────────────────────────

type CompensationTabProps = {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
  isEditMode?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString();

const toNum = (v: any): number => {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : parseFloat(v);
  return isNaN(n) ? 0 : n;
};

// ─── Field wrapper ────────────────────────────────────────────────────────────

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex flex-col gap-1 min-w-0 w-full">
    <label className="text-[11px] font-medium text-muted leading-none truncate">
      {label}
    </label>
    {children}
  </div>
);

// ─── Component row ────────────────────────────────────────────────────────────
// Uses flex instead of table so truncation works naturally without max-w-0 hacks.

const CompRow: React.FC<{ comp: ComponentResult }> = ({ comp }) => {
  const [expanded, setExpanded] = useState(false);
  const hasLongFormula =
    comp.isFormula && comp.formula && comp.formula.length > 40;

  return (
    <div className="flex items-start gap-2 border-b border-theme/30 last:border-0 hover:bg-app/40 transition-colors py-1.5 min-w-0">
      {/* Left: name + formula */}
      <div className="flex-1 min-w-0 pl-2 pr-1">
        <p className="text-xs text-main leading-tight truncate" title={comp.name}>
          {comp.name}
        </p>
        {comp.isFormula && comp.formula && (
          <div className="mt-0.5">
            {hasLongFormula ? (
              <>
                <p
                  className={`text-[10px] text-muted/70 font-mono leading-snug break-all ${
                    expanded ? "" : "line-clamp-1"
                  }`}
                  title={comp.formula}
                >
                  = {comp.formula}
                </p>
                <button
                  type="button"
                  onClick={() => setExpanded((p) => !p)}
                  className="text-[9px] text-primary/70 hover:text-primary mt-0.5 leading-none focus:outline-none"
                >
                  {expanded ? "show less" : "show more"}
                </button>
              </>
            ) : (
              <p
                className="text-[10px] text-muted/70 font-mono leading-none truncate"
                title={comp.formula}
              >
                = {comp.formula}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right: amount input — fixed width so it never shrinks */}
      <div className="w-28 shrink-0 pr-2">
        <NumericInput
          name={comp.key}
          value={comp.amount}
          onChange={() => {}}
          disabled
          decimalScale={2}
          className="w-full h-8 !text-xs !px-2.5"
        />
      </div>
    </div>
  );
};

// ─── Summary row ─────────────────────────────────────────────────────────────

const SummaryRow: React.FC<{
  label: string;
  value: string;
  variant?: "default" | "accent" | "negative" | "dimmed";
  topBorder?: boolean;
}> = ({ label, value, variant = "default", topBorder }) => (
  <div
    className={[
      "flex justify-between items-center gap-2 py-1 px-1.5 rounded-md min-w-0",
      topBorder ? "border-t border-theme mt-1 pt-2" : "",
    ].join(" ")}
  >
    <span
      className={`text-xs leading-tight shrink-0 ${
        variant === "dimmed" ? "text-muted" : "text-main"
      }`}
    >
      {label}
    </span>
    <span
      className={`text-xs font-medium tabular-nums text-right min-w-0 truncate ${
        variant === "accent"
          ? "text-primary font-semibold"
          : variant === "negative"
            ? "text-red-500 dark:text-red-400"
            : variant === "dimmed"
              ? "text-muted"
              : "text-main"
      }`}
    >
      {value}
    </span>
  </div>
);

// ─── Section label ────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{
  children: React.ReactNode;
  color: "emerald" | "red";
}> = ({ children, color }) => (
  <div className="pt-2 pb-0.5 pl-2">
    <span
      className={`text-[10px] font-semibold uppercase tracking-widest ${
        color === "emerald"
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-500 dark:text-red-400"
      }`}
    >
      {children}
    </span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const CompensationTab: React.FC<CompensationTabProps> = ({
  formData,
  handleInputChange,
  isEditMode = false,
}) => {
  const [componentDefs, setComponentDefs] = useState<SalaryComponentDef[]>([]);
  const [isLoadingStructure, setIsLoadingStructure] = useState(false);
  const [isLoadingTax, setIsLoadingTax] = useState(false);
  const [salaryResult, setSalaryResult] = useState<SalaryResult | null>(null);
  const [taxConfig, setTaxConfig] = useState<TaxConfig | null>(null);
  const { baseCurrency, currencySymbol } = useCompanyStore();

  // Stable ref for handleInputChange — prevents effect re-fires on parent re-render
  const handleInputChangeRef = useRef(handleInputChange);
  useEffect(() => {
    handleInputChangeRef.current = handleInputChange;
  });
  const stableHandleInputChange = useCallback(
    (field: string, value: any) => handleInputChangeRef.current(field, value),
    [],
  );

  // Track which field the user is actively typing in
  const activeField = useRef<"base" | "gross" | null>(null);

  const [baseInput, setBaseInput] = useState<number | null>(
    toNum(formData.basicSalary) || null,
  );
  const [grossInput, setGrossInput] = useState<number | null>(
    toNum(formData.grossSalary) || null,
  );
  const initialSalaryRef = useRef({
    base: toNum(formData.basicSalary),
    gross: toNum(formData.grossSalary),
    structure: formData.salaryStructure || "",
  });

  const [computedGross, setComputedGross] = useState<number | null>(null);
  const [computedBase, setComputedBase] = useState<number | null>(null);

  const currency = formData.currency || baseCurrency || "";
  const currencyPrefix = currencySymbol || currency || "";
  const hasComponents = componentDefs.length > 0;
  const cur = (n: number) => `${currencyPrefix} ${fmt(n)}`.trim();

  // ── Seed currency once on mount ───────────────────────────────────────────
  useEffect(() => {
    if (!formData.currency && baseCurrency) {
      stableHandleInputChange("currency", baseCurrency);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Seed effectiveFrom from dateOfJoining once on mount (add mode only) ──
  useEffect(() => {
    if (!isEditMode && formData.dateOfJoining && !formData.effectiveFrom) {
      stableHandleInputChange("effectiveFrom", formData.dateOfJoining);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load structure + tax on mount when editing existing record ────────────
  useEffect(() => {
    if (formData.salaryStructure && !componentDefs.length) {
      loadStructure(formData.salaryStructure);
    }
    if (formData.Taxslab && !taxConfig) {
      loadTaxConfig(formData.Taxslab);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Recalc when BASE changes ──────────────────────────────────────────────
  useEffect(() => {
    if (!componentDefs.length) return;
    if (activeField.current === "gross") return;
    const base = toNum(baseInput);
    const result = calculateSalary(base, componentDefs, {}, taxConfig);
    setSalaryResult(result);
    setComputedGross(result.gross);
    stableHandleInputChange("basicSalary", String(base));
    stableHandleInputChange("grossSalary", String(result.gross));
    stableHandleInputChange("_salaryResult", result);
  }, [baseInput, componentDefs, taxConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Recalc when GROSS changes ─────────────────────────────────────────────
  useEffect(() => {
    if (!componentDefs.length) return;
    if (activeField.current === "base") return;
    const gross = toNum(grossInput);
    const base = solveBaseFromGross(gross, componentDefs, 0.01, 60, taxConfig);
    const result = calculateSalary(base, componentDefs, {}, taxConfig);
    setSalaryResult(result);
    setComputedBase(base);
    stableHandleInputChange("basicSalary", String(base));
    stableHandleInputChange("grossSalary", String(gross));
    stableHandleInputChange("_salaryResult", result);
  }, [grossInput, componentDefs, taxConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── When structure first loads, seed from existing base ──────────────────
  useEffect(() => {
    if (!componentDefs.length) return;
    const base = toNum(baseInput);
    if (!base) return;
    const result = calculateSalary(base, componentDefs, {}, taxConfig);
    setSalaryResult(result);
    setComputedGross(result.gross);
    setGrossInput(result.gross);
    setComputedBase(null);
  }, [componentDefs]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-run calc when tax config changes ──────────────────────────────────
  useEffect(() => {
    if (!componentDefs.length || taxConfig === undefined) return;
    const base = toNum(baseInput);
    if (!base) return;
    const result = calculateSalary(base, componentDefs, {}, taxConfig);
    setSalaryResult(result);
    setComputedGross(result.gross);
    stableHandleInputChange("_salaryResult", result);
    stableHandleInputChange("grossSalary", String(result.gross));
  }, [taxConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Propagate salaryChanged flag ──────────────────────────────────────────
  const salaryChanged =
    isEditMode &&
    (toNum(baseInput) !== initialSalaryRef.current.base ||
      toNum(grossInput) !== initialSalaryRef.current.gross ||
      formData.salaryStructure !== initialSalaryRef.current.structure);

  useEffect(() => {
    stableHandleInputChange("_salaryChanged", salaryChanged);
  }, [salaryChanged]);

  // ─────────────────────────────────────────────────────────────────────────

  const loadTaxConfig = async (name: string) => {
    setIsLoadingTax(true);
    try {
      const config = await getTaxConfig(name);
      setTaxConfig(config);
    } catch (err) {
      console.error("Failed to load tax config:", err);
      setTaxConfig(null);
    } finally {
      setIsLoadingTax(false);
    }
  };

  const loadStructure = async (value: string) => {
    setIsLoadingStructure(true);
    setComponentDefs([]);
    setSalaryResult(null);
    setComputedGross(null);
    setComputedBase(null);
    try {
      const structure: SalaryStructure = await getSalaryStructure(value);
      const defs: SalaryComponentDef[] = [
        ...(structure.earnings ?? []).map((row) => ({
          ...row,
          amount: row.amount ?? 0,
          type: "Earning" as const,
          salary_component_abbr: row.salary_component_abbr ?? row.abbr ?? "",
        })),
        ...(structure.deductions ?? []).map((row) => ({
          ...row,
          amount: row.amount ?? 0,
          type: "Deduction" as const,
          salary_component_abbr: row.salary_component_abbr ?? row.abbr ?? "",
        })),
      ];
      setComponentDefs(defs);
    } catch (err) {
      console.error("Failed to load salary structure:", err);
    } finally {
      setIsLoadingStructure(false);
    }
  };

  const handleSalaryStructureChange = useCallback(
    (val: any) => {
      const value = typeof val === "string" ? val : val?.value;
      if (!value) return;
      stableHandleInputChange("salaryStructure", value);
      loadStructure(value);
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleTaxSlabChange = useCallback(
    (val: any) => {
      const value = typeof val === "string" ? val : val?.value || "";
      stableHandleInputChange("Taxslab", value);
      if (value) {
        loadTaxConfig(value);
      } else {
        setTaxConfig(null);
      }
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const fetchCurrencyOptions = async (q: string) => {
    const list = await getCurrencyList({ search: q, page: 1, page_size: 20 });
    return (list || []).map((c: any) => ({
      label: `${c.name}${c.symbol ? ` (${c.symbol})` : ""}`,
      value: c.name,
    }));
  };

  const { earningRows, deductionRows } = useMemo(
    () => ({
      earningRows:
        salaryResult?.components.filter((c) => c.type === "Earning") ?? [],
      deductionRows:
        salaryResult?.components.filter((c) => c.type === "Deduction") ?? [],
    }),
    [salaryResult],
  );

  const shownBase = activeField.current === "gross" ? computedBase : baseInput;
  const shownGross =
    activeField.current === "base" ? computedGross : grossInput;

  const isLoading = isLoadingStructure || isLoadingTax;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full flex flex-col gap-2 min-w-0">

      {/* ── Row 1: Settings bar ────────────────────────────────────────────── */}
      {/* 
        Responsive grid:
        - xs (<640px):  2 columns (structure + tax on row1, currency + payment on row2)
        - sm (≥640px):  2 columns
        - lg (≥1024px): 4 columns all in one row
      */}
      <div className="bg-card rounded-lg border border-theme px-3 py-2.5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <Field label="Salary structure">
            <SearchSelect2
              label=""
              value={formData.salaryStructure}
              placeholder="Select structure…"
              fetchOptions={getAllSalaryStructures}
              onChange={handleSalaryStructureChange}
            />
          </Field>

          <Field label="Tax slab">
            <div className="relative min-w-0">
              <SearchSelect2
                label=""
                value={formData.Taxslab}
                placeholder="Select tax slab…"
                fetchOptions={async (q: string) => {
                  const res = await getAllTaxConfigs(0, 20, q);
                  return (res.data || []).map((item: any) => ({
                    label: item.name,
                    value: item.name,
                  }));
                }}
                onChange={handleTaxSlabChange}
              />
              {isLoadingTax && (
                <div className="absolute right-7 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </Field>

          <Field label="Currency">
            <SearchSelect2
              label=""
              value={formData.currency}
              placeholder="Search currency…"
              fetchOptions={fetchCurrencyOptions}
              onChange={(val: any) =>
                stableHandleInputChange(
                  "currency",
                  typeof val === "string" ? val : val?.value,
                )
              }
            />
          </Field>

          <Field label="Payment mode">
            <ModalSelect
              label=""
              name="paymentMethod"
              value={formData.paymentMethod || ""}
              onChange={(e) =>
                stableHandleInputChange("paymentMethod", e.target.value)
              }
              options={[
                { label: "Bank", value: "Bank" },
                { label: "Cash", value: "Cash" },
                { label: "Check", value: "Check" },
              ]}
            />
          </Field>
        </div>
      </div>

      {/* ── Row 2: Salary inputs ───────────────────────────────────────────── */}
      {/*
        Responsive grid:
        - xs (<640px):  1 column stacked
        - sm (≥640px):  3 columns
      */}
      <div className="bg-card rounded-lg border border-theme px-3 py-2.5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-medium text-muted uppercase tracking-wide">
            Monthly salary
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
          <Field label="Effective from">
            <DatePickerInput
              name="effectiveFrom"
              value={formData.effectiveFrom || ""}
              required={salaryChanged}
              disabled={!isEditMode}
              onChange={(name, value) => stableHandleInputChange(name, value)}
            />
          </Field>

          <Field label="Base salary / month">
            <div
              onFocus={() => { activeField.current = "base"; }}
              onBlur={() => { activeField.current = null; }}
            >
              <NumericInput
                name="basicSalary"
                value={shownBase}
                onChange={(val) => setBaseInput(val)}
                placeholder="e.g. 50,000"
                decimalScale={2}
                allowNegative={false}
                className="w-full h-8 !text-xs !px-2.5"
              />
            </div>
          </Field>

          <Field label="Gross salary / month">
            <div
              onFocus={() => { activeField.current = "gross"; }}
              onBlur={() => { activeField.current = null; }}
            >
              <NumericInput
                name="grossSalary"
                value={shownGross}
                onChange={(val) => setGrossInput(val)}
                placeholder="e.g. 77,500"
                decimalScale={2}
                allowNegative={false}
                className="w-full h-8 !text-xs !px-2.5"
              />
            </div>
          </Field>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-muted">
              {isLoadingStructure
                ? "Loading components…"
                : "Loading tax config…"}
            </span>
          </div>
        )}
      </div>

      {/* ── Row 3: Components + Summary ───────────────────────────────────── */}
      {/*
        Responsive grid:
        - xs (<768px):  1 column — components above, summary below
        - md (≥768px):  2 columns side by side
        Both panels are overflow-safe with min-w-0.
      */}
      {!isLoading && hasComponents && salaryResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 min-w-0">

          {/* ── Components panel ── */}
          <div className="bg-card rounded-lg border border-theme px-3 py-2.5 min-w-0 overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-muted uppercase tracking-wide">
                Components
              </span>
            </div>

            {/* Column headers — flex mirrors CompRow layout */}
            <div className="flex items-center gap-2 border-b border-theme pb-1.5">
              <div className="flex-1 min-w-0 pl-2">
                <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
                  Component
                </span>
              </div>
              <div className="w-28 shrink-0 pr-2">
                <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
                  Amount
                </span>
              </div>
            </div>

            {/* Earnings section */}
            {earningRows.length > 0 && (
              <div>
                <SectionLabel color="emerald">Earnings</SectionLabel>
                {earningRows.map((c) => (
                  <CompRow key={c.key} comp={c} />
                ))}
              </div>
            )}

            {/* Deductions section */}
            {deductionRows.length > 0 && (
              <div>
                <SectionLabel color="red">Deductions</SectionLabel>
                {deductionRows.map((c) => (
                  <CompRow key={c.key} comp={c} />
                ))}
              </div>
            )}
          </div>

          {/* ── Summary panel ── */}
          <div className="bg-card rounded-lg border border-theme px-3 py-2.5 min-w-0 overflow-hidden">
            <span className="text-[11px] font-medium text-muted uppercase tracking-wide block mb-2">
              Summary
            </span>

            <div className="min-w-0">
              <SummaryRow
                label="Monthly base"
                value={cur(salaryResult.resolvedBase)}
              />
              <SummaryRow
                label="Gross (monthly)"
                value={cur(salaryResult.gross)}
              />
              <SummaryRow
                label="Gross (annual)"
                value={cur(salaryResult.gross * 12)}
                variant="dimmed"
              />
              {taxConfig && salaryResult.monthlyTax > 0 && (
                <SummaryRow
                  label="Income tax (monthly)"
                  value={`− ${cur(salaryResult.monthlyTax)}`}
                  variant="negative"
                />
              )}
              {taxConfig && salaryResult.annualTax > 0 && (
                <SummaryRow
                  label="Income tax (annual)"
                  value={cur(salaryResult.annualTax)}
                  variant="dimmed"
                />
              )}
              {salaryResult.deductionsTotal > 0 && (
                <SummaryRow
                  label="Total deductions"
                  value={`− ${cur(salaryResult.deductionsTotal)}`}
                  variant="negative"
                />
              )}
              <SummaryRow
                label="Net pay (monthly)"
                value={cur(salaryResult.net)}
                variant="accent"
                topBorder
              />
              <SummaryRow
                label="Net pay (annual)"
                value={cur(salaryResult.net * 12)}
                variant="dimmed"
              />
            </div>

            {/* Gross / Net highlight tiles */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-md p-2 text-center min-w-0">
                <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5 truncate">
                  Gross / month
                </p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
                  {fmt(salaryResult.gross)}
                </p>
              </div>
              <div className="bg-primary/5 rounded-md p-2 text-center min-w-0">
                <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5 truncate">
                  Net / month
                </p>
                <p className="text-sm font-bold text-primary tabular-nums truncate">
                  {fmt(salaryResult.net)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty states ─────────────────────────────────────────────────── */}
      {!isLoading && !hasComponents && !formData.salaryStructure && (
        <div className="bg-card rounded-lg border border-dashed border-theme p-6 text-center">
          <p className="text-xs text-muted">
            Select a salary structure above to view and configure components.
          </p>
        </div>
      )}
      {!isLoading && !hasComponents && formData.salaryStructure && (
        <div className="bg-card rounded-lg border border-theme p-5 text-center">
          <p className="text-xs text-muted italic">
            No components found in this structure.
          </p>
        </div>
      )}
    </div>
  );
};

export default CompensationTab;