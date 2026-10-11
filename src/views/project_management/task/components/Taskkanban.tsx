import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Check,
  CornerDownRight,
  Folder,
  Maximize2,
  Minimize2,
  Search,
  X,
} from "lucide-react";
import { showApiError, showSuccess } from "../../../../utils/alert";
import DateDisplay from "../../../../components/UI_Utils/Datedisplay";
import SearchSelect2, {
  type Option,
} from "../../../../components/ui/modal/SearchSelect2";
import {
  REFRESH_KEYS,
  useDataRefreshStore,
} from "../../../../store/dataRefreshStore";
import type {
  TaskEntry,
  TaskStatus,
} from "../../../../types/Project_Management/task/table/Task.types";
import {
  getTaskList,
  parseAssignedEmails,
  updateTaskStatus,
} from "../../../../api/project/task/taskapi";
import PriorityChip from "./PriorityChip";
import { isContextTask } from "./Tasktable.config";

type Variant = "draft" | "info" | "success" | "danger";
type Highlight = "none" | "on" | "dim";

export interface KanbanStatus {
  label: string;
  value: string;
  variant: Variant;
}

interface Props {
  statuses: KanbanStatus[];
  searchTerm: string;
  onSearch: (q: string) => void;
  projectFilter: string[];
  onProjectFilterChange: (v: string[]) => void;
  assigneeFilter: string[];
  onAssigneeFilterChange?: (v: string[]) => void;
  fetchProjects: (q: string) => Promise<Option[]>;
  fetchUsers: (q: string) => Promise<Option[]>;
  getProjectName: (code: string | null) => string;
  canEdit: boolean;
  canEditTask?: (task: TaskEntry) => boolean;
  onView: (name: string) => void;
  toolbarRight?: React.ReactNode;
  taskNames?: string[];
  showProgress?: boolean;
}

interface StatusMeta {
  label: string;
  color: string;
}

const KANBAN_LIMIT = 500;
const DONE_STATUS = "Completed";
const DONE_PROGRESS = 100;
const SEARCH_DEBOUNCE_MS = 400;
const MAX_AVATARS = 3;
const FALLBACK_COLOR = "var(--muted, #94a3b8)";
const EMPTY_TASKS: TaskEntry[] = [];
const MARQUEE_THRESHOLD = 4;
const DENSITY_KEY = "kanban-density";
const SELECTED_BG =
  "color-mix(in srgb, var(--primary, #3b82f6) 8%, var(--card, #fff))";
const MARQUEE_FILL =
  "color-mix(in srgb, var(--primary, #3b82f6) 10%, transparent)";
const MARQUEE_STROKE =
  "color-mix(in srgb, var(--primary, #3b82f6) 70%, transparent)";
const MARQUEE_GLOW =
  "color-mix(in srgb, var(--primary, #3b82f6) 15%, transparent)";

interface MarqueeRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const VARIANT_COLOR: Record<Variant, string> = {
  draft: "var(--muted, #94a3b8)",
  info: "var(--primary, #3b82f6)",
  success: "var(--success, #22c55e)",
  danger: "var(--danger, #ef4444)",
};

const AVATAR_COLORS = [
  { bg: "#1e3a8a", fg: "#ffffff" },
  { bg: "#3b82f6", fg: "#ffffff" },
  { bg: "#fbcfe8", fg: "#9d174d" },
  { bg: "#fecaca", fg: "#991b1b" },
  { bg: "#bfdbfe", fg: "#1e40af" },
  { bg: "#c7d2fe", fg: "#3730a3" },
  { bg: "#ddd6fe", fg: "#5b21b6" },
  { bg: "#bbf7d0", fg: "#166534" },
];

const FAMILY_COLORS = [
  "#6366f1",
  "#d97706",
  "#059669",
  "#db2777",
  "#0284c7",
  "#7c3aed",
  "#dc2626",
  "#0d9488",
];

const hashOf = (s: string) =>
  Array.from(s).reduce((sum, c) => (sum * 31 + c.charCodeAt(0)) >>> 0, 7);

const avatarColor = (s: string) => AVATAR_COLORS[hashOf(s) % AVATAR_COLORS.length];

const familyColor = (s: string) => FAMILY_COLORS[hashOf(s) % FAMILY_COLORS.length];

// "TASK-2026-00017" -> "#00017" (full ID stays available in the tooltip)
const shortId = (name: string) => name.replace(/^TASK-\d{4}-/, "#");

const clampProgress = (v: unknown) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
};

const isGroupTask = (t: TaskEntry) => Boolean(t.is_group);

const familyKeyOf = (t: TaskEntry): string | null => {
  if (t.parent_task) return t.parent_task;
  if (isGroupTask(t)) return t.name;
  return null;
};

interface CardProps {
  task: TaskEntry;
  status: string;
  kids: TaskEntry[];
  parentLabel: string | null;
  projectName: string;
  accent: string | null;
  highlight: Highlight;
  movable: boolean;
  selected: boolean;
  selecting: boolean;
  hasFilters: boolean;
  showProgress: boolean;
  compact: boolean;
  metaMap: Map<string, StatusMeta>;
  onOpen: (name: string) => void;
  onToggleSelect: (name: string) => void;
  onHover: (key: string | null) => void;
  onDragBegin: (name: string, from: string) => void;
  onDragFinish: () => void;
}

const KanbanCard = memo(function KanbanCard({
  task,
  status,
  kids,
  parentLabel,
  projectName,
  accent,
  highlight,
  movable,
  selected,
  selecting,
  hasFilters,
  showProgress,
  compact,
  metaMap,
  onOpen,
  onToggleSelect,
  onHover,
  onDragBegin,
  onDragFinish,
}: CardProps) {
  const isGroup = isGroupTask(task);
  const emails = useMemo(() => parseAssignedEmails(task._assign), [task._assign]);
  const progress = clampProgress(task.progress);

  const kidCounts = useMemo(() => {
    const map = new Map<string, number>();
    kids.forEach((k) => map.set(k.status, (map.get(k.status) ?? 0) + 1));
    return Array.from(map);
  }, [kids]);

  const kidsLabel = hasFilters
    ? `${kids.length} shown`
    : `${kids.length} ${kids.length === 1 ? "child" : "children"}`;

  const familyKey = familyKeyOf(task);

  const open = () => onOpen(task.name);

  const handleClick = (e: React.MouseEvent) => {
    if (movable && (selecting || e.ctrlKey || e.metaKey || e.shiftKey)) {
      onToggleSelect(task.name);
      return;
    }
    open();
  };

  const avatarSize = compact ? "h-4 w-4 text-[8px]" : "h-5 w-5 text-[9px]";

  const avatars = (
    <div className="flex shrink-0 items-center">
      {emails.slice(0, MAX_AVATARS).map((email, i) => {
        const av = avatarColor(email);
        return (
          <span
            key={email}
            title={email}
            className={`flex ${avatarSize} items-center justify-center rounded-full border-2 border-[var(--card,#fff)] font-bold`}
            style={{
              background: av.bg,
              color: av.fg,
              marginLeft: i === 0 ? 0 : -6,
            }}
          >
            {email.charAt(0).toUpperCase()}
          </span>
        );
      })}
      {emails.length > MAX_AVATARS && (
        <span className="ml-1 text-[10px] font-semibold text-muted">
          +{emails.length - MAX_AVATARS}
        </span>
      )}
    </div>
  );

  const kidsBar =
    kids.length > 0 ? (
      <div
        className={[
          "flex min-w-0 flex-1 gap-px overflow-hidden rounded-full",
          compact ? "h-0.5" : "h-1.5",
        ].join(" ")}
        style={{ background: "var(--border)" }}
      >
        {kidCounts.map(([st, n]) => {
          const meta = metaMap.get(st);
          return (
            <span
              key={st}
              title={`${n} ${meta?.label ?? st}`}
              style={{
                flexGrow: n,
                flexBasis: 0,
                background: meta?.color ?? FALLBACK_COLOR,
              }}
            />
          );
        })}
      </div>
    ) : null;

  const tooltip = compact
    ? [
        task.subject,
        task.name,
        projectName,
        parentLabel ? `↳ ${parentLabel}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : undefined;

  return (
    <div
      role="button"
      tabIndex={0}
      data-task-name={task.name}
      title={tooltip}
      draggable={movable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.name);
        onHover(null);
        onDragBegin(task.name, status);
      }}
      onDragEnd={onDragFinish}
      onMouseEnter={() => onHover(familyKey ? task.name : null)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(familyKey ? task.name : null)}
      onBlur={() => onHover(null)}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (e.key === " " && movable && selecting) onToggleSelect(task.name);
          else open();
        }
      }}
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: compact ? "0 48px" : "0 104px",
        ...(selected
          ? {
              outline: "1.5px solid var(--primary, #3b82f6)",
              outlineOffset: 0,
              background: SELECTED_BG,
            }
          : highlight === "on" && accent
            ? { outline: `1.5px solid ${accent}`, outlineOffset: 0 }
            : {}),
      }}
      className={[
        "group relative overflow-hidden rounded-lg border border-[var(--border)] bg-card shadow-sm transition-[opacity,box-shadow] hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary",
        compact ? "py-1.5 pl-3 pr-2" : "py-2 pl-3.5 pr-2.5",
        highlight === "dim" ? "opacity-40" : "",
        movable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
      ].join(" ")}
    >
      {accent && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1"
          style={{ background: accent }}
        />
      )}

      {movable && (
        <button
          type="button"
          aria-label={selected ? "Deselect task" : "Select task"}
          aria-pressed={selected}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(task.name);
          }}
          className={[
            "absolute z-10 flex h-4 w-4 items-center justify-center rounded border transition-opacity",
            compact ? "right-1.5 top-1.5" : "right-2 top-2",
            selected
              ? "border-primary bg-primary text-white opacity-100"
              : selecting
                ? "border-[var(--border)] bg-card opacity-100"
                : "border-[var(--border)] bg-card opacity-0 focus-visible:opacity-100 group-hover:opacity-100",
          ].join(" ")}
        >
          {selected && <Check size={11} />}
        </button>
      )}

      {!compact && parentLabel && task.parent_task && (
        <span
          role="link"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onOpen(task.parent_task as string);
          }}
          className="mb-1 inline-flex max-w-full items-center gap-1 rounded px-1.5 py-px text-[10px] font-semibold hover:underline"
          style={{
            background: accent ? `${accent}24` : "transparent",
            color: accent ?? "inherit",
          }}
        >
          <CornerDownRight size={10} className="shrink-0" />
          <span className="truncate">{parentLabel}</span>
        </span>
      )}

      <p className="flex items-start gap-1 pr-4 text-xs font-bold leading-snug text-main">
        {isGroup && (
          <Folder
            size={compact ? 12 : 13}
            className="mt-0.5 shrink-0"
            style={{ color: accent ?? undefined }}
          />
        )}
        <span className={compact ? "min-w-0 truncate" : "min-w-0 break-words"}>
          {task.subject}
        </span>
      </p>

      {compact ? (
        <>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-muted">
              {shortId(task.name)}
            </span>
            {isGroup && (
              <span
                title={kidsLabel}
                className="rounded border px-1 text-[9px] font-bold"
                style={{
                  borderColor: accent ?? "var(--border)",
                  color: accent ?? undefined,
                }}
              >
                {kids.length}
              </span>
            )}
            <PriorityChip priority={task.priority} />
            <div className="ml-auto">{avatars}</div>
          </div>

          {isGroup && kidsBar ? (
            <div className="mt-1 flex">{kidsBar}</div>
          ) : (
            showProgress &&
            progress > 0 && (
              <div
                className="mt-1 h-0.5 rounded-full"
                style={{ background: "var(--border)" }}
              >
                <div
                  className="h-0.5 rounded-full bg-success"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )
          )}
        </>
      ) : (
        <>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span className="font-mono text-[10px] text-muted">{task.name}</span>
            {isGroup && (
              <span
                className="rounded border px-1 text-[9px] font-bold uppercase tracking-wide"
                style={{
                  borderColor: accent ?? "var(--border)",
                  color: accent ?? undefined,
                }}
              >
                Group
              </span>
            )}
            <PriorityChip priority={task.priority} />
          </div>

          {isGroup && (
            <div className="mt-1 flex items-center gap-2 text-[10px] text-muted">
              <span className="shrink-0 font-semibold">{kidsLabel}</span>
              {kidsBar}
            </div>
          )}

          {showProgress && (
            <div className="mt-1.5 flex items-center gap-2">
              <div
                className="h-1.5 flex-1 rounded-full"
                style={{ background: "var(--border)" }}
              >
                <div
                  className="h-1.5 rounded-full bg-success"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="w-8 text-right font-mono text-[10px] text-muted">
                {progress}%
              </span>
            </div>
          )}

          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-col">
              {projectName && (
                <span className="truncate text-[10px] font-medium text-muted">
                  {projectName}
                </span>
              )}
              {task.exp_end_date ? (
                <DateDisplay
                  date={task.exp_end_date}
                  className="whitespace-nowrap text-[10px] text-muted"
                />
              ) : (
                <span className="text-[10px] text-muted">—</span>
              )}
            </div>
            {avatars}
          </div>
        </>
      )}
    </div>
  );
});

const TaskKanban: React.FC<Props> = ({
  statuses,
  searchTerm,
  onSearch,
  projectFilter,
  onProjectFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  fetchProjects,
  fetchUsers,
  getProjectName,
  canEdit,
  canEditTask,
  onView,
  toolbarRight,
  taskNames,
  showProgress = true,
}) => {
  const subscribeToRefresh = useDataRefreshStore((s) => s.subscribeToRefresh);

  const [tasks, setTasks] = useState<TaskEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState(searchTerm);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [hoverName, setHoverName] = useState<string | null>(null);
  const [contextRows, setContextRows] = useState<TaskEntry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null);
  const [projectLabel, setProjectLabel] = useState(
    projectFilter.length === 1 ? getProjectName(projectFilter[0]) : "",
  );
  const [assigneeLabel, setAssigneeLabel] = useState(
    assigneeFilter.length === 1 ? assigneeFilter[0] : "",
  );
  const [compact, setCompact] = useState<boolean>(() => {
    try {
      return (localStorage.getItem(DENSITY_KEY) ?? "compact") === "compact";
    } catch {
      return true;
    }
  });

  const reqRef = useRef(0);
  const mountedRef = useRef(true);
  const dragRef = useRef<{ name: string; from: string } | null>(null);
  const onViewRef = useRef(onView);
  const canEditRef = useRef(canEdit);
  const canEditTaskRef = useRef(canEditTask);
  const getProjectNameRef = useRef(getProjectName);

  useEffect(() => {
    onViewRef.current = onView;
    canEditRef.current = canEdit;
    canEditTaskRef.current = canEditTask;
    getProjectNameRef.current = getProjectName;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      reqRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!projectFilter.length) setProjectLabel("");
  }, [projectFilter]);

  useEffect(() => {
    if (!assigneeFilter.length) setAssigneeLabel("");
  }, [assigneeFilter]);

  const toggleCompact = () =>
    setCompact((prev) => {
      try {
        localStorage.setItem(DENSITY_KEY, prev ? "comfortable" : "compact");
      } catch {
        /* storage unavailable: keep in-memory state only */
      }
      return !prev;
    });

  const hasFilters =
    Boolean(searchInput) ||
    projectFilter.length > 0 ||
    assigneeFilter.length > 0;

  const metaMap = useMemo(() => {
    const map = new Map<string, StatusMeta>();
    statuses.forEach((s) =>
      map.set(s.value, {
        label: s.label,
        color: VARIANT_COLOR[s.variant] ?? FALLBACK_COLOR,
      }),
    );
    return map;
  }, [statuses]);

  const fetchTasks = useCallback(
    async (pageNo: number) => {
      const res = await getTaskList(
        pageNo,
        KANBAN_LIMIT,
        statuses.map((s) => s.value),
        projectFilter.length ? projectFilter : undefined,
        searchTerm || undefined,
        undefined,
        "desc",
        assigneeFilter.length ? assigneeFilter : undefined,
        true,
        taskNames,
      );
      // Context rows are ancestors the API sends only so hierarchy can be shown.
      // They are not cards and not part of `total`, but we keep them for parent
      // labels and for linking a whole family on hover.
      const rows = Array.isArray(res?.data) ? (res.data as TaskEntry[]) : [];
      const items = rows.filter((t) => !isContextTask(t));
      return {
        items,
        context: rows.filter(isContextTask),
        total: Number(res?.pagination?.total) || items.length,
      };
    },
    [statuses, projectFilter, searchTerm, assigneeFilter, taskNames],
  );

  const loadAll = useCallback(
    async (silent = false) => {
      const id = ++reqRef.current;
      if (!silent) setLoading(true);
      try {
        const { items, context, total: count } = await fetchTasks(1);
        if (id !== reqRef.current || !mountedRef.current) return;
        const seen = new Set<string>();
        setTasks(
          items.filter((t) => {
            if (!t?.name || seen.has(t.name)) return false;
            seen.add(t.name);
            return true;
          }),
        );
        setContextRows(context);
        setTotal(count);
        setPage(1);
      } catch (error) {
        if (id === reqRef.current && mountedRef.current) showApiError(error);
      } finally {
        if (id === reqRef.current && mountedRef.current) setLoading(false);
      }
    },
    [fetchTasks],
  );

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const loadAllRef = useRef(loadAll);
  useEffect(() => {
    loadAllRef.current = loadAll;
  }, [loadAll]);

  useEffect(() => {
    const unsubscribe = subscribeToRefresh(REFRESH_KEYS.TASK_LIST, () =>
      loadAllRef.current(true),
    );
    return unsubscribe;
  }, [subscribeToRefresh]);

  useEffect(() => {
    if (searchInput === searchTerm) return;
    const t = setTimeout(() => onSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput, searchTerm, onSearch]);

  const loadMore = async () => {
    if (loadingMore) return;
    const id = reqRef.current;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const { items, context, total: count } = await fetchTasks(nextPage);
      if (id !== reqRef.current || !mountedRef.current) return;
      setTasks((prev) => {
        const seen = new Set(prev.map((t) => t.name));
        return [...prev, ...items.filter((t) => t?.name && !seen.has(t.name))];
      });
      setContextRows((prev) => {
        const seen = new Set(prev.map((t) => t.name));
        return [...prev, ...context.filter((t) => !seen.has(t.name))];
      });
      setTotal(count);
      setPage(nextPage);
    } catch (error) {
      if (mountedRef.current) showApiError(error);
    } finally {
      if (mountedRef.current) setLoadingMore(false);
    }
  };

  const { byStatus, childrenOf, byName } = useMemo(() => {
    const byStatus = new Map<string, TaskEntry[]>();
    const childrenOf = new Map<string, TaskEntry[]>();
    const byName = new Map<string, TaskEntry>();

    tasks.forEach((t) => byName.set(t.name, t));

    tasks.forEach((t) => {
      const column = byStatus.get(t.status);
      if (column) column.push(t);
      else byStatus.set(t.status, [t]);

      if (t.parent_task && t.parent_task !== t.name) {
        const siblings = childrenOf.get(t.parent_task);
        if (siblings) siblings.push(t);
        else childrenOf.set(t.parent_task, [t]);
      }
    });

    return { byStatus, childrenOf, byName };
  }, [tasks]);

  // Cards plus context ancestors: used only for labels and family linking.
  const lookup = useMemo(() => {
    const map = new Map<string, TaskEntry>();
    contextRows.forEach((t) => map.set(t.name, t));
    tasks.forEach((t) => map.set(t.name, t));
    return map;
  }, [tasks, contextRows]);

  // Whole family of the hovered card: top-most ancestor and every descendant.
  const family = useMemo(() => {
    if (!hoverName) return null;

    let root = hoverName;
    const climbed = new Set([root]);
    for (;;) {
      const parent = lookup.get(root)?.parent_task;
      if (!parent || climbed.has(parent)) break;
      climbed.add(parent);
      root = parent;
    }

    const names = new Set<string>();
    const stack = [root];
    while (stack.length) {
      const name = stack.pop() as string;
      if (names.has(name)) continue;
      names.add(name);
      childrenOf.get(name)?.forEach((child) => stack.push(child.name));
    }
    return names;
  }, [hoverName, lookup, childrenOf]);

  const byNameRef = useRef(byName);
  useEffect(() => {
    byNameRef.current = byName;
  }, [byName]);

  useEffect(() => {
    setSelected((prev) => {
      if (!prev.size) return prev;
      const next = new Set(Array.from(prev).filter((n) => byName.has(n)));
      return next.size === prev.size ? prev : next;
    });
  }, [byName]);

  useEffect(() => {
    if (!selected.size) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(new Set());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected.size]);

  const toggleSelect = useCallback((name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(name)) next.add(name);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const isMovable = useCallback((t: TaskEntry) => {
    if (!canEditRef.current) return false;
    const check = canEditTaskRef.current;
    return check ? check(t) : true;
  }, []);

  const moveTask = useCallback(
    async (name: string, to: string) => {
      const task = byNameRef.current.get(name);
      if (!task || task.status === to || !isMovable(task)) return;

      const nextProgress =
        to === DONE_STATUS && !isGroupTask(task) ? DONE_PROGRESS : undefined;

      setTasks((prev) =>
        prev.map((t) =>
          t.name === name
            ? {
                ...t,
                status: to as TaskStatus,
                ...(nextProgress !== undefined ? { progress: nextProgress } : {}),
              }
            : t,
        ),
      );

      try {
        await updateTaskStatus(name, to, nextProgress);
        if (!mountedRef.current) return;
        showSuccess("Task status updated");
      } catch (error) {
        if (mountedRef.current) showApiError(error);
      } finally {
        if (mountedRef.current) loadAllRef.current(true);
      }
    },
    [isMovable],
  );

  const bulkMove = async (to: string) => {
    if (bulkBusy) return;
    const targets = Array.from(selected)
      .map((n) => byNameRef.current.get(n))
      .filter(
        (t): t is TaskEntry => Boolean(t) && t!.status !== to && isMovable(t!),
      );
    if (!targets.length) {
      clearSelection();
      return;
    }

    const progressOf = (t: TaskEntry) =>
      to === DONE_STATUS && !isGroupTask(t) ? DONE_PROGRESS : undefined;
    const names = new Set(targets.map((t) => t.name));

    setBulkBusy(true);
    setTasks((prev) =>
      prev.map((t) =>
        names.has(t.name)
          ? {
              ...t,
              status: to as TaskStatus,
              ...(progressOf(t) !== undefined ? { progress: DONE_PROGRESS } : {}),
            }
          : t,
      ),
    );

    const results = await Promise.allSettled(
      targets.map((t) => updateTaskStatus(t.name, to, progressOf(t))),
    );
    if (!mountedRef.current) return;

    const failed = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    if (failed.length) showApiError(failed[0].reason);
    if (failed.length < results.length) {
      showSuccess(`${results.length - failed.length} task(s) updated`);
    }
    clearSelection();
    setBulkBusy(false);
    loadAllRef.current(true);
  };

  const handleDrop = (status: string) => {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragOver(null);
    if (!drag || drag.from === status || !canEdit) return;
    if (selected.size > 1 && selected.has(drag.name)) {
      bulkMove(status);
      return;
    }
    moveTask(drag.name, status);
  };

  const handleOpen = useCallback((name: string) => {
    onViewRef.current(name);
  }, []);

  const handleHover = useCallback((name: string | null) => {
    setHoverName((prev) => (prev === name ? prev : name));
  }, []);

  const handleDragBegin = useCallback((name: string, from: string) => {
    dragRef.current = { name, from };
  }, []);

  const handleDragFinish = useCallback(() => {
    dragRef.current = null;
    setDragOver(null);
  }, []);

  const clearFilters = () => {
    setSearchInput("");
    onSearch("");
    onProjectFilterChange([]);
    onAssigneeFilterChange?.([]);
  };

  const highlightOf = (t: TaskEntry): Highlight => {
    if (!family) return "none";
    return family.has(t.name) ? "on" : "dim";
  };

  const renderCard = (t: TaskEntry, status: string) => {
    const familyKey = familyKeyOf(t);
    const parent = t.parent_task ? lookup.get(t.parent_task) : undefined;
    const parentLabel = t.parent_task ? (parent?.subject || t.parent_task) : null;

    return (
      <KanbanCard
        key={t.name}
        task={t}
        status={status}
        kids={isGroupTask(t) ? (childrenOf.get(t.name) ?? EMPTY_TASKS) : EMPTY_TASKS}
        parentLabel={parentLabel}
        projectName={t.project ? getProjectNameRef.current(t.project) : ""}
        accent={familyKey ? familyColor(familyKey) : null}
        highlight={highlightOf(t)}
        movable={isMovable(t)}
        selected={selected.has(t.name)}
        selecting={selected.size > 0}
        hasFilters={hasFilters}
        showProgress={showProgress}
        compact={compact}
        metaMap={metaMap}
        onOpen={handleOpen}
        onToggleSelect={toggleSelect}
        onHover={handleHover}
        onDragBegin={handleDragBegin}
        onDragFinish={handleDragFinish}
      />
    );
  };

  const startMarquee = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !canEditRef.current) return;
    const el = e.target as HTMLElement;
    if (el.closest("[data-task-name]")) return;
    const box = el.getBoundingClientRect();
    if (
      e.clientX > box.left + el.clientWidth ||
      e.clientY > box.top + el.clientHeight
    ) {
      return;
    }

    e.preventDefault();
    const board = e.currentTarget;
    const additive = e.ctrlKey || e.metaKey || e.shiftKey;
    const base = additive ? new Set(selected) : new Set<string>();
    const startX = e.clientX;
    const startY = e.clientY;
    let active = false;

    const onMove = (ev: MouseEvent) => {
      if (
        !active &&
        Math.hypot(ev.clientX - startX, ev.clientY - startY) < MARQUEE_THRESHOLD
      ) {
        return;
      }
      active = true;

      const rect: MarqueeRect = {
        left: Math.min(startX, ev.clientX),
        top: Math.min(startY, ev.clientY),
        right: Math.max(startX, ev.clientX),
        bottom: Math.max(startY, ev.clientY),
      };
      setMarquee(rect);

      const next = new Set(base);
      board.querySelectorAll<HTMLElement>("[data-task-name]").forEach((card) => {
        const c = card.getBoundingClientRect();
        const hit =
          c.left < rect.right &&
          c.right > rect.left &&
          c.top < rect.bottom &&
          c.bottom > rect.top;
        if (!hit) return;
        const task = byNameRef.current.get(card.dataset.taskName ?? "");
        if (task && isMovable(task)) next.add(task.name);
      });
      setSelected(next);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setMarquee(null);
      if (!active && !additive) clearSelection();
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const hasMore = tasks.length < total;

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search tasks by subject, ID..."
            className="w-64 rounded-lg border border-[var(--border)] bg-card py-2 pl-9 pr-3 text-xs text-main outline-none focus:border-primary"
          />
        </div>

        <div className="w-48">
          <SearchSelect2
            label=""
            placeholder="All Projects"
            value={projectLabel}
            fetchOptions={fetchProjects}
            onChange={(val, opt) => {
              setProjectLabel(opt?.label ?? "");
              onProjectFilterChange(val ? [val] : []);
            }}
          />
        </div>

        {onAssigneeFilterChange && (
          <div className="w-52">
            <SearchSelect2
              label=""
              placeholder="All Assignees"
              value={assigneeLabel}
              fetchOptions={fetchUsers}
              onChange={(val, opt) => {
                setAssigneeLabel(opt?.label ?? "");
                onAssigneeFilterChange(val ? [val] : []);
              }}
            />
          </div>
        )}

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Clear Filters
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleCompact}
            title={compact ? "Switch to detailed cards" : "Switch to compact cards"}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-card px-2.5 py-2 text-xs font-semibold text-main hover:bg-row-hover"
          >
            {compact ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
            {compact ? "Detailed" : "Compact"}
          </button>
          {toolbarRight}
        </div>
      </div>

      {marquee && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-50 rounded-md"
          style={{
            left: marquee.left,
            top: marquee.top,
            width: marquee.right - marquee.left,
            height: marquee.bottom - marquee.top,
            background: MARQUEE_FILL,
            border: `1px solid ${MARQUEE_STROKE}`,
            boxShadow: `0 0 0 1px ${MARQUEE_GLOW}`,
          }}
        />
      )}

      <div
        onMouseDown={startMarquee}
        className={[
          "custom-scrollbar flex min-h-0 flex-1 gap-3 overflow-x-auto",
          loading ? "opacity-60" : "",
        ].join(" ")}
      >
        {statuses.map((s) => {
          const items = byStatus.get(s.value) ?? EMPTY_TASKS;
          const isOver = dragOver === s.value;

          return (
            <div
              key={s.value}
              onDragOver={(e) => {
                if (!canEdit) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOver !== s.value) setDragOver(s.value);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  setDragOver(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(s.value);
              }}
              className={[
                "flex h-full flex-1 flex-col rounded-xl bg-[var(--border)]/15 transition-shadow",
                compact ? "min-w-[13rem] max-w-[17rem]" : "min-w-[15rem] max-w-[20rem]",
                isOver ? "ring-2 ring-primary" : "",
              ].join(" ")}
            >
              <div
                className={`flex items-center justify-between px-3 ${
                  compact ? "py-1" : "py-2"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: VARIANT_COLOR[s.variant] ?? FALLBACK_COLOR }}
                  />
                  <span className="truncate text-sm font-bold text-main">
                    {s.label}
                  </span>
                </div>
                <span className="rounded-full bg-card px-2 py-0.5 font-mono text-[10px] font-bold text-muted">
                  {items.length}
                  {hasMore ? "+" : ""}
                </span>
              </div>

              <div
                className={`custom-scrollbar min-h-0 flex-1 overflow-y-auto px-1.5 pb-1.5 ${
                  compact ? "space-y-1" : "space-y-1.5"
                }`}
              >
                {items.map((t) => renderCard(t, s.value))}

                {!loading && items.length === 0 && (
                  <p className="py-6 text-center text-[11px] italic text-muted">
                    No tasks
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selected.size > 0 && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-card px-3 py-2 shadow-md">
          <span className="text-xs font-bold text-main">
            {selected.size} selected
          </span>
          <span className="text-[10px] text-muted">Move to</span>
          {statuses.map((s) => (
            <button
              key={s.value}
              disabled={bulkBusy}
              onClick={() => bulkMove(s.value)}
              className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] font-semibold text-main transition-colors hover:bg-row-hover disabled:opacity-50"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: VARIANT_COLOR[s.variant] ?? FALLBACK_COLOR }}
              />
              {s.label}
            </button>
          ))}
          <button
            onClick={clearSelection}
            className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-main"
          >
            <X size={12} /> Clear
          </button>
        </div>
      )}

      {hasMore && (
        <div className="flex shrink-0 justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-lg border border-[var(--border)] bg-card px-4 py-2 text-xs font-semibold text-main transition-colors hover:bg-row-hover disabled:opacity-50"
          >
            {loadingMore
              ? "Loading..."
              : `Load more tasks (${Math.max(0, total - tasks.length)} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskKanban;