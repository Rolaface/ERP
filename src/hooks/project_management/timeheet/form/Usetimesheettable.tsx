import { useCallback, useEffect, useRef, useState } from "react";
import type {
  RowActionsView,
  SortDir,
  TimesheetLine,
  TimesheetModalState,
} from "../../../../types/Project_Management/Timesheet/form/Timesheetformmodal";

export const useLineSelection = (
  lines: TimesheetLine[],
  removeLines: TimesheetModalState["removeLines"],
) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allSelected = lines.length > 0 && selectedIds.size === lines.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleRow = useCallback(
    (id: string) =>
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    [],
  );

  const toggleAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(lines.map((l) => l.id)));

  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set(lines.map((l) => l.id));
      const next = new Set([...prev].filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [lines]);

  const deleteSelected = () => {
    removeLines([...selectedIds]);
    setSelectedIds(new Set());
  };

  return {
    selectedIds,
    allSelected,
    someSelected,
    toggleRow,
    toggleAll,
    deleteSelected,
  };
};

export const useDateSort = (
  sortLines: TimesheetModalState["sortLines"],
  isOpen: boolean,
) => {
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const toggleSort = () => {
    const next = sortDir === "asc" ? "desc" : "asc";
    sortLines(next);
    setSortDir(next);
  };

  useEffect(() => {
    if (!isOpen) setSortDir(null);
  }, [isOpen]);

  return { sortDir, toggleSort };
};

export const useRowActions = () => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<RowActionsView>("menu");
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const registerTrigger = useCallback(
    (id: string, el: HTMLButtonElement | null) => {
      triggerRefs.current[id] = el;
    },
    [],
  );

  const close = useCallback(() => {
    setOpenId(null);
    setView("menu");
  }, []);

  const toggle = useCallback(
    (id: string) => {
      if (openId === id) {
        close();
        return;
      }
      setOpenId(id);
      setView("menu");
    },
    [openId, close],
  );

  const activeTriggerRef = {
    current: openId ? (triggerRefs.current[openId] ?? null) : null,
  };

  return {
    openId,
    view,
    setView,
    registerTrigger,
    close,
    toggle,
    activeTriggerRef,
  };
};