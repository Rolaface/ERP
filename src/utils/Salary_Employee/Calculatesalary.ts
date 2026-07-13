import type {
  CalcContext,
  CompKey,
  SalaryComponentDef,
  SalaryResult,
  TaxConfig,
} from "../../types/Salary_Employee/salaryTypes";
import { resolveAbbr, toNameKey, writeCtx } from "./Keys";
import { normaliseAmount, r2 } from "./salary_Utils";
import {
  assembleResults,
  runFixedAmountPass,
  runFormulaPassForType,
  runGrossPayPass,
  runTaxCalculation,
  runTaxVariablePass,
} from "./Passes";

export function calculateSalary(
  monthlyBase: number,
  components:  SalaryComponentDef[],
  overrides:   Record<string, number> = {},
  taxConfig?:  TaxConfig | null,
): SalaryResult {
  const empty: SalaryResult = {
    components: [], breakdown: {},
    gross: 0, deductionsTotal: 0, net: 0,
    resolvedBase: r2(monthlyBase), annualTax: 0, monthlyTax: 0,
  };
  if (!components.length) return empty;

  const normalisedComponents = components.map((c) => ({
    ...c,
    amount: normaliseAmount(c.amount),
  }));

  const keys: CompKey[] = normalisedComponents.map((c) => ({
    nameKey: toNameKey(c.salary_component),
    abbrKey: resolveAbbr(c),
  }));

  const ctx: CalcContext = {};
  writeCtx(ctx, "base", null, r2(monthlyBase), "base");

  // 1. Fixed-amount non-tax components (both Earnings and Deductions).
  runFixedAmountPass(normalisedComponents, keys, ctx, overrides);

  // 2. Formula-based Earning components — resolved first so their final
  //    values are available for gross_pay below.
  runFormulaPassForType(normalisedComponents, keys, ctx, overrides, "Earning");

  // 3. Compute gross_pay from resolved Earnings and inject it into ctx.
  const preTaxGross = runGrossPayPass(normalisedComponents, keys, ctx);

  // 4. Formula-based Deduction components — resolved after gross_pay exists,
  //    so formulas like `(gross_pay * 0.05) if (...) else 1861.80` work.
  runFormulaPassForType(normalisedComponents, keys, ctx, overrides, "Deduction");

  // 5. Income tax, from the resolved pre-tax gross.
  const { annualTax, monthlyTax } = runTaxCalculation(preTaxGross, taxConfig);
  writeCtx(ctx, "annual_tax",  null, annualTax,  "annual_tax");
  writeCtx(ctx, "monthly_tax", null, monthlyTax, "monthly_tax");

  // 6. Tax-variable components (depend on annual_tax / monthly_tax above).
  runTaxVariablePass(normalisedComponents, keys, ctx, monthlyTax);

  // 7. Assemble final result.
  const { resultComponents, breakdown } = assembleResults(normalisedComponents, keys, ctx);

  const gross = r2(
    resultComponents.filter((c) => c.type === "Earning").reduce((s, c) => s + c.amount, 0),
  );
  const deductionsTotal = r2(
    resultComponents.filter((c) => c.type === "Deduction").reduce((s, c) => s + c.amount, 0),
  );

  return {
    components: resultComponents,
    breakdown,
    gross,
    deductionsTotal,
    net:          r2(gross - deductionsTotal),
    resolvedBase: r2(monthlyBase),
    annualTax,
    monthlyTax,
  };
}