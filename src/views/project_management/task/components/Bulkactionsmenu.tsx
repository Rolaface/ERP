import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Clock, UserPlus } from "lucide-react";

import { Option } from "../../../../components/selects/tabelselect/MultiSearchSelect";

export type BulkAssignMode = "add" | "replace";

interface Pos {
  top?: number;
  bottom?: number;
  left: number;
}

interface BulkAssignConfig {
  fetchOptions: (q: string) => Promise<Option[]>;
  onSubmit: (emails: string[], mode: BulkAssignMode) => Promise<boolean>;
}

interface BulkActionsMenuProps {
  count: number;
  onAddLog?: () => void;
  assign?: BulkAssignConfig;
}

const MENU_WIDTH = 200;
const MENU_HEIGHT_ESTIMATE = 96;
const POPOVER_WIDTH = 300;
const POPOVER_HEIGHT_ESTIMATE = 400;
const VIEWPORT_MARGIN = 8;
const ANCHOR_GAP = 6;
const DEBOUNCE_DELAY = 350;

const MODE_OPTIONS: { value: BulkAssignMode; label: string }[] = [
  { value: "add", label: "Add to existing" },
  { value: "replace", label: "Replace existing" },
];

const computePosition = (rect: DOMRect, width: number, height: number): Pos => {
  const left = Math.min(
    Math.max(rect.right - width, VIEWPORT_MARGIN),
    window.innerWidth - width - VIEWPORT_MARGIN,
  );
  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
  const spaceAbove = rect.top - VIEWPORT_MARGIN;
  const openUp = spaceBelow < height && spaceAbove > spaceBelow;

  return openUp
    ? { bottom: window.innerHeight - rect.top + ANCHOR_GAP, left }
    : { top: rect.bottom + ANCHOR_GAP, left };
};

const positionStyle = (pos: Pos, width: number): React.CSSProperties => ({
  position: "fixed",
  ...(pos.top !== undefined ? { top: pos.top } : {}),
  ...(pos.bottom !== undefined ? { bottom: pos.bottom } : {}),
  left: pos.left,
  width,
  zIndex: 99999,
});

interface OptionRowProps {
  option: Option;
  checked: boolean;
  onToggle: (option: Option) => void;
}

const OptionRow: React.FC<OptionRowProps> = ({ option, checked, onToggle }) => (
  <div
    onClick={() => onToggle(option)}
    className={`flex items-center gap-2 px-3 py-2 cursor-pointer row-hover ${
      checked ? "bg-primary/5" : ""
    }`}
  >
    <input
      type="checkbox"
      readOnly
      checked={checked}
      className="pointer-events-none"
    />
    <div className="flex flex-col min-w-0">
      <span className="text-[12px] text-main truncate">{option.label}</span>
      {option.subLabel && (
        <span className="text-[10px] text-muted truncate leading-tight">
          {option.subLabel}
        </span>
      )}
    </div>
  </div>
);

interface BulkAssignPopoverProps {
 popoverRef: React.RefObject<HTMLDivElement | null>;
  pos: Pos;
  count: number;
  saving: boolean;
  fetchOptions: (q: string) => Promise<Option[]>;
  onSubmit: (emails: string[], mode: BulkAssignMode) => void;
  onCancel: () => void;
}

const BulkAssignPopover: React.FC<BulkAssignPopoverProps> = ({
  popoverRef,
  pos,
  count,
  saving,
  fetchOptions,
  onSubmit,
  onCancel,
}) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEmails, setPendingEmails] = useState<string[]>([]);
  const [optionsMap, setOptionsMap] = useState<Record<string, Option>>({});
  const [mode, setMode] = useState<BulkAssignMode>("add");

  const requestIdRef = useRef(0);
  const fetchOptionsRef = useRef(fetchOptions);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    fetchOptionsRef.current = fetchOptions;
  }, [fetchOptions]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const id = ++requestIdRef.current;
    setIsLoading(true);
    fetchOptionsRef
      .current(debouncedSearch)
      .then((data) => {
        if (id !== requestIdRef.current || !mountedRef.current) return;
        setOptions(data);
        setIsLoading(false);
      })
      .catch(() => {
        if (id !== requestIdRef.current || !mountedRef.current) return;
        setOptions([]);
        setIsLoading(false);
      });
  }, [debouncedSearch]);

  const toggleEmail = (option: Option) => {
    setPendingEmails((prev) =>
      prev.includes(option.value)
        ? prev.filter((v) => v !== option.value)
        : [...prev, option.value],
    );
    setOptionsMap((prev) => ({ ...prev, [option.value]: option }));
  };

  const selectedSet = new Set(pendingEmails);
  const selectedList = pendingEmails
    .map((v) => optionsMap[v])
    .filter((o): o is Option => Boolean(o));
  const otherList = options.filter((o) => !selectedSet.has(o.value));
  const taskLabel = `${count} task${count > 1 ? "s" : ""}`;

  return createPortal(
    <div
      ref={popoverRef}
      onMouseDown={(e) => e.stopPropagation()}
      style={positionStyle(pos, POPOVER_WIDTH)}
      className="flex flex-col bg-card border border-theme rounded-lg shadow-lg overflow-hidden"
    >
      <div className="px-3 pt-2.5 pb-2 border-b border-theme">
        <span className="text-[11px] font-semibold text-main">
          Assign employees to {taskLabel}
        </span>

        <div className="mt-2 flex rounded border border-theme p-0.5">
          {MODE_OPTIONS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              disabled={saving}
              className={`flex-1 rounded px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 ${
                mode === m.value
                  ? "bg-primary text-white"
                  : "text-muted hover:text-main"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employees..."
          className="mt-2 w-full bg-transparent border border-theme rounded px-2 py-1 text-[12px] text-main outline-none focus:border-[var(--input-border-focus)]"
        />
      </div>

      <div className="max-h-56 overflow-auto">
        {selectedList.map((opt) => (
          <OptionRow
            key={opt.value}
            option={opt}
            checked
            onToggle={toggleEmail}
          />
        ))}

        {isLoading && (
          <div className="px-3 py-2 text-[12px] text-muted">Loading...</div>
        )}

        {!isLoading &&
          otherList.map((opt) => (
            <OptionRow
              key={opt.value}
              option={opt}
              checked={false}
              onToggle={toggleEmail}
            />
          ))}

        {!isLoading && otherList.length === 0 && selectedList.length === 0 && (
          <div className="px-3 py-2 text-[12px] text-muted">
            No records found
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-theme">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="text-[11px] font-medium text-muted hover:text-main px-2.5 py-1 rounded disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSubmit(pendingEmails, mode)}
          disabled={saving || pendingEmails.length === 0}
          className="text-[11px] font-medium text-white bg-primary hover:opacity-90 px-3 py-1 rounded disabled:opacity-50"
        >
          {saving ? "Assigning..." : "Assign"}
        </button>
      </div>
    </div>,
    document.body,
  );
};

const BulkActionsMenu: React.FC<BulkActionsMenuProps> = ({
  count,
  onAddLog,
  assign,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuPos, setMenuPos] = useState<Pos>({ left: 0 });
  const [popoverPos, setPopoverPos] = useState<Pos>({ left: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen && !assignOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      if (saving) return;
      setMenuOpen(false);
      setAssignOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen, assignOpen, saving]);

  if (!onAddLog && !assign) return null;

  const toggleMenu = () => {
    if (assignOpen) {
      if (!saving) setAssignOpen(false);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMenuPos(computePosition(rect, MENU_WIDTH, MENU_HEIGHT_ESTIMATE));
    setMenuOpen((open) => !open);
  };

  const openAssign = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPopoverPos(computePosition(rect, POPOVER_WIDTH, POPOVER_HEIGHT_ESTIMATE));
    setMenuOpen(false);
    setAssignOpen(true);
  };

  const handleAddLog = () => {
    setMenuOpen(false);
    onAddLog?.();
  };

  const submitAssign = async (emails: string[], mode: BulkAssignMode) => {
    if (!assign || saving) return;
    setSaving(true);
    const ok = await assign.onSubmit(emails, mode);
    setSaving(false);
    if (ok) setAssignOpen(false);
  };

  const itemClass =
    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-main row-hover";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen || assignOpen}
        onClick={toggleMenu}
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Actions ({count})
        <ChevronDown size={14} />
      </button>

      {menuOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={positionStyle(menuPos, MENU_WIDTH)}
            className="overflow-hidden rounded-lg border border-theme bg-card py-1 shadow-lg"
          >
            {onAddLog && (
              <button
                type="button"
                role="menuitem"
                onClick={handleAddLog}
                className={itemClass}
              >
                <Clock size={14} className="text-muted" />
                Add Log
              </button>
            )}
            {assign && (
              <button
                type="button"
                role="menuitem"
                onClick={openAssign}
                className={itemClass}
              >
                <UserPlus size={14} className="text-muted" />
                Assign
              </button>
            )}
          </div>,
          document.body,
        )}

      {assignOpen && assign && (
        <BulkAssignPopover
          popoverRef={popoverRef}
          pos={popoverPos}
          count={count}
          saving={saving}
          fetchOptions={assign.fetchOptions}
          onSubmit={submitAssign}
          onCancel={() => setAssignOpen(false)}
        />
      )}
    </>
  );
};

export default BulkActionsMenu;