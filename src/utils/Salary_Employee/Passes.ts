// calculateSalary used to be one long function with six numbered comment
// blocks inline. Each of those blocks is now its own named function here,
// called in order from Calculatesalary.ts.
//
// One addition vs. the original single file: runGrossPayPass() sits between
// the Earning formula pass and the Deduction formula pass, injecting
// "gross_pay" into ctx — a generic always-available variable, same pattern
// as annual_tax / monthly_tax further down. Previously "gross_pay" never
// existed in ctx, so any Deduction formula referencing it (e.g. NAPSA,
// SSF-style contributions) silently evaluated to 0.

import type {
  CalcContext,
  ComponentResult,
  ComponentType,
  CompKey,
  SalaryComponentDef,
  TaxConfig,
} from "../../types/Salary_Employee/salaryTypes";
import { isTaxComponent, writeCtx } from "./Keys";
import { evaluateFormula } from "./Formula";
import { calculateAnnualTax } from "./Tax";
import { r2 } from "./salary_Utils";

// Pass 1 — fixed-amount (non-formula) components, excluding tax components.
// Tax components are handled later, once monthlyTax is known
// (see runTaxVariablePass).
export function runFixedAmountPass(
  components: SalaryComponentDef[],
  keys:       CompKey[],
  ctx:        CalcContext,
  overrides:  Record<string, number>,
): void {
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    if (comp.amount_based_on_formula === 1 || isTaxComponent(comp)) continue;

    const { nameKey, abbrKey } = keys[i];
    const override = overrides[nameKey] ?? (abbrKey ? overrides[abbrKey] : undefined);
    writeCtx(ctx, nameKey, abbrKey, r2(override ?? comp.amount), comp.salary_component);
  }
}

// Resolves formula-based, non-tax components of a single ComponentType,
// re-evaluating up to 10 times so components can reference each other
// (e.g. "HRA = BS*0.3" needs "basic" resolved first). Used for both the
// Earnings pass and the Deductions pass — same stabilising-loop logic, just
// filtered to one type at a time so Earnings fully settle before
// Deductions run (Deductions may depend on gross_pay, see runGrossPayPass).
export function runFormulaPassForType(
  components: SalaryComponentDef[],
  keys:       CompKey[],
  ctx:        CalcContext,
  overrides:  Record<string, number>,
  type:       ComponentType,
): void {
  for (let pass = 0; pass < 10; pass++) {
    let changed = false;
    for (let i = 0; i < components.length; i++) {
      const comp = components[i];
      if (
        comp.type !== type ||
        comp.amount_based_on_formula !== 1 ||
        isTaxComponent(comp)
      ) continue;

      const { nameKey, abbrKey } = keys[i];
      const override = overrides[nameKey] ?? (abbrKey ? overrides[abbrKey] : undefined);
      const next     = r2(
        override !== undefined
          ? override
          : evaluateFormula(comp.formula ?? "", ctx),
      );

      if (next !== (ctx[nameKey] ?? 0)) {
        changed = true;
        writeCtx(ctx, nameKey, abbrKey, next, comp.salary_component);
      }
    }
    if (!changed) break;
  }
}

// Sums the resolved amount of every Earning component out of ctx.
export function sumEarnings(
  components: SalaryComponentDef[],
  keys:       CompKey[],
  ctx:        CalcContext,
): number {
  let total = 0;
  for (let i = 0; i < components.length; i++) {
    if (components[i].type === "Earning") {
      total += ctx[keys[i].nameKey] ?? 0;
    }
  }
  return r2(total);
}

// Injects "gross_pay" into ctx as a generic, always-available variable —
// same pattern as annual_tax / monthly_tax. Not tied to any specific
// component; any Deduction formula (NAPSA, SSF, or anything the API sends)
// can reference it once this runs. Must run AFTER Earning formulas are
// resolved (runFormulaPassForType(..., "Earning")) and BEFORE Deduction
// formulas are resolved, since Deductions are the ones expected to read it.
export function runGrossPayPass(
  components: SalaryComponentDef[],
  keys:       CompKey[],
  ctx:        CalcContext,
): number {
  const grossPay = sumEarnings(components, keys, ctx);
  writeCtx(ctx, "gross_pay", null, grossPay, "gross_pay");
  return grossPay;
}

// Income tax, computed from the resolved pre-tax gross.
export function runTaxCalculation(
  preTaxGross: number,
  taxConfig:   TaxConfig | null | undefined,
): { annualTax: number; monthlyTax: number } {
  if (!taxConfig) return { annualTax: 0, monthlyTax: 0 };
  const annualTax  = calculateAnnualTax(preTaxGross * 12, taxConfig);
  const monthlyTax = r2(annualTax / 12);
  return { annualTax, monthlyTax };
}

// Tax-variable components (income tax lines etc.), resolved last since they
// depend on annual_tax / monthly_tax already being in ctx.
export function runTaxVariablePass(
  components: SalaryComponentDef[],
  keys:       CompKey[],
  ctx:        CalcContext,
  monthlyTax: number,
): void {
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    if (!isTaxComponent(comp)) continue;

    const { nameKey, abbrKey } = keys[i];
    const taxAmount = r2(
      comp.amount_based_on_formula === 1 && comp.formula?.trim()
        ? evaluateFormula(comp.formula, ctx)
        : monthlyTax,
    );
    writeCtx(ctx, nameKey, abbrKey, taxAmount, comp.salary_component);
  }
}

// Turns ctx into the final ComponentResult[] + breakdown map.
export function assembleResults(
  components: SalaryComponentDef[],
  keys:       CompKey[],
  ctx:        CalcContext,
): { resultComponents: ComponentResult[]; breakdown: Record<string, number> } {
  const resultComponents: ComponentResult[] = components.map((comp, i) => ({
    name:      comp.salary_component,
    key:       keys[i].nameKey,
    abbrKey:   keys[i].abbrKey,
    amount:    r2(ctx[keys[i].nameKey] ?? 0),
    formula:   comp.formula ?? "",
    isFormula: comp.amount_based_on_formula === 1,
    type:      comp.type,
  }));

  const breakdown: Record<string, number> = {};
  for (const { key, abbrKey, amount, name } of resultComponents) {
    writeCtx(breakdown, key, abbrKey, amount, name);
  }

  return { resultComponents, breakdown };
}