import { useCallback, useMemo, useRef, useState } from "react";
import { showApiError } from "../../../../utils/alert";
import { getChildTasks } from "../../../../api/project/task/taskapi";
import type { TaskEntry } from "../../../../types/Project_Management/task/table/Task.types";
import { useIsMounted } from "./Useismounted";

const collectDescendants = async (
  groupName: string,
  cache: Record<string, TaskEntry[]>,
): Promise<TaskEntry[]> => {
  const children = cache[groupName] ?? (await getChildTasks(groupName));
  const nested = await Promise.all(
    children
      .filter((c) => c.is_group === 1)
      .map((c) => collectDescendants(c.name, cache)),
  );
  return [...children, ...nested.flat()];
};

interface Args {
  childrenMap: Record<string, TaskEntry[]>;
}

export const useTaskSelection = ({ childrenMap }: Args) => {
  const mountedRef = useIsMounted();
  const childrenRef = useRef(childrenMap);
  childrenRef.current = childrenMap;
  const cascadeTokenRef = useRef<Map<string, number>>(new Map());

  const [selected, setSelected] = useState<Map<string, TaskEntry>>(new Map());

  const pickedTasks = useMemo(() => Array.from(selected.values()), [selected]);

  const isSelected = useCallback(
    (task: TaskEntry) => selected.has(task.name),
    [selected],
  );

  const clear = useCallback(() => setSelected(new Map()), []);

  const removeMany = useCallback((names: string[]) => {
    if (names.length === 0) return;
    setSelected((prev) => {
      const next = new Map(prev);
      let changed = false;
      names.forEach((name) => {
        if (next.delete(name)) changed = true;
      });
      return changed ? next : prev;
    });
  }, []);

  const patchAssign = useCallback((taskName: string, assign: string) => {
    setSelected((prev) => {
      const current = prev.get(taskName);
      if (!current) return prev;
      const next = new Map(prev);
      next.set(taskName, { ...current, _assign: assign });
      return next;
    });
  }, []);

  const cascadeGroup = useCallback(
    async (group: TaskEntry, checked: boolean) => {
      const token = (cascadeTokenRef.current.get(group.name) ?? 0) + 1;
      cascadeTokenRef.current.set(group.name, token);
      const isLatest = () =>
        mountedRef.current && cascadeTokenRef.current.get(group.name) === token;

      try {
        const descendants = await collectDescendants(
          group.name,
          childrenRef.current,
        );
        if (!isLatest()) return;
        setSelected((prev) => {
          const next = new Map(prev);
          descendants.forEach((d) => {
            if (checked) next.set(d.name, d);
            else next.delete(d.name);
          });
          return next;
        });
      } catch (error) {
        if (!isLatest()) return;
        showApiError(error);
        if (checked) {
          setSelected((prev) => {
            const next = new Map(prev);
            next.delete(group.name);
            return next;
          });
        }
      }
    },
    [],
  );

  const handleRowSelect = useCallback(
    (task: TaskEntry, checked: boolean) => {
      setSelected((prev) => {
        const next = new Map(prev);
        if (checked) next.set(task.name, task);
        else next.delete(task.name);
        return next;
      });
      if (task.is_group === 1) void cascadeGroup(task, checked);
    },
    [cascadeGroup],
  );

  const handleSelectAll = useCallback(
    (list: TaskEntry[], checked: boolean) => {
      setSelected((prev) => {
        const next = new Map(prev);
        list.forEach((task) => {
          if (checked) next.set(task.name, task);
          else next.delete(task.name);
        });
        return next;
      });
      list
        .filter((task) => task.is_group === 1)
        .forEach((group) => void cascadeGroup(group, checked));
    },
    [cascadeGroup],
  );

  return {
    selected,
    pickedTasks,
    isSelected,
    clear,
    removeMany,
    patchAssign,
    handleRowSelect,
    handleSelectAll,
  };
};