import React from "react";
import ReactDOM from "react-dom";
import { Eye, Edit, Trash2, Download, MoreVertical, Play } from "lucide-react";

/* ======================================================
   ACTION BUTTON
====================================================== */

// 1. Extend the union type
type ActionType = "view" | "edit" | "delete" | "download" | "run-payroll" | "custom";

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
      case "view": return <Eye className="w-4 h-4" />;
      case "edit": return <Edit className="w-4 h-4" />;
      case "delete": return <Trash2 className="w-4 h-4" />;
      case "download": return <Download className="w-4 h-4" />;
      case "run-payroll": return <Play className="w-4 h-4" />;
      default: return <MoreVertical className="w-4 h-4" />;
    }
  };

  const getLabel = () => {
    if (label === null) return null;
    if (label) return label;
    switch (type) {
      case "view": return "View";
      case "edit": return "Edit";
      case "delete": return "Delete";
      case "download": return "Download";
      default: return "Action";
    }
  };



const variantStyles = {
  primary:  "text-primary hover:bg-row-hover hover:text-primary",
  secondary:"text-muted hover:bg-row-hover hover:text-main",
  danger:   "text-red-500 hover:bg-row-hover hover:text-red-600",
  success:  "bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg font-medium text-sm transition-all",
};

  const base = iconOnly
    ? `inline-flex items-center justify-center w-8 h-8 rounded-md ${variantStyles[variant]}`
    : `inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${variantStyles[variant]}`;

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
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

export const ActionMenu: React.FC<ActionMenuProps> = ({
  onEdit,
  onDelete,
  onDownload,
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

  // ── Step 1: Open and render off-screen first ──
  const openMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({ top: -9999, left: Math.max(8, rect.right - 192) });
    setOpen((v) => !v);
  };

  // ── Step 2: After render, measure actual height and reposition correctly ──
  React.useLayoutEffect(() => {
    if (!open || !menuRef.current || !triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuH = menuRef.current.offsetHeight;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const top = spaceBelow >= menuH + 8
      ? triggerRect.bottom + 6       // open downward
      : triggerRect.top - menuH - 6; // flip upward — real height used
    const left = Math.max(8, triggerRect.right - 192);
    setCoords({ top, left });
  }, [open]);

  // ── Close on outside click / Escape ──
  React.useEffect(() => {
    if (!open) return;

    const onDoc = (e: MouseEvent) => {
      if (
        menuRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onScroll = () => setOpen(false);

    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true); // capture scroll anywhere
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  // ── Portal dropdown ──
  const dropdown = open
    ? ReactDOM.createPortal(
      <div
        ref={menuRef}
        role="menu"
        aria-label="Actions"
        onClick={(e) => e.stopPropagation()}
        style={{ top: coords.top, left: coords.left }}
        className="fixed w-48 bg-card border border-[var(--border)] rounded-lg shadow-2xl z-[9999] py-2"
      >
        {/* Custom actions */}
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
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2
    ${action.danger ? "text-red-500" : "text-main"}
    ${action.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-row-hover"}
  `}
              role="menuitem"
            >
              {action.icon && <span className="w-4 h-4">{action.icon}</span>}
              {action.label}
            </button>
          );
        })}

        {customActions && customActions.length > 0 && (onEdit || onDelete || (showDownload && onDownload)) && (
          <div className="my-1 border-t border-[var(--border)]" />
        )}

        {/* Edit */}
        {onEdit && (
          <button
            type="button"
            onClick={(e) => { setOpen(false); onEdit(e); }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-row-hover flex items-center gap-2 text-main"
            role="menuitem"
          >
            <Edit className="w-4 h-4 text-muted" />
            <span>{editLabel ?? "Edit"}</span>
          </button>
        )}

        {/* Download */}
        {showDownload && onDownload && (
          <button
            type="button"
            onClick={(e) => { setOpen(false); onDownload(e); }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-row-hover flex items-center gap-2 text-main"
            role="menuitem"
          >
            <Download className="w-4 h-4 text-muted" />
            <span>{downloadLabel ?? "Download"}</span>
          </button>
        )}

        {/* Delete */}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => { setOpen(false); onDelete(e); }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-row-hover flex items-center gap-2"
            role="menuitem"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            <span className={deleteVariant === "danger" ? "text-red-500" : "text-main"}>
              {deleteLabel ?? "Delete"}
            </span>
          </button>
        )}
      </div>,
      document.body
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