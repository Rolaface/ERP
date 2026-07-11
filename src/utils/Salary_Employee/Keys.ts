import type { CalcContext, SalaryComponentDef } from "../../types/Salary_Employee/salaryTypes";
import { isValidIdentifier } from "./salary_Utils";

// Converts any component name into a valid JS identifier.
// Keeps only [a-z0-9], collapses everything else into a single underscore.
// "SSF Employee Contribution 5.5%" → "ssf_employee_contribution_5_5"
// "HRA/Transport (Monthly)"        → "hra_transport_monthly"
//
// Exported so every consumer (calculateSalary, CompensationTab's
// override-lookup, etc.) hashes component names the exact same way. Two
// independent copies of this regex previously existed and could silently
// drift apart — always import this instead of re-implementing it.
export const toNameKey = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")  // any non-alphanumeric run → single underscore
    .replace(/^_+|_+$/g, "");     // trim leading/trailing underscores

// Exported for the same reason as toNameKey — single source of truth for
// how an abbreviation is normalised into a lookup key.
export const toAbbrKey = (abbr?: string | null): string | null =>
  abbr?.trim() ? abbr.trim().toLowerCase() : null;

export const resolveAbbr = (comp: SalaryComponentDef): string | null =>
  toAbbrKey(comp.abbr ?? comp.salary_component_abbr);

export const isTaxComponent = (comp: SalaryComponentDef): boolean =>
  comp.variable_based_on_taxable_salary === 1 ||
  comp.is_income_tax_component === 1;

// Writes a value into ctx under all reasonable lookup keys for a component.
// All keys are stored lowercase — case-insensitive resolution happens at
// formula evaluation time via normalizeCaseInFormula() (see Formula.ts),
// not here.
//
// Keys written (examples for "Basic Salary", abbr "BS"):
//   nameKey:   "basic_salary"
//   firstWord: "basic"           ← useful for short formulas like `basic * 0.4`
//   abbrKey:   "bs"
//   origSnake: "basic_salary"    ← snake_case of original name (usually same as nameKey)
//   camelCase: "BasicSalary"     ← for structures that use PascalCase in formulas
//
// To add a new alias pattern, add a write() call here.
export const writeCtx = (
  ctx:           CalcContext,
  nameKey:       string,
  abbrKey:       string | null,
  value:         number,
  originalName?: string,
): void => {
  const write = (k: string) => {
    if (isValidIdentifier(k)) ctx[k] = value;
  };

  write(nameKey);

  // First word of snake_case key — e.g. "basic" from "basic_salary"
  const firstWord = nameKey.split("_")[0];
  if (firstWord && firstWord !== nameKey) {
    write(firstWord);
  }

  if (originalName?.trim()) {
    const origLower = originalName.trim().toLowerCase();
    // Same sanitization as toNameKey — strips %, dots, parens, etc.
    const origSnake = origLower.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const origTitle = origLower.replace(/\b\w/g, (c) => c.toUpperCase());

    write(origSnake);                          // "ssf_employee_contribution_5_5"
    write(origTitle.replace(/\s+/g, ""));      // "BasicSalary"
  }

  if (abbrKey) {
    write(abbrKey);
  }
};