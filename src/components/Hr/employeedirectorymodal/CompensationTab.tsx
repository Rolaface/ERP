import React, { useState, useCallback, useMemo, useEffect } from "react";
import { ModalSelect } from "../../ui/modal/modalComponent";
import { getAllSalaryStructures } from "../../../api/utils/frappeUtilsApi";
import { getCurrencyList } from "../../../api/lookupApi";
import {
  getSalaryStructure,
  type SalaryStructure,
  getAllTaxConfigs,
} from "../../../api/payrollConfigApi";
import SearchSelect2 from "../../ui/modal/SearchSelect2";
import {
  calculateSalary,
  solveBaseFromGross,
  toKey,
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

const fmt = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 2 });
const toNum = (v: any) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

// ─── Salary Mode Toggle ───────────────────────────────────────────────────────

const SalaryModeToggle: React.FC<{
  mode: SalaryInputMode;
  onChange: (m: SalaryInputMode) => void;
}> = ({ mode, onChange }) => (
  <div className="inline-flex items-center rounded-md border border-theme bg-app overflow-hidden text-[11px] font-semibold select-none">
    <button
      type="button"
      onClick={() => onChange("base")}
      className={`
        relative px-3 py-1.5 transition-all duration-200 flex items-center gap-1.5
        ${
          mode === "base"
            ? "bg-primary text-white shadow-sm"
            : "text-muted hover:text-main hover:bg-card"
        }
      `}
    >
      {/* active indicator dot */}
      {mode === "base" && (
        <span className="w-1.5 h-1.5 rounded-full bg-white/70 inline-block" />
      )}
      Base Salary
    </button>
    <button
      type="button"
      onClick={() => onChange("gross")}
      className={`
        relative px-3 py-1.5 transition-all duration-200 flex items-center gap-1.5
        ${
          mode === "gross"
            ? "bg-primary text-white shadow-sm"
            : "text-muted hover:text-main hover:bg-card"
        }
      `}
    >
      {mode === "gross" && (
        <span className="w-1.5 h-1.5 rounded-full bg-white/70 inline-block" />
      )}
      Gross Salary
    </button>
  </div>
);

// ─── Plain number input ───────────────────────────────────────────────────────

const PlainInput: React.FC<{
  name: string;
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}> = ({
  name,
  value,
  onChange,
  placeholder = "0",
  disabled = false,
  className = "",
}) => (
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
      className={`w-full bg-transparent border border-theme rounded px-2 py-1 text-xs text-main
        focus:outline-none focus:ring-1 focus:ring-primary/40
        disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-app ${className}`}
    />
  </>
);

// ─── Derived read-only field ──────────────────────────────────────────────────
// Shown next to the active input to display the derived counter-value

const DerivedBadge: React.FC<{
  label: string;
  value: string;
}> = ({ label, value }) => (
  <div className="flex flex-col justify-center">
    <label className="block text-[11px] font-semibold text-muted mb-1">
      {label}
    </label>
    <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-dashed border-theme bg-app/60 min-h-[28px]">
      <span className="text-xs text-muted font-mono">{value || "—"}</span>
    </div>
  </div>
);

// ─── Component Table ──────────────────────────────────────────────────────────

const ComponentTable: React.FC<{
  sectionLabel: string;
  accentClass: string;
  components: ComponentResult[];
}> = ({ sectionLabel, accentClass, components }) => {
  if (!components.length) return null;
  return (
    <>
      <tr>
        <td
          colSpan={2}
          className={`pt-3 pb-1 px-2 text-[10px] font-bold uppercase tracking-widest border-b border-theme ${accentClass}`}
        >
          {sectionLabel}
        </td>
      </tr>
      {components.map((comp) => (
        <tr
          key={comp.key}
          className="border-b border-theme/30 hover:bg-app/50 transition-colors"
        >
          <td className="py-2 px-2 w-1/2">
            <p className="text-xs text-main font-medium leading-tight">
              {comp.name}
            </p>
            {comp.isFormula && comp.formula && (
              <p className="text-[10px] text-muted font-mono mt-0.5 leading-none">
                = {comp.formula}
              </p>
            )}
          </td>
          <td className="py-1.5 px-2 w-1/2">
            <PlainInput
              name={comp.key}
              value={comp.amount}
              onChange={() => {}}
              disabled
            />
          </td>
        </tr>
      ))}
    </>
  );
};

// ─── Summary Row ──────────────────────────────────────────────────────────────

const SummaryRow: React.FC<{
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
  negative?: boolean;
  dimmed?: boolean;
  topBorder?: boolean;
  highlight?: boolean;
}> = ({
  label,
  value,
  bold,
  accent,
  negative,
  dimmed,
  topBorder,
  highlight,
}) => (
  <div
    className={`
    flex justify-between items-center py-1 rounded transition-colors
    ${topBorder ? "border-t border-theme mt-1 pt-2" : ""}
    ${highlight ? "bg-primary/5 px-1.5 -mx-1.5 rounded" : ""}
  `}
  >
    <span
      className={`text-xs ${dimmed ? "text-muted" : "text-main"} ${bold ? "font-semibold" : ""}`}
    >
      {label}
    </span>
    <span
      className={`text-xs ${bold ? "font-bold" : "font-medium"} ${accent ? "text-primary" : negative ? "text-red-500 dark:text-red-400" : dimmed ? "text-muted" : "text-main"}`}
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

  // The input mode: "base" → user types base, gross derived; "gross" → user types gross, base derived
  const [inputMode, setInputMode] = useState<SalaryInputMode>("base");

  // We store the "active" input value as a local string so the field is controlled
  const [activeInput, setActiveInput] = useState<string>("");

  const currency = formData.currency || "";
  const hasComponents = componentDefs.length > 0;

  // Sync activeInput from formData on mount / structure change
  useEffect(() => {
    if (inputMode === "base") {
      setActiveInput(String(formData.basicSalary ?? ""));
    } else {
      setActiveInput(String(formData.grossSalary ?? ""));
    }
  }, [inputMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recalculate whenever activeInput, mode, or component defs change
  useEffect(() => {
    if (!componentDefs.length) {
      setSalaryResult(null);
      return;
    }

    const inputVal = toNum(activeInput);

    let base: number;
    if (inputMode === "base") {
      base = inputVal;
    } else {
      // Back-solve base from target gross
      base = solveBaseFromGross(inputVal, componentDefs);
    }

    const result = calculateSalary(base, componentDefs);
    setSalaryResult(result);

    // Keep formData in sync
    handleInputChange("basicSalary", String(base));
    handleInputChange("grossSalary", String(result.gross));
    handleInputChange("_salaryResult", result);
  }, [activeInput, inputMode, componentDefs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load structure on mount if already selected (edit mode)
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
    [handleInputChange],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTaxSlabChange = useCallback(
    (val: any) => {
      handleInputChange(
        "Taxslab",
        typeof val === "string" ? val : val?.value || "",
      );
    },
    [handleInputChange],
  );

  const handleModeChange = useCallback(
    (newMode: SalaryInputMode) => {
      setInputMode(newMode);
      // Pre-fill the new input field with the derived value so it's not blank
      if (newMode === "gross" && salaryResult) {
        setActiveInput(String(salaryResult.gross));
      } else if (newMode === "base" && salaryResult) {
        setActiveInput(String(salaryResult.resolvedBase));
      }
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

  // Derived display values
  const derivedBase = salaryResult ? fmt(salaryResult.resolvedBase) : "—";
  const derivedGross = salaryResult ? fmt(salaryResult.gross) : "—";

  return (
    <div className="w-full space-y-3">
      {/* Settings */}
      <div className="bg-card rounded-lg border border-theme p-3 space-y-3">
        <h4 className="text-xs font-semibold text-main uppercase tracking-wide">
          Salary Structure & Settings
        </h4>

        <SearchSelect2
          label="Salary Structure"
          value={formData.salaryStructure}
          placeholder="Select Salary Structure..."
          fetchOptions={getAllSalaryStructures}
          onChange={handleSalaryStructureChange}
        />
        <SearchSelect2
          label="Tax Slab"
          value={formData.Taxslab}
          placeholder="Select tax slab..."
          fetchOptions={async (q: string) => {
            const res = await getAllTaxConfigs(0, 20, q);
            return (res.data || []).map((item: any) => ({
              label: item.name,
              value: item.name,
            }));
          }}
          onChange={handleTaxSlabChange}
        />

        {/* ── Salary input row with toggle ── */}
        <div className="space-y-1.5">
          {/* Toggle header */}
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-semibold text-muted">
              Monthly Salary Input
            </label>
            <SalaryModeToggle mode={inputMode} onChange={handleModeChange} />
          </div>

          {/* Input + derived badge */}
          <div className="grid grid-cols-2 gap-3">
            {/* Active input */}
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                {inputMode === "base"
                  ? "Base Salary / month"
                  : "Gross Salary / month"}
                <span className="ml-1 text-primary">✎</span>
              </label>
              <PlainInput
                name={inputMode === "base" ? "basicSalary" : "grossSalary"}
                value={activeInput}
                onChange={setActiveInput}
                placeholder={
                  inputMode === "base" ? "e.g. 50 000" : "e.g. 75 000"
                }
              />
            </div>

            {/* Derived read-only */}
            <DerivedBadge
              label={
                inputMode === "base"
                  ? "Derived Gross / month"
                  : "Derived Base / month"
              }
              value={
                inputMode === "base"
                  ? salaryResult
                    ? `${currency} ${derivedGross}`
                    : "—"
                  : salaryResult
                    ? `${currency} ${derivedBase}`
                    : "—"
              }
            />
          </div>

          {/* Hint */}
          <p className="text-[10px] text-muted leading-tight">
            {inputMode === "base"
              ? "Enter the base salary — gross and all formula components are derived automatically."
              : "Enter the target gross — the engine back-calculates the exact base salary needed."}
          </p>
        </div>

        {/* Currency + Payment Mode */}
        <div className="grid grid-cols-2 gap-3">
          <SearchSelect2
            label="Currency"
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
          <ModalSelect
            label="Payment Mode"
            name="paymentMethod"
            value={formData.paymentMethod || ""}
            onChange={(e) => handleInputChange("paymentMethod", e.target.value)}
            options={[
              { label: "Bank", value: "Bank" },
              { label: "Cash", value: "Cash" },
              { label: "Check", value: "Check" },
            ]}
          />
        </div>

        {isLoadingStructure && (
          <div className="flex items-center gap-2 py-1">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted">Loading components…</p>
          </div>
        )}
      </div>

      {/* Components + Summary */}
      {!isLoadingStructure && hasComponents && salaryResult && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-lg border border-theme p-3">
            <h4 className="text-xs font-semibold text-main uppercase tracking-wide mb-2">
              Components{" "}
              {currency && (
                <span className="ml-1 normal-case font-normal text-muted">
                  ({currency})
                </span>
              )}
            </h4>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-theme">
                  <th className="text-left text-[10px] font-semibold text-muted uppercase tracking-wider py-1.5 px-2 w-1/2">
                    Component
                  </th>
                  <th className="text-left text-[10px] font-semibold text-muted uppercase tracking-wider py-1.5 px-2 w-1/2">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <ComponentTable
                  sectionLabel="Earnings"
                  accentClass="text-emerald-600 dark:text-emerald-400"
                  components={earningRows}
                />
                <ComponentTable
                  sectionLabel="Deductions"
                  accentClass="text-red-500 dark:text-red-400"
                  components={deductionRows}
                />
              </tbody>
            </table>
          </div>

          <div className="bg-card rounded-lg border border-theme p-3">
            <h4 className="text-xs font-semibold text-main uppercase tracking-wide mb-2">
              Summary
            </h4>
            <div className="space-y-0.5">
              <SummaryRow
                label="Monthly Base"
                value={`${currency} ${fmt(salaryResult.resolvedBase)}`}
                dimmed={inputMode !== "base"}
                bold={inputMode === "base"}
                highlight={inputMode === "gross"} // base is derived in gross mode → highlight it
              />
              <SummaryRow
                label="Gross (Monthly)"
                value={`${currency} ${fmt(salaryResult.gross)}`}
                bold={inputMode === "gross"}
                highlight={inputMode === "base"} // gross is derived in base mode → highlight it
              />
              <SummaryRow
                label="Gross (Annual)"
                value={`${currency} ${fmt(salaryResult.gross * 12)}`}
                dimmed
              />
              {salaryResult.deductionsTotal > 0 && (
                <SummaryRow
                  label="Deductions (Monthly)"
                  value={`− ${currency} ${fmt(salaryResult.deductionsTotal)}`}
                  negative
                />
              )}
              <SummaryRow
                label="Net Pay (Monthly)"
                value={`${currency} ${fmt(salaryResult.net)}`}
                bold
                accent
                topBorder
              />
              <SummaryRow
                label="Net Pay (Annual)"
                value={`${currency} ${fmt(salaryResult.net * 12)}`}
                dimmed
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">
                  Gross / month
                </p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {fmt(salaryResult.gross)}
                </p>
              </div>
              <div className="bg-primary/5 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">
                  Net / month
                </p>
                <p className="text-sm font-bold text-primary">
                  {fmt(salaryResult.net)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoadingStructure && !hasComponents && !formData.salaryStructure && (
        <div className="bg-card rounded-lg border border-dashed border-theme p-8 text-center">
          <p className="text-xs text-muted">
            Select a salary structure above to view and configure components.
          </p>
        </div>
      )}

      {!isLoadingStructure && !hasComponents && formData.salaryStructure && (
        <div className="bg-card rounded-lg border border-theme p-6 text-center">
          <p className="text-xs text-muted italic">
            No components found in this structure.
          </p>
        </div>
      )}
    </div>
  );
};

export default CompensationTab;
