/* eslint-disable react-refresh/only-export-components, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, camelcase */
import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { getAllSalaryStructures } from "../../../api/utils/frappeUtilsApi";
import { getCurrencyList } from "../../../api/lookupApi";
import { useCompanyStore } from "../../../store/companyStore";
import {
  getSalaryStructure,
  getTaxConfig,
  getSalaryComponent,
  type SalaryStructure,
  type TaxConfig,
  getAllSalaryComponents,
} from "../../../api/payrollConfigApi";
import {
  calculateSalary,
  solveBaseFromGross,
  buildCompensationPayload,
  toNameKey,
  toAbbrKey,
  type SalaryComponentDef,
  type SalaryResult,
  type ComponentType,
} from "./salaryengine";
import { ComponentsPanel } from "./Compensation/ComponentsPanel";
import { SalarySetupSection } from "./Compensation/SalarySetupSection";

import {
  fmt,
  hydrateCustomComponents,
  nextCustomId,
  toNum,
} from "./Compensation/salaryHelpers";
import type {
  CompensationTabProps,
  ComponentOption,
  CustomComponent,
  DisplayRow,
} from "./Compensation/types";

export { buildCompensationPayload };

// A per-employee override that flips a *structure* component into formula
// mode (or edits its formula), keyed the same way `overrides` is keyed —
// by the component's nameKey (salaryengine's toNameKey(salary_component)),
// which is what DisplayRow.editId equals for structure rows.
type FormulaOverride = { amount_based_on_formula: 0 | 1; formula: string };

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

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  // Per-employee formula overrides for STRUCTURE components (custom
  // components track their own amount_based_on_formula/formula directly on
  // customComponents, same as before).
  const [formulaOverrides, setFormulaOverrides] = useState<
    Record<string, FormulaOverride>
  >({});
  const [customComponents, setCustomComponents] = useState<CustomComponent[]>(
    [],
  );
  // Structure components removed for THIS employee only. The shared
  // structure is untouched — an excluded row is zeroed out via `overrides`
  // (so it contributes nothing to gross/net) and hidden from the list,
  // with a "restore" chip surfaced so it isn't a dead end.
  const [excludedComponents, setExcludedComponents] = useState<Set<string>>(
    new Set(),
  );
  // Mobile-only: the sticky summary is always visible in condensed form;
  // this controls whether the full breakdown underneath is expanded.
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const componentMetaRef = useRef<Record<string, string>>({});

  // Snapshot of whatever customization was persisted for this employee,
  // captured once on mount so later formData writes (which this component
  // itself triggers) never re-trigger a restore loop.
  const savedCustomizationRef = useRef({
    isCustom: Boolean(formData._isCustomStructure),
    overrides: { ...(formData._componentOverrides ?? {}) } as Record<
      string,
      number
    >,
    formulaOverrides: {
      ...(formData._componentFormulaOverrides ?? {}),
    } as Record<string, FormulaOverride>,
    customDefs: [...(formData._customComponents ?? [])] as SalaryComponentDef[],
    excludedComponents: new Set<string>(
      formData._excludedComponents ?? [],
    ),
  });

  const handleInputChangeRef = useRef(handleInputChange);
  useEffect(() => {
    handleInputChangeRef.current = handleInputChange;
  });
  const stableHandleInputChange = useCallback(
    (field: string, value: any) => handleInputChangeRef.current(field, value),
    [],
  );

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

  const selectedCustom = useMemo(
    () => customComponents.filter((c) => c.selected),
    [customComponents],
  );
  const customDefs = useMemo(
    () => selectedCustom.map((c) => c.def),
    [selectedCustom],
  );

  // Structure components merged with any per-employee formula overrides —
  // this is what actually drives calculateSalary, so toggling a structure
  // row to Formula mode (or editing its formula) changes gross/net, not
  // just the display. Keyed by the same nameKey calculateSalary derives
  // internally via toNameKey(salary_component) — imported from
  // salaryengine so this can never drift out of sync with how
  // calculateSalary itself hashes component names.
  //
  // NOTE: excluded rows stay IN this array (not filtered out) — their
  // exclusion is expressed as a zeroed override instead. This keeps the
  // array's length/order identical to componentDefs, which the
  // earningRows/deductionRows builder below relies on for its positional
  // (index-based) matching against salaryResult.components.
  const componentDefsWithOverrides = useMemo(
    () =>
      componentDefs.map((def) => {
        const nameKey = toNameKey(def.salary_component || "");
        const abbrKey = toAbbrKey(def.abbr ?? def.salary_component_abbr);
        const fo = formulaOverrides[nameKey] ?? (abbrKey ? formulaOverrides[abbrKey] : undefined);
        if (!fo) return def;
        return {
          ...def,
          amount_based_on_formula: fo.amount_based_on_formula,
          formula: fo.formula,
        };
      }),
    [componentDefs, formulaOverrides],
  );

  const effectiveComponentDefs = useMemo(
    () => [...componentDefsWithOverrides, ...customDefs],
    [componentDefsWithOverrides, customDefs],
  );
  const hasComponents = effectiveComponentDefs.length > 0;
  const cur = (n: number) => `${currencyPrefix} ${fmt(n)}`.trim();

  const hasPendingEarning = customComponents.some(
    (c) => c.def.type === "Earning" && !c.selected,
  );
  const hasPendingDeduction = customComponents.some(
    (c) => c.def.type === "Deduction" && !c.selected,
  );

  // Count of employee-specific changes: overridden structure amounts +
  // structure formula overrides + custom components added just for this
  // employee. Surfaced as a badge so it's obvious at a glance, both while
  // editing and when the tab re-opens. Excluded structure rows are already
  // reflected here — excluding one writes a 0 into `overrides`.
  const customizationCount =
    Object.keys(overrides).length +
    Object.keys(formulaOverrides).length +
    selectedCustom.length;
  const hasCustomizations = customizationCount > 0;

  useEffect(() => {
    if (!formData.currency && baseCurrency) {
      stableHandleInputChange("currency", baseCurrency);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isEditMode && formData.dateOfJoining && !formData.effectiveFrom) {
      stableHandleInputChange("effectiveFrom", formData.dateOfJoining);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Restore saved customization on mount (edit mode) ───────────────────────
  useEffect(() => {
    if (formData.salaryStructure && !componentDefs.length) {
      // When editing, restore employee-specific overrides/custom components
      // once the structure's own components have loaded (see loadStructure).
      loadStructure(formData.salaryStructure, isEditMode);
    } else if (
      isEditMode &&
      !formData.salaryStructure &&
      (savedCustomizationRef.current.isCustom ||
        savedCustomizationRef.current.customDefs.length > 0)
    ) {
      // Fully custom structure with no base salary structure selected at all.
      applySavedCustomization();
    }
    if (formData.Taxslab && !taxConfig) {
      loadTaxConfig(formData.Taxslab);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!effectiveComponentDefs.length) return;
    if (activeField.current === "gross") return;
    const base = toNum(baseInput);
    const result = calculateSalary(
      base,
      effectiveComponentDefs,
      overrides,
      taxConfig,
    );
    setSalaryResult(result);
    setComputedGross(result.gross);
    stableHandleInputChange("basicSalary", String(base));
    stableHandleInputChange("grossSalary", String(result.gross));
    stableHandleInputChange("_salaryResult", result);
  }, [baseInput, effectiveComponentDefs, overrides, taxConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!effectiveComponentDefs.length) return;
    if (activeField.current === "base") return;
    const gross = toNum(grossInput);
    const base = solveBaseFromGross(
      gross,
      effectiveComponentDefs,
      0.01,
      60,
      taxConfig,
    );
    const result = calculateSalary(
      base,
      effectiveComponentDefs,
      overrides,
      taxConfig,
    );
    setSalaryResult(result);
    setComputedBase(base);
    stableHandleInputChange("basicSalary", String(base));
    stableHandleInputChange("grossSalary", String(gross));
    stableHandleInputChange("_salaryResult", result);
  }, [grossInput, effectiveComponentDefs, overrides, taxConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!effectiveComponentDefs.length) return;
    const base = toNum(baseInput);
    if (!base) return;
    const result = calculateSalary(
      base,
      effectiveComponentDefs,
      overrides,
      taxConfig,
    );
    setSalaryResult(result);
    setComputedGross(result.gross);
    setGrossInput(result.gross);
    setComputedBase(null);
  }, [componentDefs]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!effectiveComponentDefs.length || taxConfig === undefined) return;
    const base = toNum(baseInput);
    if (!base) return;
    const result = calculateSalary(
      base,
      effectiveComponentDefs,
      overrides,
      taxConfig,
    );
    setSalaryResult(result);
    setComputedGross(result.gross);
    stableHandleInputChange("_salaryResult", result);
    stableHandleInputChange("grossSalary", String(result.gross));
  }, [taxConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!effectiveComponentDefs.length) return;
    const base = toNum(baseInput);
    if (!base) return;
    const result = calculateSalary(
      base,
      effectiveComponentDefs,
      overrides,
      taxConfig,
    );
    setSalaryResult(result);
    setComputedGross(result.gross);
    stableHandleInputChange("_salaryResult", result);
    stableHandleInputChange("grossSalary", String(result.gross));
  }, [overrides, formulaOverrides, customDefs]); // eslint-disable-line react-hooks/exhaustive-deps

  const salaryChanged =
    isEditMode &&
    (toNum(baseInput) !== initialSalaryRef.current.base ||
      toNum(grossInput) !== initialSalaryRef.current.gross ||
      formData.salaryStructure !== initialSalaryRef.current.structure);

  useEffect(() => {
    stableHandleInputChange("_salaryChanged", salaryChanged);
  }, [salaryChanged]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    stableHandleInputChange("_isCustomStructure", isCustomizing);
    stableHandleInputChange("_componentOverrides", overrides);
    stableHandleInputChange("_componentFormulaOverrides", formulaOverrides);
    stableHandleInputChange("_customComponents", customDefs);
    stableHandleInputChange("_excludedComponents", Array.from(excludedComponents));
  }, [isCustomizing, overrides, formulaOverrides, customDefs, excludedComponents]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Restores overrides/custom components saved for this employee. Only ever
  // called once on mount - after that, the person's own edits are the source
  // of truth and this ref is never consulted again.
  const applySavedCustomization = () => {
    const saved = savedCustomizationRef.current;
    if (saved.isCustom) setIsCustomizing(true);
    if (Object.keys(saved.overrides).length) setOverrides(saved.overrides);
    if (Object.keys(saved.formulaOverrides).length)
      setFormulaOverrides(saved.formulaOverrides);
    if (saved.customDefs.length) {
      setCustomComponents(hydrateCustomComponents(saved.customDefs));
    }
    if (saved.excludedComponents.size) {
      setExcludedComponents(new Set(saved.excludedComponents));
    }
  };

  const loadStructure = async (value: string, restoreSaved = false) => {
    setIsLoadingStructure(true);
    setComponentDefs([]);
    setSalaryResult(null);
    setComputedGross(null);
    setComputedBase(null);
    if (!restoreSaved) {
      setOverrides({});
      setFormulaOverrides({});
      setCustomComponents([]);
      setExcludedComponents(new Set());
    }
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
      if (restoreSaved) applySavedCustomization();
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
      // A structure switch chosen by the person always starts clean - the
      // employee-specific overrides only ever applied to the previous
      // structure's components.
      loadStructure(value, false);
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

  const fetchComponentOptions = useCallback(
    async (type: ComponentType, query: string): Promise<ComponentOption[]> => {
      const res = await getAllSalaryComponents(0, 20, query, type);
      const used = new Set(
        [...componentDefs, ...selectedCustom.map((c) => c.def)].map((d) =>
          d.salary_component.toLowerCase(),
        ),
      );
      return (res?.data || [])
        .filter((c: any) => c?.name && !used.has(String(c.name).toLowerCase()))
        .map((c: any) => {
          componentMetaRef.current[c.name] = c.abbr || c.name;
          return { label: c.name, value: c.name };
        });
    },
    [componentDefs, selectedCustom],
  );

  const handleToggleCustomize = useCallback(() => {
    setIsCustomizing((prev) => !prev);
  }, []);

  const handleAmountChange = useCallback(
    (editId: string, value: number | null, isCustomRow: boolean) => {
      if (isCustomRow) {
        setCustomComponents((prev) =>
          prev.map((c) =>
            c.id === editId
              ? { ...c, def: { ...c.def, amount: value ?? 0 } }
              : c,
          ),
        );
      } else {
        setOverrides((prev) => ({ ...prev, [editId]: value ?? 0 }));
      }
    },
    [],
  );

  const handleResetOverride = useCallback((key: string) => {
    setOverrides((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setFormulaOverrides((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // Removes a STRUCTURE component for this employee only. The shared
  // structure keeps the component — we zero its override (so it drops out
  // of gross/net) and clear any formula override, then hide the row.
  // Restorable via handleRestoreComponent, unlike a custom component
  // removal, which is a genuine delete (handleRemoveCustomComponent).
  const handleExcludeComponent = useCallback((editId: string) => {
    setExcludedComponents((prev) => {
      if (prev.has(editId)) return prev;
      const next = new Set(prev);
      next.add(editId);
      return next;
    });
    setOverrides((prev) => ({ ...prev, [editId]: 0 }));
    setFormulaOverrides((prev) => {
      if (!(editId in prev)) return prev;
      const next = { ...prev };
      delete next[editId];
      return next;
    });
  }, []);

  const handleRestoreComponent = useCallback(
    (editId: string) => {
      setExcludedComponents((prev) => {
        if (!prev.has(editId)) return prev;
        const next = new Set(prev);
        next.delete(editId);
        return next;
      });
      handleResetOverride(editId);
    },
    [handleResetOverride],
  );

  // Bulk "start over" - clears every employee-specific override, excluded
  // structure component, and custom component in one action, falling back
  // to the plain structure values.
  const handleResetAllCustomizations = useCallback(() => {
    setOverrides({});
    setFormulaOverrides({});
    setCustomComponents([]);
    setExcludedComponents(new Set());
  }, []);

  const handleAddCustomComponent = useCallback((type: ComponentType) => {
    setCustomComponents((prev) => {
      if (prev.some((c) => c.def.type === type && !c.selected)) return prev;
      const id = nextCustomId();
      return [
        ...prev,
        {
          id,
          selected: false,
          def: {
            salary_component: "",
            amount: 0,
            amount_based_on_formula: 0,
            formula: "",
            type,
            abbr: id,
            salary_component_abbr: id,
          },
        },
      ];
    });
  }, []);

  // Selecting a custom component now fetches its full master definition -
  // formula, fixed/formula flag, and the informational tax/payment-day
  // attributes - the same way the Salary Structure builder does via
  // getSalaryComponent. This is what lets a formula-based component (e.g.
  // "HRA = base * 0.4") actually behave as a formula once added here,
  // instead of silently being treated as a zero fixed amount.
  const handleSelectCustomComponent = useCallback(
    async (id: string, option: ComponentOption) => {
      setCustomComponents((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                detailsLoading: true,
                def: { ...c.def, salary_component: option.value },
              }
            : c,
        ),
      );

      try {
        const details = await getSalaryComponent(option.value);
        const abbr =
          details.salary_component_abbr ||
          componentMetaRef.current[option.value] ||
          id;

        setCustomComponents((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  selected: true,
                  detailsLoading: false,
                  def: {
                    ...c.def,
                    salary_component: details.salary_component || option.value,
                    amount:
                      details.amount_based_on_formula === 1
                        ? 0
                        : (details.amount ?? 0),
                    amount_based_on_formula:
                      details.amount_based_on_formula ?? 0,
                    formula: details.formula ?? "",
                    abbr,
                    salary_component_abbr: abbr,
                    depends_on_payment_days:
                      details.depends_on_payment_days ?? 0,
                    is_tax_applicable: details.is_tax_applicable ?? 0,
                    is_income_tax_component:
                      details.is_income_tax_component ?? 0,
                    variable_based_on_taxable_salary:
                      details.variable_based_on_taxable_salary ?? 0,
                  },
                }
              : c,
          ),
        );
      } catch (err) {
        console.error("Failed to load salary component details:", err);
        // Fall back to a bare fixed-amount component so the person can
        // still key in a value manually rather than getting stuck.
        const abbr = componentMetaRef.current[option.value] || id;
        setCustomComponents((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  selected: true,
                  detailsLoading: false,
                  def: {
                    ...c.def,
                    salary_component: option.value,
                    abbr,
                    salary_component_abbr: abbr,
                  },
                }
              : c,
          ),
        );
      }
    },
    [],
  );

  const handleReselectCustomComponent = useCallback((id: string) => {
    setCustomComponents((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              selected: false,
              def: {
                ...c.def,
                salary_component: "",
                formula: "",
                amount_based_on_formula: 0,
              },
            }
          : c,
      ),
    );
  }, []);

  const handleRemoveCustomComponent = useCallback((id: string) => {
    setCustomComponents((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Flips ANY row — structure or custom — between fixed-amount and formula
  // mode while customizing. Structure rows are tracked in formulaOverrides
  // (this employee only, shared structure stays untouched); custom rows
  // keep living inside customComponents, same as before.
  //
  // FIX: a structure row's *true* current mode is not simply "does an
  // override exist" — a row with NO override yet is still displaying
  // whatever amount_based_on_formula the master structure component
  // defines (see CompRow's isFormulaMode fallback). The old version only
  // ever checked `prev[id]`, so the very first click on a row whose master
  // default was already formula-based re-wrote the override as formula
  // again (a no-op click). It also deleted the override on "switch to
  // fixed" instead of writing an explicit 0, which meant deleting fell
  // straight back to a formula-based master default. Both are fixed below
  // by resolving the row's real current state (override, else master
  // default) and always writing an explicit 0/1.
  const handleToggleCustomFormulaMode = useCallback(
    (id: string, isCustomRow: boolean) => {
      // The row's last computed amount — used to seed a sensible fixed
      // value the moment we switch OUT of formula mode. A formula-based
      // component's own `amount` field is normally 0/stale (it's meant to
      // be derived, not stored), so without this the Fixed box would
      // "switch" but display 0 — which looks exactly like it did nothing.
      const computedAmount = salaryResult?.components.find(
        (c) => c.key === id,
      )?.amount;

      if (isCustomRow) {
        setCustomComponents((prev) =>
          prev.map((c) => {
            if (c.id !== id) return c;
            const switchingToFixed = c.def.amount_based_on_formula === 1;
            return {
              ...c,
              def: {
                ...c.def,
                amount_based_on_formula: switchingToFixed ? 0 : 1,
                amount: switchingToFixed
                  ? (computedAmount ?? c.def.amount ?? 0)
                  : c.def.amount,
              },
            };
          }),
        );
        return;
      }

      // Resolve the row's TRUE current mode BEFORE mutating anything: an
      // override if one exists, otherwise the structure's own master
      // default (matched the same way componentDefsWithOverrides matches
      // it — nameKey, else abbrKey — via the shared salaryengine helpers).
      let currentlyFormula: boolean;
      if (id in formulaOverrides) {
        currentlyFormula = formulaOverrides[id].amount_based_on_formula === 1;
      } else {
        const master = componentDefs.find((d) => {
          const nameKey = toNameKey(d.salary_component || "");
          const abbrKey = toAbbrKey(d.abbr ?? d.salary_component_abbr);
          return id === nameKey || (abbrKey !== null && id === abbrKey);
        });
        currentlyFormula = master?.amount_based_on_formula === 1;
      }
      const switchingToFixed = currentlyFormula;

      setFormulaOverrides((prev) => ({
        ...prev,
        [id]: {
          // Switching to Fixed writes an EXPLICIT 0 — deleting the entry
          // would fall back to the master definition, which for a
          // formula-based component would silently undo this toggle.
          amount_based_on_formula: switchingToFixed ? 0 : 1,
          formula: prev[id]?.formula ?? "",
        },
      }));

      setOverrides((prev) => {
        if (switchingToFixed) {
          // Seed the fixed value with the last computed amount so the
          // input shows a real number instead of resetting to 0.
          if (computedAmount === undefined) return prev;
          return { ...prev, [id]: computedAmount };
        }
        // Switching TO formula — a fixed-amount override no longer applies.
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [componentDefs, formulaOverrides, salaryResult],
  );

  const handleCustomFormulaChange = useCallback(
    (id: string, formula: string, isCustomRow: boolean) => {
      if (isCustomRow) {
        setCustomComponents((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, def: { ...c.def, formula } } : c,
          ),
        );
        return;
      }
      setFormulaOverrides((prev) => ({
        ...prev,
        [id]: { amount_based_on_formula: 1, formula },
      }));
    },
    [],
  );

  const {
    earningRows,
    deductionRows,
    removedEarningRows,
    removedDeductionRows,
  } = useMemo(() => {
    const pendingCustom = customComponents.filter((c) => !c.selected);
    const boundary = componentDefs.length;
    const components = salaryResult?.components ?? [];

    const structureRowsAll: DisplayRow[] = components
      .slice(0, boundary)
      .map((c, i) => ({
        ...c,
        editId: c.key,
        isCustom: false,
        selected: true,
        amount_based_on_formula:
          componentDefsWithOverrides[i]?.amount_based_on_formula,
        formula: componentDefsWithOverrides[i]?.formula ?? c.formula,
        flags: {
          depends_on_payment_days:
            componentDefsWithOverrides[i]?.depends_on_payment_days,
          is_tax_applicable: componentDefsWithOverrides[i]?.is_tax_applicable,
          is_income_tax_component:
            componentDefsWithOverrides[i]?.is_income_tax_component,
          variable_based_on_taxable_salary:
            componentDefsWithOverrides[i]?.variable_based_on_taxable_salary,
        },
      }));

    // Excluded structure rows are pulled out of the visible list here —
    // they're still present (and zeroed) inside componentDefsWithOverrides
    // for calculation purposes, this is purely a display-layer split.
    const structureRows = structureRowsAll.filter(
      (r) => !excludedComponents.has(r.editId),
    );
    const removedStructureRows = structureRowsAll.filter((r) =>
      excludedComponents.has(r.editId),
    );

    const customCalcRows: DisplayRow[] = components
      .slice(boundary)
      .map((c, i) => {
        const cc = selectedCustom[i];
        return {
          ...c,
          editId: cc?.id ?? c.key,
          isCustom: true,
          selected: true,
          flags: {
            depends_on_payment_days: cc?.def.depends_on_payment_days,
            is_tax_applicable: cc?.def.is_tax_applicable,
            is_income_tax_component: cc?.def.is_income_tax_component,
            variable_based_on_taxable_salary:
              cc?.def.variable_based_on_taxable_salary,
          },
          amount_based_on_formula: cc?.def.amount_based_on_formula,
          detailsLoading: cc?.detailsLoading,
        };
      });

    const pendingRows: DisplayRow[] = pendingCustom.map((c) => ({
      name: "",
      key: c.id,
      abbrKey: null,
      amount: 0,
      formula: c.def.formula ?? "",
      isFormula: false,
      type: c.def.type,
      editId: c.id,
      isCustom: true,
      selected: false,
      detailsLoading: c.detailsLoading,
    }));

    const all = [...structureRows, ...customCalcRows, ...pendingRows];
    return {
      earningRows: all.filter((c) => c.type === "Earning"),
      deductionRows: all.filter((c) => c.type === "Deduction"),
      removedEarningRows: removedStructureRows.filter(
        (c) => c.type === "Earning",
      ),
      removedDeductionRows: removedStructureRows.filter(
        (c) => c.type === "Deduction",
      ),
    };
  }, [
    salaryResult,
    componentDefs,
    componentDefsWithOverrides,
    customComponents,
    selectedCustom,
    excludedComponents,
  ]);

  const shownBase = activeField.current === "gross" ? computedBase : baseInput;
  const shownGross =
    activeField.current === "base" ? computedGross : grossInput;

  const isLoading = isLoadingStructure || isLoadingTax;
  const showComponentsPanel = !isLoading && (hasComponents || isCustomizing);

  return (
    <div className="w-full h-full flex flex-col gap-2 min-w-0 min-h-0">
      <SalarySetupSection
        formData={formData}
        hasCustomizations={hasCustomizations}
        isLoadingTax={isLoadingTax}
        salaryChanged={salaryChanged}
        shownBase={shownBase}
        shownGross={shownGross}
        isEditMode={isEditMode}
        activeField={activeField}
        getAllSalaryStructures={getAllSalaryStructures}
        fetchCurrencyOptions={fetchCurrencyOptions}
        handleSalaryStructureChange={handleSalaryStructureChange}
        handleTaxSlabChange={handleTaxSlabChange}
        stableHandleInputChange={stableHandleInputChange}
        setBaseInput={setBaseInput}
        setGrossInput={setGrossInput}
      />

      {isLoading && (
        <div className="flex items-center gap-2 mt-2">
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted">
            {isLoadingStructure ? "Loading components…" : "Loading tax config…"}
          </span>
        </div>
      )}

      {showComponentsPanel && (
        <div className="flex flex-col">
          <ComponentsPanel
            hasCustomizations={hasCustomizations}
            customizationCount={customizationCount}
            isCustomizing={isCustomizing}
            earningRows={earningRows}
            deductionRows={deductionRows}
            removedEarningRows={removedEarningRows}
            removedDeductionRows={removedDeductionRows}
            overrides={overrides}
            formulaOverrides={formulaOverrides}
            hasPendingEarning={hasPendingEarning}
            hasPendingDeduction={hasPendingDeduction}
            currencyPrefix={currencyPrefix}
            fetchComponentOptions={fetchComponentOptions}
            handleResetAllCustomizations={handleResetAllCustomizations}
            handleToggleCustomize={handleToggleCustomize}
            handleAddCustomComponent={handleAddCustomComponent}
            handleAmountChange={handleAmountChange}
            handleSelectCustomComponent={handleSelectCustomComponent}
            handleReselectCustomComponent={handleReselectCustomComponent}
            handleRemoveCustomComponent={handleRemoveCustomComponent}
            handleExcludeComponent={handleExcludeComponent}
            handleRestoreComponent={handleRestoreComponent}
            handleResetOverride={handleResetOverride}
            handleToggleCustomFormulaMode={handleToggleCustomFormulaMode}
            handleCustomFormulaChange={handleCustomFormulaChange}
          />
        </div>
      )}

      {!isLoading &&
        !hasComponents &&
        !isCustomizing &&
        !formData.salaryStructure && (
          <div className="bg-card rounded-lg border border-dashed border-theme p-6 text-center">
            <p className="text-xs text-muted mb-2">
              Select a salary structure above to view and configure components.
            </p>
            <button
              type="button"
              onClick={handleToggleCustomize}
              className="text-xs text-primary hover:underline"
            >
              Or build a custom structure for this employee
            </button>
          </div>
        )}
      {!isLoading &&
        !hasComponents &&
        !isCustomizing &&
        formData.salaryStructure && (
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