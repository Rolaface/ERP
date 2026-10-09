import { useCallback, useEffect, useState } from "react";
import {
  getTaskList,
  getTaskById,
  createTask,
  updateTaskById,
  updateTaskAssignees,
} from "../../../../api/project/task/taskapi";
import {
  taskDetailToEntry,
  type TaskEntry,
  type TaskFilters,
} from "../../../../types/Project_Management/task/table/Task.types";

export function useTaskList(filters: TaskFilters) {
  const [tasks, setTasks] = useState<TaskEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getTaskList(
        filters.page,
        filters.pageSize,
        filters.statuses.length ? filters.statuses : undefined,
        filters.projects.length ? filters.projects : undefined,
        filters.search,
        filters.sortBy,
        filters.sortOrder,
      );
      setTasks(response.data);
      setTotal(response.pagination?.total ?? response.data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, [
    filters.page,
    filters.pageSize,
    filters.statuses,
    filters.projects,
    filters.search,
    filters.sortBy,
    filters.sortOrder,
  ]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const updateLocalAssignees = useCallback(
    (taskName: string, emails: string[]) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.name === taskName
            ? { ...task, _assign: JSON.stringify(emails) }
            : task,
        ),
      );
    },
    [],
  );

  return { tasks, total, isLoading, error, refresh: loadTasks, updateLocalAssignees };
}

export function useTaskDetail(id: string) {
  const [task, setTask] = useState<TaskEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTask = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getTaskById(id);

      setTask(response ? taskDetailToEntry(response) : null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load task",
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  return {
    task,
    isLoading,
    error,
    refresh: loadTask,
  };
}

export function useTaskActions() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAction = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      setIsSaving(true);
      setError(null);
      try {
        return await fn();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed");
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const create = useCallback(
    (payload: any) => runAction(() => createTask(payload)),
    [runAction],
  );

  const update = useCallback(
    (payload: any) => runAction(() => updateTaskById(payload)),
    [runAction],
  );

const assign = useCallback(
  (
    taskName: string,
    previousEmails: string[],
    nextEmails: string[],
  ) =>
    runAction(() =>
      updateTaskAssignees(
        taskName,
        previousEmails,
        nextEmails,
      ),
    ),
  [runAction],
);
  return { create, update, assign, isSaving, error };
}