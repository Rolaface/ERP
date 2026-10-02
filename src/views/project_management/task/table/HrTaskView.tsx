import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { showApiError, showSuccess } from "../../../../utils/alert";
import DateDisplay from "../../../../components/UI_Utils/Datedisplay";
import Table from "../../../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
} from "../../../../components/ui/Table/ActionButton";
import { usePermission } from "../../../../hooks/permission/usePermission";
import {
  useDataRefreshStore,
  REFRESH_KEYS,
} from "../../../../store/dataRefreshStore";
import type { Column } from "../../../../components/ui/Table/type";
import type {
  TaskEntry,
  TaskStatus,
  TaskDetail,
  ProjectOption,
} from "../../../../types/Project_Management/task/table/Task.types";
import { HrTableFrame } from "../../../hr/components/HrTabLayout";
import {
  getTaskList,
  getTaskById,
  getChildTasks,
  parseAssignedEmails,
  updateTaskAssignees,
  updateTaskStatus,
} from "../../../../api/project/task/taskapi";
import {
  getMyAssignedTasks,
  closeMyTaskAssignment,
} from "../../../../api/project/todo/todo.api";
import { getAllProjects } from "../../../../api/project/projectapi/project.api";
import { getalluser } from "../../../../api/utils/frappeUtilsApi";
import { Option } from "../../../../components/selects/tabelselect/MultiSearchSelect";
import AssigneeCell from "../components/AssigneeCell";
import PriorityChip from "../components/PriorityChip";
import StatusCell from "../components/StatusCell";
import TaskDetailDrawer from "../Drawer/Taskdetaildrawer";
import { openEmployeeTimesheetFormModal } from "../../../../components/feature/project management/timesheet/timesheetForm.modal";
import {
  Clock,
  ChevronDown,
  ChevronRight,
  Folder,
  Loader2,
} from "lucide-react";
import TaskKanban from "../components/Taskkanban";
import type { TaskMode } from "../components/Taskviewtoggle";
import ViewSelector, {
  type ViewOption,
} from "../../../project_management/ViewSelector";

const TASK_MODULE = "Task";
const TREE_INDENT_PX = 16;
const ADMIN_DEFAULT_VIEW: TaskMode = "table";
const EMPLOYEE_DEFAULT_VIEW: TaskMode = "kanban";
const VIEW_OPTIONS: ViewOption<TaskMode>[] = [
  { value: "kanban", label: "Kanban" },
  { value: "table", label: "Table" },
];

type TaskRow = TaskEntry & { _depth: number };

const STATUS_OPTIONS = [
  { label: "Open", value: "Open" },
  { label: "Working", value: "Working" },
  { label: "Pending Review", value: "Pending Review" },
  { label: "Overdue", value: "Overdue" },
  { label: "Template", value: "Template" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
];

const STATUS_VARIANT: Record<
  TaskStatus,
  "draft" | "info" | "success" | "danger"
> = {
  Open: "draft",
  Working: "info",
  "Pending Review": "info",
  Overdue: "danger",
  Template: "draft",
  Completed: "success",
  Cancelled: "danger",
};

const STATUS_CELL_OPTIONS = STATUS_OPTIONS.map((s) => ({
  label: s.label,
  value: s.value,
  variant: STATUS_VARIANT[s.value as TaskStatus],
}));

const fetchUserOptions = async (q: string): Promise<Option[]> => {
  const res: any = await getalluser(q || undefined);
  const list = res?.data ?? res ?? [];
  return list.map((u: any) => ({
    label: u.label,
    value: u.value,
    subLabel: u.description,
  }));
};

const fetchProjectOptions = async (q: string): Promise<Option[]> => {
  try {
    const list = await getAllProjects(q || undefined);
    return list.map((p) => ({
      label: p.project_name || p.name,
      value: p.name,
      subLabel:
        p.project_name && p.project_name !== p.name ? p.name : undefined,
    }));
  } catch (error) {
    showApiError(error);
    return [];
  }
};

type TaskViewContext = "admin" | "employee";
const CONTENT_HEIGHT = "calc(95.5vh - 120px)";

interface HrTaskViewProps {
  context?: TaskViewContext;
  currentUserEmail?: string;
}

const HrTaskView: React.FC<HrTaskViewProps> = ({
  context = "admin",
  currentUserEmail,
}) => {
  const { can } = usePermission();
  const mountedRef = useRef(true);

  const isEmployee = context === "employee";

  const canCreateTask = can(TASK_MODULE, "create");
  const canWriteTask = can(TASK_MODULE, "write");
  const canLogTime = can("Timesheet", "create");

  const canEditStatusOf = (_assign?: string | null) => canWriteTask;
  const subscribeToRefresh = useDataRefreshStore((s) => s.subscribeToRefresh);
  const triggerRefresh = useDataRefreshStore((s) => s.triggerRefresh);

  const [tasks, setTasks] = useState<TaskEntry[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [projectFilter, setProjectFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);
  const [userFilterOptions, setUserFilterOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<TaskDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerActionLoading, setDrawerActionLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [childrenMap, setChildrenMap] = useState<Record<string, TaskEntry[]>>(
    {},
  );
  const [loadingGroups, setLoadingGroups] = useState<Set<string>>(new Set());

  const [selected, setSelected] = useState<Map<string, TaskEntry>>(new Map());
  const [view, setView] = useState<TaskMode>(
    isEmployee ? EMPLOYEE_DEFAULT_VIEW : ADMIN_DEFAULT_VIEW,
  );

  // Table: employee ke SAARE assigned tasks (ToDo status ka filter nahi)
  const allAssignedNamesRef = useRef<string[] | undefined>(undefined);
  // Kanban: sirf Open ToDo wale tasks
  const [assignedNames, setAssignedNames] = useState<string[]>([]);

  const assigneeActive = isEmployee || assigneeFilter.length > 0;

  useEffect(() => {
    getAllProjects()
      .then((data) => {
        if (!mountedRef.current) return;
        setProjectOptions(
          data.map((p) => ({ name: p.name, project_name: p.project_name })),
        );
      })
      .catch(showApiError);
  }, []);

  useEffect(() => {
    if (isEmployee) return;
    fetchUserOptions("")
      .then((list) => {
        if (!mountedRef.current) return;
        setUserFilterOptions(
          list.map((u) => ({ label: u.label, value: u.value })),
        );
      })
      .catch(showApiError);
  }, [isEmployee]);

  const projectFilterOptions = projectOptions.map((p) => ({
    label: p.project_name,
    value: p.name,
  }));

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, projectFilter, assigneeFilter]);

  const fetchTasks = useCallback(async () => {
    if (!mountedRef.current) return;
    if (view !== "table") return;
    if (isEmployee && allAssignedNamesRef.current === undefined) return;

    setIsFetching(true);

    try {
      const res = await getTaskList(
        page,
        pageSize,
        statusFilter.length ? statusFilter : undefined,
        projectFilter.length ? projectFilter : undefined,
        searchTerm || undefined,
        sortBy || undefined,
        sortOrder,
        assigneeFilter.length ? assigneeFilter : undefined,
        isEmployee,
        isEmployee ? allAssignedNamesRef.current : undefined,
      );

      if (!mountedRef.current) return;

      setTasks(res.data || []);
      setChildrenMap({});
      setExpanded(new Set());
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || res.data?.length || 0);
    } catch (error) {
      showApiError(error);
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
        setIsInitialLoad(false);
      }
    }
  }, [
    page,
    pageSize,
    searchTerm,
    statusFilter,
    projectFilter,
    assigneeFilter,
    sortBy,
    sortOrder,
    isEmployee,
    view,
  ]);

  const fetchTasksRef = useRef(fetchTasks);
  useEffect(() => {
    fetchTasksRef.current = fetchTasks;
  }, [fetchTasks]);

  const viewInitRef = useRef(true);
  useEffect(() => {
    if (viewInitRef.current) {
      viewInitRef.current = false;
      return;
    }
    if (view === "table") fetchTasksRef.current();
  }, [view]);

  const loadAssignedNames = useCallback(async () => {
    try {
      const [names, allNames] = currentUserEmail
        ? await Promise.all([
            getMyAssignedTasks(currentUserEmail, true), // Kanban: Open only
            getMyAssignedTasks(currentUserEmail, false), // Table: sab
          ])
        : [[], []];
      if (!mountedRef.current) return;
      allAssignedNamesRef.current = allNames;
      setAssignedNames((prev) =>
        prev.length === names.length && prev.every((n, i) => n === names[i])
          ? prev
          : names,
      );
      await fetchTasksRef.current();
    } catch (error) {
      showApiError(error);
      if (mountedRef.current) setIsInitialLoad(false);
    }
  }, [currentUserEmail]);

  const reloadRef = useRef<() => unknown>(fetchTasks);
  useEffect(() => {
    reloadRef.current = isEmployee ? loadAssignedNames : fetchTasks;
  }, [isEmployee, loadAssignedNames, fetchTasks]);

  useEffect(() => {
    mountedRef.current = true;
    reloadRef.current();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isInitialLoad) return;
    fetchTasks();
  }, [
    page,
    pageSize,
    searchTerm,
    statusFilter,
    projectFilter,
    assigneeFilter,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    const unsubscribe = subscribeToRefresh(REFRESH_KEYS.TASK_LIST, () =>
      reloadRef.current(),
    );
    return unsubscribe;
  }, [subscribeToRefresh]);

  const findTask = (name: string): TaskEntry | undefined =>
    tasks.find((t) => t.name === name) ??
    Object.values(childrenMap)
      .flat()
      .find((t) => t.name === name);

  const patchTask = (taskName: string, patch: Partial<TaskEntry>) => {
    const apply = (list: TaskEntry[]) =>
      list.map((t) => (t.name === taskName ? { ...t, ...patch } : t));
    setTasks(apply);
    setChildrenMap((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([key, list]) => [key, apply(list)]),
      ),
    );
  };

  const refreshParents = async (taskName: string) => {
    let parent = findTask(taskName)?.parent_task;
    while (parent) {
      try {
        const detail = await getTaskById(parent);
        if (!detail) return;
        patchTask(parent, {
          status: detail.status,
          progress: detail.progress,
        });
      } catch (error) {
        showApiError(error);
        return;
      }
      parent = findTask(parent)?.parent_task;
    }
  };

  const toggleGroup = async (groupName: string) => {
    const isOpen = expanded.has(groupName);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (isOpen) next.delete(groupName);
      else next.add(groupName);
      return next;
    });
    if (isOpen || childrenMap[groupName] || loadingGroups.has(groupName))
      return;

    setLoadingGroups((prev) => new Set(prev).add(groupName));
    try {
      const children = await getChildTasks(groupName);
      if (!mountedRef.current) return;
      setChildrenMap((prev) => ({ ...prev, [groupName]: children }));
    } catch (error) {
      showApiError(error);
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(groupName);
        return next;
      });
    } finally {
      if (mountedRef.current) {
        setLoadingGroups((prev) => {
          const next = new Set(prev);
          next.delete(groupName);
          return next;
        });
      }
    }
  };

  const rows = useMemo<TaskRow[]>(() => {
    if (assigneeActive) return tasks.map((t) => ({ ...t, _depth: 0 }));
    const walk = (list: TaskEntry[], depth: number): TaskRow[] =>
      list.flatMap((t) => [
        { ...t, _depth: depth },
        ...(t.is_group === 1 && expanded.has(t.name)
          ? walk(childrenMap[t.name] ?? [], depth + 1)
          : []),
      ]);
    return walk(tasks, 0);
  }, [tasks, childrenMap, expanded, assigneeActive]);

  const handleAdd = () => {
    if (!canCreateTask) return;
    console.warn("handleAdd: Task create modal not wired yet.");
  };

  // Task update has already succeeded when this runs.
  // A ToDo failure must never undo it. Admin path returns immediately.
  const finalizeEmployeeAssignment = async (
    taskName: string,
    nextStatus: string,
  ) => {
    if (nextStatus !== "Completed" || !isEmployee || !currentUserEmail) return;
    try {
      await closeMyTaskAssignment(taskName, currentUserEmail);
    } catch (error) {
      showApiError(error); // non-fatal: task is completed, assignment stays open
    }
    triggerRefresh(REFRESH_KEYS.TASK_LIST); // reloadRef → loadAssignedNames → refetch
  };

  const handleStatusChange = async (
    taskName: string,
    nextStatus: string,
    nextProgress?: number,
  ) => {
    if (!canEditStatusOf(findTask(taskName)?._assign)) return;

    const progress = nextStatus === "Completed" ? 100 : nextProgress;

    try {
      await updateTaskStatus(taskName, nextStatus, progress); // throws → nothing below runs

      patchTask(taskName, {
        status: nextStatus as TaskStatus,
        ...(progress !== undefined ? { progress } : {}),
      });
      refreshParents(taskName);

      showSuccess("Task status updated");
      await finalizeEmployeeAssignment(taskName, nextStatus);
    } catch (error) {
      showApiError(error);
    }
  };

  const handleEdit = (id: string) => {
    console.warn("handleEdit: Task edit modal not wired yet.", id);
  };

  const getProjectDisplayName = (code: string | null): string => {
    if (!code) return "—";
    const match = projectOptions.find((p) => p.name === code);
    return match?.project_name || code;
  };

  const handleLogTime = (task: TaskEntry) => {
    if (!canLogTime) return;
    openEmployeeTimesheetFormModal({
      title: "Log Time",
      subtitle: `Logging time for ${task.subject}`,
      prefillTask: {
        project: task.project ?? "",
        projectName: getProjectDisplayName(task.project),
        task: task.name,
        taskName: task.subject,
      },
    });
  };

  const canLogRow = (t: TaskEntry) => canLogTime && t.is_group !== 1;

  const handleRowSelect = (t: TaskEntry, checked: boolean) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (checked) next.set(t.name, t);
      else next.delete(t.name);
      return next;
    });

  const handleSelectAll = (list: TaskEntry[], checked: boolean) =>
    setSelected((prev) => {
      const next = new Map(prev);
      list.forEach((t) => {
        if (checked) next.set(t.name, t);
        else next.delete(t.name);
      });
      return next;
    });

  const handleLogSelected = () => {
    if (!canLogTime) return;
    const picked = Array.from(selected.values());
    if (picked.length === 0) return;

    openEmployeeTimesheetFormModal({
      title: "Log Time",
      subtitle: `Logging time for ${picked.length} task${picked.length > 1 ? "s" : ""
        }`,
      prefillTasks: picked.map((t) => ({
        project: t.project ?? "",
        projectName: getProjectDisplayName(t.project),
        task: t.name,
        taskName: t.subject,
      })),
      onSuccess: () => setSelected(new Map()),
    });
  };

  const handleView = async (id: string) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerData(null);
    try {
      const detail = await getTaskById(id);
      setDrawerData(detail);
    } catch (err) {
      showApiError(err);
      setDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleDrawerStatusChange = async (
    taskName: string,
    nextStatus: string,
  ) => {
    if (!canEditStatusOf(drawerData?._assign)) return;

    const nextProgress = nextStatus === "Completed" ? 100 : undefined;

    setDrawerActionLoading(true);
    try {
      await updateTaskStatus(taskName, nextStatus, nextProgress);

      setDrawerData((prev) =>
        prev
          ? {
            ...prev,
            status: nextStatus as TaskStatus,
            progress:
              nextProgress !== undefined ? nextProgress : prev.progress,
          }
          : prev,
      );

      patchTask(taskName, {
        status: nextStatus as TaskStatus,
        ...(nextProgress !== undefined ? { progress: nextProgress } : {}),
      });
      refreshParents(taskName);

      showSuccess("Task status updated");

      await finalizeEmployeeAssignment(taskName, nextStatus);
      if (view === "kanban" && !(isEmployee && nextStatus === "Completed")) {
        triggerRefresh(REFRESH_KEYS.TASK_LIST);
      }
    } catch (error) {
      showApiError(error);
    } finally {
      setDrawerActionLoading(false);
    }
  };

  const handleAssigneesChange = async (
    taskName: string,
    nextEmails: string[],
  ) => {
    const task = findTask(taskName);
    if (!task) return;

    const previousEmails = parseAssignedEmails(task._assign);

    try {
      const result = await updateTaskAssignees(
        taskName,
        previousEmails,
        nextEmails,
      );

      patchTask(taskName, { _assign: JSON.stringify(nextEmails) });

      if (result.message) {
        showSuccess(result.message);
      }
    } catch (error) {
      showApiError(error);
      throw error;
    }
  };

  const allColumns: Column<TaskRow>[] = [
    {
      key: "subject",
      header: "Task ",
      align: "left",
      sortable: true,
      render: (t) => {
        const isGroup = t.is_group === 1;
        const isOpen = expanded.has(t.name);
        const isEmpty = isOpen && childrenMap[t.name]?.length === 0;

        return (
          <div
            className="flex items-start gap-1"
            style={{ paddingLeft: t._depth * TREE_INDENT_PX }}
          >
            {isGroup && !assigneeActive ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroup(t.name);
                }}
                className="mt-0.5 shrink-0 text-muted hover:text-main"
              >
                {loadingGroups.has(t.name) ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : isOpen ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
            ) : (
              <span className="w-[14px] shrink-0" />
            )}
            <div className="min-w-0">
              <span
                className="font-bold text-main text-xs hover:underline cursor-pointer flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleView(t.name);
                }}
              >
                {isGroup && (
                  <Folder size={13} className="shrink-0 text-muted" />
                )}
                {t.subject}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-[10px] text-muted">
                  {t.name}
                </span>
                {isGroup && (
                  <span className="rounded border border-theme px-1 text-[9px] font-bold uppercase tracking-wide text-muted">
                    Group
                  </span>
                )}
                <PriorityChip priority={t.priority} />
              </div>
              {isEmpty && (
                <span className="text-[10px] italic text-muted">
                  No child tasks
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "project",
      header: "Project",
      align: "left",
      sortable: true,
      render: (t) => (
        <span className="text-xs font-medium text-main">
          {getProjectDisplayName(t.project)}
        </span>
      ),
    },
    {
      key: "exp_end_date",
      header: "Deadline",
      align: "left",
      sortable: true,
      render: (t) =>
        t.exp_end_date ? (
          <DateDisplay
            date={t.exp_end_date}
            className="text-xs text-muted whitespace-nowrap"
          />
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      sortable: true,
      render: (t) => (
        <StatusCell
          status={t.status}
          progress={t.progress ?? 0}
          options={STATUS_CELL_OPTIONS}
          disabled={!canEditStatusOf(t._assign)}
          onChange={(nextStatus, nextProgress) =>
            handleStatusChange(t.name, nextStatus, nextProgress)
          }
        />
      ),
    },
    {
      key: "_assign",
      header: "Assigned To",
      align: "left",
      render: (t) => {
        // Completed / Cancelled task: assign nahi hoga, isliye column khali dikhao
        if (t.status === "Completed" || t.status === "Cancelled") {
          return <span className="text-xs text-muted">—</span>;
        }

        const emails = parseAssignedEmails(t._assign);

        return (
          <AssigneeCell
            emails={emails}
            disabled={!canWriteTask}
            fetchOptions={fetchUserOptions}
            onChange={(nextValues) => handleAssigneesChange(t.name, nextValues)}
          />
        );
      },
    },
    {
      key: "progress",
      header: "Progress",
      align: "left",
      render: (t) => (
        <div className="flex items-center gap-2 w-28">
          <div
            className="flex-1 rounded-full h-1.5 min-w-[50px]"
            style={{ background: "var(--border)" }}
          >
            <div
              className="h-1.5 rounded-full bg-success"
              style={{ width: `${t.progress || 0}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-muted w-8 text-right">
            {t.progress || 0}%
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (t) => (
        <ActionGroup>
          <ActionButton type="view" onClick={() => handleView(t.name)} iconOnly />
          <ActionButton
            type="edit"
            onClick={() => handleEdit(t.name)}
            iconOnly
            disabled={!canWriteTask}
            title={canWriteTask ? "Edit" : "You don't have permission to edit"}
          />
          {canLogTime && (
            <button
              onClick={() => handleLogTime(t)}
              disabled={t.is_group === 1}
              className="p-1.5 hover:bg-app rounded border border-theme text-muted hover:text-main transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted"
              title={
                t.is_group === 1
                  ? "Time can't be logged on a group task"
                  : "Log time"
              }
            >
              <Clock size={14} />
            </button>
          )}
        </ActionGroup>
      ),
    },
  ];
  const columns = isEmployee
    ? allColumns.filter((c) => c.key !== "progress")
    : allColumns;
  const viewSelector = (
    <ViewSelector value={view} options={VIEW_OPTIONS} onChange={setView} />
  );
  return (
    <HrTableFrame>
      {view === "kanban" ? (
        <div
          className="app-surface overflow-hidden"
          style={{ height: CONTENT_HEIGHT }}
        >
          <TaskKanban
            statuses={STATUS_CELL_OPTIONS}
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            projectFilter={projectFilter}
            onProjectFilterChange={setProjectFilter}
            assigneeFilter={isEmployee ? [] : assigneeFilter}
            onAssigneeFilterChange={isEmployee ? undefined : setAssigneeFilter}
            fetchProjects={fetchProjectOptions}
            fetchUsers={fetchUserOptions}
            getProjectName={getProjectDisplayName}
            canEdit={canWriteTask}
            canEditTask={(t) => canEditStatusOf(t._assign)}
            onView={handleView}
            toolbarRight={viewSelector}
            taskNames={isEmployee ? assignedNames : undefined}
            showProgress={!isEmployee}
          />
        </div>
      ) : (
        <Table
          tableId="hr-task"
          columns={columns}
          data={rows}
          rowKey={(row) => row.name}
          loading={isInitialLoad}
          isFetching={isFetching}
          showToolbar
          toolbarPlaceholder="Search tasks by subject, ID..."
          searchValue={searchTerm}
          onSearch={(q) => setSearchTerm(q)}
          multiSelectFilters={[
            {
              key: "status",
              label: "Status",
              options: STATUS_OPTIONS,
              values: statusFilter,
              onChange: setStatusFilter,
            },
            {
              key: "project",
              label: "Project",
              options: projectFilterOptions,
              values: projectFilter,
              onChange: setProjectFilter,
            },
            ...(!isEmployee
              ? [
                {
                  key: "assignee",
                  label: "Assigned To",
                  options: userFilterOptions,
                  values: assigneeFilter,
                  onChange: setAssigneeFilter,
                  searchPlaceholder: "Search employee...",
                  onSearch: fetchUserOptions,
                },
              ]
              : []),
          ]}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={({ sortBy: newSortBy, sortOrder: newSortOrder }) => {
            setSortBy(newSortBy);
            setSortOrder(newSortOrder);
            setPage(1);
          }}
          enableAdd={canCreateTask}
          addLabel="+ Add Task"
          onAdd={handleAdd}
          selectable={canLogTime}
          isRowSelected={(t) => selected.has(t.name)}
          isRowSelectable={canLogRow}
          onRowSelect={handleRowSelect}
          onSelectAll={handleSelectAll}
          primaryAction={
            <div className="flex items-center gap-2">
              {canLogTime && selected.size > 0 && (
                <>
                  <button
                    onClick={() => setSelected(new Map())}
                    className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-main transition-colors hover:bg-row-hover"
                  >
                    Clear
                  </button>

                  <button
                    onClick={handleLogSelected}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    <Clock size={14} />
                    Log Time ({selected.size})
                  </button>
                </>
              )}

              {viewSelector}
            </div>
          }
          enableColumnSelector
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          pageSizeOptions={[20, 50, 100, 200]}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          onPageChange={setPage}
          onRowDoubleClick={(t) => handleView(t.name)}
        />
      )}

      <TaskDetailDrawer
        open={drawerOpen}
        data={drawerData}
        loading={drawerLoading}
        canEditStatus={!!drawerData && canEditStatusOf(drawerData._assign)}
        showFinancials={!isEmployee}
        actionLoading={drawerActionLoading}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerData(null);
        }}
        onStatusChange={handleDrawerStatusChange}
      />
    </HrTableFrame>
  );
};

export default HrTaskView;