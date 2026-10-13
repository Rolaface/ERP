import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { usePermission } from "../../../../hooks/permission/usePermission";
import { useHRView } from "../../../../hooks/permission/useHRView";
import {
  useDataRefreshStore,
  REFRESH_KEYS,
} from "../../../../store/dataRefreshStore";
import { HrTableFrame } from "../../../hr/components/HrTabLayout";
import TaskDetailDrawer from "../Drawer/Taskdetaildrawer";
import BulkActionsMenu from "../components/Bulkactionsmenu";
import TaskKanban from "../components/Taskkanban";
import type { TaskMode } from "../components/Taskviewtoggle";
import ViewSelector from "../../../project_management/ViewSelector";
import { buildTaskColumns, type TaskSelectionApi } from "../components/Taskcolumns";
import { buildTaskRows } from "../components/Taskrows";
import TaskTreeTable from "../components/Tasktreetable";
import {
  ClearFiltersButton,
  MultiSelectFilter,
  TaskSearchInput,
} from "../components/Tasktoolbar";
import {
  fetchProjectAssigneeOptions,
  fetchProjectOptions,
  fetchUserOptions,
} from "../components/Taskoptionfetchers";
import { openTaskFormModal } from "../../../../components/project management/task/Taskform.modal ";
import {
  CONTENT_HEIGHT,
  EMPLOYEE_DEFAULT_VIEW,
  PAGE_SIZE_OPTIONS,
  PROFESSIONAL_DEFAULT_VIEW,
  STATUS_CELL_OPTIONS,
  STATUS_OPTIONS,
  TASK_MODULE,
  TIMESHEET_MODULE,
  VIEW_OPTIONS,
  isContextTask,
} from "../components/Tasktable.config";
import { useAssignedTaskNames } from "../../../../hooks/project_management/task/table/Useassignedtasknames";
import { useTaskDrawer } from "../../../../hooks/project_management/task/table/Usetaskdrawer";
import { useTaskFilterOptions } from "../../../../hooks/project_management/task/table/Usetaskfilteroptions";
import { useTaskList } from "../../../../hooks/project_management/task/table/Usetasklist";
import { useTaskNotes } from "../../../../hooks/project_management/task/table/Usetasknotes";
import { useTaskMutations } from "../../../../hooks/project_management/task/table/Usetaskmutations";
import { useTaskSelection } from "../../../../hooks/project_management/task/table/Usetaskselection";
import { useTaskTimeLog } from "../../../../hooks/project_management/task/table/Usetasktimelog";
import { useTaskTree } from "../../../../hooks/project_management/task/table/Usetasktree";

interface HrTaskViewProps {
  currentUserEmail?: string;
}

const HrTaskView: React.FC<HrTaskViewProps> = ({ currentUserEmail }) => {
  const { can } = usePermission();
  const { viewMode } = useHRView();
  const isProfessional = viewMode === "professional";
  const isEmployee = viewMode === "employee";

  const canWriteTask = can(TASK_MODULE, "write");
  const canCreateTask = can(TASK_MODULE, "create");
  const canLogTime = can(TIMESHEET_MODULE, "create");
  const canBulkSelect = canLogTime || canWriteTask;

  const subscribeToRefresh = useDataRefreshStore((s) => s.subscribeToRefresh);

  const [view, setView] = useState<TaskMode>(
    isEmployee ? EMPLOYEE_DEFAULT_VIEW : PROFESSIONAL_DEFAULT_VIEW,
  );

  const list = useTaskList({ view, isEmployee, currentUserEmail });

  const filterOptions = useTaskFilterOptions({
    enabled: !isEmployee,
    projectFilter: list.projectFilter,
    assigneeFilter: list.assigneeFilter,
    onPruneAssignees: list.changeAssigneeFilter,
  });

  const tree = useTaskTree({
    tasks: list.tasks,
    setTasks: list.setTasks,
    resetKey: JSON.stringify([
      list.page,
      list.pageSize,
      list.searchValue,
      list.statusFilter,
      list.projectFilter,
      list.assigneeFilter,
    ]),
  });
  const selection = useTaskSelection({ childrenOf: tree.childrenOf });
  const assigned = useAssignedTaskNames(isEmployee, currentUserEmail);

  const visibleAssignees = useMemo(
    () =>
      isEmployee
        ? currentUserEmail
          ? [currentUserEmail]
          : []
        : list.assigneeFilter,
    [isEmployee, currentUserEmail, list.assigneeFilter],
  );

  const mutations = useTaskMutations({
    canWriteTask,
    isEmployee,
    currentUserEmail,
    findTask: tree.findTask,
    patchTask: tree.patchTask,
    removeTask: tree.removeTask,
    refreshParents: tree.refreshParents,
    pickedTasks: selection.pickedTasks,
    patchSelectedAssign: selection.patchAssign,
    clearSelection: selection.clear,
    deselectTasks: selection.removeMany,
    visibleAssignees,
  });

  const drawer = useTaskDrawer({
    canEditStatus: canWriteTask,
    isEmployee,
    view,
    changeStatus: mutations.changeStatus,
    assignTask: mutations.assignTask,
  });

  const timeLog = useTaskTimeLog({
    isProfessional,
    canLogTime,
    pickedTasks: selection.pickedTasks,
    getProjectDisplayName: filterOptions.getProjectDisplayName,
    clearSelection: selection.clear,
  });

  const refreshAll = useCallback(() => {
    if (isEmployee) void assigned.reload();
    void list.reload();
  }, [isEmployee, assigned.reload, list.reload]);

  const refreshRef = useRef(refreshAll);
  useEffect(() => {
    refreshRef.current = refreshAll;
  }, [refreshAll]);

  useEffect(
    () =>
      subscribeToRefresh(REFRESH_KEYS.TASK_LIST, () => refreshRef.current()),
    [subscribeToRefresh],
  );

  const pendingFocusRef = useRef<string | null>(null);

  const modeInitRef = useRef(true);
  useEffect(() => {
    if (modeInitRef.current) {
      modeInitRef.current = false;
      return;
    }
    selection.clear();
    list.resetAssigneeFilter();
    setView(isEmployee ? EMPLOYEE_DEFAULT_VIEW : PROFESSIONAL_DEFAULT_VIEW);
  }, [isEmployee]);

  const lastLoadRef = useRef<{ signature: string; names: Set<string> } | null>(
    null,
  );

  useEffect(() => {
    if (list.loadVersion === 0) return;

    const signature = JSON.stringify([
      view,
      isEmployee,
      currentUserEmail,
      list.page,
      list.pageSize,
      list.searchValue,
      list.statusFilter,
      list.projectFilter,
      list.assigneeFilter,
    ]);
    const names = new Set(list.tasks.map((t) => t.name));
    const previous = lastLoadRef.current;

    if (previous && previous.signature === signature) {
      const vanished = Array.from(previous.names).filter(
        (name) => !names.has(name),
      );
      if (vanished.length > 0) selection.removeMany(vanished);
    }

    lastLoadRef.current = { signature, names };
  }, [list.loadVersion]);

  useEffect(() => {
    const target = pendingFocusRef.current;
    if (!target || list.loadVersion === 0) return;

    const byName = new Map(list.tasks.map((t) => [t.name, t]));
    if (!byName.has(target)) return;

    const chain: string[] = [];
    let parent = byName.get(target)?.parent_task;
    while (parent && byName.has(parent) && !chain.includes(parent)) {
      chain.push(parent);
      parent = byName.get(parent)?.parent_task;
    }

    pendingFocusRef.current = null;
    if (chain.length) tree.expandGroups(chain);
  }, [list.loadVersion, list.tasks]);

  const rows = useMemo(
    () => buildTaskRows(list.tasks, tree.childrenByParent, tree.expanded),
    [list.tasks, tree.childrenByParent, tree.expanded],
  );

  const noteTaskNames = useMemo(() => {
    if (isEmployee && !currentUserEmail) return [];
    const names = rows.map((r) => r.name);
    if (drawer.data?.name) names.push(drawer.data.name);
    return names;
  }, [rows, drawer.data?.name, isEmployee, currentUserEmail]);

  const notesByTask = useTaskNotes({
    taskNames: noteTaskNames,
    reloadKey: list.loadVersion,
    userEmail: isEmployee ? currentUserEmail : undefined,
  });

  const selectableRows = rows.filter((r) => !isContextTask(r));
  const allSelected =
    selectableRows.length > 0 && selectableRows.every(selection.isSelected);
  const someSelected = selectableRows.some(selection.isSelected);

  const selectionApi: TaskSelectionApi = {
    enabled: canBulkSelect,
    count: selection.selected.size,
    isSelected: selection.isSelected,
    onToggle: selection.handleRowSelect,
    allSelected,
    someSelected,
    onToggleAll: () => selection.handleSelectAll(selectableRows, !allSelected),
  };

  const allColumns = buildTaskColumns({
    expanded: tree.expanded,
    childrenOf: tree.childrenOf,
    canWriteTask,
    canLogTime,
    currentUserEmail,
    notesByTask,
    showNoteUser: !isEmployee,
    selection: selectionApi,
    getProjectDisplayName: filterOptions.getProjectDisplayName,
    onToggleGroup: tree.toggleGroup,
    onView: drawer.handleView,
    onStatusChange: mutations.changeStatus,
    onAssigneesChange: mutations.changeAssignees,
    onLogTime: timeLog.logTime,
  });
  const columns = isEmployee
    ? allColumns.filter((c) => c.id !== "progress")
    : allColumns;

  const fetchBulkAssigneeOptions = useCallback(
    async (q: string) => {
      const projects = Array.from(
        new Set(
          selection.pickedTasks
            .map((t) => t.project)
            .filter((p): p is string => Boolean(p)),
        ),
      );
      if (projects.length === 0) return [];

      const lists = await Promise.all(
        projects.map((project) => fetchProjectAssigneeOptions(project, q)),
      );
      const [first, ...rest] = lists;
      const shared = rest.map((list) => new Set(list.map((o) => o.value)));
      return first.filter((o) => shared.every((values) => values.has(o.value)));
    },
    [selection.pickedTasks],
  );

  const hasLoggable = selection.pickedTasks.some((t) => t.is_group !== 1);

  const handleViewChange = (next: TaskMode) => {
    if (next === "table") {
      if (list.projectFilter.length > 1) {
        list.changeProjectFilter(list.projectFilter.slice(0, 1));
      }
      if (!isEmployee && list.assigneeFilter.length > 1) {
        list.changeAssigneeFilter(list.assigneeFilter.slice(0, 1));
      }
    }
    setView(next);
  };

  const handleAddTask = () => openTaskFormModal({ onSuccess: refreshAll });

  const viewSelector = (
    <ViewSelector
      value={view}
      options={VIEW_OPTIONS}
      onChange={handleViewChange}
    />
  );

  const addTaskButton = canCreateTask ? (
    <button
      type="button"
      onClick={handleAddTask}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
    >
      <Plus size={14} />
      Add Task
    </button>
  ) : null;

  const toolbarActions = (
    <>
      {addTaskButton}
      {viewSelector}
    </>
  );

  const hasActiveFilters =
    !!list.searchValue ||
    list.statusFilter.length > 0 ||
    list.projectFilter.length > 0 ||
    (isProfessional && list.assigneeFilter.length > 0);

  const clearFilters = () => {
    pendingFocusRef.current = null;
    list.setSearchValue("");
    list.changeStatusFilter([]);
    list.changeProjectFilter([]);
    if (isProfessional) list.changeAssigneeFilter([]);
  };

  const handleDependencyClick = (taskName: string) => {
    drawer.close();
    list.changeStatusFilter([]);
    list.changeProjectFilter([]);
    if (isProfessional) list.changeAssigneeFilter([]);
    list.setPage(1);
    pendingFocusRef.current = taskName;
    list.setSearchValue(taskName);
    setView("table");
  };

  return (
    <HrTableFrame>
      {view === "kanban" ? (
        <div
          className="app-surface overflow-hidden"
          style={{ height: CONTENT_HEIGHT }}
        >
          <TaskKanban
            statuses={STATUS_CELL_OPTIONS}
            searchTerm={list.searchValue}
            onSearch={list.setSearchValue}
            projectFilter={list.projectFilter}
            onProjectFilterChange={list.changeProjectFilter}
            assigneeFilter={isEmployee ? [] : list.assigneeFilter}
            onAssigneeFilterChange={
              isEmployee ? undefined : list.changeAssigneeFilter
            }
            fetchProjects={fetchProjectOptions}
            fetchUsers={fetchUserOptions}
            getProjectName={filterOptions.getProjectDisplayName}
            canEdit={canWriteTask}
            canEditTask={() => canWriteTask}
            onView={drawer.handleView}
            toolbarRight={toolbarActions}
            taskNames={isEmployee ? assigned.assignedNames : undefined}
            showProgress={!isEmployee}
          />
        </div>
      ) : (
        <div style={{ height: CONTENT_HEIGHT }}>
          <TaskTreeTable
            tableId="hr-task"
            columns={columns}
            data={rows}
            getRowId={(row) => row.name}
            loading={list.isInitialLoad}
            fetching={list.isFetching}
            rowClassName={(row) => (isContextTask(row) ? "opacity-60" : "")}
            onRowDoubleClick={(t) => drawer.handleView(t.name)}
            toolbar={
              <>
                <TaskSearchInput
                  value={list.searchValue}
                  onChange={list.setSearchValue}
                />
                <MultiSelectFilter
                  label="Status"
                  options={STATUS_OPTIONS}
                  values={list.statusFilter}
                  onChange={list.changeStatusFilter}
                />
                <MultiSelectFilter
                  single
                  label="Project"
                  options={filterOptions.projectFilterOptions}
                  values={list.projectFilter}
                  onChange={list.changeProjectFilter}
                  searchable
                  searchPlaceholder="Search project..."
                />
                {isProfessional && (
                  <MultiSelectFilter
                    single
                    label="Assignee"
                    options={filterOptions.userFilterOptions}
                    values={list.assigneeFilter}
                    onChange={list.changeAssigneeFilter}
                    searchable
                    searchPlaceholder="Search employee..."
                  />
                )}

                <div className="ml-auto flex items-center gap-2">
                  {selection.selected.size > 0 && (
                    <>
                      <button
                        onClick={selection.clear}
                        className="h-9 rounded-lg border border-[var(--border)] px-3 text-sm font-medium text-main transition-colors hover:bg-row-hover"
                      >
                        Clear selection
                      </button>
                      <BulkActionsMenu
                        count={selection.selected.size}
                        onAddLog={
                          canLogTime && hasLoggable
                            ? timeLog.logSelected
                            : undefined
                        }
                        assign={
                          canWriteTask
                            ? {
                                fetchOptions: fetchBulkAssigneeOptions,
                                onSubmit: mutations.bulkAssign,
                              }
                            : undefined
                        }
                      />
                    </>
                  )}
                  {toolbarActions}
                </div>

                <ClearFiltersButton
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                />
              </>
            }
            page={list.page}
            totalPages={list.totalPages}
            pageSize={list.pageSize}
            totalItems={list.totalItems}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={list.changePageSize}
            onPageChange={list.setPage}
          />
        </div>
      )}

      <TaskDetailDrawer
        open={drawer.open}
        data={drawer.data}
        loading={drawer.loading}
        canEditStatus={!!drawer.data && canWriteTask}
        showFinancials={!isEmployee}
        actionLoading={drawer.actionLoading}
        onClose={drawer.close}
        onStatusChange={drawer.handleStatusChange}
        onDependencyClick={handleDependencyClick}
        canAssign={canWriteTask}
        assignOnlyOwn={isEmployee}
        currentUserEmail={currentUserEmail}
        dependencyInfo={drawer.dependencyInfo}
        onAssigneesChange={drawer.handleAssign}
        assignmentNotes={drawer.data ? notesByTask[drawer.data.name] : undefined}
        showNoteUser={!isEmployee}
      />
    </HrTableFrame>
  );
};

export default HrTaskView;