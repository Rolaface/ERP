import type {
  CompensationPayload,
  ComponentType,
  SalaryComponentDef,
  SalaryResult,
} from "../../types/Salary_Employee/salaryTypes";
import { normaliseAmount, r2 } from "./salary_Utils";

export function structureToComponents(
  structureData: Record<string, unknown>,
): SalaryComponentDef[] {
  const normalize = (row: Record<string, unknown>, type: ComponentType): SalaryComponentDef => ({
    ...(row as SalaryComponentDef),
    type,
    amount:                normaliseAmount((row as SalaryComponentDef).amount),
    abbr:                  (row.abbr ?? row.salary_component_abbr ?? "") as string,
    salary_component_abbr: (row.abbr ?? row.salary_component_abbr ?? "") as string,
  });

  const earnings   = Array.isArray(structureData.earnings)   ? structureData.earnings   : [];
  const deductions = Array.isArray(structureData.deductions) ? structureData.deductions : [];

  return [
    ...earnings.map(  (r: unknown) => normalize(r as Record<string, unknown>, "Earning")),
    ...deductions.map((r: unknown) => normalize(r as Record<string, unknown>, "Deduction")),
  ];
}

export function buildCompensationPayload(
  formData: Record<string, unknown>,
  result:   SalaryResult,
): CompensationPayload {
  const mapPaymentMode = (method: unknown): string | null => {
    const m = String(method ?? "").toLowerCase();
    if (m.includes("bank"))   return "Bank";
    if (m.includes("mobile")) return "Mobile";
    if (m.includes("cash"))   return "Cash";
    return (method as string) || null;
  };

  const basicComp = result.components.find(
    (c) =>
      c.type === "Earning" &&
      (c.abbrKey === "bs" || c.key === "basic_salary" || c.key === "basic"),
  );

  return {
    salary_structure:  (formData.salaryStructure as string) ?? null,
    base_salary:       r2(basicComp?.amount ?? result.gross),
    components:        result.components.map(({ name, key, abbrKey, amount, type }) => ({
      name, key, abbrKey, amount: r2(amount), type,
    })),
    gross:             r2(result.gross),
    deductions_total:  r2(result.deductionsTotal),
    net:               r2(result.net),
    salary_mode:       mapPaymentMode(formData.paymentMethod),
    salary_currency:   (formData.currency     as string) ?? null,
    bank_name:         (formData.bankName      as string) ?? null,
    bank_ac_no:        (formData.accountNumber as string) ?? null,
    account_type:      (formData.accountType   as string) ?? null,
    branch_code:       (formData.branchCode    as string) ?? null,
  };
}