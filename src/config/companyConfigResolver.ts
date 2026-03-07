import { ZRA_ITEM_FIELDS } from "../companies/companyConfig";
import { COMP_00004_ITEM_FIELDS } from "../companies/RolConfig";
import type { FieldConfig } from "../types/fieldConfig.types";

export function getItemFieldConfigs(companyCode: string): FieldConfig[] {
  const code = companyCode?.toUpperCase(); // Convert to uppercase for matching

  switch (code) {
    case "ZRA":
      return ZRA_ITEM_FIELDS;
    case "ROLA":
      return COMP_00004_ITEM_FIELDS;
    case "COMP-00004":
      return COMP_00004_ITEM_FIELDS;
    default:
      console.warn(`Unknown company code: ${code}, falling back to ZRA`);
      return ZRA_ITEM_FIELDS;
  }
}
