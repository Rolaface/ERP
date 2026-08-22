import type { TaxConfig } from "../../types/Salary_Employee/salaryTypes";
import { normaliseAmount, r2 } from "./salary_Utils";

export function calculateAnnualTax(
  annualGross: number,
  taxConfig:   TaxConfig,
): number {
  if (!taxConfig?.slabs?.length) return 0;

  const exemption     = normaliseAmount(taxConfig.standard_tax_exemption_amount);
  const taxableIncome = Math.max(0, r2(annualGross) - exemption);
  if (taxableIncome <= 0) return 0;

  const reliefThreshold = normaliseAmount(taxConfig.tax_relief_limit);
  if (reliefThreshold > 0 && taxableIncome <= reliefThreshold) return 0;

  let slabTax = 0;
  for (const slab of taxConfig.slabs) {
    const from = normaliseAmount(slab.from_amount);
    const to   = slab.to_amount && slab.to_amount > 0
      ? normaliseAmount(slab.to_amount)
      : Infinity;
    const rate = normaliseAmount(slab.percent_deduction) / 100;

    if (rate === 0 || taxableIncome <= from) continue;
    slabTax += (Math.min(taxableIncome, to) - from) * rate;
  }

  let totalTax = slabTax;
  for (const charge of taxConfig.other_taxes_and_charges ?? []) {
    const rate = normaliseAmount(charge.percent) / 100;
    if (rate === 0) continue;

    const min = normaliseAmount(charge.min_taxable_income);
    const max = charge.max_taxable_income && charge.max_taxable_income > 0
      ? normaliseAmount(charge.max_taxable_income)
      : Infinity;

    if (taxableIncome >= min && taxableIncome <= max) {
      totalTax += slabTax * rate;
    }
  }

  return r2(Math.max(0, totalTax));
}