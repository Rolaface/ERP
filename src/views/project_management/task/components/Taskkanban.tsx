import React, { useCallback, useEffect, useRef, useState } from "react";
import { Folder, Search } from "lucide-react";
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

export interface KanbanStatus {
  label: string;
  value: string;
  variant: Variant;
}

interface ColState {
  items: TaskEntry[];
  total: number;
  page: number;
  loading: boolean;
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
  onView: (name: string) => void;
  toolbarRight?: React.ReactNode;
}

const PAGE_SIZE = 25;
const DONE_STATUS = "Completed";
const DONE_PROGRESS = 100;
const SEARCH_DEBOUNCE_MS = 400;
const MAX_AVATARS = 3;

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

const avatarColor = (s: string) =>
  AVATAR_COLORS[
    Array.from(s).reduce((sum, c) => sum + c.charCodeAt(0), 0) %
      AVATAR_COLORS.length
  ];

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
  onView,
  toolbarRight,
}) => {
  const subscribeToRefresh = useDataRefreshStore((s) => s.subscribeToRefresh);

  const [cols, setCols] = useState<Record<string, ColState>>({});
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchTerm);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [projectLabel, setProjectLabel] = useState(
    projectFilter.length === 1 ? getProjectName(projectFilter[0]) : "",
  );
  const [assigneeLabel, setAssigneeLabel] = useState(
    assigneeFilter.length === 1 ? assigneeFilter[0] : "",
  );

  const reqRef = useRef(0);
  const dragRef = useRef<{ name: string; from: string } | null>(null);

  useEffect(() => {
    if (!projectFilter.length) setProjectLabel("");
  }, [projectFilter]);

  useEffect(() => {
    if (!assigneeFilter.length) setAssigneeLabel("");
  }, [assigneeFilter]);

  const fetchColumn = useCallback(
    async (status: string, page: number) => {
      const res = await getTaskList(
        page,
        PAGE_SIZE,
        [status],
        projectFilter.length ? projectFilter : undefined,
        searchTerm || undefined,
        undefined,
        "desc",
        assigneeFilter.length ? assigneeFilter : undefined,
        true,
      );
      return {
        items: (res.data || []) as TaskEntry[],
        total: res.pagination?.total ?? res.data?.length ?? 0,
      };
    },
    [projectFilter, searchTerm, assigneeFilter],
  );

  const loadAll = useCallback(
    async (silent = false) => {
      const id = ++reqRef.current;
      if (!silent) setLoading(true);
      try {
        const results = await Promise.all(
          statuses.map((s) => fetchColumn(s.value, 1)),
        );
        if (id !== reqRef.current) return;
        const next: Record<string, ColState> = {};
        statuses.forEach((s, i) => {
          next[s.value] = {
            items: results[i].items,
            total: results[i].total,
            page: 1,
            loading: false,
          };
        });
        setCols(next);
      } catch (error) {
        if (id === reqRef.current) showApiError(error);
      } finally {
        if (id === reqRef.current) setLoading(false);
      }
    },
    [fetchColumn, statuses],
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

  const loadMore = async (status: string) => {
    const col = cols[status];
    if (!col || col.loading) return;
    const nextPage = col.page + 1;

    setCols((prev) => ({
      ...prev,
      [status]: { ...prev[status], loading: true },
    }));
    try {
      const { items, total } = await fetchColumn(status, nextPage);
      setCols((prev) => {
        const cur = prev[status];
        const seen = new Set(cur.items.map((t) => t.name));
        return {
          ...prev,
          [status]: {
            items: [...cur.items, ...items.filter((t) => !seen.has(t.name))],
            total,
            page: nextPage,
            loading: false,
          },
        };
      });
    } catch (error) {
      showApiError(error);
      setCols((prev) => ({
        ...prev,
        [status]: { ...prev[status], loading: false },
      }));
    }
  };

  const moveTask = async (name: string, from: string, to: string) => {
    const task = cols[from]?.items.find((t) => t.name === name);
    if (!task || !cols[to]) return;

    const nextProgress = to === DONE_STATUS ? DONE_PROGRESS : undefined;
    const moved: TaskEntry = {
      ...task,
      status: to as TaskStatus,
      ...(nextProgress !== undefined ? { progress: nextProgress } : {}),
    };

    setCols((prev) => ({
      ...prev,
      [from]: {
        ...prev[from],
        items: prev[from].items.filter((t) => t.name !== name),
        total: Math.max(0, prev[from].total - 1),
      },
      [to]: {
        ...prev[to],
        items: [moved, ...prev[to].items],
        total: prev[to].total + 1,
      },
    }));

    try {
      await updateTaskStatus(name, to, nextProgress);
      showSuccess("Task status updated");
      loadAll(true);
    } catch (error) {
      showApiError(error);
      loadAll(true);
    }
  };

  const handleDrop = (status: string) => {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragOver(null);
    if (!drag || drag.from === status || !canEdit) return;
    moveTask(drag.name, drag.from, status);
  };

  const hasFilters =
    Boolean(searchInput) ||
    projectFilter.length > 0 ||
    assigneeFilter.length > 0;

  const clearFilters = () => {
    setSearchInput("");
    onSearch("");
    onProjectFilterChange([]);
    onAssigneeFilterChange?.([]);
  };

  const renderCard = (t: TaskEntry, status: string) => {
    const emails = parseAssignedEmails(t._assign);
    const isGroup = t.is_group === 1;

    return (
      <div
        key={t.name}
        draggable={canEdit}
        onDragStart={(e) => {
          dragRef.current = { name: t.name, from: status };
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragEnd={() => {
          dragRef.current = null;
          setDragOver(null);
        }}
        onClick={() => onView(t.name)}
        className={[
          "rounded-xl border border-[var(--border)] bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
          canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        ].join(" ")}
      >
        <p className="flex items-start gap-1 text-xs font-bold text-main">
          {isGroup && (
            <Folder size={13} className="mt-0.5 shrink-0 text-muted" />
          )}
          <span className="min-w-0 break-words">{t.subject}</span>
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] text-muted">{t.name}</span>
          {isGroup && (
            <span className="rounded border border-theme px-1 text-[9px] font-bold uppercase tracking-wide text-muted">
              Group
            </span>
          )}
          <PriorityChip priority={t.priority} />
        </div>

        {t.project && (
          <p className="mt-1.5 truncate text-[11px] font-medium text-muted">
            {getProjectName(t.project)}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2">
          <div
            className="h-1.5 flex-1 rounded-full"
            style={{ background: "var(--border)" }}
          >
            <div
              className="h-1.5 rounded-full bg-success"
              style={{ width: `${t.progress || 0}%` }}
            />
          </div>
          <span className="w-8 text-right font-mono text-[10px] text-muted">
            {t.progress || 0}%
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          {t.exp_end_date ? (
            <DateDisplay
              date={t.exp_end_date}
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
  };

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
              setProjectLabel(opt.label);
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
                setAssigneeLabel(opt.label);
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
          const col = cols[s.value];
          const items = col?.items ?? [];
          const total = col?.total ?? 0;
          const isOver = dragOver === s.value;

          return (
            <div
              key={s.value}
              onDragOver={(e) => {
                if (!canEdit) return;
                e.preventDefault();
                if (dragOver !== s.value) setDragOver(s.value);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
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
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: VARIANT_COLOR[s.variant] }}
                  />
                  <span className="text-sm font-bold text-main">{s.label}</span>
                </div>
                <span className="rounded-full bg-card px-2 py-0.5 font-mono text-[10px] font-bold text-muted">
                  {total}
                </span>
              </div>

              <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto px-2 pb-2">
                {items.map((t) => renderCard(t, s.value))}

                {!loading && items.length === 0 && (
                  <p className="py-6 text-center text-[11px] italic text-muted">
                    No tasks
                  </p>
                )}

                {items.length < total && (
                  <button
                    onClick={() => loadMore(s.value)}
                    disabled={col?.loading}
                    className="w-full rounded-lg border border-[var(--border)] bg-card py-2 text-xs font-semibold text-main transition-colors hover:bg-row-hover disabled:opacity-50"
                  >
                    {col?.loading
                      ? "Loading..."
                      : `Load more (${total - items.length})`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskKanban;