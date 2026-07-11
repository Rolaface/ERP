// Public entry point for the salary calculation module.
// Other files should import from here (e.g. `from ".../Salary_Employee/Index"`),
// not reach into individual files directly — this keeps the internal file
// split free to change without breaking consumers.
//
// Note: component TYPES (SalaryComponentDef, SalaryResult, ComponentType,
// etc.) live in ../../types/Salary_Employee/salaryTypes, not here — import
// those directly from that path, same as CompensationTab.tsx already does.

export { r2 } from "./salary_Utils";
export { toNameKey, toAbbrKey } from "./Keys";
export { evaluateFormula } from "./Formula";
export { calculateAnnualTax } from "./Tax";
export { calculateSalary } from "./Calculatesalary";
export { solveBaseFromGross } from "./Solvebasefromgross";
export { structureToComponents, buildCompensationPayload } from "./Structuremapping";