import { create } from "zustand";
import type { RawSubscribedModules } from "../utils/productClassifier";


interface SubscriptionState {
  raw: RawSubscribedModules | null;
  isLoading: boolean;
  setSubscription: (raw: RawSubscribedModules | null | undefined) => void;
  clearSubscription: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  raw: null,
  isLoading: true,
  setSubscription: (raw) => set({ raw: raw ?? null, isLoading: false }),
  clearSubscription: () => set({ raw: null, isLoading: false }),
}));


export interface SubscriptionAccess {
  hasErpKey: boolean;
  inventory: boolean;
  hasHrmsKey: boolean;
  expenseManagement: boolean;
  lending: boolean;
  los: boolean;
  sales: boolean;
  customer: boolean;
  procurement: boolean;
  accounting: boolean;
  assets: boolean;
  scheduler: boolean;
  taxMaintenance: boolean;
  importAccess: boolean;
  settingsAccess: (key: "bank" | "email" | "company" | "userAndRoles") => boolean;
}

export function useSubscriptionAccess(): SubscriptionAccess & { isLoading: boolean } {
  const raw = useSubscriptionStore((s) => s.raw);
  const isLoading = useSubscriptionStore((s) => s.isLoading);
  const erpEnabled = raw?.erp?.enabled === true;
  const hrmsEnabled = raw?.hrms?.enabled === true;
  const lendingEnabled = raw?.lending?.enabled === true;
  const losEnabled = raw?.los?.enabled === true;

  const taxMain = raw?.erp?.settings?.taxMain;
  const inv = raw?.erp?.inventory;
  const hasInventoryAccess = erpEnabled && !!(inv?.item || inv?.warehouse || inv?.stockEntry);

  return {
    isLoading,
    hasErpKey: erpEnabled,
    inventory: hasInventoryAccess,
    hasHrmsKey: hrmsEnabled,
    sales: erpEnabled && raw?.erp?.sales === true,
    customer: erpEnabled && raw?.erp?.customer === true,
    procurement: erpEnabled && raw?.erp?.procurement === true,
    accounting: erpEnabled && raw?.erp?.accounting === true,
    assets: erpEnabled && raw?.erp?.assets === true,
    scheduler: erpEnabled && raw?.erp?.settings?.scheduler === true,
    expenseManagement: hrmsEnabled && raw?.hrms?.expenseManagement === true,
    lending: lendingEnabled,
    los: losEnabled,
    taxMaintenance: erpEnabled && !!(taxMain?.itemTax || taxMain?.salesTax || taxMain?.taxCategory),
    importAccess:
      erpEnabled &&
      (raw?.erp?.sales === true || raw?.erp?.procurement === true || hasInventoryAccess),
    settingsAccess: (key) =>
      (erpEnabled && raw?.erp?.settings?.[key] === true) ||
      (hrmsEnabled && raw?.hrms?.settings?.[key] === true),
  };
}