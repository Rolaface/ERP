import React, { useState, useCallback, useMemo, useEffect } from "react";
import { ModalSelect } from "../../ui/modal/modalComponent";
import { getAllSalaryStructures } from "../../../api/utils/frappeUtilsApi";
import { getCurrencyList } from "../../../api/lookupApi";
import {
  getSalaryStructure,
 
  type SalaryStructure,
  
} from "../../../api/payrollConfigApi";
import SearchSelect2 from "../../ui/modal/SearchSelect2";
import { getAllTaxConfigs } from "../../../api/payrollConfigApi";
import {
  calculateSalary,
  toKey,
  buildCompensationPayload,
  type SalaryComponentDef,
  type SalaryResult,
  type ComponentResult,
} from "./salaryengine";

type CompensationTabProps = {
  formData: any;
  handleInputChange: (field: string, value: string | boolean | any) => void;
};

export { buildCompensationPayload };

const fmt = (n: number): string =>
  n.toLocaleString(undefined, { maximumFractionDigits: 2 });

const toNum = (v: any): number => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

// ─── No-spinner number input ──────────────────────────────────────────────────

interface PlainInputProps {
  name: string;
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const PlainInput: React.FC<PlainInputProps> = ({
  name,
  value,
  onChange,
  placeholder = "0",
  disabled = false,
  className = "",
}) => (
  <>
    <style>{`
      input[data-nospinner]::-webkit-outer-spin-button,
      input[data-nospinner]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      input[data-nospinner] { -moz-appearance: textfield; }
    `}</style>
    <input
      data-nospinner
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

// ─── Component Table ──────────────────────────────────────────────────────────

interface ComponentTableProps {
  sectionLabel: string;
  accentClass: string;
  components: ComponentResult[];
  overrides: Record<string, number>;
  onOverrideChange: (key: string, val: string) => void;
}

const ComponentTable: React.FC<ComponentTableProps> = ({
  sectionLabel,
  accentClass,
  components,
  overrides,
  onOverrideChange,
}) => {
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
              value={
                comp.isFormula
                  ? comp.amount
                  : (overrides[comp.key] ?? comp.amount)
              }
              onChange={(val) => onOverrideChange(comp.key, val)}
              disabled={true}
            />
          </td>
        </tr>
      ))}
    </>
  );
};

// ─── Summary Row ──────────────────────────────────────────────────────────────

const SummaryRow = ({
  label,
  value,
  bold = false,
  accent = false,
  negative = false,
  dimmed = false,
  topBorder = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
  negative?: boolean;
  dimmed?: boolean;
  topBorder?: boolean;
}) => (
  <div
    className={`flex justify-between items-center py-1 ${topBorder ? "border-t border-theme mt-1 pt-2" : ""}`}
  >
    <span
      className={`text-xs ${dimmed ? "text-muted" : "text-main"} ${bold ? "font-semibold" : ""}`}
    >
      {label}
    </span>
    <span
      className={`text-xs font-${bold ? "bold" : "medium"} ${
        accent
          ? "text-primary"
          : negative
            ? "text-red-500 dark:text-red-400"
            : dimmed
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
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [salaryResult, setSalaryResult] = useState<SalaryResult | null>(null);

  const base = toNum(formData.basicSalary ?? 0);
  const currency = formData.currency || "";

  // ── Recalculate whenever base / overrides / defs change ─────────────────
  useEffect(() => {
    if (!componentDefs.length) {
      setSalaryResult(null);
      return;
    }
    const result = calculateSalary(base, componentDefs, overrides);
    setSalaryResult(result);
    for (const comp of result.components)
      handleInputChange(comp.key, String(comp.amount));
    handleInputChange("_salaryResult", result);
    handleInputChange("grossSalary", String(result.gross));
  }, [base, overrides, componentDefs]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load salary structure ────────────────────────────────────────────────
  const handleSalaryStructureChange = useCallback(
    async (val: any) => {
      const value = typeof val === "string" ? val : val?.value;
      if (!value) return;

      handleInputChange("salaryStructure", value);
      setIsLoadingStructure(true);
      setComponentDefs([]);
      setOverrides({});
      setSalaryResult(null);

      try {
        const structure: SalaryStructure = await getSalaryStructure(value);

      
        
const defs: SalaryComponentDef[] = [
  ...(structure.earnings ?? []).map((row) => ({
    ...row,
    amount: row.amount ?? 0,
    type: "Earning" as const,
    salary_component_abbr:
      row.salary_component_abbr ?? row.abbr ?? "",
  })),

  ...(structure.deductions ?? []).map((row) => ({
    ...row,
    amount: row.amount ?? 0,
    type: "Deduction" as const,
    salary_component_abbr:
      row.salary_component_abbr ?? row.abbr ?? "",
  })),
];

        const initOverrides: Record<string, number> = {};
        for (const def of defs) {
          if (def.amount_based_on_formula !== 1 && def.amount) {
            initOverrides[toKey(def.salary_component)] = def.amount;
          }
        }

        setComponentDefs(defs);
        setOverrides(initOverrides);
        const basicSalary = defs.find(
  (d) =>
    toKey(d.salary_component) === "basic_salary" ||
    d.salary_component_abbr?.toLowerCase() === "bs"
);

if (
  basicSalary &&
  basicSalary.amount_based_on_formula !== 1 &&
  basicSalary.amount
) {
  handleInputChange(
    "basicSalary",
    String(basicSalary.amount)
  );
}
      } catch (err) {
        console.error("Failed to load salary structure:", err);
      } finally {
        setIsLoadingStructure(false);
      }
    },
    [handleInputChange],
  );

  const handleOverrideChange = useCallback((key: string, val: string) => {
    setOverrides((prev) => ({ ...prev, [key]: toNum(val) }));
  }, []);

  const handleTaxSlabChange = useCallback(
  (val: any) => {
    const value = typeof val === "string"
      ? val
      : val?.value || "";

    handleInputChange("Taxslab", value);
  },
  [handleInputChange],
);

  const { earningRows, deductionRows } = useMemo(() => {
    if (!salaryResult) return { earningRows: [], deductionRows: [] };
    return {
      earningRows: salaryResult.components.filter((c) => c.type === "Earning"),
      deductionRows: salaryResult.components.filter(
        (c) => c.type === "Deduction",
      ),
    };
  }, [salaryResult]);

  const hasComponents = componentDefs.length > 0;

  const fetchCurrencyOptions = async (q: string) => {
    const list = await getCurrencyList({ search: q, page: 1, page_size: 20 });
    return (list || []).map((c: any) => ({
      label: `${c.name}${c.symbol ? ` (${c.symbol})` : ""}`,
      value: c.name,
    }));
  };

  useEffect(() => {
    if (formData.salaryStructure && componentDefs.length === 0) {
      handleSalaryStructureChange({ value: formData.salaryStructure });
    }
  }, [formData.salaryStructure]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-3">
      {/* ── Top controls row ── */}
      <div className="bg-card rounded-lg border border-theme p-3 space-y-3">
        <h4 className="text-xs font-semibold text-main uppercase tracking-wide">
          Salary Structure & Settings
        </h4>

        {/* Row 1: Structure picker full width */}
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

        {/* Row 2: Base salary + Currency + Mode */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">
              Base Salary
            </label>
            <PlainInput
              name="basicSalary"
              value={formData.basicSalary ?? ""}
              onChange={(val) => handleInputChange("basicSalary", val)}
              placeholder="e.g. 120000"
            />
          </div>
          <div>
            <SearchSelect2
              label="Currency"
              value={formData.currency}
              placeholder="Search currency…"
              fetchOptions={fetchCurrencyOptions}
              onChange={(val: any) => {
                const value = typeof val === "string" ? val : val?.value;
                handleInputChange("currency", value);
              }}
            />
          </div>
          <div>
            <ModalSelect
              label="Payment Mode"
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
          </div>
        </div>

        {isLoadingStructure && (
          <div className="flex items-center gap-2 py-1">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted">Loading components…</p>
          </div>
        )}
      </div>

      {/* ── Components + Summary — side by side when components exist ── */}
      {!isLoadingStructure && hasComponents && salaryResult && (
        <div className="grid grid-cols-2 gap-3">
          {/* LEFT: component table */}
          <div className="bg-card rounded-lg border border-theme p-3">
            <h4 className="text-xs font-semibold text-main uppercase tracking-wide mb-2">
              Components
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
                  overrides={overrides}
                  onOverrideChange={handleOverrideChange}
                />
                <ComponentTable
                  sectionLabel="Deductions"
                  accentClass="text-red-500 dark:text-red-400"
                  components={deductionRows}
                  overrides={overrides}
                  onOverrideChange={handleOverrideChange}
                />
              </tbody>
            </table>
          </div>

          {/* RIGHT: summary */}
          <div className="bg-card rounded-lg border border-theme p-3">
            <h4 className="text-xs font-semibold text-main uppercase tracking-wide mb-2">
              Summary
            </h4>
            <div className="space-y-0.5">
              <SummaryRow
                label="Base Salary (Input)"
                value={`${currency} ${fmt(base)}`}
                dimmed
              />
              <SummaryRow
                label="Total Earnings (Annual)"
                value={`${currency} ${fmt(salaryResult.gross)}`}
                bold
              />
              <SummaryRow
                label="Total Earnings (Monthly)"
                value={`${currency} ${fmt(salaryResult.gross / 12)}`}
                dimmed
              />
              {salaryResult.deductionsTotal > 0 && (
                <SummaryRow
                  label="Total Deductions (Annual)"
                  value={`− ${currency} ${fmt(salaryResult.deductionsTotal)}`}
                  negative
                />
              )}
              <SummaryRow
                label="Net Pay (Annual)"
                value={`${currency} ${fmt(salaryResult.net)}`}
                bold
                accent
                topBorder
              />
              <SummaryRow
                label="Net Pay (Monthly)"
                value={`${currency} ${fmt(salaryResult.net / 12)}`}
                dimmed
              />
            </div>

            {/* Quick stats */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">
                  Gross / month
                </p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {fmt(salaryResult.gross / 12)}
                </p>
              </div>
              <div className="bg-primary/5 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">
                  Net / month
                </p>
                <p className="text-sm font-bold text-primary">
                  {fmt(salaryResult.net / 12)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state when no structure selected */}
      {!isLoadingStructure && !hasComponents && !formData.salaryStructure && (
        <div className="bg-card rounded-lg border border-dashed border-theme p-8 text-center">
          <p className="text-xs text-muted">
            Select a salary structure above to view and configure components.
          </p>
        </div>
      )}

      {/* Empty state when structure selected but no components */}
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
