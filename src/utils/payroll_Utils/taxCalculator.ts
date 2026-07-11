

import { TAX_SLABS_OLD, TAX_SLABS_NEW, STANDARD_DEDUCTION } from "./constants";

export const calculateTax = (
  annualIncome: number,
  regime: "Old" | "New",
  investments = 0,
): number => {
  const slabs = regime === "Old" ? TAX_SLABS_OLD : TAX_SLABS_NEW;
  let taxable = annualIncome - STANDARD_DEDUCTION;
  if (regime === "Old") taxable -= investments;
  taxable = Math.max(0, taxable);

  let tax = 0;
  let remaining = taxable;
  for (const slab of slabs) {
    const slabAmount = Math.min(remaining, slab.max - slab.min);
    if (slabAmount > 0) {
      tax += (slabAmount * slab.rate) / 100;
      remaining -= slabAmount;
    }
    if (remaining <= 0) break;
  }
  return Math.round((tax * 1.04) / 12); // monthly TDS incl. 4% cess
};