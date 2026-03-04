import {
  getPackagingUnits,
  getCountries,
  getUOMs,
  getItemClasses,
  getRolaPackagingUnits,
  getRolaCountries,
  getRolaUOMs,
  getRolaItemClasses,
} from "../api/itemZraApi";

// Map of function names to actual functions
export const API_REGISTRY = {
  getPackagingUnits,
  getCountries,
  getUOMs,
  getItemClasses,
  getRolaPackagingUnits,
  getRolaCountries,
  getRolaUOMs,
  getRolaItemClasses,
} as const;

export type ApiRegistryKey = keyof typeof API_REGISTRY;

// Helper to get API function by name
export function getApiFunction(functionName: string) {
  if (functionName in API_REGISTRY) {
    return API_REGISTRY[functionName as ApiRegistryKey];
  }

  console.error(`API function "${functionName}" not found in registry`);
  return null;
}
