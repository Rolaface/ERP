export type ProductId = "erp" | "lms";

export interface RawSubscribedModules {
  erp?: {
    enabled?: boolean;
    sales?: boolean;
    customer?: boolean;
    procurement?: boolean;
    inventory?: {
      warehouse?: boolean;
      stockEntry?: boolean;
      item?: boolean;
    };
    accounting?: boolean;
    assets?: boolean;
    settings?: {
      bank?: boolean;
      email?: boolean;
      company?: boolean;
      userAndRoles?: boolean;
      scheduler?: boolean;
      taxMain?: {
        taxCategory?: boolean;
        salesTax?: boolean;
        itemTax?: boolean;
      };
    };
  };
  hrms?: {
    enabled?: boolean;
    settings?: {
      bank?: boolean;
      email?: boolean;
      company?: boolean;
      userAndRoles?: boolean;
    };
    expenseManagement?: boolean;
  };
  lending?: {
    enabled?: boolean;
  };
  los?: {
    enabled?: boolean;
  };
}



export function deriveSubscribedProducts(
  raw: RawSubscribedModules | null | undefined,
): ProductId[] {
  const hasErpSide = raw?.erp?.enabled === true || raw?.hrms?.enabled === true;
  const hasLms = raw?.lending?.enabled === true || raw?.los?.enabled === true;

  if (hasErpSide && hasLms) return ["erp", "lms"];
  if (hasLms && !hasErpSide) return ["lms"];
  if (hasErpSide && !hasLms) return ["erp"];


  console.warn(
    "[productClassifier] Neither 'erp'/'hrms' nor 'lending' found in subscribed_modules:",
    raw,
  );
  return ["erp"];
}