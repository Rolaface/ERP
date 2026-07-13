/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { CustomComponent } from "./types";
import type { SalaryComponentDef } from "../../../../utils/Salary_Employee/salaryengine";

export const fmt = (n: number) => n.toLocaleString();

export const toNum = (v: any): number => {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : parseFloat(v);
  return isNaN(n) ? 0 : n;
};

let customIdSeq = 0;
export const nextCustomId = () => `custom_${Date.now()}_${customIdSeq++}`;

// Builds CustomComponent[] state from a persisted def list (used to restore
// employee-specific components when re-opening this tab in edit mode).
export const hydrateCustomComponents = (
  defs: SalaryComponentDef[] | undefined | null,
): CustomComponent[] =>
  (defs ?? [])
    .filter((d) => d?.salary_component)
    .map((def) => ({ id: nextCustomId(), selected: true, def }));
