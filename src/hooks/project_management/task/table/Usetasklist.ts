import { useCallback, useEffect, useRef, useState } from "react";
import { showApiError } from "../../../../utils/alert";
import { getTaskList } from "../../../../api/project/task/taskapi";
import type { TaskEntry } from "../../../../types/Project_Management/task/table/Task.types";
import type { TaskMode } from "../../../../views/project_management/task/components/Taskviewtoggle";
import { SEARCH_DEBOUNCE_MS } from "../../../../views/project_management/task/components/Tasktable.config";
import { useIsMounted } from "./Useismounted";

interface Args {
  view: TaskMode;
  isEmployee: boolean;
  currentUserEmail?: string;
}

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
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const assigneeActive = isEmployee || assigneeFilter.length > 0;

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
        sortBy || undefined,
        sortOrder,
        assignees,
        isEmployee,
      );

      if (!isLatest()) return;

      setTasks(res.data ?? []);
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
    sortBy,
    sortOrder,
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

  const changeSort = useCallback(
    (nextSortBy: string, nextSortOrder: "asc" | "desc") => {
      setSortBy(nextSortBy);
      setSortOrder(nextSortOrder);
      setPage(1);
    },
    [],
  );

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
    sortBy,
    sortOrder,
    changeSort,
    assigneeActive,
    reload,
  };
};