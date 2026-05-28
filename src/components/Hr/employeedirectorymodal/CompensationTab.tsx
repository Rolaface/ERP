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

type CompensationTabProps = {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
  isEditMode?: boolean;
};
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
  <div className="flex flex-col gap-1 min-w-0">
    <label className="text-[11px] font-medium text-muted leading-none truncate">
      {label}
    </label>
    {children}
  </div>
);

// ─── Component row ────────────────────────────────────────────────────────────

const CompRow: React.FC<{ comp: ComponentResult }> = ({ comp }) => (
  <tr className="border-b border-theme/30 last:border-0 hover:bg-app/40 transition-colors">
    <td className="py-1.5 pl-2 pr-1 w-[55%]">
      <p className="text-xs text-main leading-tight truncate">{comp.name}</p>
      {comp.isFormula && comp.formula && (
        <p className="text-[10px] text-muted/70 font-mono leading-none mt-0.5 truncate">
          = {comp.formula}
        </p>
      )}
    </td>
    <td className="py-1.5 pr-2 pl-1 w-[45%]">
      <NumericInput
        name={comp.key}
        value={comp.amount}
        onChange={() => {}}
        disabled
        decimalScale={2}
        className="w-full h-8 !text-xs !px-2.5"
      />
    </td>
  </tr>
);

// ─── Summary row ─────────────────────────────────────────────────────────────

const SummaryRow: React.FC<{
  label: string;
  value: string;
  variant?: "default" | "accent" | "negative" | "dimmed";
  topBorder?: boolean;
}> = ({ label, value, variant = "default", topBorder }) => (
  <div
    className={[
      "flex justify-between items-center py-1 px-1.5 rounded-md",
      topBorder ? "border-t border-theme mt-1 pt-2" : "",
    ].join(" ")}
  >
    <span
      className={`text-xs leading-tight ${variant === "dimmed" ? "text-muted" : "text-main"}`}
    >
      {label}
    </span>
    <span
      className={`text-xs font-medium tabular-nums ${
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

  // Track which field user is typing in — prevents recalc stomping active input
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
  // Derived values shown in the non-active field
  const [computedGross, setComputedGross] = useState<number | null>(null);
  const [computedBase, setComputedBase] = useState<number | null>(null);

  const currency = formData.currency || baseCurrency || "";
  const currencyPrefix = currencySymbol || currency || "";
  const hasComponents = componentDefs.length > 0;
  const cur = (n: number) => `${currencyPrefix} ${fmt(n)}`.trim();

  useEffect(() => {
    if (!formData.currency && baseCurrency) {
      handleInputChange("currency", baseCurrency);
    }
  }, [formData.currency, baseCurrency, handleInputChange]);

  // Load structure on mount if editing existing record
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
    handleInputChange("basicSalary", String(base));
    handleInputChange("grossSalary", String(result.gross));
    handleInputChange("_salaryResult", result);
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
    handleInputChange("basicSalary", String(base));
    handleInputChange("grossSalary", String(gross));
    handleInputChange("_salaryResult", result);
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

  // ── Re-run calc when tax config changes (tax slab selected/changed) ───────
  useEffect(() => {
    if (!componentDefs.length || taxConfig === undefined) return;
    // Re-run from whichever input was last active
    const base = toNum(baseInput);
    if (!base) return;
    const result = calculateSalary(base, componentDefs, {}, taxConfig);
    setSalaryResult(result);
    setComputedGross(result.gross);
    handleInputChange("_salaryResult", result);
    handleInputChange("grossSalary", String(result.gross));
  }, [taxConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  //Auto lOad the effictive date when employee on boarding

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
      handleInputChange("salaryStructure", value);
      loadStructure(value);
    },
    [handleInputChange], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleTaxSlabChange = useCallback(
    (val: any) => {
      const value = typeof val === "string" ? val : val?.value || "";
      handleInputChange("Taxslab", value);
      if (value) {
        loadTaxConfig(value);
      } else {
        // Tax slab cleared — remove tax from calculation
        setTaxConfig(null);
      }
    },
    [handleInputChange],
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

  const salaryChanged =
    isEditMode &&
    (toNum(baseInput) !== initialSalaryRef.current.base ||
      toNum(grossInput) !== initialSalaryRef.current.gross ||
      formData.salaryStructure !== initialSalaryRef.current.structure);
  useEffect(() => {
    if (!isEditMode && formData.dateOfJoining && !formData.effectiveFrom) {
      handleInputChange("effectiveFrom", formData.dateOfJoining);
    }
  }, [
    isEditMode,
    formData.dateOfJoining,
    formData.effectiveFrom,
    handleInputChange,
  ]);
  useEffect(() => {
    handleInputChange("_salaryChanged", salaryChanged);
  }, [salaryChanged, handleInputChange]);
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full flex flex-col gap-2">
      {/* ── Row 1: settings bar ── */}
      <div className="bg-card rounded-lg border border-theme px-3 py-2.5">
        <div className="grid grid-cols-4 gap-3 items-end">
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
            <div className="relative">
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
                <div className="absolute right-7 top-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* {taxConfig && !isLoadingTax && (
              <p className="text-[10px] text-primary/70 leading-tight mt-0.5">
                {taxConfig.slabs?.length ?? 0} slabs
                {taxConfig.standard_tax_exemption_amount
                  ? ` · ₹${taxConfig.standard_tax_exemption_amount.toLocaleString()} exemption`
                  : ""}
              </p>
            )} */}
          </Field>

          <Field label="Currency">
            <SearchSelect2
              label=""
              value={formData.currency}
              placeholder="Search currency…"
              fetchOptions={fetchCurrencyOptions}
              onChange={(val: any) =>
                handleInputChange(
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
                handleInputChange("paymentMethod", e.target.value)
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

      {/* ── Row 2: Dual salary inputs ── */}
      <div className="bg-card rounded-lg border border-theme px-3 py-2.5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-medium text-muted uppercase tracking-wide">
            Monthly salary
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 items-start">
          <Field label="Effective from">
            <DatePickerInput
              name="effectiveFrom"
              value={formData.effectiveFrom || ""}
              required={salaryChanged}
              disabled={!isEditMode}
              onChange={(name, value) => handleInputChange(name, value)}
            />
          </Field>
          <Field label="Base salary / month">
            <div
              onFocus={() => {
                activeField.current = "base";
              }}
              onBlur={() => {
                activeField.current = null;
              }}
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
              onFocus={() => {
                activeField.current = "gross";
              }}
              onBlur={() => {
                activeField.current = null;
              }}
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

      {/* ── Row 3: Components + Summary ── */}
      {!isLoading && hasComponents && salaryResult && (
        <div className="grid grid-cols-2 gap-2">
          {/* Components panel */}
          <div className="bg-card rounded-lg border border-theme px-3 py-2.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-muted uppercase tracking-wide">
                Components
              </span>
              {currency && (
                <span className="text-[10px] text-muted/60 font-mono">
                  {currency}
                </span>
              )}
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-theme">
                  <th className="text-left text-[10px] font-medium text-muted uppercase tracking-wider pb-1.5 pl-2 w-[55%]">
                    Component
                  </th>
                  <th className="text-left text-[10px] font-medium text-muted uppercase tracking-wider pb-1.5 pr-2 w-[45%]">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {earningRows.length > 0 && (
                  <>
                    <tr>
                      <td colSpan={2} className="pt-2 pb-0.5 pl-2">
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                          Earnings
                        </span>
                      </td>
                    </tr>
                    {earningRows.map((c) => (
                      <CompRow key={c.key} comp={c} />
                    ))}
                  </>
                )}
                {deductionRows.length > 0 && (
                  <>
                    <tr>
                      <td colSpan={2} className="pt-2 pb-0.5 pl-2">
                        <span className="text-[10px] font-semibold text-red-500 dark:text-red-400 uppercase tracking-widest">
                          Deductions
                        </span>
                      </td>
                    </tr>
                    {deductionRows.map((c) => (
                      <CompRow key={c.key} comp={c} />
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary panel */}
          <div className="bg-card rounded-lg border border-theme px-3 py-2.5">
            <span className="text-[11px] font-medium text-muted uppercase tracking-wide block mb-2">
              Summary
            </span>

            <div>
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
              {/* Tax breakdown when slab is applied */}
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

            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-md p-2 text-center">
                <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">
                  Gross / month
                </p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {fmt(salaryResult.gross)}
                </p>
              </div>
              <div className="bg-primary/5 rounded-md p-2 text-center">
                <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">
                  Net / month
                </p>
                <p className="text-sm font-bold text-primary tabular-nums">
                  {fmt(salaryResult.net)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty states ── */}
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
