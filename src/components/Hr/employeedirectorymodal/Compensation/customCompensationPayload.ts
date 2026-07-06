import {
  toNameKey,
  toAbbrKey,
  r2,
  type SalaryComponentDef,
} from "../salaryengine";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CustomSalaryComponentPayload {
  component: string;
  formula?:  string;   // present only when amount_based_on_formula === 1
  amount?:   number;   // present only for plain fixed components
  // neither key present => backend-resolved (statutory / tax) component
}

export interface CustomCompensationPayload {
  base_salary:               number;
  is_custom_salary:          true;
  income_tax_slab:           string | null;
  custom_salary_components:  CustomSalaryComponentPayload[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const resolveAbbr = (comp: SalaryComponentDef): string | null =>
  toAbbrKey(comp.abbr ?? comp.salary_component_abbr);

// A component is "backend-resolved" (bare — no amount, no formula sent) when
// it's a statutory/statistical component or a tax-variable component. The
// backend computes these itself; sending a stale frontend amount would be
// wrong the moment the tax slab or contribution rate changes server-side.
export const isBackendResolvedComponent = (comp: SalaryComponentDef): boolean =>
  comp.statistical_component === 1 ||
  comp.variable_based_on_taxable_salary === 1 ||
  comp.is_income_tax_component === 1;

// ─── Public API ─────────────────────────────────────────────────────────────

// Builds the payload shape the backend expects for a fully custom (no
// salary_structure) compensation setup. Only called from the custom-build
// flow — structure-based employees keep using buildCompensationPayload in
// salaryengine.ts untouched.
export function buildCustomCompensationPayload(
  formData:    Record<string, unknown>,
  components:  SalaryComponentDef[],
  overrides:   Record<string, number>,
  monthlyBase: number,
): CustomCompensationPayload {
  const custom_salary_components: CustomSalaryComponentPayload[] = components.map((comp) => {
    const nameKey = toNameKey(comp.salary_component || "");
    const abbrKey = resolveAbbr(comp);
    const override = overrides[nameKey] ?? (abbrKey ? overrides[abbrKey] : undefined);

    if (isBackendResolvedComponent(comp)) {
      return { component: comp.salary_component };
    }

    if (comp.amount_based_on_formula === 1) {
      // Raw formula string goes out, not the evaluated number — the backend
      // re-evaluates it server-side against its own component context.
      return { component: comp.salary_component, formula: comp.formula ?? "" };
    }

    return {
      component: comp.salary_component,
      amount:    r2(override ?? comp.amount ?? 0),
    };
  });

  return {
    base_salary:       r2(monthlyBase),
    is_custom_salary:  true,
    income_tax_slab:   (formData.Taxslab as string) ?? null,
    custom_salary_components,
  };
}