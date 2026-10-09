import { useCallback } from "react";
import { showApiError, showSuccess } from "../../../../utils/alert";
import {
  parseAssignedEmails,
  updateTaskAssignees,
  updateTaskStatus,
} from "../../../../api/project/task/taskapi";
import { closeMyTaskAssignment } from "../../../../api/project/todo/todo.api";
import {
  useDataRefreshStore,
  REFRESH_KEYS,
} from "../../../../store/dataRefreshStore";
import type {
  TaskEntry,
  TaskStatus,
} from "../../../../types/Project_Management/task/table/Task.types";
import type { BulkAssignMode } from "../../../../views/project_management/task/components/Bulkactionsmenu";
export interface StatusChangeResult {
  ok: boolean;
  progress?: number;
}

interface Args {
  canWriteTask: boolean;
  isEmployee: boolean;
  currentUserEmail?: string;
  findTask: (name: string) => TaskEntry | undefined;
  patchTask: (name: string, patch: Partial<TaskEntry>) => void;
  removeTask: (name: string) => void;
  refreshParents: (name: string) => Promise<void>;
  pickedTasks: TaskEntry[];
  patchSelectedAssign: (name: string, assign: string) => void;
  clearSelection: () => void;
  deselectTasks: (names: string[]) => void;
  visibleAssignees: string[];
}

export const useTaskMutations = ({
  canWriteTask,
  isEmployee,
  currentUserEmail,
  findTask,
  patchTask,
  removeTask,
  refreshParents,
  pickedTasks,
  patchSelectedAssign,
  clearSelection,
  deselectTasks,
  visibleAssignees,
}: Args) => {
  const triggerRefresh = useDataRefreshStore((s) => s.triggerRefresh);

  const staysInView = useCallback(
    (emails: string[]) =>
      visibleAssignees.length === 0 ||
      emails.some((email) => visibleAssignees.includes(email)),
    [visibleAssignees],
  );

  const handOff = useCallback(
    (previous: string[], next: string[]) => {
      if (!currentUserEmail || !previous.includes(currentUserEmail)) {
        return next;
      }
      const assignedToOthers = next.some(
        (email) => email !== currentUserEmail && !previous.includes(email),
      );
      return assignedToOthers
        ? next.filter((email) => email !== currentUserEmail)
        : next;
    },
    [currentUserEmail],
  );

  const finalizeEmployeeAssignment = useCallback(
    async (taskName: string, nextStatus: string) => {
      if (nextStatus !== "Completed" || !isEmployee || !currentUserEmail) {
        return;
      }
      try {
        await closeMyTaskAssignment(taskName, currentUserEmail);
      } catch (error) {
        showApiError(error);
      }
      triggerRefresh(REFRESH_KEYS.TASK_LIST);
    },
    [isEmployee, currentUserEmail, triggerRefresh],
  );

  const changeStatus = useCallback(
    async (
      taskName: string,
      nextStatus: string,
      nextProgress?: number,
    ): Promise<StatusChangeResult> => {
      if (!canWriteTask) return { ok: false };

      const progress = nextStatus === "Completed" ? 100 : nextProgress;

      try {
        await updateTaskStatus(taskName, nextStatus, progress);

        patchTask(taskName, {
          status: nextStatus as TaskStatus,
          ...(progress !== undefined ? { progress } : {}),
        });
        void refreshParents(taskName);

        showSuccess("Task status updated");
        await finalizeEmployeeAssignment(taskName, nextStatus);
        return { ok: true, progress };
      } catch (error) {
        showApiError(error);
        return { ok: false };
      }
    },
    [canWriteTask, patchTask, refreshParents, finalizeEmployeeAssignment],
  );

  const changeAssignees = useCallback(
    async (
      taskName: string,
      requestedEmails: string[],
      description?: string,
    ) => {
      const task = findTask(taskName);
      if (!task) return;

      const previousEmails = parseAssignedEmails(task._assign);
      const nextEmails = handOff(previousEmails, requestedEmails);

      try {
        const result = await updateTaskAssignees(
          taskName,
          previousEmails,
          nextEmails,
          description,
        );

        if (staysInView(nextEmails)) {
          patchTask(taskName, { _assign: JSON.stringify(nextEmails) });
        } else {
          removeTask(taskName);
          deselectTasks([taskName]);
        }

        showSuccess(result.message || "Assignees updated");
      } catch (error) {
        showApiError(error);
        throw error;
      } finally {
        triggerRefresh(REFRESH_KEYS.TASK_LIST);
      }
    },
    [
      findTask,
      patchTask,
      removeTask,
      deselectTasks,
      staysInView,
      handOff,
      triggerRefresh,
    ],
  );

  const bulkAssign = useCallback(
    async (
      emails: string[],
      mode: BulkAssignMode,
      description?: string,
    ): Promise<boolean> => {
      if (!canWriteTask || emails.length === 0) return false;

      const leftView: string[] = [];

      const results = await Promise.allSettled(
        pickedTasks.map(async (t) => {
          const previous = parseAssignedEmails(
            findTask(t.name)?._assign ?? t._assign,
          );
          const next = handOff(
            previous,
            mode === "add"
              ? Array.from(new Set([...previous, ...emails]))
              : emails,
          );
          await updateTaskAssignees(t.name, previous, next, description);
          if (staysInView(next)) {
            const assign = JSON.stringify(next);
            patchTask(t.name, { _assign: assign });
            patchSelectedAssign(t.name, assign);
          } else {
            removeTask(t.name);
            leftView.push(t.name);
          }
        }),
      );

      const failed = results.filter(
        (r): r is PromiseRejectedResult => r.status === "rejected",
      );
      const doneCount = results.length - failed.length;

      if (doneCount > 0) {
        showSuccess(`Assigned ${doneCount} task${doneCount > 1 ? "s" : ""}`);
        triggerRefresh(REFRESH_KEYS.TASK_LIST);
      }
      if (failed.length > 0) showApiError(failed[0].reason);
      if (leftView.length > 0) deselectTasks(leftView);
      if (failed.length === 0) clearSelection();

      return failed.length === 0;
    },
    [
      canWriteTask,
      pickedTasks,
      findTask,
      patchTask,
      removeTask,
      patchSelectedAssign,
      clearSelection,
      deselectTasks,
      staysInView,
      handOff,
      triggerRefresh,
    ],
  );

  return { changeStatus, changeAssignees, bulkAssign };
};