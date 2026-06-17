import { useState, useCallback } from "react";
import type { PermissionEntry, UserRoleFormData, UserRole } from "../types/RoleManagement/UserRole";
import { EMPTY_FORM } from "../types/RoleManagement/UserRole";
import { showApiError } from "../utils/alert";

export const MODULE_STRUCTURE: Record<string, { key: string; label: string }[]> = {
  Sales: [
    { key: "Sales Invoice", label: "Sales Invoice" },
    { key: "Quotation", label: "Quotation" },
  ],
  CustomerManagement: [
    { key: "Customer", label: "Customer" },
    { key: "Customer Group", label: "Customer Group" },
    { key: "Payment Entry", label: "Payment Entry" },
  ],
  Procurement: [
    { key: "Supplier", label: "Supplier" },
    { key: "Request For Quotation", label: "Request For Quotation" },
    { key: "Purchase Order", label: "Purchase Order" },
    { key: "Purchase Invoice", label: "Purchase Invoice" },
    { key: "Payment Entry", label: "Payment Entry" },
  ],
  Inventory: [
    { key: "Item", label: "Item" },
    { key: "Item Group", label: "Item Group" },
    { key: "Warehouse", label: "Warehouse" },
    { key: "Stock Entry", label: "Stock Entry" },
  ],
  Accounting: [
    { key: "Journal Entry", label: "Journal Entry" },
    { key: "Account", label: "Account" },
  ],
  Assets: [
    { key: "Asset Category", label: "Asset Category" },
    { key: "Asset", label: "Asset" },
    { key: "Asset Movement", label: "Asset Movement" },
  ],
  HumanResource: [
    { key: "Employee", label: "Employee" },
    { key: "Payroll Entry", label: "Payroll Entry" },
    { key: "Salary Slip", label: "Salary Slip" },
    { key: "Leave Application", label: "Leave Application" },
    { key: "Leave Type", label: "Leave Type" },
    { key: "Leave Period", label: "Leave Period" },
    { key: "Leave Policy", label: "Leave Policy" },
    { key: "Leave Policy Assignment", label: "Leave Policy Assignment" },
    { key: "Holiday List", label: "Holiday List" },
    { key: "Shift Type", label: "Shift Type" },
  ],
  Settings: [
    { key: "Company", label: "Company" },
    { key: "Document Naming Settings", label: "Naming Series" },
    { key: "User", label: "User" },
    { key: "Role", label: "Role" },
    { key: "Bank", label: "Bank" },
    { key: "Bank Account", label: "Bank Account" },
    { key: "Mode of Payment", label: "Mode of Payment" },
    { key: "Currency Exchange", label: "Currency Exchange" },
    { key: "Expense Claim Type", label: "Expense Claim Type" },
    { key: "Expense Claim", label: "Expense Claim" },
    { key: "Employee Advance", label: "Employee Advance" },
    { key: "Email Template", label: "Email Template" },
    { key: "Tax Category", label: "Tax Category" },
    { key: "Item Tax Template", label: "Item Tax Template" },
    { key: "Sales Taxes and Charges Template", label: "Sales Taxes and Charges Template" },
  ],
};;

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
    const allSubModules = Object.values(MODULE_STRUCTURE).flat().map((s) => s.key);

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
        submit: existing?.submit ?? 0,
        cancel: existing?.cancel ?? 0,
      };
    });

    return { role: form.role.trim(), permission };
  };

  const selectAllSubModules = useCallback(
    (module: string, on: boolean) => {
      const subModules = (MODULE_STRUCTURE[module] ?? []).map((s) => s.key);
      setForm((prev) => {
        const filtered = prev.permission.filter(
          (p) => !subModules.includes(p.module)
        );
        if (!on) return { ...prev, permission: filtered };
        const newEntries: PermissionEntry[] = subModules.map((sub) => ({
          module: sub,
          read: 1, write: 1, create: 1, delete: 1,
          import: 1, export: 1, report: 1, submit: 1, cancel: 1,
        }));
        return { ...prev, permission: [...filtered, ...newEntries] };
      });
      clearError("permission");
    },
    [clearError]
  );

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
          delete: 0, import: 0, export: 0, report: 0, submit: 0, cancel: 0,
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
            { module, read: 1, write: 1, create: 1, delete: 1, import: 1, export: 1, report: 1, submit: 1, cancel: 1, },
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