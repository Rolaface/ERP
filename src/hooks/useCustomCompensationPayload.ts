import { useEffect, useMemo } from "react";
import type { SalaryComponentDef, SalaryResult } from "../components/Hr/employeedirectorymodal/salaryengine"; 
import type { CustomCompensationPayload } from "../components/Hr/employeedirectorymodal/Compensation/customCompensationPayload";

interface UseCustomCompensationPayloadArgs {
  formData:                Record<string, any>;
  isCustomizing:           boolean;
  hasCustomizations:       boolean;
  effectiveComponentDefs:  SalaryComponentDef[];
  excludedComponents:      Set<string>;
  overrides:               Record<string, number>;
  salaryResult:            SalaryResult | null;
  stableHandleInputChange: (field: string, value: any) => void;
  toNameKey:                (name: string) => string;
  buildCustomCompensationPayload: (
    formData:    Record<string, unknown>,
    components:  SalaryComponentDef[],
    overrides:   Record<string, number>,
    monthlyBase: number,
  ) => CustomCompensationPayload;
}

// Builds the custom (is_custom_salary) compensation payload and pushes it
// into formData as `_customCompensationPayload`, kept in sync whenever the
// underlying components, overrides, or base change.
//
// Fires in TWO cases:
//   1. No salary_structure selected at all (full custom build), OR
//   2. A structure IS selected but the user has customized it
//      (override/exclude/formula-change/added component — hasCustomizations).
//
// When neither is true (plain, untouched structure selection), any stale
// value is actively cleared so buildEmployeePayload falls back to the
// original structure-based shape — this is the ONLY place that decides the
// payload shape, so Employeeformconfig.ts can trust the field as-is.
export function useCustomCompensationPayload({
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
}: UseCustomCompensationPayloadArgs) {
  const componentsForCustomPayload = useMemo(
    () =>
      effectiveComponentDefs.filter((def) => {
        if (!def.salary_component) return false;
        const nameKey = toNameKey(def.salary_component || "");
        return !excludedComponents.has(nameKey);
      }),
    [effectiveComponentDefs, excludedComponents, toNameKey],
  );

  useEffect(() => {
    const shouldUseCustomPayload = !formData.salaryStructure || hasCustomizations;

    if (!shouldUseCustomPayload) {
      if (formData._customCompensationPayload) {
        stableHandleInputChange("_customCompensationPayload", null);
      }
      return;
    }

    if (!salaryResult) return;

    const customPayload = buildCustomCompensationPayload(
      formData,
      componentsForCustomPayload,
      overrides,
      salaryResult.resolvedBase,
    );
    stableHandleInputChange("_customCompensationPayload", customPayload);
  }, [
    formData.salaryStructure,
    hasCustomizations,
    componentsForCustomPayload,
    overrides,
    salaryResult,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  return { componentsForCustomPayload };
}