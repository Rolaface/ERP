import { useMemo } from "react";
import { create } from "zustand";
import {
  getModuleList,
  hasModule,
  type RawSubscribedModules,
} from "../utils/productClassifier";

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

  return useMemo(() => {
    const erpEnabled = getModuleList(raw, "ERP").length > 0;
    const hrmsEnabled = getModuleList(raw, "HRMS").length > 0;
    const erp = (name: string) => hasModule(raw, "ERP", name);

    const sales = erp("Sales");
    const procurement = erp("Procurement");
    const inventory = erp("Inventory");

    return {
      isLoading,
      hasErpKey: erpEnabled,
      hasHrmsKey: hrmsEnabled,
      sales,
      customer: erp("Customer"),
      procurement,
      inventory,
      accounting: erp("Accounting"),
      assets: erp("Assets"),
      expenseManagement: hasModule(raw, "HRMS", "Expense Management"),
      lending: getModuleList(raw, "LMS").length > 0,
      los: getModuleList(raw, "LOS").length > 0,

      importAccess: sales || procurement || inventory,

      scheduler: erpEnabled,
      taxMaintenance: erpEnabled,
      settingsAccess: () => erpEnabled || hrmsEnabled,
    };
  }, [raw, isLoading]);
}