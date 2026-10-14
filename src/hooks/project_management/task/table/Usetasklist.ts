import { useCallback, useEffect, useRef, useState } from "react";
import { showApiError } from "../../../../utils/alert";
import { getTaskList } from "../../../../api/project/task/taskapi";
import type { TaskEntry } from "../../../../types/Project_Management/task/table/Task.types";
import type { TaskMode } from "../../../../views/project_management/task/components/Taskviewtoggle";
import {
  SEARCH_DEBOUNCE_MS,
  isContextTask,
} from "../../../../views/project_management/task/components/Tasktable.config";
import { useIsMounted } from "./Useismounted";

interface Args {
  view: TaskMode;
  isEmployee: boolean;
  currentUserEmail?: string;
}

const withoutContextRows = (rows: TaskEntry[]): TaskEntry[] => {
  const visible = rows.filter((row) => !isContextTask(row));
  const names = new Set(visible.map((row) => row.name));

  return visible.map((row) =>
    row.parent_task && !names.has(row.parent_task)
      ? ({ ...row, parent_task: null } as TaskEntry)
      : row,
  );
};

export const useTaskList = ({ view, isEmployee, currentUserEmail }: Args) => {
  const mountedRef = useIsMounted();
  const requestIdRef = useRef(0);

  const [tasks, setTasks] = useState<TaskEntry[]>([]);
  const [loadVersion, setLoadVersion] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [searchValue, setSearchValue] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [projectFilter, setProjectFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);

  useEffect(() => {
    if (searchValue === search) return;
    const timer = setTimeout(() => {
      setSearch(searchValue);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchValue, search]);

  const reload = useCallback(async () => {
    if (view !== "table") return;
    if (isEmployee && !currentUserEmail) return;

    const requestId = ++requestIdRef.current;
    const isLatest = () =>
      mountedRef.current && requestId === requestIdRef.current;

    // Employees only ever see their own tasks. Professionals see everything
    // unless they pick an assignee; never send their own email by default,
    // otherwise the backend drops out of "all tasks" mode.
    const assignees = isEmployee
      ? [currentUserEmail as string]
      : assigneeFilter.length
        ? assigneeFilter
        : undefined;

    setIsFetching(true);

    try {
      const res = await getTaskList(
        page,
        pageSize,
        statusFilter.length ? statusFilter : undefined,
        projectFilter.length ? projectFilter : undefined,
        search || undefined,
        undefined,
        "desc",
        assignees,
        false,
        undefined,
        isEmployee ? currentUserEmail : undefined,
      );

      if (!isLatest()) return;

      const rows = res.data ?? [];

      setTasks(isEmployee ? withoutContextRows(rows) : rows);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total ?? res.data?.length ?? 0);
      setLoadVersion((v) => v + 1);
    } catch (error) {
      if (isLatest()) showApiError(error);
    } finally {
      if (isLatest()) {
        setIsFetching(false);
        setIsInitialLoad(false);
      }
    }
  }, [
    view,
    isEmployee,
    currentUserEmail,
    page,
    pageSize,
    search,
    statusFilter,
    projectFilter,
    assigneeFilter,
  ]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const changeStatusFilter = useCallback((next: string[]) => {
    setStatusFilter(next);
    setPage(1);
  }, []);

  const changeProjectFilter = useCallback((next: string[]) => {
    setProjectFilter(next);
    setPage(1);
  }, []);

  const changeAssigneeFilter = useCallback((next: string[]) => {
    setAssigneeFilter(next);
    setPage(1);
  }, []);

  const resetAssigneeFilter = useCallback(() => {
    setAssigneeFilter([]);
    setPage(1);
  }, []);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  return {
    tasks,
    setTasks,
    loadVersion,
    isInitialLoad,
    isFetching,
    page,
    setPage,
    pageSize,
    changePageSize,
    totalPages,
    totalItems,
    searchValue,
    setSearchValue,
    statusFilter,
    changeStatusFilter,
    projectFilter,
    changeProjectFilter,
    assigneeFilter,
    changeAssigneeFilter,
    resetAssigneeFilter,
    reload,
  };
};