import { useState, useCallback } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

export const MODULE_STRUCTURE: Record<string, string[]> = {
  Sales: [
    "Quotations",
    "Proforma Invoice",
    "Invoices",
    "Credit Notes",
    "Debit Notes",
    "Reports",
    "Sales Analytics",
  ],
  Customer: ["Customer Management", "Payments", "Reports"],
  Procurement: [
    "Supplier Management",
    "Payments",
    "RFQs",
    "Purchase Orders",
    "Purchase Invoice",
    "Approvals",
    "Purchase Analytics",
  ],
  Inventory: [
    "Tax Templates",
    "Items",
    "Items Category",
    "Warehouse",
    "Stock",
    "Import",
  ],
  Accounting: [
    "General Ledger",
    "Trial Balance",
    "Receivables",
    "Payables",
    "Banking",
    "Profit & Loss",
    "Balance Sheet",
    "Cash Flow",
    "Journal Entries",
  ],
  Assets: ["Asset Category", "Assets", "Asset Movements"],
  "Human Resource": [
    "Employee Management",
    "Leave Management",
    "Time & Attendance",
    "Performance & Growth",
    "Payroll",
    "Compliance Management",
  ],
  Settings: [
    "Company Setup",
    "User Management",
    "Bank Account",
    "Mode of Payment",
    "Payment Entry",
    "Currency Exchange",
    "Customer Group",
    "Tax Maintenance",
    "General Settings",
  ],
};

export const ALL_MODULES = Object.keys(MODULE_STRUCTURE);

export const ACTIONS = [
  "Create",
  "Delete",
  "Write",
  "Read",
  "Report",
  "Import",
  "Export",
] as const;

export type ActionType = (typeof ACTIONS)[number];

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Represents one permission entry.
 * subModule = null means the entire module is granted at module level.
 * subModule = string means a specific submodule is granted.
 */
export interface PermissionEntry {
  module: string;
  subModule: string | null;
  actions: ActionType[];
}

export interface UserRoleFormData {
  roleName: string;
  description: string;
  permissions: PermissionEntry[];
  status: "Active" | "Inactive";
}

export interface UserRole {
  id: number;
  roleName: string;
  description: string;
  permissions: PermissionEntry[];
  status: "Active" | "Inactive";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Given all permissions, get what's selected for a specific module+submodule combo.
 * Returns actions array or empty array.
 */
export const getPermissionActions = (
  permissions: PermissionEntry[],
  module: string,
  subModule: string | null
): ActionType[] => {
  const entry = permissions.find(
    (p) => p.module === module && p.subModule === subModule
  );
  return entry?.actions ?? [];
};

/**
 * Check if a module has module-level permission (subModule === null)
 */
export const hasModuleLevelPermission = (
  permissions: PermissionEntry[],
  module: string
): boolean => {
  return permissions.some((p) => p.module === module && p.subModule === null);
};

/**
 * Check if a specific submodule has permission
 */
export const hasSubModulePermission = (
  permissions: PermissionEntry[],
  module: string,
  subModule: string
): boolean => {
  return permissions.some(
    (p) => p.module === module && p.subModule === subModule
  );
};

/**
 * Get all modules that have at least one permission (module-level or submodule-level)
 */
export const getActiveModules = (permissions: PermissionEntry[]): string[] => {
  return [...new Set(permissions.map((p) => p.module))];
};

/**
 * Count total permission entries
 */
export const countPermissions = (permissions: PermissionEntry[]): number => {
  return permissions.length;
};

/**
 * Build the default empty form data
 */
export const buildDefaultForm = (): UserRoleFormData => ({
  roleName: "",
  description: "",
  permissions: [],
  status: "Active",
});

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseUserRoleLogicOptions {
  onSubmit: (data: UserRoleFormData) => Promise<void> | void;
  onClose: () => void;
  initialData?: UserRoleFormData | null;
}

export const useUserRoleLogic = ({
  onSubmit,
  onClose,
  initialData,
}: UseUserRoleLogicOptions) => {
  const [form, setForm] = useState<UserRoleFormData>(
    initialData ?? buildDefaultForm()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Validation ───────────────────────────────────────────────────────────

  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {};
    if (!form.roleName.trim()) e.roleName = "Role name is required";
    if (form.permissions.length === 0)
      e.permissions = "At least one permission is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  // ── Form field helpers ───────────────────────────────────────────────────

  const handleFieldChange = useCallback(
    (field: keyof UserRoleFormData, value: unknown) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      clearError(field);
    },
    [clearError]
  );

  // ── Permission helpers ───────────────────────────────────────────────────

  /**
   * Set actions for a module+submodule entry.
   * If actions is empty, removes the entry.
   */
  const setPermissionActions = useCallback(
    (module: string, subModule: string | null, actions: ActionType[]) => {
      setForm((prev) => {
        const filtered = prev.permissions.filter(
          (p) => !(p.module === module && p.subModule === subModule)
        );
        if (actions.length === 0) {
          return { ...prev, permissions: filtered };
        }
        return {
          ...prev,
          permissions: [...filtered, { module, subModule, actions }],
        };
      });
      clearError("permissions");
    },
    [clearError]
  );

  /**
   * Toggle a single action for a module+submodule entry.
   */
  const toggleAction = useCallback(
    (module: string, subModule: string | null, action: ActionType) => {
      setForm((prev) => {
        const existing = prev.permissions.find(
          (p) => p.module === module && p.subModule === subModule
        );
        const currentActions = existing?.actions ?? [];
        const newActions = currentActions.includes(action)
          ? currentActions.filter((a) => a !== action)
          : [...currentActions, action];

        const filtered = prev.permissions.filter(
          (p) => !(p.module === module && p.subModule === subModule)
        );

        if (newActions.length === 0) {
          return { ...prev, permissions: filtered };
        }

        return {
          ...prev,
          permissions: [...filtered, { module, subModule, actions: newActions }],
        };
      });
      clearError("permissions");
    },
    [clearError]
  );

  /**
   * Toggle module-level permission (subModule = null).
   * When enabling module-level, removes all submodule entries for that module.
   * When disabling module-level, removes the module-level entry.
   */
  const toggleModuleLevel = useCallback(
    (module: string, actions: ActionType[]) => {
      setForm((prev) => {
        // Remove module-level entry
        const filtered = prev.permissions.filter(
          (p) => !(p.module === module && p.subModule === null)
        );
        if (actions.length === 0) {
          return { ...prev, permissions: filtered };
        }
        return {
          ...prev,
          permissions: [...filtered, { module, subModule: null, actions }],
        };
      });
      clearError("permissions");
    },
    [clearError]
  );

  /**
   * Remove all permissions for a module (both module-level and all submodules)
   */
  const clearModulePermissions = useCallback((module: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.filter((p) => p.module !== module),
    }));
  }, []);

  /**
   * Select all submodules of a module with given actions
   */
  const selectAllSubModules = useCallback(
    (module: string, actions: ActionType[]) => {
      const subModules = MODULE_STRUCTURE[module] ?? [];
      setForm((prev) => {
        const filtered = prev.permissions.filter((p) => p.module !== module);
        if (actions.length === 0) {
          return { ...prev, permissions: filtered };
        }
        const newEntries: PermissionEntry[] = subModules.map((sub) => ({
          module,
          subModule: sub,
          actions,
        }));
        return { ...prev, permissions: [...filtered, ...newEntries] };
      });
      clearError("permissions");
    },
    [clearError]
  );

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, onSubmit, validate]);

  const handleReset = useCallback(() => {
    setForm(initialData ?? buildDefaultForm());
    setErrors({});
  }, [initialData]);

  return {
    form,
    setForm,
    errors,
    isSubmitting,
    handleFieldChange,
    handleSubmit,
    handleReset,
    // permission helpers
    setPermissionActions,
    toggleAction,
    toggleModuleLevel,
    clearModulePermissions,
    selectAllSubModules,
    clearError,
    // read helpers
    getPermissionActions: (module: string, subModule: string | null) =>
      getPermissionActions(form.permissions, module, subModule),
    hasModuleLevelPermission: (module: string) =>
      hasModuleLevelPermission(form.permissions, module),
    hasSubModulePermission: (module: string, subModule: string) =>
      hasSubModulePermission(form.permissions, module, subModule),
    getActiveModules: () => getActiveModules(form.permissions),
    countPermissions: () => countPermissions(form.permissions),
  };
};