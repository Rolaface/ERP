export type ProductId = "erp" | "lms";
export type SubscriptionProductKey = "ERP" | "LMS" | "LOS" | "HRMS";

export interface RawSubscribedModules {
  ERP?: string[];
  LMS?: string[];
  LOS?: string[];
  HRMS?: string[];
}

const norm = (s: string) => s.trim().toLowerCase();

export function getModuleList(
  raw: RawSubscribedModules | null | undefined,
  product: SubscriptionProductKey,
): string[] {
  if (!raw || typeof raw !== "object") return [];
  const target = product.toLowerCase();
  for (const [key, value] of Object.entries(raw)) {
    if (key.toLowerCase() === target && Array.isArray(value)) {
      return value.filter((v): v is string => typeof v === "string");
    }
  }
  return [];
}

export function hasModule(
  raw: RawSubscribedModules | null | undefined,
  product: SubscriptionProductKey,
  moduleName: string,
): boolean {
  const target = norm(moduleName);
  return getModuleList(raw, product).some((m) => norm(m) === target);
}

export function isLegacySubscriptionShape(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  return Object.values(raw as Record<string, unknown>).some(
    (v) => v !== null && typeof v === "object" && !Array.isArray(v),
  );
}

export function deriveSubscribedProducts(
  raw: RawSubscribedModules | null | undefined,
): ProductId[] {
  const hasErpSide =
    getModuleList(raw, "ERP").length > 0 || getModuleList(raw, "HRMS").length > 0;
  const hasLms =
    getModuleList(raw, "LMS").length > 0 || getModuleList(raw, "LOS").length > 0;

  if (hasErpSide && hasLms) return ["erp", "lms"];
  if (hasLms && !hasErpSide) return ["lms"];
  if (hasErpSide && !hasLms) return ["erp"];

  console.warn("[productClassifier] No ERP/HRMS/LMS/LOS modules found:", raw);
  return ["erp"];
}