import React, { useState, useCallback, useMemo, useEffect } from "react";
import { ModalSelect } from "../../ui/modal/modalComponent";
import { getAllSalaryStructures } from "../../../api/utils/frappeUtilsApi";
import { getCurrencyList } from "../../../api/lookupApi";
import {
  getSalaryStructure,
  getSalaryComponent,
  type SalaryStructure,
  type SalaryComponent as ApiSalaryComponent,
} from "../../../api/payrollConfigApi";
import SearchSelect2 from "../../ui/modal/SearchSelect2";
import {
  calculateSalary,
  toKey,
  buildCompensationPayload,
  type SalaryComponentDef,
  type SalaryResult,
  type ComponentResult,
} from "./salaryengine";

// ─── Types ────────────────────────────────────────────────────────────────────

type CompensationTabProps = {
  formData: any;
  handleInputChange: (field: string, value: string | boolean | any) => void;
};

export { buildCompensationPayload };

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
        disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-app
        ${className}`}
    />
  </>
);

// ─── Component Table ──────────────────────────────────────────────────────────

interface ComponentTableProps {
  sectionLabel: string;
  accentClass: string; // e.g. "text-emerald-600" for earnings, "text-red-500" for deductions
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
              disabled={comp.isFormula}
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

  // base = whatever the user typed in "Base Salary" field
  const base = toNum(formData.basicSalary ?? 0);

  // ── Recalculate on every base / override / componentDef change ───────────
  useEffect(() => {
    if (!componentDefs.length) {
      setSalaryResult(null);
      return;
    }

    const result = calculateSalary(base, componentDefs, overrides);
    setSalaryResult(result);

    // Write computed component values back to formData
    for (const comp of result.components) {
      handleInputChange(comp.key, String(comp.amount));
    }
    // Stash full result for buildEmployeePayload
    handleInputChange("_salaryResult", result);
    // Also expose gross directly for the summary panel
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

        const enrichRows = async (
          rows: Array<{ salary_component: string }>,
        ): Promise<ApiSalaryComponent[]> => {
          const results = await Promise.allSettled(
            rows.map((row) => getSalaryComponent(row.salary_component)),
          );
          return results
            .filter(
              (r): r is PromiseFulfilledResult<ApiSalaryComponent> =>
                r.status === "fulfilled",
            )
            .map((r) => r.value);
        };

        const [earnings, deductions] = await Promise.all([
          enrichRows(structure.earnings ?? []),
          enrichRows(structure.deductions ?? []),
        ]);

        const defs: SalaryComponentDef[] = [
          ...earnings.map((c) => ({ ...c, type: "Earning" as const })),
          ...deductions.map((c) => ({ ...c, type: "Deduction" as const })),
        ] as SalaryComponentDef[];

        // Seed overrides from API fixed defaults
        const initOverrides: Record<string, number> = {};
        for (const def of defs) {
          if (def.amount_based_on_formula !== 1 && def.amount) {
            initOverrides[toKey(def.salary_component)] = def.amount;
          }
        }

        setComponentDefs(defs);
        setOverrides(initOverrides);
      } catch (err) {
        console.error("Failed to load salary structure:", err);
      } finally {
        setIsLoadingStructure(false);
      }
    },
    [handleInputChange],
  );

  // ── Override handler ─────────────────────────────────────────────────────
  const handleOverrideChange = useCallback((key: string, val: string) => {
    setOverrides((prev) => ({ ...prev, [key]: toNum(val) }));
  }, []);

  // ── Split result ─────────────────────────────────────────────────────────
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
  const currency = formData.currency || "";

  const fetchCurrencyOptions = async (q: string) => {
    const list = await getCurrencyList({
      search: q,
      page: 1,
      page_size: 20,
    });

    return (list || []).map((c: any) => ({
      label: `${c.name} ${c.symbol ? `(${c.symbol})` : ""}`,
      value: c.name,
    }));
  };

  useEffect(() => {
  if (formData.salaryStructure && componentDefs.length === 0) {
    handleSalaryStructureChange({
      value: formData.salaryStructure,
    });
  }
}, [formData.salaryStructure]);
  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* ── LEFT: Salary Components ── */}
        <div className="space-y-4">
          <div className="bg-card p-3 rounded-lg border border-theme space-y-3">
            <h4 className="text-xs font-semibold text-main uppercase tracking-wide">
              Salary Components
            </h4>

            {/* Structure picker */}
            <SearchSelect2
              label="Salary Structure"
              value={formData.salaryStructure}
              placeholder="Select Salary Structure..."
              fetchOptions={getAllSalaryStructures}
              onChange={handleSalaryStructureChange}
            />

            {/* Base Salary input */}
            <div className="grid grid-cols-2 gap-2">
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
                  placeholder="Select Currency..."
                  fetchOptions={fetchCurrencyOptions}
                  onChange={(val: any) => {
                    const value = typeof val === "string" ? val : val?.value;
                    handleInputChange("currency", value);
                  }}
                />
              </div>
            </div>

            {isLoadingStructure && (
              <div className="flex items-center gap-2 py-2">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-muted">Loading components…</p>
              </div>
            )}

            {/* Component table */}
            {!isLoadingStructure && hasComponents && salaryResult && (
              <table className="w-full border-collapse mt-1">
                <thead>
                  <tr className="border-b border-theme">
                    <th className="text-left text-[10px] font-semibold text-muted uppercase tracking-wider py-1.5 px-2 w-1/2">
                      Component
                    </th>
                    <th className="text-left text-[10px] font-semibold text-muted uppercase tracking-wider py-1.5 px-2 w-1/2">
                      Amount{" "}
                      {currency && (
                        <span className="normal-case font-normal">
                          ({currency})
                        </span>
                      )}
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
            )}

            {!isLoadingStructure &&
              !hasComponents &&
              formData.salaryStructure && (
                <p className="text-xs text-muted text-center py-3 italic">
                  No components found in this structure
                </p>
              )}

            {/* Summary */}
            {salaryResult && (
              <div className="pt-2 border-t border-theme space-y-0.5">
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
            )}
          </div>

          {/* Payroll Config */}
          {/* <div className="bg-card p-3 rounded-lg border border-theme space-y-3">
            <h4 className="text-xs font-semibold text-main uppercase tracking-wide">
              Payroll Configuration
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <ModalSelect
                label="Currency"
                name="currency"
                value={formData.currency || ""}
                onChange={(e) => handleInputChange("currency", e.target.value)}
              />
              <ModalSelect
                label="Frequency"
                name="paymentFrequency"
                value={formData.paymentFrequency || "Monthly"}
                onChange={(e) => handleInputChange("paymentFrequency", e.target.value)}
              />
              <ModalSelect
                label="Mode"
                name="paymentMethod"
                value={formData.paymentMethod || "Bank Transfer"}
                onChange={(e) => handleInputChange("paymentMethod", e.target.value)}
              />
            </div>
          </div> */}
        </div>

        {/* ── RIGHT: Bank + NAPSA ── */}
        <div className="space-y-4">
          <div className="bg-card p-3 rounded-lg border border-theme space-y-2">
            <h4 className="text-xs font-semibold text-main uppercase tracking-wide">
              Bank Account Details
            </h4>

            <ModalSelect
              label="Account Type"
              name="accountType"
              value={formData.accountType || ""}
              onChange={(e) => handleInputChange("accountType", e.target.value)}
              required
            />

            {[
              {
                label: "Account Name",
                name: "accountName",
                placeholder: "Account holder name",
                type: "text",
              },
              {
                label: "Account Number",
                name: "accountNumber",
                placeholder: "Bank account number",
                type: "text",
              },
              {
                label: "Bank Name",
                name: "bankName",
                placeholder: "e.g., Zanaco Bank",
                type: "text",
              },
              {
                label: "Branch Code",
                name: "branchCode",
                placeholder: "e.g., 027",
                type: "text",
              },
            ].map(({ label, name, placeholder, type }) => (
              <div key={name}>
                <label className="block text-[11px] text-muted mb-1">
                  {label}
                </label>
                <input
                  type={type}
                  name={name}
                  value={formData[name] ?? ""}
                  placeholder={placeholder}
                  onChange={(e) => handleInputChange(name, e.target.value)}
                  className="w-full bg-transparent border border-theme rounded px-2 py-1 text-xs text-main focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
            ))}
          </div>

          {/* NAPSA Ceiling */}
          <div className="bg-card p-3 rounded-lg border border-theme space-y-2">
            <h4 className="text-xs font-semibold text-main uppercase tracking-wide">
              NAPSA Ceiling
            </h4>
            <p className="text-[11px] text-muted">
              Max statutory contribution limit
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: "Ceiling Amount",
                  name: "ceilingAmount",
                  placeholder: "e.g., 50000",
                },
                {
                  label: "Ceiling Year",
                  name: "ceilingYear",
                  placeholder: "e.g., 2025",
                },
              ].map(({ label, name, placeholder }) => (
                <div key={name}>
                  <label className="block text-[11px] text-muted mb-1">
                    {label}
                  </label>
                  <PlainInput
                    name={name}
                    value={formData[name] ?? ""}
                    onChange={(val) => handleInputChange(name, val)}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompensationTab;
