import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, UserPlus } from "lucide-react";

import { Option } from "../../../../components/selects/tabelselect/MultiSearchSelect";

interface AssigneeCellProps {
  emails: string[];
  disabled?: boolean;
  fetchOptions: (q: string) => Promise<Option[]>;
  onChange: (nextEmails: string[], description?: string) => void | Promise<void>;
  onTake?: () => void | Promise<void>;
  currentUserEmail?: string;
}

const AVATAR_PALETTE: [string, string][] = [
  ["#E8F0FE", "#3B6FD4"],
  ["#FCE8E6", "#C5433A"],
  ["#E6F4EA", "#2D7D46"],
  ["#FFF3E0", "#C07A1B"],
  ["#F3E8FD", "#7B3FC4"],
  ["#E8F5E9", "#388E3C"],
  ["#FFF8E1", "#F9A825"],
  ["#E3F2FD", "#1565C0"],
];

function getAvatarColors(seed: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function getDisplayName(email: string): string {
  const username = email.split("@")[0];
  return username
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const TOOLTIP_WIDTH = 280;
const POPOVER_WIDTH = 300;
const POPOVER_MIN_HEIGHT_ESTIMATE = 360;
const DEBOUNCE_DELAY = 350;

const AssigneeCell: React.FC<AssigneeCellProps> = ({
  emails,
  disabled,
  fetchOptions,
  onChange,
  onTake,
  currentUserEmail,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{
    top?: number;
    bottom?: number;
    left: number;
  }>({ top: 0, left: 0 });

  const [open, setOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
  }>({ left: 0, width: POPOVER_WIDTH });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [pendingEmails, setPendingEmails] = useState<string[]>([]);
  const [pendingOptionsMap, setPendingOptionsMap] = useState<
    Record<string, Option>
  >({});
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [taking, setTaking] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
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

  const reposition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(Math.max(rect.left, 8), vw - TOOLTIP_WIDTH - 8);

    const estimatedHeight = Math.min(emails.length * 48 + 24, 320);
    const spaceBelow = vh - rect.bottom - 8;
    const spaceAbove = rect.top - 8;

    if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
      setTooltipPos({ bottom: vh - rect.top + 8, left });
    } else {
      setTooltipPos({ top: rect.bottom + 8, left });
    }
  };

  const handleMouseEnter = () => {
    if (open) return;
    reposition();
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const repositionPopover = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(Math.max(rect.width, POPOVER_WIDTH), vw - 16);
    const left = Math.min(Math.max(rect.left, 8), vw - width - 8);

    const spaceBelow = vh - rect.bottom - 8;
    const spaceAbove = rect.top - 8;

    if (spaceBelow < POPOVER_MIN_HEIGHT_ESTIMATE && spaceAbove > spaceBelow) {
      setPopoverPos({ bottom: vh - rect.top + 6, left, width });
    } else {
      setPopoverPos({ top: rect.bottom + 6, left, width });
    }
  }, []);

  const openPopover = () => {
    if (disabled || saving) return;
    setShowTooltip(false);

    const initialMap: Record<string, Option> = {};
    emails.forEach((email) => {
      initialMap[email] = {
        label: getDisplayName(email),
        value: email,
        subLabel: email,
      };
    });

    setPendingOptionsMap(initialMap);
    setPendingEmails([...emails]);
    setSearch("");
    setDebouncedSearch("");
    setDescription("");
    setOptions([]);
    repositionPopover();
    setOpen(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    const id = ++requestIdRef.current;
    setIsLoading(true);
    fetchOptionsRef
      .current(debouncedSearch)
      .then((data) => {
        if (id !== requestIdRef.current || !mountedRef.current) return;
        setOptions(data);
        setIsLoading(false);
        setPendingOptionsMap((prev) => {
          let changed = false;
          const next = { ...prev };
          data.forEach((opt) => {
            if (next[opt.value]) {
              next[opt.value] = opt;
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      })
      .catch(() => {
        if (id !== requestIdRef.current || !mountedRef.current) return;
        setOptions([]);
        setIsLoading(false);
      });
  }, [debouncedSearch, open]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        if (saving) return;
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, saving]);

  const selfAssigned = !!currentUserEmail && emails.includes(currentUserEmail);

  const toggleEmail = (opt: Option) => {
    setPendingEmails((prev) => {
      if (prev.includes(opt.value)) {
        return prev.filter((v) => v !== opt.value);
      }
      if (!selfAssigned) return [...prev, opt.value];

      const isSelf = opt.value === currentUserEmail;
      const hasNewOthers = prev.some(
        (v) => v !== currentUserEmail && !emails.includes(v),
      );

      if (isSelf) return hasNewOthers ? prev : [...prev, opt.value];

      const isNewOther = !emails.includes(opt.value);
      const base = isNewOther
        ? prev.filter((v) => v !== currentUserEmail)
        : prev;
      return [...base, opt.value];
    });
    setPendingOptionsMap((prev) => ({ ...prev, [opt.value]: opt }));
  };

  const handleCancel = () => {
    if (saving) return;
    setOpen(false);
  };

  const handleAssign = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onChange(pendingEmails, description.trim() || undefined);
      if (mountedRef.current) setOpen(false);
    } catch {
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  const handleTake = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (taking || !onTake) return;
    setTaking(true);
    try {
      await onTake();
    } catch {
    } finally {
      if (mountedRef.current) setTaking(false);
    }
  };

  const selectedList = pendingEmails.map(
    (v) =>
      pendingOptionsMap[v] || {
        label: getDisplayName(v),
        value: v,
        subLabel: v,
      },
  );
  const selectedSet = new Set(pendingEmails);
  const otherList = options.filter((o) => !selectedSet.has(o.value));

  const visible = emails.slice(0, 3);
  const overflow = emails.length - visible.length;
  const hasAssignees = emails.length > 0;

const takeButton = onTake ? (
  <button
    type="button"
    onClick={handleTake}
    onDoubleClick={(e) => e.stopPropagation()}
    disabled={taking}
    title={
      hasAssignees ? "Add yourself to this task" : "Assign this task to yourself"
    }
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-primary/40 bg-primary/10 font-semibold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${
      hasAssignees ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-[11px]"
    }`}
  >
    {taking ? (
      <Loader2 size={12} className="animate-spin" />
    ) : (
      <UserPlus size={12} />
    )}
    {taking ? "Joining..." : hasAssignees ? "Join" : "Take task"}
  </button>
) : null;

if (!hasAssignees && takeButton) return takeButton;

  if (emails.length === 0 && onTake) {
    return (
      <button
        type="button"
        onClick={handleTake}
        onDoubleClick={(e) => e.stopPropagation()}
        disabled={taking}
        title="Assign this task to yourself"
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {taking ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <UserPlus size={12} />
        )}
        {taking ? "Taking..." : "Take task"}
      </button>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-disabled={disabled || undefined}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled) return;
          openPopover();
        }}
        onDoubleClick={(e) => e.stopPropagation()}
        onMouseEnter={emails.length > 0 ? handleMouseEnter : undefined}
        onMouseLeave={emails.length > 0 ? handleMouseLeave : undefined}
        className={`relative flex items-center min-w-[120px] text-left ${
          disabled ? "cursor-default" : "cursor-pointer"
        }`}
      >
        {emails.length === 0 ? (
          disabled ? (
            <span className="text-xs text-muted">Unassigned</span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-muted border border-dashed border-theme rounded-full px-2.5 py-1 hover:text-main hover:border-main">
              + Assign
            </span>
          )
        ) : (
          <div className="flex items-center -space-x-1.5">
            {visible.map((email) => {
              const displayName = getDisplayName(email);
              const [bg, fg] = getAvatarColors(email);

              return (
                <span
                  key={email}
                  className="flex shrink-0 items-center justify-center rounded-full border-2 border-card"
                  style={{
                    width: 30,
                    height: 30,
                    background: bg,
                    color: fg,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    userSelect: "none",
                  }}
                >
                  {getInitials(displayName)}
                </span>
              );
            })}

            {overflow > 0 && (
              <span
                className="flex shrink-0 items-center justify-center rounded-full border-2 border-card bg-[var(--border)] text-main"
                style={{
                  width: 30,
                  height: 30,
                  fontSize: 10,
                  fontWeight: 700,
                  userSelect: "none",
                }}
              >
                +{overflow}
              </span>
            )}
          </div>
        )}

        {showTooltip &&
          emails.length > 0 &&
          createPortal(
            <div
              style={{
                position: "fixed",
                ...(tooltipPos.top !== undefined ? { top: tooltipPos.top } : {}),
                ...(tooltipPos.bottom !== undefined
                  ? { bottom: tooltipPos.bottom }
                  : {}),
                left: tooltipPos.left,
                width: TOOLTIP_WIDTH,
                zIndex: 99999,
              }}
              className="pointer-events-none rounded-lg border border-theme bg-card p-3 shadow-lg"
            >
              <div className="flex flex-col gap-2.5">
                {emails.map((email) => {
                  const displayName = getDisplayName(email);
                  const [bg, fg] = getAvatarColors(email);

                  return (
                    <div key={email} className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="flex shrink-0 items-center justify-center rounded-full"
                        style={{
                          width: 30,
                          height: 30,
                          background: bg,
                          color: fg,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.03em",
                          userSelect: "none",
                        }}
                      >
                        {getInitials(displayName)}
                      </span>

                      <div className="min-w-0 flex flex-col leading-tight">
                        <span
                          className="block truncate text-sm font-semibold text-main"
                          title={displayName}
                        >
                          {displayName}
                        </span>
                        <span
                          className="block truncate text-xs text-muted"
                          title={email}
                        >
                          {email}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>,
            document.body,
          )}
      </button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              ...(popoverPos.top !== undefined ? { top: popoverPos.top } : {}),
              ...(popoverPos.bottom !== undefined
                ? { bottom: popoverPos.bottom }
                : {}),
              left: popoverPos.left,
              width: popoverPos.width,
              zIndex: 99999,
            }}
            className="flex flex-col bg-card border border-theme rounded-lg shadow-lg overflow-hidden"
          >
            <div className="px-3 pt-2.5 pb-2 border-b border-theme">
              <span className="text-[11px] font-semibold text-main">
                Assign employees
              </span>
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employees..."
                className="mt-1.5 w-full bg-transparent border border-theme rounded px-2 py-1 text-[12px] text-main outline-none focus:border-[var(--input-border-focus)]"
              />
            </div>

            <div className="max-h-56 overflow-auto">
              {selectedList.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => toggleEmail(opt)}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer row-hover bg-primary/5"
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked
                    className="pointer-events-none"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[12px] text-main truncate">
                      {opt.label}
                    </span>
                    {opt.subLabel && (
                      <span className="text-[10px] text-muted truncate leading-tight">
                        {opt.subLabel}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="px-3 py-2 text-[12px] text-muted">Loading...</div>
              )}

              {!isLoading &&
                otherList.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => toggleEmail(opt)}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer row-hover"
                  >
                    <input
                      type="checkbox"
                      readOnly
                      checked={false}
                      className="pointer-events-none"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] text-main truncate">
                        {opt.label}
                      </span>
                      {opt.subLabel && (
                        <span className="text-[10px] text-muted truncate leading-tight">
                          {opt.subLabel}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

              {!isLoading &&
                otherList.length === 0 &&
                selectedList.length === 0 && (
                  <div className="px-3 py-2 text-[12px] text-muted">
                    No records found
                  </div>
                )}
            </div>

            <div className="px-3 py-2 border-t border-theme">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
                rows={2}
                placeholder="Description (optional)"
                className="w-full resize-none bg-transparent border border-theme rounded px-2 py-1 text-[12px] text-main outline-none focus:border-[var(--input-border-focus)] disabled:opacity-50"
              />
            </div>

            <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-theme">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="text-[11px] font-medium text-muted hover:text-main px-2.5 py-1 rounded disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssign}
                disabled={saving}
                className="text-[11px] font-medium text-white bg-primary hover:opacity-90 px-3 py-1 rounded disabled:opacity-50"
              >
                {saving ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default AssigneeCell;