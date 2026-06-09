import React from "react";
import ReactDOM from "react-dom";
import { Eye, Edit, Trash2, Download, MoreVertical, Play } from "lucide-react";
import { Ban, ToggleLeft, ToggleRight } from "lucide-react";
import { CheckCircle } from "lucide-react";


/* ======================================================
   ACTION BUTTON
====================================================== */

type ActionType =
  | "view"
  | "edit"
  | "delete"
  | "download"
  | "run-payroll"
  | "enable"
  | "disable"
  | "custom";

interface ActionButtonProps {
  type: ActionType;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  label?: string | null;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  iconOnly?: boolean;
  title?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  type,
  onClick,
  label,
  icon,
  variant = "primary",
  disabled = false,
  iconOnly = false,
  title,
}) => {
  const getIcon = () => {
    if (icon) return icon;
    switch (type) {
      case "view":
        return <Eye className="w-4 h-4" />;
      case "edit":
        return <Edit className="w-4 h-4" />;
      case "delete":
        return <Trash2 className="w-4 h-4" />;
      case "download":
        return <Download className="w-4 h-4" />;
      case "run-payroll":
        return <Play className="w-4 h-4" />;
      case "enable":
        return <ToggleRight className="w-4 h-4" />;
      case "disable":
        return <ToggleLeft className="w-4 h-4" />;
      default:
        return <MoreVertical className="w-4 h-4" />;
    }
  };

  const getLabel = () => {
    if (label === null) return null;
    if (label) return label;
    switch (type) {
      case "view":
        return "View";
      case "edit":
        return "Edit";
      case "delete":
        return "Delete";
      case "download":
        return "Download";
      default:
        return "Action";
    }
  };

  const variantStyles = {
    primary: "text-primary hover:bg-row-hover hover:text-primary",
    secondary: "text-muted hover:bg-row-hover hover:text-main",
    danger: "text-red-500 hover:bg-row-hover hover:text-red-600",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg font-medium text-sm transition-all",
  };

  const base = iconOnly
    ? `inline-flex items-center justify-center w-7 h-7 rounded-md ${variantStyles[variant]}`
    : `inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${variantStyles[variant]}`;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      disabled={disabled}
      aria-label={getLabel() ?? undefined}
      title={title ?? getLabel() ?? undefined}
      className={`${base} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {getIcon()}
      {getLabel() && !iconOnly ? <span>{getLabel()}</span> : null}
    </button>
  );
};

/* ======================================================
   ACTION GROUP
====================================================== */

interface ActionGroupProps {
  children: React.ReactNode;
}

export const ActionGroup: React.FC<ActionGroupProps> = ({ children }) => (
  <div className="flex items-center gap-1 justify-center">{children}</div>
);

/* ======================================================
   ACTION MENU (THREE DOT) — Portal-based, never clips
====================================================== */

interface ActionMenuProps {
  onEdit?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  onDelete?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  onDownload?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  onDisable?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  onEnable?: (e?: React.MouseEvent<HTMLButtonElement>) => void;

  editLabel?: string;
  deleteLabel?: string;
  downloadLabel?: string;

  deleteVariant?: "danger" | "primary" | "secondary";
  showDownload?: boolean;

  customActions?: {
    label: string;
    onClick: () => void;
    danger?: boolean;
    icon?: React.ReactNode;
    divider?: boolean;
    disabled?: boolean;
  }[];
}

// ── Shared class for EVERY menu row — one source of truth ──
const MENU_ITEM_BASE =
  "w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-row-hover transition-colors";

export const ActionMenu: React.FC<ActionMenuProps> = ({
  onEdit,
  onDelete,
  onDownload,
  onDisable,
  onEnable,
  editLabel,
  deleteLabel,
  downloadLabel,
  deleteVariant = "danger",
  showDownload = false,
  customActions,
}) => {
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: -9999, left: 0 });
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({ top: -9999, left: Math.max(8, rect.right - 192) });
    setOpen((v) => !v);
  };

  React.useLayoutEffect(() => {
    if (!open || !menuRef.current || !triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuH = menuRef.current.offsetHeight;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const top =
      spaceBelow >= menuH + 8
        ? triggerRect.bottom + 6
        : triggerRect.top - menuH - 6;
    const left = Math.max(8, triggerRect.right - 192);
    setCoords({ top, left });
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (
        menuRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const dropdown = open
    ? ReactDOM.createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label="Actions"
          onClick={(e) => e.stopPropagation()}
          style={{ top: coords.top, left: coords.left }}
          className="fixed w-48 bg-card border border-[var(--border)] rounded-lg shadow-2xl z-[9999] py-1"
        >
          {/* ── Custom actions ── */}
          {customActions?.map((action, index) => {
            if (action.divider) {
              return (
                <div
                  key={`divider-${index}`}
                  className="my-1 border-t border-[var(--border)]"
                />
              );
            }
            return (
              <button
                key={action.label}
                type="button"
                disabled={action.disabled}
                onClick={() => {
                  if (action.disabled) return;
                  setOpen(false);
                  action.onClick?.();
                }}
                className={`${MENU_ITEM_BASE} ${
                  action.danger ? "text-red-500" : "text-main"
                } ${action.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                role="menuitem"
              >
                {/* Icon: fixed 16×16 box so text always starts at the same x */}
                <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center text-muted">
                  {action.icon}
                </span>
                <span>{action.label}</span>
              </button>
            );
          })}

          {/* Divider between custom and built-in actions */}
          {customActions &&
            customActions.length > 0 &&
            (onEdit ||
              onDisable ||
              onEnable ||
              onDelete ||
              (showDownload && onDownload)) && (
              <div className="my-1 border-t border-[var(--border)]" />
            )}

          {/* ── Edit ── */}
          {onEdit && (
            <button
              type="button"
              onClick={(e) => { setOpen(false); onEdit(e); }}
              className={`${MENU_ITEM_BASE} text-main`}
              role="menuitem"
            >
              <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center text-muted">
                <Edit className="w-4 h-4" />
              </span>
              <span>{editLabel ?? "Edit"}</span>
            </button>
          )}

          {/* ── Disable ── */}
          {onDisable && (
            <button
              type="button"
              onClick={(e) => { setOpen(false); onDisable(e); }}
              className={`${MENU_ITEM_BASE} text-amber-600`}
              role="menuitem"
            >
              <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                <ToggleLeft className="w-4 h-4" />
              </span>
              <span>Disable</span>
            </button>
          )}

          {/* ── Enable ── */}
          {onEnable && (
            <button
              type="button"
              onClick={(e) => { setOpen(false); onEnable(e); }}
              className={`${MENU_ITEM_BASE} text-green-600`}
              role="menuitem"
            >
              <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                <ToggleRight className="w-4 h-4" />
              </span>
              <span>Enable</span>
            </button>
          )}

          {/* ── Download ── */}
          {showDownload && onDownload && (
            <button
              type="button"
              onClick={(e) => { setOpen(false); onDownload(e); }}
              className={`${MENU_ITEM_BASE} text-main`}
              role="menuitem"
            >
              <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center text-muted">
                <Download className="w-4 h-4" />
              </span>
              <span>{downloadLabel ?? "Download"}</span>
            </button>
          )}

          {/* ── Delete ── */}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => { setOpen(false); onDelete(e); }}
              className={`${MENU_ITEM_BASE}`}
              role="menuitem"
            >
              <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-500" />
              </span>
              <span className={deleteVariant === "danger" ? "text-red-500" : "text-main"}>
                {deleteLabel ?? "Delete"}
              </span>
            </button>
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={openMenu}
        className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-card text-muted hover:bg-row-hover hover:text-main transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {dropdown}
    </>
  );
};

export default ActionButton;