import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, FileText, Search, X } from "lucide-react";
import type { Option } from "../../ui/modal/SearchSelect2";

/**
 * Grouped task picker (standalone, SearchSelect2 is not modified).
 * Closed: a field showing the selected task. Open: a panel with its own
 * search box, group headers and the tasks under them.
 * Options arrive in hierarchy order; `meta.ancestors` is top-most group first.
 */

interface TaskSelectProps {
  label?: string;
  value?: string; // task label shown in the closed field
  selectedValue?: string; // task id
  onChange: (value: string, option: Option) => void;
  fetchOptions: (q: string) => Promise<Option[]>;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  dropdownMinWidth?: number;
  dropdownMaxWidth?: number;
}

interface Ancestor {
  name: string;
  subject: string;
}

interface Item {
  opt: Option;
  index: number; // position among selectable tasks (headers excluded)
}

interface Segment {
  key: string;
  groupId: string | null; // null = task without a group (no header)
  name: string;
  fullPath: string;
  items: Item[];
}

interface DropdownPos {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

const DEBOUNCE_DELAY = 400;
const MIN_SEARCH_LENGTH = 2;
const DROPDOWN_MAX_HEIGHT = 340;
const DROPDOWN_GAP = 2;
const VIEWPORT_EDGE = 8;
const DEFAULT_MIN_WIDTH = 400;
const DEFAULT_MAX_WIDTH = 480;
const isAncestor = (a: unknown): a is Ancestor =>
  typeof a === "object" &&
  a !== null &&
  typeof (a as Ancestor).name === "string";

const getAncestors = (opt: Option): Ancestor[] => {
  const raw: unknown = opt.meta?.ancestors;
  if (!Array.isArray(raw)) return [];
  return raw.filter(isAncestor).map((a) => ({
    name: a.name,
    subject: a.subject || a.name,
  }));
};

// Flat grouping by the immediate group, keeping the incoming order.
const buildSegments = (options: Option[]): Segment[] => {
  const segments: Segment[] = [];

  options.forEach((opt, index) => {
    const item: Item = { opt, index };
    const ancestors = getAncestors(opt);
    const parent = ancestors.length ? ancestors[ancestors.length - 1] : null;
    const groupId = parent ? parent.name : null;
    const last = segments[segments.length - 1];

    if (last && last.groupId === groupId) {
      last.items.push(item);
      return;
    }

    segments.push({
      key: `s-${index}`,
      groupId,
      name: parent ? parent.subject : "",
      fullPath: ancestors.map((a) => a.subject).join(" › "),
      items: [item],
    });
  });

  return segments;
};

const Highlight: React.FC<{ text: string; term: string }> = ({
  text,
  term,
}) => {
  const needle = term.trim().toLowerCase();
  const at = needle ? text.toLowerCase().indexOf(needle) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded-sm bg-primary/20 text-main">
        {text.slice(at, at + needle.length)}
      </mark>
      {text.slice(at + needle.length)}
    </>
  );
};

const TaskSelect: React.FC<TaskSelectProps> = React.memo(
  ({
    label,
    value,
    selectedValue,
    onChange,
    fetchOptions,
    placeholder = "Search task",
    searchPlaceholder = "Search task...",
    disabled,
    error,
    required,
    dropdownMinWidth = DEFAULT_MIN_WIDTH,
    dropdownMaxWidth = DEFAULT_MAX_WIDTH,
  }) => {
    const uid = useId();
    const listId = `${uid}-list`;

    const [typed, setTyped] = useState("");
    const [debouncedTyped, setDebouncedTyped] = useState("");
    const [options, setOptions] = useState<Option[]>([]);
    const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
      "idle",
    );
    const [retryTick, setRetryTick] = useState(0);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const [dropdownPos, setDropdownPos] = useState<DropdownPos>({
      top: 0,
      left: 0,
      width: 0,
      maxHeight: DROPDOWN_MAX_HEIGHT,
    });

    const triggerRef = useRef<HTMLButtonElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const requestIdRef = useRef(0);
    const fetchOptionsRef = useRef(fetchOptions);
    const keyNavRef = useRef(false);

    useEffect(() => {
      fetchOptionsRef.current = fetchOptions;
    }, [fetchOptions]);

    useEffect(() => {
      const timer = setTimeout(() => setDebouncedTyped(typed), DEBOUNCE_DELAY);
      return () => clearTimeout(timer);
    }, [typed]);

    // Server-side search. Opening always lists everything (typed is "").
    useEffect(() => {
      if (!open) return;
      if (debouncedTyped && debouncedTyped.length < MIN_SEARCH_LENGTH) return;

      const id = ++requestIdRef.current;
      setStatus("loading");
      fetchOptionsRef
        .current(debouncedTyped)
        .then((data) => {
          if (id !== requestIdRef.current) return;
          setOptions(data);
          setStatus("ready");
        })
        .catch(() => {
          if (id !== requestIdRef.current) return;
          setStatus("error");
        });
    }, [open, debouncedTyped, retryTick]);

    const segments = useMemo(() => buildSegments(options), [options]);

    // While searching, every match stays visible regardless of collapse state.
    const isCollapsed = useCallback(
      (groupId: string | null) =>
        groupId !== null && !debouncedTyped && collapsed.has(groupId),
      [collapsed, debouncedTyped],
    );

    // Indexes of tasks currently visible, in render order.
    const visibleIndexes = useMemo(
      () =>
        segments
          .filter((seg) => !isCollapsed(seg.groupId))
          .flatMap((seg) => seg.items.map((it) => it.index)),
      [segments, isCollapsed],
    );

    const firstIndex = options.length ? 0 : -1;

    const toggleGroup = useCallback((groupId: string) => {
      setCollapsed((prev) => {
        const next = new Set(prev);
        if (next.has(groupId)) next.delete(groupId);
        else next.add(groupId);
        return next;
      });
    }, []);

    // Keep the highlighted task on something that is actually visible.
    useEffect(() => {
      if (visibleIndexes.length === 0) return;
      if (!visibleIndexes.includes(activeIndex)) {
        setActiveIndex(visibleIndexes[0]);
      }
    }, [visibleIndexes, activeIndex]);

    const selectedIndex = useMemo(
      () =>
        options.findIndex((o) =>
          selectedValue !== undefined
            ? o.value === selectedValue
            : o.label === value,
        ),
      [options, selectedValue, value],
    );

    useEffect(() => {
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : firstIndex);
    }, [selectedIndex, firstIndex]);

    useEffect(() => {
      if (!open || activeIndex < 0 || !keyNavRef.current) return;
      document
        .getElementById(`${uid}-opt-${activeIndex}`)
        ?.scrollIntoView({ block: "nearest" });
      keyNavRef.current = false;
    }, [activeIndex, open, uid]);

    const fieldTitle = useMemo(() => {
      if (!value) return undefined;
      const match = options.find((o) => o.value === selectedValue);
      if (!match) return value;
      return [...getAncestors(match).map((a) => a.subject), match.label].join(
        " › ",
      );
    }, [options, selectedValue, value]);

    const updatePosition = useCallback(() => {
      const el = wrapperRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const spaceBelow =
        window.innerHeight - rect.bottom - DROPDOWN_GAP - VIEWPORT_EDGE;
      const spaceAbove = rect.top - DROPDOWN_GAP - VIEWPORT_EDGE;
      const openUp =
        spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow;
      const available = Math.max(openUp ? spaceAbove : spaceBelow, 120);

      const viewportWidth = window.innerWidth - VIEWPORT_EDGE * 2;
      const width = Math.min(
        Math.max(rect.width, dropdownMinWidth),
        dropdownMaxWidth,
        viewportWidth,
      );
      const left = Math.min(
        Math.max(rect.left, VIEWPORT_EDGE),
        window.innerWidth - width - VIEWPORT_EDGE,
      );

      setDropdownPos({
        left,
        width,
        maxHeight: Math.min(DROPDOWN_MAX_HEIGHT, available),
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + DROPDOWN_GAP }
          : { top: rect.bottom + DROPDOWN_GAP }),
      });
    }, [dropdownMaxWidth, dropdownMinWidth]);

    useLayoutEffect(() => {
      if (!open) return;
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }, [open, updatePosition]);

    const closeDropdown = useCallback(() => {
      requestIdRef.current += 1;
      setOpen(false);
      setTyped("");
      setDebouncedTyped("");
      setCollapsed(new Set());
    }, []);

    const select = useCallback(
      (opt: Option) => {
        onChange(opt.value, opt);
        closeDropdown();
        triggerRef.current?.focus();
      },
      [onChange, closeDropdown],
    );

    useEffect(() => {
      if (!open) return;
      const handleClick = (e: MouseEvent) => {
        const target = e.target as Node;
        if (
          wrapperRef.current?.contains(target) ||
          dropdownRef.current?.contains(target)
        )
          return;
        closeDropdown();
      };
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }, [open, closeDropdown]);

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const vis = visibleIndexes;
        if (vis.length === 0) return;
        keyNavRef.current = true;
        const step = e.key === "ArrowDown" ? 1 : -1;
        const pos = vis.indexOf(activeIndex);
        const nextPos =
          pos < 0
            ? step > 0
              ? 0
              : vis.length - 1
            : (pos + step + vis.length) % vis.length;
        setActiveIndex(vis[nextPos]);
      } else if (e.key === "Enter") {
        if (visibleIndexes.includes(activeIndex) && options[activeIndex]) {
          e.preventDefault();
          select(options[activeIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeDropdown();
        triggerRef.current?.focus();
      } else if (e.key === "Tab") {
        closeDropdown();
      }
    };

    const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setOpen(true);
      }
    };

    const activeId = activeIndex >= 0 ? `${uid}-opt-${activeIndex}` : undefined;

    const renderItem = (item: Item) => {
      const { opt, index } = item;
      const selected =
        selectedValue !== undefined
          ? opt.value === selectedValue
          : opt.label === value;
      const active = index === activeIndex;

      return (
        <div
          key={opt.value || opt.label}
          id={`${uid}-opt-${index}`}
          role="option"
          aria-selected={selected}
          onMouseDown={(e) => e.preventDefault()}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => select(opt)}
          className={[
            "flex min-w-0 scroll-mt-9 cursor-pointer items-center gap-2 rounded-md py-1.5 pr-2 text-[12px] text-main transition-colors",
            "pl-2",
            selected ? "bg-primary/10" : active ? "bg-primary/5" : "",
          ].join(" ")}
        >
          <FileText size={13} className="shrink-0 text-muted" />
          <span className="min-w-0 flex-1 truncate" title={opt.label}>
            <Highlight text={opt.label} term={debouncedTyped} />
          </span>
          {selected && <Check size={13} className="shrink-0 text-primary" />}
        </div>
      );
    };

    const renderSegment = (seg: Segment) => {
      // Task without a group: plain rows, no header.
      if (seg.groupId === null) {
        return (
          <div
            key={seg.key}
            role="presentation"
            className="ml-[14px] border-l border-theme pl-1"
          >
            {seg.items.map((it) => renderItem(it))}
          </div>
        );
      }

      const groupId = seg.groupId;
      const headerId = `${uid}-h-${seg.key}`;
      const collapsedNow = isCollapsed(groupId);

      return (
        <div key={seg.key} role="group" aria-labelledby={headerId}>
          <button
            type="button"
            id={headerId}
            tabIndex={-1}
            aria-expanded={!collapsedNow}
            title={seg.fullPath}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleGroup(groupId)}
            className="group sticky top-0 z-10 flex w-full min-w-0 cursor-pointer items-center gap-1.5 bg-card px-2 py-1.5 text-left"
          >
            <ChevronDown
              size={13}
              className={[
                "shrink-0 text-muted transition-transform group-hover:text-main",
                collapsedNow ? "-rotate-90" : "",
              ].join(" ")}
            />
            <span className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-wide text-main">
              <Highlight text={seg.name} term={debouncedTyped} />
            </span>
            <span className="shrink-0 rounded-full bg-primary/10 px-2 text-[10px] font-medium text-primary">
              {seg.items.length}
            </span>
          </button>
          {!collapsedNow && (
            <div className="ml-[14px] border-l border-theme pl-1">
              {seg.items.map((it) => renderItem(it))}
            </div>
          )}
        </div>
      );
    };

    const showClear = Boolean(value) && !disabled;

    return (
      <>
        <div ref={wrapperRef} className="flex w-full flex-col">
          {label && (
            <label className="mb-1 text-[10px] font-medium text-main">
              {label}
              {required && <span className="text-danger"> *</span>}
            </label>
          )}
          <div className="relative w-full">
            <button
              ref={triggerRef}
              type="button"
              aria-haspopup="listbox"
              aria-expanded={open}
              disabled={disabled}
              title={fieldTitle}
              onKeyDown={handleTriggerKeyDown}
              onClick={() => {
                if (disabled) return;
                if (open) closeDropdown();
                else setOpen(true);
              }}
              className={[
                "flex h-9 w-full items-center rounded border bg-card pl-2.5 text-left text-xs transition-colors duration-150 focus:outline-none",
                showClear ? "pr-10" : "pr-6",
                disabled
                  ? "cursor-not-allowed border-theme opacity-50"
                  : error
                    ? "border-[var(--input-border-error)] bg-[var(--input-bg-error)]"
                    : "border-theme hover:border-[var(--input-border-hover)] focus:border-[var(--input-border-focus)] focus:shadow-[0_0_0_3px_var(--input-focus-ring)]",
              ].join(" ")}
            >
              <span
                className={[
                  "min-w-0 flex-1 truncate",
                  value ? "text-main" : "text-muted",
                ].join(" ")}
              >
                {value || placeholder}
              </span>
            </button>

            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted"
            />

            {showClear && (
              <button
                type="button"
                aria-label="Clear task"
                onClick={() => onChange("", { label: "", value: "" })}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-danger"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {error && (
            <span className="mt-1 text-[10px] text-danger">{error}</span>
          )}
        </div>

        {open &&
          createPortal(
            <div
              ref={dropdownRef}
              style={{
                position: "fixed",
                top: dropdownPos.top,
                bottom: dropdownPos.bottom,
                left: dropdownPos.left,
                width: dropdownPos.width,
                maxHeight: dropdownPos.maxHeight,
                zIndex: 99999,
              }}
              className="flex flex-col overflow-hidden rounded-xl border border-theme bg-card shadow-lg"
            >
              <div className="shrink-0 p-2">
                <div className="relative">
                  <Search
                    size={13}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    autoFocus
                    role="combobox"
                    aria-expanded
                    aria-controls={listId}
                    aria-activedescendant={activeId}
                    aria-autocomplete="list"
                    value={typed}
                    placeholder={searchPlaceholder}
                    onChange={(e) => setTyped(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="w-full rounded-md border border-theme bg-card py-1.5 pl-8 pr-2 text-[12px] text-main placeholder:text-muted focus:border-[var(--input-border-focus)] focus:outline-none focus:shadow-[0_0_0_3px_var(--input-focus-ring)]"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1.5 pb-1.5">
                <div
                  id={listId}
                  role="listbox"
                  aria-label={label || "Tasks"}
                  className={
                    status === "loading" && options.length ? "opacity-60" : ""
                  }
                >
                  {segments.map((seg) => renderSegment(seg))}
                </div>

                {status === "loading" && options.length === 0 && (
                  <div className="px-2 py-2 text-[12px] text-muted">
                    Loading tasks…
                  </div>
                )}
                {status === "ready" && options.length === 0 && (
                  <div className="px-2 py-2 text-[12px] text-muted">
                    No tasks found
                  </div>
                )}
                {status === "error" && (
                  <div className="flex items-center justify-between gap-2 px-2 py-2 text-[12px] text-danger">
                    <span>Couldn't load tasks.</span>
                    <button
                      type="button"
                      onClick={() => setRetryTick((n) => n + 1)}
                      className="text-primary hover:underline"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )}
      </>
    );
  },
);

export default TaskSelect;