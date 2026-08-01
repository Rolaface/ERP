const ERP_KEY = "hrms";
const LMS_KEY = "lending";

export type ProductId = "erp" | "lms";

export function deriveSubscribedProducts(subscribedModules: string[] = []): ProductId[] {
  const normalized = subscribedModules.map((m) => m.toLowerCase().trim());

  const hasERP = normalized.includes(ERP_KEY);
  const hasLMS = normalized.includes(LMS_KEY);

  if (hasERP && hasLMS) return ["erp", "lms"];
  if (hasLMS && !hasERP) return ["lms"];
  if (hasERP && !hasLMS) return ["erp"];

  console.warn(
    "[productClassifier] Neither 'hrms' nor 'lending' found in subscribed_modules:",
    subscribedModules
  );
  return ["erp"];
}