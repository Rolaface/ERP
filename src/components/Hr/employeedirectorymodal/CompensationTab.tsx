import React, { useState, useCallback, useMemo, useEffect } from "react";
import { ModalSelect } from "../../ui/modal/modalComponent";
import { getAllSalaryStructures } from "../../../api/utils/frappeUtilsApi";
import { getCurrencyList } from "../../../api/lookupApi";
import { useCompanyStore } from "../../../store/companyStore";
import {
  getSalaryStructure,
  type SalaryStructure,
  getAllTaxConfigs,
} from "../../../api/payrollConfigApi";
import SearchSelect2 from "../../ui/modal/SearchSelect2";
import {
  calculateSalary,
  solveBaseFromGross,
  buildCompensationPayload,
  type SalaryComponentDef,
  type SalaryResult,
  type ComponentResult,
} from "./salaryengine";

export { buildCompensationPayload };

type SalaryInputMode = "base" | "gross";

type CompensationTabProps = {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
};

// Display a number exactly as-is — no rounding, no forced decimals
const fmt = (n: number) => n.toLocaleString();

const toNum = (v: any) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

// ─── Salary Mode Toggle ───────────────────────────────────────────────────────

const SalaryModeToggle: React.FC<{
  mode: SalaryInputMode;
  onChange: (m: SalaryInputMode) => void;
}> = ({ mode, onChange }) => (
  <div className="inline-flex items-center rounded-full border border-theme bg-app p-0.5 text-[11px] font-medium select-none">
    {(["base", "gross"] as SalaryInputMode[]).map((m) => (
      <button
        key={m}
        type="button"
        onClick={() => onChange(m)}
        className={`
          px-3 py-1 rounded-full transition-all duration-150 whitespace-nowrap
          ${
            mode === m
              ? "bg-primary text-white shadow-sm"
              : "text-muted hover:text-main"
          }
        `}
      >
        {m === "base" ? "Base salary" : "Gross salary"}
      </button>
    ))}
  </div>
);

// ─── Plain number input ───────────────────────────────────────────────────────

const PlainInput: React.FC<{
  name: string;
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
}> = ({ name, value, onChange, placeholder = "0", disabled = false }) => (
  <>
    <style>{`
      input[data-ns]::-webkit-outer-spin-button,
      input[data-ns]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      input[data-ns] { -moz-appearance: textfield; }
    `}</style>
    <input
      data-ns
      type="number"
      name={name}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="
        w-full h-8 bg-transparent border border-theme rounded-md px-2.5
        text-xs text-main placeholder:text-muted/50
        focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40
        disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-app/60
      "
    />
  </>
);

// ─── Field wrapper ────────────────────────────────────────────────────────────

const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  hint?: string;
}> = ({ label, children, hint }) => (
  <div className="flex flex-col gap-1 min-w-0">
    <label className="text-[11px] font-medium text-muted leading-none truncate">
      {label}
    </label>
    {children}
    {hint && <p className="text-[10px] text-muted/60 leading-tight">{hint}</p>}
  </div>
);

// ─── Derived read-only display ────────────────────────────────────────────────

const DerivedField: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <Field label={label}>
    <div className="h-8 flex items-center px-2.5 rounded-md border border-dashed border-theme bg-app/40">
      <span className="text-xs font-mono text-muted truncate">
        {value || "—"}
      </span>
    </div>
  </Field>
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
      <PlainInput
        name={comp.key}
        value={comp.amount}
        onChange={() => {}}
        disabled
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
  highlight?: boolean;
}> = ({ label, value, variant = "default", topBorder, highlight }) => (
  <div
    className={[
      "flex justify-between items-center py-1 px-1.5 rounded-md",
      topBorder ? "border-t border-theme mt-1 pt-2" : "",
      highlight ? "bg-primary/5" : "",
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
}) => {
  const [componentDefs, setComponentDefs] = useState<SalaryComponentDef[]>([]);
  const [isLoadingStructure, setIsLoadingStructure] = useState(false);
  const [salaryResult, setSalaryResult] = useState<SalaryResult | null>(null);
  const { baseCurrency, currencySymbol } = useCompanyStore();

  const [inputMode, setInputMode] = useState<SalaryInputMode>("base");
  const [activeInput, setActiveInput] = useState<string>("");

  const currency = formData.currency || baseCurrency || "";

  const currencyPrefix = currencySymbol || currency || "";
  const hasComponents = componentDefs.length > 0;

  useEffect(() => {
    if (!formData.currency && baseCurrency) {
      handleInputChange("currency", baseCurrency);
    }
  }, [formData.currency, baseCurrency, handleInputChange]);

  // Sync input field when mode switches
  useEffect(() => {
    setActiveInput(
      inputMode === "base"
        ? String(formData.basicSalary ?? "")
        : String(formData.grossSalary ?? ""),
    );
  }, [inputMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recalculate on input / mode / defs change
  useEffect(() => {
    if (!componentDefs.length) {
      setSalaryResult(null);
      return;
    }
    const inputVal = toNum(activeInput);
    const base =
      inputMode === "base"
        ? inputVal
        : solveBaseFromGross(inputVal, componentDefs);
    const result = calculateSalary(base, componentDefs);
    setSalaryResult(result);
    handleInputChange("basicSalary", String(base));
    handleInputChange("grossSalary", String(result.gross));
    handleInputChange("_salaryResult", result);
  }, [activeInput, inputMode, componentDefs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load structure on mount when editing an existing record
  useEffect(() => {
    if (formData.salaryStructure && !componentDefs.length) {
      loadStructure(formData.salaryStructure);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadStructure = async (value: string) => {
    setIsLoadingStructure(true);
    setComponentDefs([]);
    setSalaryResult(null);
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

  const handleModeChange = useCallback(
    (newMode: SalaryInputMode) => {
      setInputMode(newMode);
      if (newMode === "gross" && salaryResult)
        setActiveInput(String(salaryResult.gross));
      else if (newMode === "base" && salaryResult)
        setActiveInput(String(salaryResult.resolvedBase));
    },
    [salaryResult],
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

  // Currency-prefixed display — no rounding applied
  const cur = (n: number) => `${currencyPrefix} ${fmt(n)}`.trim();

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full flex flex-col gap-2">
      {/* ── Row 1: 4-col settings bar ── */}
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
              onChange={(val: any) =>
                handleInputChange(
                  "Taxslab",
                  typeof val === "string" ? val : val?.value || "",
                )
              }
            />
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

      {/* ── Row 2: Salary input + toggle ── */}
      <div className="bg-card rounded-lg border border-theme px-3 py-2.5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-medium text-muted uppercase tracking-wide">
            Monthly salary
          </span>
          <SalaryModeToggle mode={inputMode} onChange={handleModeChange} />
        </div>

        <div className="grid grid-cols-2 gap-3 items-start">
          <Field
            label={
              inputMode === "base"
                ? "Base salary / month"
                : "Gross salary / month"
            }
          >
            <PlainInput
              name={inputMode === "base" ? "basicSalary" : "grossSalary"}
              value={activeInput}
              onChange={setActiveInput}
              placeholder={inputMode === "base" ? "e.g. 50,000" : "e.g. 77,500"}
            />
          </Field>

          <DerivedField
            label={
              inputMode === "base"
                ? "Derived gross / month"
                : "Derived base / month"
            }
            value={
              salaryResult
                ? cur(
                    inputMode === "base"
                      ? salaryResult.gross
                      : salaryResult.resolvedBase,
                  )
                : "—"
            }
          />
        </div>

        {isLoadingStructure && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-muted">Loading components…</span>
          </div>
        )}
      </div>

      {/* ── Row 3: Components + Summary ── */}
      {!isLoadingStructure && hasComponents && salaryResult && (
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
                variant={inputMode === "base" ? "dimmed" : "default"}
                highlight={inputMode === "gross"}
              />
              <SummaryRow
                label="Gross (monthly)"
                value={cur(salaryResult.gross)}
                variant={inputMode === "gross" ? "dimmed" : "default"}
                highlight={inputMode === "base"}
              />
              <SummaryRow
                label="Gross (annual)"
                value={cur(salaryResult.gross * 12)}
                variant="dimmed"
              />
              {salaryResult.deductionsTotal > 0 && (
                <SummaryRow
                  label="Deductions (monthly)"
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
      {!isLoadingStructure && !hasComponents && !formData.salaryStructure && (
        <div className="bg-card rounded-lg border border-dashed border-theme p-6 text-center">
          <p className="text-xs text-muted">
            Select a salary structure above to view and configure components.
          </p>
        </div>
      )}

      {!isLoadingStructure && !hasComponents && formData.salaryStructure && (
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
