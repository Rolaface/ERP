import { useCallback, useRef, useState } from "react";
import { showApiError } from "../../../../utils/alert";
import { getTaskById } from "../../../../api/project/task/taskapi";
import {
  useDataRefreshStore,
  REFRESH_KEYS,
} from "../../../../store/dataRefreshStore";
import type {
  TaskDetail,
  TaskStatus,
} from "../../../../types/Project_Management/task/table/Task.types";
import type { TaskMode } from "../../../../views/project_management/task/components/Taskviewtoggle";
import { useIsMounted } from "./Useismounted";
import type { StatusChangeResult } from "./Usetaskmutations";

interface Args {
  canEditStatus: boolean;
  isEmployee: boolean;
  view: TaskMode;
  changeStatus: (
    taskName: string,
    nextStatus: string,
    nextProgress?: number,
  ) => Promise<StatusChangeResult>;
}

export const useTaskDrawer = ({
  canEditStatus,
  isEmployee,
  view,
  changeStatus,
}: Args) => {
  const mountedRef = useIsMounted();
  const triggerRefresh = useDataRefreshStore((s) => s.triggerRefresh);
  const viewRequestRef = useRef(0);

  const [open, setOpen] = useState(false);
  const [data, setData] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleView = useCallback(async (id: string) => {
    const requestId = ++viewRequestRef.current;
    setOpen(true);
    setLoading(true);
    setData(null);

    try {
      const detail = await getTaskById(id);
      if (!mountedRef.current || requestId !== viewRequestRef.current) return;
      setData(detail);
    } catch (error) {
      if (!mountedRef.current || requestId !== viewRequestRef.current) return;
      showApiError(error);
      setOpen(false);
    } finally {
      if (mountedRef.current && requestId === viewRequestRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const close = useCallback(() => {
    viewRequestRef.current += 1;
    setOpen(false);
    setData(null);
  }, []);

  const handleStatusChange = useCallback(
    async (taskName: string, nextStatus: string) => {
      if (!canEditStatus) return;

      setActionLoading(true);
      try {
        const result = await changeStatus(taskName, nextStatus);
        if (!result.ok || !mountedRef.current) return;

        setData((prev) =>
          prev
            ? {
                ...prev,
                status: nextStatus as TaskStatus,
                progress:
                  result.progress !== undefined
                    ? result.progress
                    : prev.progress,
              }
            : prev,
        );

        if (view === "kanban" && !(isEmployee && nextStatus === "Completed")) {
          triggerRefresh(REFRESH_KEYS.TASK_LIST);
        }
      } finally {
        if (mountedRef.current) setActionLoading(false);
      }
    },
    [canEditStatus, changeStatus, view, isEmployee, triggerRefresh],
  );

  return {
    open,
    data,
    loading,
    actionLoading,
    handleView,
    close,
    handleStatusChange,
  };
};