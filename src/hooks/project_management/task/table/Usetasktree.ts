import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { showApiError } from "../../../../utils/alert";
import {
  getChildTasks,
  getTaskById,
} from "../../../../api/project/task/taskapi";
import type { TaskEntry } from "../../../../types/Project_Management/task/table/Task.types";
import { useIsMounted } from "./Useismounted";

interface Args {
  tasks: TaskEntry[];
  setTasks: Dispatch<SetStateAction<TaskEntry[]>>;
  loadVersion: number;
  flat: boolean;
}

export const useTaskTree = ({
  tasks,
  setTasks,
  loadVersion,
  flat,
}: Args) => {
  const mountedRef = useIsMounted();

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [childrenMap, setChildrenMap] = useState<Record<string, TaskEntry[]>>(
    {},
  );
  const [loadingGroups, setLoadingGroups] = useState<Set<string>>(new Set());

  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const expandedRef = useRef(expanded);
  expandedRef.current = expanded;
  const childrenRef = useRef(childrenMap);
  childrenRef.current = childrenMap;
  const loadingRef = useRef(loadingGroups);
  loadingRef.current = loadingGroups;
  const flatRef = useRef(flat);
  flatRef.current = flat;
  const syncSeqRef = useRef(0);

  const findTask = useCallback((name: string): TaskEntry | undefined => {
    return (
      tasksRef.current.find((t) => t.name === name) ??
      Object.values(childrenRef.current)
        .flat()
        .find((t) => t.name === name)
    );
  }, []);

  const patchTask = useCallback(
    (taskName: string, patch: Partial<TaskEntry>) => {
      const apply = (list: TaskEntry[]) =>
        list.map((t) => (t.name === taskName ? { ...t, ...patch } : t));
      setTasks(apply);
      setChildrenMap((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([key, list]) => [key, apply(list)]),
        ),
      );
    },
    [setTasks],
  );

  const removeTask = useCallback(
    (taskName: string) => {
      setTasks((prev) => prev.filter((t) => t.name !== taskName));
      setChildrenMap((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([key, list]) => [
            key,
            list.filter((t) => t.name !== taskName),
          ]),
        ),
      );
    },
    [setTasks],
  );

  const refreshParents = useCallback(
    async (taskName: string) => {
      if (flatRef.current) return;

      let parent = findTask(taskName)?.parent_task;
      while (parent) {
        try {
          const detail = await getTaskById(parent);
          if (!detail || !mountedRef.current) return;
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
    },
    [findTask, patchTask],
  );

  const toggleGroup = useCallback(async (groupName: string) => {
    const isOpen = expandedRef.current.has(groupName);

    setExpanded((prev) => {
      const next = new Set(prev);
      if (isOpen) next.delete(groupName);
      else next.add(groupName);
      return next;
    });

    if (
      isOpen ||
      childrenRef.current[groupName] ||
      loadingRef.current.has(groupName)
    ) {
      return;
    }

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
  }, []);

  const syncExpanded = useCallback(async () => {
    const seq = ++syncSeqRef.current;
    const open = expandedRef.current;

    if (flatRef.current || open.size === 0) {
      setExpanded((prev) => (prev.size ? new Set() : prev));
      setChildrenMap((prev) => (Object.keys(prev).length ? {} : prev));
      return;
    }

    const nextMap: Record<string, TaskEntry[]> = {};
    const nextExpanded = new Set<string>();
    let frontier = tasksRef.current
      .filter((t) => t.is_group === 1 && open.has(t.name))
      .map((t) => t.name);

    try {
      while (frontier.length > 0) {
        const results = await Promise.all(
          frontier.map(
            async (name) => [name, await getChildTasks(name)] as const,
          ),
        );
        if (!mountedRef.current || seq !== syncSeqRef.current) return;

        frontier = [];
        results.forEach(([name, children]) => {
          nextMap[name] = children;
          nextExpanded.add(name);
          children.forEach((child) => {
            if (child.is_group === 1 && open.has(child.name)) {
              frontier.push(child.name);
            }
          });
        });
      }
    } catch (error) {
      if (!mountedRef.current || seq !== syncSeqRef.current) return;
      showApiError(error);
      setExpanded(new Set());
      setChildrenMap({});
      return;
    }

    setChildrenMap(nextMap);
    setExpanded(nextExpanded);
  }, []);

  useEffect(() => {
    if (loadVersion === 0) return;
    void syncExpanded();
  }, [loadVersion]);

  return {
    expanded,
    childrenMap,
    loadingGroups,
    toggleGroup,
    findTask,
    patchTask,
    removeTask,
    refreshParents,
  };
};