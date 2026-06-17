import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { MinimizableModal } from "../common/MinimizableModal";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import {
  useUserRoleLogic,
  MODULE_STRUCTURE,
  ALL_MODULES,
} from "../../hooks/useUserRole";
import type { UserRoleFormData, PermissionEntry } from "../../types/RoleManagement/UserRole";


type PermissionKey = keyof Omit<PermissionEntry, "module">;

const PERMISSION_KEYS: PermissionKey[] = [
  "read",
  "write",
  "create",
  "delete",
  "import",
  "export",
  "report",
  "submit",
  "cancel",
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface AssignUserRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserRoleFormData) => Promise<void> | void;
  initialData?: UserRoleFormData | null;
  isEdit?: boolean;
  modalId: string;
}


const ACTION_LABELS: Record<PermissionKey, string> = {
  read: "Read",
  write: "Write",
  create: "Create",
  delete: "Delete",
  import: "Import",
  export: "Export",
  report: "Report",
  submit: "Submit",
  cancel: "Cancel",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getActiveKeys = (entry: PermissionEntry | undefined): PermissionKey[] => {
  if (!entry) return [];
  return PERMISSION_KEYS.filter((k) => entry[k] === 1);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ActionChipProps {
  permKey: PermissionKey;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const ActionChip: React.FC<ActionChipProps> = ({ permKey, selected, onClick, disabled }) => (
  <button
    type="button"
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-all duration-150 select-none bg-card border-[var(--border)] hover:bg-[var(--row-hover)] text-main"

  >
    <div className={`w-3 h-3 rounded-sm border flex items-center justify-center flex-shrink-0 transition-all ${selected
      ? "bg-primary border-primary"
      : "border-[var(--border)] bg-app"
      }`}>
      {selected && (
        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 8 8">
          <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
    {ACTION_LABELS[permKey]}
  </button>
);

interface ActionRowProps {
  label: string;
  entry: PermissionEntry | undefined;
  onToggle: (key: PermissionKey) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  indent?: boolean;
  isModule?: boolean;
  disabled?: boolean;
}

const ActionRow: React.FC<ActionRowProps> = ({
  label,
  entry,
  onToggle,
  onSelectAll,
  onClearAll,
  indent = false,
  isModule = false,
  disabled = false,
}) => {
  const activeKeys = getActiveKeys(entry);
  const allSelected = activeKeys.length === PERMISSION_KEYS.length;
  const someSelected = activeKeys.length > 0 && !allSelected;

  return (
    <div
      className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-colors ${indent
        ? "ml-6 bg-[var(--row-hover)]/40 hover:bg-[var(--row-hover)]"
        : isModule
          ? "bg-primary/5 border border-primary/10"
          : ""
        }`}
    >
      {/* Tri-state checkbox + label */}
      <button
        type="button"
        onClick={disabled ? undefined : () => (allSelected ? onClearAll() : onSelectAll())}
        disabled={disabled}
        className={`flex items-center gap-2 min-w-[160px] group ${disabled ? "cursor-not-allowed" : ""}`}
      >
        <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 transition-all ${allSelected
          ? "bg-primary border-primary"
          : someSelected
            ? "bg-primary/30 border-primary"
            : "border-[var(--border)] bg-app"
          }`}>
          {allSelected && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 8 8">
              <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {someSelected && (
            <div className="w-1.5 h-0.5 bg-primary rounded-full" />
          )}
        </div>
        <span className={`text-[12px] font-${isModule ? "bold" : "semibold"} ${activeKeys.length > 0 ? "text-main" : "text-muted"
          } group-hover:text-main transition-colors truncate`}>
          {label}
        </span>
        {activeKeys.length > 0 && (
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
            {activeKeys.length}/{PERMISSION_KEYS.length}
          </span>
        )}
      </button>

      {/* Action chips */}
      <div className="flex items-center gap-1.5 flex-wrap flex-1">
        {PERMISSION_KEYS.map((key) => (
          <ActionChip
            key={key}
            permKey={key}
            selected={entry ? entry[key] === 1 : false}
            onClick={() => onToggle(key)}
            disabled={disabled}
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
  const isViewMode = !isEdit && !!initialData; // ADD KARO

  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();

  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

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
  } = useUserRoleLogic({
    onSubmit,
    onClose,
    initialData: initialData ?? null,
  });


  useEffect(() => {
    if (!isOpen) {
      setExpandedModules(new Set());
      return;
    }
    // Auto-expand modules that have any permissions set
    if (initialData?.permission && initialData.permission.length > 0) {
      const modulesToExpand = new Set<string>();
      ALL_MODULES.forEach((module) => {
        const subModules = MODULE_STRUCTURE[module] ?? [];
        const hasPermission =
          initialData.permission.some((p) => p.module === module) ||
          subModules.some((sub) => initialData.permission.some((p) => p.module === sub.key));
        if (hasPermission) modulesToExpand.add(module);
      });
      setExpandedModules(modulesToExpand);
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

  const handleFieldChangeDirty = (field: keyof UserRoleFormData, value: unknown) => {
    handleFieldChange(field, value);
    markDirty();
  };

  const onPermissionChange = () => markDirty();

  const moduleHasAnyPermission = (module: string): boolean => {
    const subModules = MODULE_STRUCTURE[module] ?? [];
    return subModules.some((sub) => {
      const subEntry = getPermissionActions(sub.key);
      return subEntry && getActiveKeys(subEntry).length > 0;
    });
  };

  const footer = (
    <div className="flex items-center justify-between w-full">
      {!isViewMode && (
        <button
          type="button"
          onClick={() => { handleReset(); resetDirty(); }}
          className="px-4 py-2 text-sm font-medium text-muted border border-[var(--border)] rounded-lg hover:bg-[var(--row-hover)] transition-colors"
        >
          Reset
        </button>
      )}
      <div className={`flex gap-3 ${isViewMode ? "ml-auto" : ""}`}>
        <button
          type="button"
          onClick={() => handleCloseWithConfirm(onClose, resolvedModalId)}
          className="px-4 py-2 text-sm font-medium text-main border border-[var(--border)] rounded-lg hover:bg-[var(--row-hover)] transition-colors"
        >
          {isViewMode ? "Close" : "Cancel"}
        </button>
        {!isViewMode && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-6 py-2 text-sm font-semibold text-white bg-primary rounded-lg shadow-sm shadow-primary/20 hover:opacity-90 transition-all ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {isSubmitting ? "Saving..." : isEdit ? "Update" : "Save"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      title={
        isViewMode
          ? "View Role"
          : isEdit
            ? "Edit Role"
            : "Add New Role"
      }
      subtitle={
        isViewMode
          ? `Viewing permissions for: ${form.role}`
          : isEdit
            ? "Edit role name and module permissions"
            : "Define role name and module permissions"
      }
      icon={ShieldCheck}
      footer={footer}
      maxWidth="5xl"
      height="82vh"
    >
      <div className="h-full flex flex-col gap-0">
        {/* ── Row 1: Role Name ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 px-1 pb-4 x ">
          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest mb-1.5">
              Role Name <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="text"
              value={form.role}
              disabled={isEdit || isViewMode}
              onChange={(e) => handleFieldChangeDirty("role", e.target.value)}
              placeholder="e.g. Admin, HR Manager, Sales Executive"
              className={`w-full px-3 py-2 text-sm border rounded-lg text-main placeholder:text-muted outline-none transition-all ${(isEdit || isViewMode)
                ? "bg-[var(--disabled-bg)] cursor-not-allowed opacity-70 border-[var(--border)]"
                : "bg-app focus:ring-2 focus:ring-primary/20 focus:border-primary"
                } ${errors.role
                  ? "border-[var(--danger)]"
                  : "border-[var(--border)]"
                }`}
            />
            {errors.role && (
              <p className="text-[10px] text-[var(--danger)] mt-1">
                {errors.role}
              </p>
            )}
          </div>
        </div>

        {/* ── Summary bar ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-1 py-1 ">
          <div className="flex items-center gap-3">
            {errors.permission && (
              <p className="text-[10px] text-[var(--danger)]">
                {errors.permission}
              </p>
            )}
          </div>
        </div>

        {/* ── Permissions section header ───────────────────────────────── */}
        <div className="flex items-center justify-between px-1 pb-2">
          <p className="text-[11px] font-bold text-main uppercase tracking-widest">
            Permissions
          </p>
        </div>

        {/* ── Permissions list ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
          {ALL_MODULES.map((module) => {
            const isExpanded = expandedModules.has(module);
            const subModules = MODULE_STRUCTURE[module] ?? [];

            const moduleEntry = getPermissionActions(module);
            const hasAny = moduleHasAnyPermission(module);


            return (
              <div
                key={module}
                className={`rounded-xl border transition-all ${hasAny
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
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-muted" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-muted" />
                    )}
                  </button>

                  {/* Module label + checkbox (controls submodules only) */}
                  <div className="flex-1 flex items-center gap-3 py-2 px-3 rounded-lg bg-primary/5 border border-primary/10">
                    {/* Tri-state checkbox for submodules */}
                    <button
                      type="button"
                      onClick={isViewMode ? undefined : () => {
                        const allSubsChecked = subModules.every((sub) => {
                          const e = getPermissionActions(sub.key);
                          return e && getActiveKeys(e).length === PERMISSION_KEYS.length;
                        });

                        selectAllSubModules(module, !allSubsChecked);
                        onPermissionChange();
                      }}
                      disabled={isViewMode}
                      className={`flex items-center gap-2 min-w-[160px] group ${isViewMode ? "cursor-not-allowed" : ""}`}
                    >
                      {(() => {
                        const checkedSubs = subModules.filter((sub) => {
                          const e = getPermissionActions(sub.key);
                          return e && getActiveKeys(e).length > 0;
                        }).length;
                        const allChecked = checkedSubs === subModules.length && subModules.length > 0;
                        const someChecked = checkedSubs > 0 && !allChecked;
                        return (
                          <>
                            <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 transition-all ${allChecked
                              ? "bg-primary border-primary"
                              : someChecked
                                ? "bg-primary/30 border-primary"
                                : "border-[var(--border)] bg-app"
                              }`}>
                              {allChecked && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 8 8">
                                  <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                              {someChecked && (
                                <div className="w-1.5 h-0.5 bg-primary rounded-full" />
                              )}
                            </div>
                            <span className="text-[12px] font-bold text-main group-hover:text-primary transition-colors truncate">
                              {module}
                            </span>
                            {checkedSubs > 0 && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                {checkedSubs}/{subModules.length}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </button>
                  </div>

                  {/* Clear button */}
                  {hasAny && !isViewMode && (
                    <button
                      type="button"
                      onClick={() => {
                        subModules.forEach((sub) => clearModulePermissions(sub.key));

                        onPermissionChange();
                      }}
                      className="text-[10px] font-bold text-[var(--danger)] hover:bg-[var(--danger)]/10 px-2 py-1 rounded-md transition-colors flex-shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Submodule rows */}
                {isExpanded && (
                  <div className="pb-2 px-2 space-y-1 border-t border-[var(--border)]/50 pt-2 mt-0.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-muted uppercase tracking-widest">
                        Submodules ({subModules.length})
                      </span>
                      {!isViewMode && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => { selectAllSubModules(module, true); onPermissionChange(); }}
                            className="text-[10px] font-bold text-[var(--success)] hover:bg-[var(--success)]/10 px-2 py-0.5 rounded transition-colors"
                          >
                            All
                          </button>
                          <button
                            type="button"
                            onClick={() => { selectAllSubModules(module, false); onPermissionChange(); }}
                            className="text-[10px] font-bold text-muted hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 px-2 py-0.5 rounded transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>

                    {subModules.map((sub) => {
                      const subEntry = getPermissionActions(sub.key);
                      return (
                        <ActionRow
                          key={sub.key}
                          label={sub.label}
                          entry={subEntry}
                          indent
                          disabled={isViewMode}
                          onToggle={(key) => { toggleAction(sub.key, key); onPermissionChange(); }}
                          onSelectAll={() => { toggleModuleLevel(sub.key, true); onPermissionChange(); }}
                          onClearAll={() => { toggleModuleLevel(sub.key, false); onPermissionChange(); }}
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