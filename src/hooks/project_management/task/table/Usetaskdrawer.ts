import { useCallback, useRef, useState } from "react";
import { showApiError } from "../../../../utils/alert";
import {
  getTaskBriefs,
  getTaskById,
  parseAssignedEmails,
  type TaskBrief,
} from "../../../../api/project/task/taskapi";
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

export interface DependencyInfo {
  project: string | null;
  status: string;
  assign: string | null;
}

interface Args {
  canEditStatus: boolean;
  isEmployee: boolean;
  view: TaskMode;
  changeStatus: (
    taskName: string,
    nextStatus: string,
    nextProgress?: number,
  ) => Promise<StatusChangeResult>;
  assignTask: (
    taskName: string,
    previousEmails: string[],
    requestedEmails: string[],
    description?: string,
  ) => Promise<string[]>;
}

const loadBriefs = async (names: string[]): Promise<Map<string, TaskBrief>> => {
  try {
    const briefs = await getTaskBriefs(names);
    return new Map(briefs.map((brief) => [brief.name, brief]));
  } catch {
    return new Map();
  }
};

export const useTaskDrawer = ({
  canEditStatus,
  isEmployee,
  view,
  changeStatus,
  assignTask,
}: Args) => {
  const mountedRef = useIsMounted();
  const triggerRefresh = useDataRefreshStore((s) => s.triggerRefresh);
  const viewRequestRef = useRef(0);

  const [open, setOpen] = useState(false);
  const [data, setData] = useState<TaskDetail | null>(null);
  const [dependencyInfo, setDependencyInfo] = useState<
    Record<string, DependencyInfo>
  >({});
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleView = useCallback(
    async (id: string) => {
      const requestId = ++viewRequestRef.current;
      const isStale = () =>
        !mountedRef.current || requestId !== viewRequestRef.current;

      setOpen(true);
      setLoading(true);
      setData(null);
      setDependencyInfo({});

      try {
        const detail = await getTaskById(id);
        if (isStale()) return;

        if (!detail) {
          setData(detail);
          return;
        }

        const dependencyNames = Array.from(
          new Set(
            (detail.depends_on ?? [])
              .map((dep) => dep.task)
              .filter((name): name is string => Boolean(name)),
          ),
        );

        const briefs = await loadBriefs([id, ...dependencyNames]);
        if (isStale()) return;

        setData({
          ...detail,
          _assign: (briefs.get(id)?._assign ??
            detail._assign) as TaskDetail["_assign"],
        });

        const info: Record<string, DependencyInfo> = {};
        dependencyNames.forEach((name) => {
          const brief = briefs.get(name);
          if (!brief) return;
          info[name] = {
            project: brief.project ?? null,
            status: brief.status,
            assign: brief._assign ?? null,
          };
        });
        setDependencyInfo(info);
      } catch (error) {
        if (isStale()) return;
        showApiError(error);
        setOpen(false);
      } finally {
        if (mountedRef.current && requestId === viewRequestRef.current) {
          setLoading(false);
        }
      }
    },
    [mountedRef],
  );

  const close = useCallback(() => {
    viewRequestRef.current += 1;
    setOpen(false);
    setData(null);
    setDependencyInfo({});
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

  const handleAssign = useCallback(
    async (taskName: string, requestedEmails: string[], description?: string) => {
      const isMain = data?.name === taskName;
      const previousSource = isMain
        ? (data?._assign ?? null)
        : (dependencyInfo[taskName]?.assign ?? null);

      const nextEmails = await assignTask(
        taskName,
        parseAssignedEmails(previousSource),
        requestedEmails,
        description,
      );
      if (!mountedRef.current) return;

      const assign = JSON.stringify(nextEmails);
      if (isMain) {
        setData((prev) =>
          prev && prev.name === taskName ? { ...prev, _assign: assign } : prev,
        );
      } else {
        setDependencyInfo((prev) =>
          prev[taskName]
            ? { ...prev, [taskName]: { ...prev[taskName], assign } }
            : prev,
        );
      }
    },
    [data, dependencyInfo, assignTask, mountedRef],
  );

  return {
    open,
    data,
    loading,
    actionLoading,
    dependencyInfo,
    handleView,
    close,
    handleStatusChange,
    handleAssign,
  };
};