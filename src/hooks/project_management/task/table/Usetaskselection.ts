import { useCallback, useMemo, useRef, useState } from "react";
import type { TaskEntry } from "../../../../types/Project_Management/task/table/Task.types";
import { isContextTask } from "../../../../views/project_management/task/components/Tasktable.config";

interface Args {
  childrenOf: (name: string) => TaskEntry[];
}

export const useTaskSelection = ({ childrenOf }: Args) => {
  const childrenOfRef = useRef(childrenOf);
  childrenOfRef.current = childrenOf;

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

  /** The given tasks plus all their loaded descendants, minus context rows. */
  const withDescendants = (tasks: TaskEntry[]): TaskEntry[] => {
    const visited = new Set<string>();
    const out: TaskEntry[] = [];

    const visit = (task: TaskEntry) => {
      if (visited.has(task.name)) return;
      visited.add(task.name);
      if (!isContextTask(task)) out.push(task);
      childrenOfRef.current(task.name).forEach(visit);
    };

    tasks.forEach(visit);
    return out;
  };

  const setChecked = useCallback((tasks: TaskEntry[], checked: boolean) => {
    const items = withDescendants(tasks);
    setSelected((prev) => {
      const next = new Map(prev);
      items.forEach((task) => {
        if (checked) next.set(task.name, task);
        else next.delete(task.name);
      });
      return next;
    });
  }, []);

  const handleRowSelect = useCallback(
    (task: TaskEntry, checked: boolean) => setChecked([task], checked),
    [setChecked],
  );

  const handleSelectAll = useCallback(
    (list: TaskEntry[], checked: boolean) => setChecked(list, checked),
    [setChecked],
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