import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { FaSlidersH } from "react-icons/fa";
import { ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
import { getAllSalaryStructures } from "../../../api/utils/frappeUtilsApi";
import { getCurrencyList } from "../../../api/lookupApi";
import { useCompanyStore } from "../../../store/companyStore";
import { useCustomCompensationPayload } from "../../../hooks/useCustomCompensationPayload";
import { buildCustomCompensationPayload } from "../employeedirectorymodal/Compensation/customCompensationPayload";
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
import { CompensationReviewModal } from "./Compensation/CompensationReviewModal";
import { NumericInput } from "../../../components/ui/modal/modalComponent";
import DatePickerInput from "../../../components/calendar/DatePickerInput";
import { Field } from "./Compensation/Field";
import { Badge } from "./Compensation/Badge";

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

  

  // State to open/close our interactive review modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isCustomizing, setIsCustomizing] = useState(true);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [formulaOverrides, setFormulaOverrides] = useState<
    Record<string, FormulaOverride>
  >({});
  const [customComponents, setCustomComponents] = useState<CustomComponent[]>([]);
  const [excludedComponents, setExcludedComponents] = useState<Set<string>>(new Set());
  const componentMetaRef = useRef<Record<string, string>>({});

  // Listen for event triggered by EmployeeSummaryPanel's button
  useEffect(() => {
    const handleOpenModal = () => setIsModalOpen(true);
    window.addEventListener("open-compensation-modal", handleOpenModal);
    return () => window.removeEventListener("open-compensation-modal", handleOpenModal);
  }, []);

  const savedCustomizationRef = useRef({
    isCustom: Boolean(formData._isCustomStructure),
    overrides: { ...(formData._componentOverrides ?? {}) } as Record<string, number>,
    formulaOverrides: { ...(formData._componentFormulaOverrides ?? {}) } as Record<string, FormulaOverride>,
    customDefs: [...(formData._customComponents ?? [])] as SalaryComponentDef[],
    excludedComponents: new Set<string>(formData._excludedComponents ?? []),
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
  const [baseInput, setBaseInput] = useState<number | null>(toNum(formData.basicSalary) || null);
  const [grossInput, setGrossInput] = useState<number | null>(toNum(formData.grossSalary) || null);
  const initialSalaryRef = useRef({
    base: toNum(formData.basicSalary),
    gross: toNum(formData.grossSalary),
    structure: formData.salaryStructure || "",
  });

  const [computedGross, setComputedGross] = useState<number | null>(null);
  const [computedBase, setComputedBase] = useState<number | null>(null);

  const currency = formData.currency || baseCurrency || "";
  const currencyPrefix = currencySymbol || currency || "";

  const selectedCustom = useMemo(() => customComponents.filter((c) => c.selected), [customComponents]);
  const customDefs = useMemo(() => selectedCustom.map((c) => c.def), [selectedCustom]);

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

  // NOTE: customizationCount / hasCustomizations must be declared here —
  // *before* the useCustomCompensationPayload call below — since that hook
  // receives hasCustomizations as an argument. Because these are `const`
  // (not hoisted like function declarations), referencing them before this
  // point throws "used before its declaration" (ts(2448) / ts(2454)).
  const customizationCount =
    Object.keys(overrides).length +
    Object.keys(formulaOverrides).length +
    selectedCustom.length;
  const hasCustomizations = customizationCount > 0;

  useCustomCompensationPayload({
    formData,
    isCustomizing,
    hasCustomizations,
    effectiveComponentDefs,
    excludedComponents,
    overrides,
    salaryResult,
    stableHandleInputChange,
    toNameKey,
    buildCustomCompensationPayload,
  });

  const hasPendingEarning = customComponents.some((c) => c.def.type === "Earning" && !c.selected);
  const hasPendingDeduction = customComponents.some((c) => c.def.type === "Deduction" && !c.selected);

  // Whether there's anything at all to show in the Salary Configuration
  // card / empty-state branches below (structure components + any custom
  // components added, whether or not they're pending selection).
  const hasComponents = effectiveComponentDefs.length > 0 || customComponents.length > 0;

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

useEffect(() => {
    const saved = savedCustomizationRef.current;
    const hasSavedCustomization =
      saved.isCustom ||
      Object.keys(saved.overrides).length > 0 ||
      Object.keys(saved.formulaOverrides).length > 0 ||
      saved.customDefs.length > 0 ||
      saved.excludedComponents.size > 0;

    if (formData.salaryStructure && !componentDefs.length) {
     
      loadStructure(formData.salaryStructure, hasSavedCustomization);
    } else if (
      !formData.salaryStructure &&
      (saved.isCustom || saved.customDefs.length > 0)
    ) {
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
    const result = calculateSalary(base, effectiveComponentDefs, overrides, taxConfig);
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
    const base = solveBaseFromGross(gross, effectiveComponentDefs, 0.01, 60, taxConfig);
    const result = calculateSalary(base, effectiveComponentDefs, overrides, taxConfig);
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
    const result = calculateSalary(base, effectiveComponentDefs, overrides, taxConfig);
    setSalaryResult(result);
    setComputedGross(result.gross);
    setGrossInput(result.gross);
    setComputedBase(null);
  }, [componentDefs]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!effectiveComponentDefs.length || taxConfig === undefined) return;
    const base = toNum(baseInput);
    if (!base) return;
    const result = calculateSalary(base, effectiveComponentDefs, overrides, taxConfig);
    setSalaryResult(result);
    setComputedGross(result.gross);
    stableHandleInputChange("_salaryResult", result);
    stableHandleInputChange("grossSalary", String(result.gross));
  }, [taxConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!effectiveComponentDefs.length) return;
    const base = toNum(baseInput);
    if (!base) return;
    const result = calculateSalary(base, effectiveComponentDefs, overrides, taxConfig);
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

  const applySavedCustomization = () => {
    const saved = savedCustomizationRef.current;
    if (saved.isCustom) setIsCustomizing(true);
    if (Object.keys(saved.overrides).length) setOverrides(saved.overrides);
    if (Object.keys(saved.formulaOverrides).length) setFormulaOverrides(saved.formulaOverrides);
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
const handleSalaryStructureChange = useCallback((val: any) => {
  const value = typeof val === "string" ? val : val?.value;
  if (!value) return;

  if (value === "Custom") {
    stableHandleInputChange("salaryStructure", "");
    setComponentDefs([]);
    setIsCustomizing(true);
    return;
  }

  stableHandleInputChange("salaryStructure", value);
  loadStructure(value, false);
}, []); 

  const handleTaxSlabChange = useCallback((val: any) => {
    const value = typeof val === "string" ? val : val?.value || "";
    stableHandleInputChange("Taxslab", value);
    if (value) {
      loadTaxConfig(value);
    } else {
      setTaxConfig(null);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCurrencyOptions = async (q: string) => {
    const list = await getCurrencyList({ search: q, page: 1, page_size: 20 });
    return (list || []).map((c: any) => ({
      label: `${c.name}${c.symbol ? ` (${c.symbol})` : ""}`,
      value: c.name,
    }));
  };

const fetchComponentOptions = useCallback(
    async (type: ComponentType, query: string): Promise<ComponentOption[]> => {
      const res = await getAllSalaryComponents(0, 20, query);

      const blocked = new Set(
        [
          ...componentDefs
            .filter((d) => {
              const nameKey = toNameKey(d.salary_component || "");
              const abbrKey = toAbbrKey(d.abbr ?? d.salary_component_abbr);
           
              const isExcluded =
                excludedComponents.has(nameKey) ||
                (abbrKey !== null && excludedComponents.has(abbrKey));
              return !isExcluded;
            })
            .map((d) => d.salary_component),
          ...selectedCustom.map((c) => c.def.salary_component),
        ]
          .filter((n): n is string => !!n?.trim())
          .map((n) => n.toLowerCase().trim()),
      );

      return (res?.data || [])
        .filter((c: any) => c?.name && !blocked.has(String(c.name).toLowerCase().trim()))
        .filter(
          (c: any) => String(c?.type ?? "").toLowerCase() === type.toLowerCase(),
        )
        .map((c: any) => {
          componentMetaRef.current[c.name] = c.abbr || c.name;
          return { label: c.name, value: c.name };
        });
    },
    [componentDefs, selectedCustom, excludedComponents],
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
                    amount_based_on_formula: details.amount_based_on_formula ?? 0,
                    formula: details.formula ?? "",
                    abbr,
                    salary_component_abbr: abbr,
                    depends_on_payment_days: details.depends_on_payment_days ?? 0,
                    is_tax_applicable: details.is_tax_applicable ?? 0,
                    is_income_tax_component: details.is_income_tax_component ?? 0,
                    variable_based_on_taxable_salary:
                      details.variable_based_on_taxable_salary ?? 0,
                      statistical_component: details.statistical_component ?? 0, 
                  },
                }
              : c,
          ),
        );
      } catch (err) {
        console.error("Failed to load salary component details:", err);
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

  const handleToggleCustomFormulaMode = useCallback(
    (id: string, isCustomRow: boolean) => {
      const computedAmount = salaryResult?.components.find((c) => c.key === id)?.amount;

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
          amount_based_on_formula: switchingToFixed ? 0 : 1,
          formula: prev[id]?.formula ?? "",
        },
      }));

      setOverrides((prev) => {
        if (switchingToFixed) {
          if (computedAmount === undefined) return prev;
          return { ...prev, [id]: computedAmount };
        }
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
          prev.map((c) => (c.id === id ? { ...c, def: { ...c.def, formula } } : c)),
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
        amount_based_on_formula: componentDefsWithOverrides[i]?.amount_based_on_formula,
        formula: componentDefsWithOverrides[i]?.formula ?? c.formula,
        flags: {
          depends_on_payment_days: componentDefsWithOverrides[i]?.depends_on_payment_days as 0 | 1 | undefined,
          is_tax_applicable: componentDefsWithOverrides[i]?.is_tax_applicable as 0 | 1 | undefined,
          is_income_tax_component: componentDefsWithOverrides[i]?.is_income_tax_component as 0 | 1 | undefined,
          variable_based_on_taxable_salary: componentDefsWithOverrides[i]?.variable_based_on_taxable_salary as 0 | 1 | undefined,
        },
      }));

    const structureRows = structureRowsAll.filter((r) => !excludedComponents.has(r.editId));
    const removedStructureRows = structureRowsAll.filter((r) => excludedComponents.has(r.editId));

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
            depends_on_payment_days: cc?.def.depends_on_payment_days as 0 | 1 | undefined,
            is_tax_applicable: cc?.def.is_tax_applicable as 0 | 1 | undefined,
            is_income_tax_component: cc?.def.is_income_tax_component as 0 | 1 | undefined,
            variable_based_on_taxable_salary: cc?.def.variable_based_on_taxable_salary as 0 | 1 | undefined,
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
      removedEarningRows: removedStructureRows.filter((c) => c.type === "Earning"),
      removedDeductionRows: removedStructureRows.filter((c) => c.type === "Deduction"),
    };
  }, [
    salaryResult,
    componentDefs,
      hasCustomizations,   
    componentDefsWithOverrides,
    customComponents,
    selectedCustom,
    excludedComponents,
  ]);

  // Only the "live" (selected / resolved) rows are shown in the read-only summary.
  // Pending rows (a component slot added but not yet picked) only matter inside
  // the customize modal, so they're left out here.
  const visibleEarningRows = useMemo(
    () => earningRows.filter((r) => r.selected),
    [earningRows],
  );
  const visibleDeductionRows = useMemo(
    () => deductionRows.filter((r) => r.selected),
    [deductionRows],
  );

  const shownBase = activeField.current === "gross" ? computedBase : baseInput;
  const shownGross = activeField.current === "base" ? computedGross : grossInput;

  const isLoading = isLoadingStructure || isLoadingTax;
  const showComponentsPanel = !isLoading && (hasComponents || isCustomizing);

  return (
    <div className="w-full flex flex-col gap-4 min-w-0">
      <SalarySetupSection
        formData={formData}
        hasCustomizations={hasCustomizations}
        isLoadingTax={isLoadingTax}
        getAllSalaryStructures={getAllSalaryStructures}
        fetchCurrencyOptions={fetchCurrencyOptions}
        handleSalaryStructureChange={handleSalaryStructureChange}
        handleTaxSlabChange={handleTaxSlabChange}
        stableHandleInputChange={stableHandleInputChange}
      />

      {isLoading && (
        <div className="flex items-center gap-2 mt-2">
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted">
            {isLoadingStructure ? "Loading components…" : "Loading tax config…"}
          </span>
        </div>
      )}

      {/* Salary Configuration card: title on the left, Effective from / Base /
          Gross salary inputs plus the Customize button on the right — all in
          one header row. Earnings / Deductions summary sits below, split
          into two columns with a vertical divider. */}
      {showComponentsPanel && (
        <div className="bg-card rounded-xl border border-theme shadow-sm overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-5 pt-5 pb-4">
            <div className="flex items-center gap-2 min-w-0 shrink-0">
              <h3 className="text-lg font-bold text-main truncate">
                Salary Configuration
              </h3>
              {hasCustomizations && (
                <Badge tone="primary">Customized</Badge>
              )}
            </div>

            <div className="flex flex-wrap items-end gap-3">
              {/* Each Field is wrapped in a fixed-width, non-shrinking box.
                  Field's inner input uses w-full internally, which — as a
                  direct flex child with no width constraint — will otherwise
                  try to claim the *entire* row width and force every field
                  onto its own line. Giving it an explicit width here fixes
                  that collapse. */}
              <div className="w-36 shrink-0">
                <Field label="Effective from">
                  <DatePickerInput
                    name="effectiveFrom"
                    value={formData.effectiveFrom || ""}
                    required={salaryChanged}
                    disabled={!isEditMode}
                    onChange={(name, value) => stableHandleInputChange(name, value)}
                  />
                </Field>
              </div>

              <div className="w-36 shrink-0">
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
                      className="w-full h-9 !text-xs !px-2.5"
                    />
                  </div>
                </Field>
              </div>

              <div className="w-36 shrink-0">
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
                      className="w-full h-9 !text-xs !px-2.5"
                    />
                  </div>
                </Field>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-white text-xs font-semibold rounded-lg shadow hover:bg-primary/90 transition-all shrink-0"
              >
                <FaSlidersH className="w-3 h-3" />
                <span>Customize</span>
              </button>
            </div>
          </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x divide-theme border-t border-theme">
            {/* Earnings */}
            <div className="px-5 py-5 flex flex-col">
              <div className="flex items-center gap-1.5 mb-2">
                <ArrowUpRight className="w-3.5 h-3.5 text-success" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
                  Earnings
                </span>
              </div>
              {visibleEarningRows.length > 0 ? (
                <>
                  {visibleEarningRows.map((row) => (
                    <div
                      key={row.editId}
                      className="flex justify-between items-center py-2.5 border-b border-theme/60 last:border-0"
                    >
                      <span className="text-[13px] text-main truncate pr-2" title={row.name}>
                        {row.name}
                      </span>
                      <span className="text-[13px] font-bold text-success tabular-nums shrink-0">
                        {currencyPrefix} {fmt(row.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 mt-auto border-t-2 border-success/30">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-success">
                      Total Earning
                    </span>
                    <span className="text-sm font-extrabold text-success tabular-nums shrink-0">
                      {currencyPrefix} {fmt(salaryResult?.gross ?? 0)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted italic py-2">No earnings</p>
              )}
            </div>
            {/* Deductions */}
            <div className="px-5 py-5 flex flex-col">
              <div className="flex items-center gap-1.5 mb-2">
                <ArrowDownRight className="w-3.5 h-3.5 text-danger" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
                  Deductions
                </span>
              </div>
              {visibleDeductionRows.length > 0 ? (
                <>
                  {visibleDeductionRows.map((row) => (
                    <div
                      key={row.editId}
                      className="flex justify-between items-center py-2.5 border-b border-theme/60 last:border-0"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        <span className="text-[13px] text-main truncate" title={row.name}>
                          {row.name}
                        </span>
                        {/* {!!row.flags?.variable_based_on_taxable_salary && (
                          <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded px-1.5 py-0.5 shrink-0">
                            Var
                          </span>
                        )} */}
                      </div>
                      <span className="text-[13px] font-bold text-danger tabular-nums shrink-0">
                        {currencyPrefix} {fmt(row.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 mt-auto border-t-2 border-danger/30">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-danger">
                      Total Deduction
                    </span>
                    <span className="text-sm font-extrabold text-danger tabular-nums shrink-0">
                      {currencyPrefix} {fmt(salaryResult?.deductionsTotal ?? 0)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted italic py-2">No deductions</p>
              )}
            </div>
          </div>
        </div>
      )}

      <CompensationReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employeeName={[formData.firstName, formData.lastName].filter(Boolean).join(" ")}
        currencyPrefix={currencyPrefix}
        salaryResult={salaryResult}
        salaryStructureName={formData.salaryStructure}
        hasCustomizations={hasCustomizations}
        onResetCustomizations={handleResetAllCustomizations}
        baseSalaryInput={toNum(baseInput)}
  onBaseSalaryChange={(val) => {
    setBaseInput(val);
    stableHandleInputChange("basicSalary", val ? String(val) : "");
  }}
        grossSalaryInput={toNum(grossInput)}
  onGrossSalaryChange={(val) => {
    setGrossInput(val);
    stableHandleInputChange("grossSalary", val ? String(val) : "");
  }}
      >
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
      </CompensationReviewModal>

      {!isLoading && !hasComponents && !isCustomizing && !formData.salaryStructure && (
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
      {!isLoading && !hasComponents && !isCustomizing && formData.salaryStructure && (
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