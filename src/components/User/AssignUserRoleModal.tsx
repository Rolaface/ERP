import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  Minus,
} from "lucide-react";
import { MinimizableModal } from "../common/MinimizableModal";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import {
  useUserRoleLogic,
  MODULE_STRUCTURE,
  ALL_MODULES,
  ACTIONS,
  buildDefaultForm,
  type UserRoleFormData,
  type ActionType,
} from "../../hooks/useUserRole";

// ─── Props ────────────────────────────────────────────────────────────────────

interface AssignUserRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean> | boolean;
  initialData?: UserRoleFormData | null;
  isEdit?: boolean;
  modalId: string;
}

// ─── Action color map ────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  Create: "text-emerald-600",
  Delete: "text-red-500",
  Write: "text-blue-500",
  Read: "text-slate-500",
  Report: "text-purple-500",
  Import: "text-orange-500",
  Export: "text-cyan-500",
};

const ACTION_BG: Record<string, string> = {
  Create: "bg-emerald-50 border-emerald-200 text-emerald-700",
  Delete: "bg-red-50 border-red-200 text-red-600",
  Write: "bg-blue-50 border-blue-200 text-blue-600",
  Read: "bg-slate-50 border-slate-200 text-slate-600",
  Report: "bg-purple-50 border-purple-200 text-purple-600",
  Import: "bg-orange-50 border-orange-200 text-orange-600",
  Export: "bg-cyan-50 border-cyan-200 text-cyan-600",
};

const ACTION_BG_SELECTED: Record<string, string> = {
  Create: "bg-emerald-500 border-emerald-500 text-white",
  Delete: "bg-red-500 border-red-500 text-white",
  Write: "bg-blue-500 border-blue-500 text-white",
  Read: "bg-slate-500 border-slate-500 text-white",
  Report: "bg-purple-500 border-purple-500 text-white",
  Import: "bg-orange-500 border-orange-500 text-white",
  Export: "bg-cyan-500 border-cyan-500 text-white",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ActionChipProps {
  action: ActionType;
  selected: boolean;
  onClick: () => void;
}

const ActionChip: React.FC<ActionChipProps> = ({ action, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-all duration-150 select-none ${
      selected ? ACTION_BG_SELECTED[action] : ACTION_BG[action]
    }`}
  >
    {action}
  </button>
);

interface ActionRowProps {
  label: string;
  selectedActions: ActionType[];
  onToggle: (action: ActionType) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  indent?: boolean;
  isModule?: boolean;
}

const ActionRow: React.FC<ActionRowProps> = ({
  label,
  selectedActions,
  onToggle,
  onSelectAll,
  onClearAll,
  indent = false,
  isModule = false,
}) => {
  const allSelected = selectedActions.length === ACTIONS.length;
  const someSelected = selectedActions.length > 0 && !allSelected;

  return (
    <div
      className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors ${
        indent
          ? "ml-6 bg-[var(--row-hover)]/40 hover:bg-[var(--row-hover)]"
          : isModule
          ? "bg-primary/5 border border-primary/10 hover:bg-primary/8"
          : ""
      }`}
    >
      {/* Label + tri-state checkbox */}
      <button
        type="button"
        onClick={() => (allSelected ? onClearAll() : onSelectAll())}
        className="flex items-center gap-2 min-w-[160px] group"
      >
        {allSelected ? (
          <CheckSquare
            className={`w-4 h-4 flex-shrink-0 ${
              isModule ? "text-primary" : "text-[var(--success)]"
            }`}
          />
        ) : someSelected ? (
          <Minus
            className={`w-4 h-4 flex-shrink-0 ${
              isModule ? "text-primary" : "text-[var(--success)]"
            }`}
          />
        ) : (
          <Square className="w-4 h-4 flex-shrink-0 text-muted" />
        )}
        <span
          className={`text-[12px] font-${isModule ? "bold" : "semibold"} ${
            selectedActions.length > 0
              ? isModule
                ? "text-primary"
                : "text-main"
              : "text-muted"
          } group-hover:text-main transition-colors truncate`}
        >
          {label}
        </span>
        {selectedActions.length > 0 && (
          <span
            className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
              isModule
                ? "bg-primary/10 text-primary"
                : "bg-[var(--success)]/10 text-[var(--success)]"
            }`}
          >
            {selectedActions.length}/{ACTIONS.length}
          </span>
        )}
      </button>

      {/* Action chips */}
      <div className="flex items-center gap-1.5 flex-wrap flex-1">
        {ACTIONS.map((action) => (
          <ActionChip
            key={action}
            action={action}
            selected={selectedActions.includes(action)}
            onClick={() => onToggle(action)}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

const AssignUserRoleModal: React.FC<AssignUserRoleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
  modalId,
}) => {
  const resolvedModalId = useRef(modalId).current;

  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();

  // Expanded modules state
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );

  const {
    form,
    errors,
    isSubmitting,
    handleFieldChange,
    handleSubmit,
    handleReset,
    toggleAction,
    toggleModuleLevel,
    clearModulePermissions,
    selectAllSubModules,
    getPermissionActions,
    hasModuleLevelPermission,
    hasSubModulePermission,
  } = useUserRoleLogic({
    onSubmit: async (data) => {
      await onSubmit(data);
    },
    onClose,
    initialData: initialData ?? null,
  });

  // Reset expanded state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setExpandedModules(new Set());
    }
  }, [isOpen]);

  const toggleExpand = (module: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  };

  const handleFieldChangeDirty = (
    field: keyof typeof form,
    value: unknown
  ) => {
    handleFieldChange(field, value);
    markDirty();
  };

  const onPermissionChange = () => markDirty();

  // Module-level actions
  const getModuleActions = (module: string): ActionType[] =>
    getPermissionActions(module, null);

  // Check if module has any permission at all (module-level OR any submodule)
  const moduleHasAnyPermission = (module: string): boolean => {
    return (
      form.permissions.some((p) => p.module === module) 
    );
  };

  // Get all actions that are selected across ALL submodules of a module (intersection)
  const getCommonSubModuleActions = (module: string): ActionType[] => {
    const subs = MODULE_STRUCTURE[module] ?? [];
    const selectedSubs = subs.filter((sub) => hasSubModulePermission(module, sub));
    if (selectedSubs.length === 0) return [];
    const allActions = selectedSubs.map((sub) => getPermissionActions(module, sub));
    return ACTIONS.filter((a) => allActions.every((acts) => acts.includes(a)));
  };

  const footer = (
    <div className="flex items-center justify-between w-full">
      <button
        type="button"
        onClick={() => {
          handleReset();
          resetDirty();
        }}
        className="px-4 py-2 text-sm font-medium text-muted border border-[var(--border)] rounded-lg hover:bg-[var(--row-hover)] transition-colors"
      >
        Reset
      </button>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleCloseWithConfirm(onClose, resolvedModalId)}
          className="px-4 py-2 text-sm font-medium text-main border border-[var(--border)] rounded-lg hover:bg-[var(--row-hover)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`px-6 py-2 text-sm font-semibold text-white bg-primary rounded-lg shadow-sm shadow-primary/20 hover:opacity-90 transition-all ${
            isSubmitting ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting
            ? "Saving..."
            : isEdit
            ? "Update Role"
            : "Create Role"}
        </button>
      </div>
    </div>
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      title={isEdit ? "Edit Role" : "Add New Role"}
      subtitle="Define role name, description and module permissions"
      icon={Users}
      footer={footer}
      maxWidth="5xl"
      height="82vh"
    >
      <div className="h-full flex flex-col gap-0">
        {/* ── Row 1: Role Name + Description ─────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 px-1 pb-4 border-b border-[var(--border)]">
          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest mb-1.5">
              Role Name <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="text"
              value={form.roleName}
              onChange={(e) => {
                handleFieldChangeDirty("roleName", e.target.value);
              }}
              placeholder="e.g. Admin, HR Manager, Sales Executive"
              className={`w-full px-3 py-2 text-sm bg-app border rounded-lg text-main placeholder:text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
                errors.roleName
                  ? "border-[var(--danger)]"
                  : "border-[var(--border)]"
              }`}
            />
            {errors.roleName && (
              <p className="text-[10px] text-[var(--danger)] mt-1">
                {errors.roleName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                handleFieldChangeDirty("description", e.target.value)
              }
              placeholder="Brief summary of this role's responsibilities..."
              className="w-full px-3 py-2 text-sm bg-app border border-[var(--border)] rounded-lg text-main placeholder:text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        {/* ── Status + summary ────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-1 py-3 border-b border-[var(--border)]">
          {/* <div className="flex items-center gap-6">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-widest">
              Status
            </span>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name={`roleStatus-${resolvedModalId}`}
                checked={form.status === "Active"}
                onChange={() => handleFieldChangeDirty("status", "Active")}
                className="w-3.5 h-3.5 accent-[var(--success)]"
              />
              <span className="text-sm font-medium text-main">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name={`roleStatus-${resolvedModalId}`}
                checked={form.status === "Inactive"}
                onChange={() => handleFieldChangeDirty("status", "Inactive")}
                className="w-3.5 h-3.5 accent-[var(--danger)]"
              />
              <span className="text-sm font-medium text-main">Inactive</span>
            </label>
          </div> */}

          <div className="flex items-center gap-3">
            {errors.permissions && (
              <p className="text-[10px] text-[var(--danger)]">
                {errors.permissions}
              </p>
            )}
            <span className="text-[11px] text-muted">
              {form.permissions.length} permission
              {form.permissions.length !== 1 ? "s" : ""} configured
            </span>
          </div>
        </div>

        {/* ── Permissions section header ───────────────────────────────── */}
        <div className="flex items-center justify-between px-1 pt-3 pb-2">
          <p className="text-[11px] font-bold text-main uppercase tracking-widest">
              Permissions
          </p>
        </div>

        {/* ── Permissions list ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
          {ALL_MODULES.map((module) => {
            const isExpanded = expandedModules.has(module);
            const subModules = MODULE_STRUCTURE[module] ?? [];
            const moduleLevelActions = getModuleActions(module);
            const hasAny = moduleHasAnyPermission(module);

            return (
              <div
                key={module}
                className={`rounded-xl border transition-all ${
                  hasAny
                    ? "border-primary/20 bg-primary/3"
                    : "border-[var(--border)] bg-card"
                }`}
              >
                {/* Module row */}
                <div className="flex items-center gap-2 p-1">
                  {/* Expand toggle */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(module)}
                    className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-[var(--row-hover)] transition-colors flex-shrink-0"
                    title={isExpanded ? "Collapse submodules" : "Expand submodules"}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-muted" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-muted" />
                    )}
                  </button>

                  {/* Module-level action row */}
                  <div className="flex-1">
                    <ActionRow
                      label={module}
                      selectedActions={moduleLevelActions}
                      isModule
                      onToggle={(action) => {
                        toggleModuleLevel(
                          module,
                          moduleLevelActions.includes(action)
                            ? moduleLevelActions.filter((a) => a !== action)
                            : [...moduleLevelActions, action]
                        );
                        onPermissionChange();
                      }}
                      onSelectAll={() => {
                        toggleModuleLevel(module, [...ACTIONS]);
                        onPermissionChange();
                      }}
                      onClearAll={() => {
                        toggleModuleLevel(module, []);
                        onPermissionChange();
                      }}
                    />
                  </div>

                  {/* Clear all for module */}
                  {hasAny && (
                    <button
                      type="button"
                      onClick={() => {
                        clearModulePermissions(module);
                        onPermissionChange();
                      }}
                      className="text-[10px] font-bold text-[var(--danger)] hover:bg-[var(--danger)]/10 px-2 py-1 rounded-md transition-colors flex-shrink-0"
                      title="Clear all permissions for this module"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Submodule rows */}
                {isExpanded && (
                  <div className="pb-2 px-2 space-y-1 border-t border-[var(--border)]/50 pt-2 mt-0.5">
                    {/* Select all submodules shortcut */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-muted uppercase tracking-widest">
                        Submodules ({subModules.length})
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            selectAllSubModules(module, [...ACTIONS]);
                            onPermissionChange();
                          }}
                          className="text-[10px] font-bold text-[var(--success)] hover:bg-[var(--success)]/10 px-2 py-0.5 rounded transition-colors"
                        >
                          All Submodules
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            // clear only submodule entries, keep module-level
                            setExpandedModules((prev) => new Set(prev));
                            subModules.forEach((sub) => {
                              // will be cleared via clearModulePermissions filtered
                            });
                            // Clear submodule permissions
                            const moduleLvl = form.permissions.filter(
                              (p) =>
                                p.module === module && p.subModule === null
                            );
                            // keep module-level, remove subs
                            // We'll just call clearModulePermissions and re-add module-level if present
                            const hadModuleLevel = moduleLevelActions.length > 0;
                            clearModulePermissions(module);
                            if (hadModuleLevel) {
                              setTimeout(() => {
                                toggleModuleLevel(module, moduleLevelActions);
                              }, 0);
                            }
                            onPermissionChange();
                          }}
                          className="text-[10px] font-bold text-muted hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 px-2 py-0.5 rounded transition-colors"
                        >
                          Clear Submodules
                        </button>
                      </div>
                    </div>

                    {subModules.map((sub) => {
                      const subActions = getPermissionActions(module, sub);
                      return (
                        <ActionRow
                          key={sub}
                          label={sub}
                          selectedActions={subActions}
                          indent
                          onToggle={(action) => {
                            toggleAction(module, sub, action);
                            onPermissionChange();
                          }}
                          onSelectAll={() => {
                            const allA = [...ACTIONS];
                            const current = getPermissionActions(module, sub);
                            // set all actions
                            ACTIONS.forEach((a) => {
                              if (!current.includes(a)) {
                                toggleAction(module, sub, a);
                              }
                            });
                            onPermissionChange();
                          }}
                          onClearAll={() => {
                            ACTIONS.forEach((a) => {
                              const current = getPermissionActions(module, sub);
                              if (current.includes(a)) {
                                toggleAction(module, sub, a);
                              }
                            });
                            onPermissionChange();
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </MinimizableModal>
  );
};

export default AssignUserRoleModal;