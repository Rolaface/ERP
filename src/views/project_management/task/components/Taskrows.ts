import type { TaskEntry } from "../../../../types/Project_Management/task/table/Task.types";
import type { TaskRow } from "./Tasktable.config";

export const buildTaskRows = (
  tasks: TaskEntry[],
  childrenMap: Record<string, TaskEntry[]>,
  expanded: Set<string>,
  flat: boolean,
): TaskRow[] => {
  if (flat) {
    return tasks.map((t) => ({
      ...t,
      _depth: 0,
      _guides: [],
      _isLast: true,
    }));
  }

  const walk = (
    list: TaskEntry[],
    depth: number,
    guides: boolean[],
  ): TaskRow[] =>
    list.flatMap((task, index) => {
      const isLast = index === list.length - 1;
      const row: TaskRow = {
        ...task,
        _depth: depth,
        _guides: guides,
        _isLast: isLast,
      };

      if (task.is_group === 1 && expanded.has(task.name)) {
        const childGuides = depth === 0 ? [] : [...guides, !isLast];
        return [row, ...walk(childrenMap[task.name] ?? [], depth + 1, childGuides)];
      }

      return [row];
    });

  return walk(tasks, 0, []);
};