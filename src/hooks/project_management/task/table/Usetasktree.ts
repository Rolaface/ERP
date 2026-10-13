import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { showApiError } from "../../../../utils/alert";
import { getTaskById } from "../../../../api/project/task/taskapi";
import type { TaskEntry } from "../../../../types/Project_Management/task/table/Task.types";
import { groupChildren } from "../../../../views/project_management/task/components/Taskrows";
import { useIsMounted } from "./Useismounted";

interface Args {
  tasks: TaskEntry[];
  setTasks: Dispatch<SetStateAction<TaskEntry[]>>;
  resetKey?: string;
}

export const useTaskTree = ({ tasks, setTasks, resetKey }: Args) => {
  const mountedRef = useIsMounted();

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const childrenByParent = useMemo(() => groupChildren(tasks), [tasks]);

  const initializedRef = useRef(false);

  useEffect(() => {
    if (!tasks.length || initializedRef.current) return;

    const firstFolder = tasks.find((task) =>
      childrenByParent.has(task.name),
    );

    if (!firstFolder) return;

    setExpanded(new Set([firstFolder.name]));
    initializedRef.current = true;
  }, [tasks, childrenByParent]);

  useEffect(() => {
    initializedRef.current = false;
    setExpanded(new Set());
  }, [resetKey]);

  const childrenOf = useCallback(
    (name: string): TaskEntry[] => childrenByParent.get(name) ?? [],
    [childrenByParent],
  );

  const toggleGroup = useCallback((name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);

      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }

      return next;
    });
  }, []);

  const expandGroups = useCallback((names: string[]) => {
    setExpanded((prev) => {
      if (names.every((name) => prev.has(name))) return prev;

      const next = new Set(prev);
      names.forEach((name) => next.add(name));

      return next;
    });
  }, []);

  const findTask = useCallback(
    (name: string): TaskEntry | undefined =>
      tasksRef.current.find((task) => task.name === name),
    [],
  );

  const patchTask = useCallback(
    (taskName: string, patch: Partial<TaskEntry>) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.name === taskName ? { ...task, ...patch } : task,
        ),
      );
    },
    [setTasks],
  );

  const removeTask = useCallback(
    (taskName: string) => {
      setTasks((prev) => prev.filter((task) => task.name !== taskName));
    },
    [setTasks],
  );

  const refreshParents = useCallback(
    async (taskName: string) => {
      const chain: string[] = [];
      let parent = findTask(taskName)?.parent_task;

      while (parent && !chain.includes(parent)) {
        chain.push(parent);
        parent = findTask(parent)?.parent_task;
      }

      for (const name of chain) {
        try {
          const detail = await getTaskById(name);

          if (!detail || !mountedRef.current) return;

          patchTask(name, {
            status: detail.status,
            progress: detail.progress,
          });
        } catch (error) {
          showApiError(error);
          return;
        }
      }
    },
    [findTask, patchTask, mountedRef],
  );

  return {
    expanded,
    childrenByParent,
    childrenOf,
    toggleGroup,
    expandGroups,
    findTask,
    patchTask,
    removeTask,
    refreshParents,
  };
};