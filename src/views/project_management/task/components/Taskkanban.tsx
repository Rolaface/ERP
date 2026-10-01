import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CornerDownRight, Folder, Search } from "lucide-react";
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
  hasFilters: boolean;
  metaMap: Map<string, StatusMeta>;
  onOpen: (name: string) => void;
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
  hasFilters,
  metaMap,
  onOpen,
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
    : `${kids.length} child ${kids.length === 1 ? "task" : "tasks"}`;

  const familyKey = familyKeyOf(task);

  const open = () => onOpen(task.name);

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={movable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.name);
        onHover(null);
        onDragBegin(task.name, status);
      }}
      onDragEnd={onDragFinish}
      onMouseEnter={() => onHover(familyKey)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(familyKey)}
      onBlur={() => onHover(null)}
      onClick={open}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "0 150px",
        ...(highlight === "on" && accent
          ? { outline: `2px solid ${accent}`, outlineOffset: 0 }
          : {}),
      }}
      className={[
        "relative overflow-hidden rounded-xl border border-[var(--border)] bg-card py-3 pl-4 pr-3 shadow-sm transition-[opacity,box-shadow] hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary",
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

      {parentLabel && task.parent_task && (
        <span
          role="link"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onOpen(task.parent_task as string);
          }}
          className="mb-1.5 inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold hover:underline"
          style={{
            background: accent ? `${accent}24` : "transparent",
            color: accent ?? "inherit",
          }}
        >
          <CornerDownRight size={10} className="shrink-0" />
          <span className="truncate">{parentLabel}</span>
        </span>
      )}

      <p className="flex items-start gap-1 text-xs font-bold text-main">
        {isGroup && (
          <Folder
            size={13}
            className="mt-0.5 shrink-0"
            style={{ color: accent ?? undefined }}
          />
        )}
        <span className="min-w-0 break-words">{task.subject}</span>
      </p>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
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

      {projectName && (
        <p className="mt-1.5 truncate text-[11px] font-medium text-muted">
          {projectName}
        </p>
      )}

      {isGroup && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted">
          <span className="font-semibold">{kidsLabel}</span>
          {kidCounts.map(([st, n]) => {
            const meta = metaMap.get(st);
            return (
              <span key={st} className="flex items-center gap-1">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: meta?.color ?? FALLBACK_COLOR }}
                />
                {n} {meta?.label ?? st}
              </span>
            );
          })}
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
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

      <div className="mt-2 flex items-center justify-between gap-2">
        {task.exp_end_date ? (
          <DateDisplay
            date={task.exp_end_date}
            className="whitespace-nowrap text-[10px] text-muted"
          />
        ) : (
          <span className="text-[10px] text-muted">—</span>
        )}

        <div className="flex items-center">
          {emails.slice(0, MAX_AVATARS).map((email, i) => {
            const av = avatarColor(email);
            return (
              <span
                key={email}
                title={email}
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--card,#fff)] text-[10px] font-bold"
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
      </div>
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
}) => {
  const subscribeToRefresh = useDataRefreshStore((s) => s.subscribeToRefresh);

  const [tasks, setTasks] = useState<TaskEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState(searchTerm);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [projectLabel, setProjectLabel] = useState(
    projectFilter.length === 1 ? getProjectName(projectFilter[0]) : "",
  );
  const [assigneeLabel, setAssigneeLabel] = useState(
    assigneeFilter.length === 1 ? assigneeFilter[0] : "",
  );

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
      );
      const items = Array.isArray(res?.data) ? (res.data as TaskEntry[]) : [];
      return {
        items,
        total: Number(res?.pagination?.total) || items.length,
      };
    },
    [statuses, projectFilter, searchTerm, assigneeFilter],
  );

  const loadAll = useCallback(
    async (silent = false) => {
      const id = ++reqRef.current;
      if (!silent) setLoading(true);
      try {
        const { items, total: count } = await fetchTasks(1);
        if (id !== reqRef.current || !mountedRef.current) return;
        const seen = new Set<string>();
        setTasks(
          items.filter((t) => {
            if (!t?.name || seen.has(t.name)) return false;
            seen.add(t.name);
            return true;
          }),
        );
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
      const { items, total: count } = await fetchTasks(nextPage);
      if (id !== reqRef.current || !mountedRef.current) return;
      setTasks((prev) => {
        const seen = new Set(prev.map((t) => t.name));
        return [...prev, ...items.filter((t) => t?.name && !seen.has(t.name))];
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

  const byNameRef = useRef(byName);
  useEffect(() => {
    byNameRef.current = byName;
  }, [byName]);

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

  const handleDrop = (status: string) => {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragOver(null);
    if (!drag || drag.from === status || !canEdit) return;
    moveTask(drag.name, status);
  };

  const handleOpen = useCallback((name: string) => {
    onViewRef.current(name);
  }, []);

  const handleHover = useCallback((key: string | null) => {
    setHoverKey((prev) => (prev === key ? prev : key));
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
    if (!hoverKey) return "none";
    return t.name === hoverKey || t.parent_task === hoverKey ? "on" : "dim";
  };

  const renderCard = (t: TaskEntry, status: string) => {
    const familyKey = familyKeyOf(t);
    const parent = t.parent_task ? byName.get(t.parent_task) : undefined;
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
        hasFilters={hasFilters}
        metaMap={metaMap}
        onOpen={handleOpen}
        onHover={handleHover}
        onDragBegin={handleDragBegin}
        onDragFinish={handleDragFinish}
      />
    );
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

        <div className="ml-auto flex items-center gap-2">{toolbarRight}</div>
      </div>

      <div
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
                "flex h-full w-72 shrink-0 flex-col rounded-xl bg-[var(--border)]/15 transition-shadow",
                isOver ? "ring-2 ring-primary" : "",
              ].join(" ")}
            >
              <div className="flex items-center justify-between px-3 py-3">
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

              <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto px-2 pb-2">
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