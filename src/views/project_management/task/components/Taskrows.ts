import type { TaskEntry } from "../../../../types/Project_Management/task/table/Task.types";
import type { TaskRow } from "./Tasktable.config";

export type ChildrenByParent = Map<string, TaskEntry[]>;

/** Direct children grouped by parent, limited to parents present in `tasks`. */
export const groupChildren = (tasks: TaskEntry[]): ChildrenByParent => {
  const names = new Set(tasks.map((task) => task.name));
  const map: ChildrenByParent = new Map();

  for (const task of tasks) {
    if (!task.parent_task || !names.has(task.parent_task)) continue;
    const siblings = map.get(task.parent_task);
    if (siblings) siblings.push(task);
    else map.set(task.parent_task, [task]);
  }

  return map;
};

/**
 * The API returns the page in depth-first order and ships out-of-page ancestors
 * as context rows, so the whole tree is already in `tasks`. Groups start closed
 * and open on click; descendants of a closed group are simply not emitted.
 */
export const buildTaskRows = (
  tasks: TaskEntry[],
  childrenByParent: ChildrenByParent,
  expanded: Set<string>,
): TaskRow[] => {
  const names = new Set(tasks.map((task) => task.name));
  const roots = tasks.filter(
    (task) => !task.parent_task || !names.has(task.parent_task),
  );
  const visited = new Set<string>();

  const walk = (
    list: TaskEntry[],
    depth: number,
    guides: boolean[],
  ): TaskRow[] =>
    list.flatMap((task, index) => {
      if (visited.has(task.name)) return [];
      visited.add(task.name);

      const children = childrenByParent.get(task.name) ?? [];
      const isLast = index === list.length - 1;
      const row: TaskRow = {
        ...task,
        _depth: depth,
        _guides: guides,
        _isLast: isLast,
        _childCount: children.length,
      };

      if (children.length === 0 || !expanded.has(task.name)) return [row];

      const childGuides = depth === 0 ? [] : [...guides, !isLast];
      return [row, ...walk(children, depth + 1, childGuides)];
    });

  return walk(roots, 0, []);
};