import type { SalaryComponentDef, TaxConfig } from "../../types/Salary_Employee/salaryTypes";
import { r2 } from "./salary_Utils";
import { calculateSalary } from "./Calculatesalary";

export function solveBaseFromGross(
  targetGross:  number,
  components:   SalaryComponentDef[],
  tolerance     = 0.01,
  maxIterations = 60,
  taxConfig?:   TaxConfig | null,
): number {
  if (targetGross <= 0) return 0;

  const hasFormulaEarnings = components.some(
    (c) => c.type === "Earning" && c.amount_based_on_formula === 1,
  );
  if (!hasFormulaEarnings) return 0;

  const calcGross = (base: number): number =>
    calculateSalary(base, components, {}, taxConfig).gross;

  let lo = 0;
  let hi = targetGross * 3;
  for (let i = 0; i < 25 && calcGross(hi) < targetGross; i++) hi *= 2;

  let bestBase = (lo + hi) / 2;

  for (let iter = 0; iter < maxIterations; iter++) {
    const mid   = (lo + hi) / 2;
    const gross = calcGross(mid);
    bestBase = mid;
    if (Math.abs(gross - targetGross) <= tolerance) break;
    if (gross < targetGross) lo = mid;
    else                     hi = mid;
  }

  
  const rounded = r2(bestBase);
  const step = 0.01;
  const candidates = [
    rounded - step * 2,
    rounded - step,
    rounded,
    rounded + step,
    rounded + step * 2,
  ].filter((b) => b >= 0);

  let closest = rounded;
  let closestDiff = Math.abs(calcGross(rounded) - targetGross);

  for (const candidate of candidates) {
    const diff = Math.abs(calcGross(candidate) - targetGross);
    if (diff < closestDiff) {
      closest = candidate;
      closestDiff = diff;
    }
  }

  return r2(closest);
}