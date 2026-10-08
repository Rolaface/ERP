import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  fetchProjectOptions,
  fetchUserOptions,
} from "../components/Taskoptionfetchers";
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
} from "../components/Tasktable.config";
import { useAssignedTaskNames } from "../../../../hooks/project_management/task/table/Useassignedtasknames";
import { useTaskDrawer } from "../../../../hooks/project_management/task/table/Usetaskdrawer";
import { useTaskFilterOptions } from "../../../../hooks/project_management/task/table/Usetaskfilteroptions";
import { useTaskList } from "../../../../hooks/project_management/task/table/Usetasklist";
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

  const canCreateTask = can(TASK_MODULE, "create");
  const canWriteTask = can(TASK_MODULE, "write");
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
    loadVersion: list.loadVersion,
    flat: list.assigneeActive,
  });

  const selection = useTaskSelection({ childrenMap: tree.childrenMap });
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
      list.sortBy,
      list.sortOrder,
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

  const rows = useMemo(
    () =>
      buildTaskRows(
        list.tasks,
        tree.childrenMap,
        tree.expanded,
        list.assigneeActive,
      ),
    [list.tasks, tree.childrenMap, tree.expanded, list.assigneeActive],
  );

  const allSelected = rows.length > 0 && rows.every((r) => selection.isSelected(r));
  const someSelected = rows.some((r) => selection.isSelected(r));

  const selectionApi: TaskSelectionApi = {
    enabled: canBulkSelect,
    isSelected: (t) => selection.isSelected(t),

    onToggle: (t) => selection.handleRowSelect(t, !selection.isSelected(t)),
    allSelected,
    someSelected,
    onToggleAll: () => selection.handleSelectAll(rows, !allSelected),
  };

  const allColumns = buildTaskColumns({
    expanded: tree.expanded,
    loadingGroups: tree.loadingGroups,
    childrenMap: tree.childrenMap,
    assigneeActive: list.assigneeActive,
    canWriteTask,
    canLogTime,
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

  const handleAdd = () => {
    if (!canCreateTask) return;
    console.warn("handleAdd: Task create modal not wired yet.");
  };

  const hasLoggable = selection.pickedTasks.some((t) => t.is_group !== 1);

  const viewSelector = (
    <ViewSelector value={view} options={VIEW_OPTIONS} onChange={setView} />
  );

  const hasActiveFilters =
    !!list.searchValue ||
    list.statusFilter.length > 0 ||
    list.projectFilter.length > 0 ||
    (isProfessional && list.assigneeFilter.length > 0);

  const clearFilters = () => {
    list.setSearchValue("");
    list.changeStatusFilter([]);
    list.changeProjectFilter([]);
    if (isProfessional) list.changeAssigneeFilter([]);
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
            toolbarRight={viewSelector}
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
          sortBy={list.sortBy}
          sortOrder={list.sortOrder}
          onSortChange={list.changeSort}
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
                label="Project"
                options={filterOptions.projectFilterOptions}
                values={list.projectFilter}
                onChange={list.changeProjectFilter}
                searchable
                searchPlaceholder="Search project..."
              />
              {isProfessional && (
                <MultiSelectFilter
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
                              fetchOptions: fetchUserOptions,
                              onSubmit: mutations.bulkAssign,
                            }
                          : undefined
                      }
                    />
                  </>
                )}
                {viewSelector}
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
      />
    </HrTableFrame>
  );
};

export default HrTaskView;