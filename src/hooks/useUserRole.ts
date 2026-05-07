import { useState, useCallback } from "react";
import type { PermissionEntry, UserRoleFormData, UserRole } from "../types/RoleManagement/UserRole";
import { EMPTY_FORM } from "../types/RoleManagement/UserRole";
import { showApiError } from "../utils/alert"; 

export const MODULE_STRUCTURE: Record<string, string[]> = {
  Sales: ["Sales Invoice"],
  CustomerManagement: ["Customer"],
  Procurement: ["Supplier", "Request For Quotation", "Purchase Order", "Purchase Invoice"],
  Inventory: ["Item Tax Template", "Item", "Item Group", "Warehouse", "Stock Entry"],
  Accounting: ["GL Entry", "Journal Entry","Account"],
  Assets: ["Asset Category", "Asset", "Asset Movement"],
  HumanResource: ["Employee", "Payroll Entry"],
  Settings: ["Company", "User","Role","Bank", "Bank Account", "Mode of Payment", "Payment Entry", "Currency Exchange", "Customer Group", "Item Tax Template"],
};

export const ALL_MODULES = Object.keys(MODULE_STRUCTURE);

export const getPermissionActions = (
  permissions: PermissionEntry[],
  module: string
): PermissionEntry | undefined => {
  return permissions.find((p) => p.module === module);
};

export const hasModuleLevelPermission = (
  permissions: PermissionEntry[],
  module: string
): boolean => {
  const entry = permissions.find((p) => p.module === module);
  if (!entry) return false;
  const { module: _, ...flags } = entry;
  return Object.values(flags).some((v) => v === 1);
};

export const getActiveModules = (permissions: PermissionEntry[]): string[] => {
  return [...new Set(permissions.map((p) => p.module))];
};

export const countPermissions = (permissions: PermissionEntry[]): number => {
  return permissions.length;
};

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<UserRole>(initialData ?? EMPTY_FORM);

  // ── Validation ───────────────────────────────────────────────────────────

  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {};
    if (!form.role.trim()) e.role = "Role name is required";
    if (form.permission.length === 0) e.permission = "At least one permission is required";
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

  // ── Form helpers ─────────────────────────────────────────────────────────

  const handleFieldChange = useCallback(
    (field: keyof UserRoleFormData, value: unknown) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      clearError(field);
      clearError("submit"); 
    },
    [clearError]
  );

 

const buildPayload = (): UserRoleFormData => {
  const subModuleParent: Record<string, string> = {};
  Object.entries(MODULE_STRUCTURE).forEach(([parent, subs]) => {
    subs.forEach((sub) => {
      subModuleParent[sub] = parent;
    });
  });


  const allSubModules = Object.values(MODULE_STRUCTURE).flat();

  const permission = allSubModules.map((sub) => {
    const existing = form.permission.find((p) => p.module === sub);
    return {
      module: sub,
      read: existing?.read ?? 0,
      write: existing?.write ?? 0,
      create: existing?.create ?? 0,
      delete: existing?.delete ?? 0,
      import: existing?.import ?? 0,
      export: existing?.export ?? 0,
      report: existing?.report ?? 0,
    };
  });

  return {
    role: form.role.trim(),
    permission,
  };
};

  const setPermissionActions = useCallback(
    (module: string, entry: Omit<PermissionEntry, "module">) => {
      setForm((prev) => {
        const filtered = prev.permission.filter((p) => p.module !== module);
        const hasAnyFlag = Object.values(entry).some((v) => v === 1);
        if (!hasAnyFlag) return { ...prev, permission: filtered };
        return { ...prev, permission: [...filtered, { module, ...entry }] };
      });
      clearError("permission");
    },
    [clearError]
  );

  const toggleAction = useCallback(
    (module: string, action: keyof Omit<PermissionEntry, "module">) => {
      setForm((prev) => {
        const existing = prev.permission.find((p) => p.module === module);
        if (existing) {
          return {
            ...prev,
            permission: prev.permission.map((p) =>
              p.module === module
                ? { ...p, [action]: p[action] === 1 ? 0 : 1 }
                : p
            ),
          };
        }
        const newEntry: PermissionEntry = {
          module,
          read: 0, write: 0, create: 0,
          delete: 0, import: 0, export: 0, report: 0,
          [action]: 1,
        };
        return { ...prev, permission: [...prev.permission, newEntry] };
      });
      clearError("permission");
    },
    [clearError]
  );

  const toggleModuleLevel = useCallback(
    (module: string, on: boolean) => {
      setForm((prev) => {
        const filtered = prev.permission.filter((p) => p.module !== module);
        if (!on) return { ...prev, permission: filtered };
        return {
          ...prev,
          permission: [
            ...filtered,
            { module, read: 1, write: 1, create: 1, delete: 1, import: 1, export: 1, report: 1 },
          ],
        };
      });
      clearError("permission");
    },
    [clearError]
  );

  const clearModulePermissions = useCallback((module: string) => {
    setForm((prev) => ({
      ...prev,
      permission: prev.permission.filter((p) => p.module !== module),
    }));
  }, []);

  const selectAllSubModules = useCallback(
    (module: string, on: boolean) => {
      const subModules = MODULE_STRUCTURE[module] ?? [];
      setForm((prev) => {
        const filtered = prev.permission.filter(
          (p) => p.module !== module && !subModules.includes(p.module)
        );
        if (!on) return { ...prev, permission: filtered };
        const newEntries: PermissionEntry[] = subModules.map((sub) => ({
          module: sub,
          read: 1, write: 1, create: 1, delete: 1, import: 1, export: 1, report: 1,
        }));
        return { ...prev, permission: [...filtered, ...newEntries] };
      });
      clearError("permission");
    },
    [clearError]
  );

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      await onSubmit(payload);
    } catch (error) {
      showApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, onSubmit, validate]);

  const handleReset = useCallback(() => {
    setForm(initialData ?? EMPTY_FORM);
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
    setPermissionActions,
    toggleAction,
    toggleModuleLevel,
    clearModulePermissions,
    selectAllSubModules,
    clearError,
    getPermissionActions: (module: string) =>
      getPermissionActions(form.permission, module),
    hasModuleLevelPermission: (module: string) =>
      hasModuleLevelPermission(form.permission, module),
    getActiveModules: () => getActiveModules(form.permission),
    countPermissions: () => countPermissions(form.permission),
  };
};