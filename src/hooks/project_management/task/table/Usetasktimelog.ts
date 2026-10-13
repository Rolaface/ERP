import { useCallback } from "react";
import {
  useDataRefreshStore,
  REFRESH_KEYS,
} from "../../../../store/dataRefreshStore";
import type { TaskEntry } from "../../../../types/Project_Management/task/table/Task.types";
import {
  openAdminTimesheetFormModal,
  openEmployeeTimesheetFormModal,
} from "../../../../components/feature/project management/timesheet/timesheetForm.modal";

interface Args {
  isProfessional: boolean;
  canLogTime: boolean;
  pickedTasks: TaskEntry[];
  getProjectDisplayName: (code: string | null) => string;
  clearSelection: () => void;
}

export const useTaskTimeLog = ({
  isProfessional,
  canLogTime,
  pickedTasks,
  getProjectDisplayName,
  clearSelection,
}: Args) => {
  const triggerRefresh = useDataRefreshStore((s) => s.triggerRefresh);

  const openTimesheetForm = isProfessional
    ? openAdminTimesheetFormModal
    : openEmployeeTimesheetFormModal;

  const toPrefillTask = useCallback(
    (t: TaskEntry) => ({
      project: t.project ?? "",
      projectName: getProjectDisplayName(t.project),
      task: t.name,
      taskName: t.subject,
      activityType:
        (t as TaskEntry & { custom_activity_type?: string })
          .custom_activity_type || undefined,
    }),
    [getProjectDisplayName],
  );

  const refreshAfterLog = useCallback(() => {
    triggerRefresh(REFRESH_KEYS.TASK_LIST);
    triggerRefresh(REFRESH_KEYS.TIMESHEET_LIST);
  }, [triggerRefresh]);

  const logTime = useCallback(
    (task: TaskEntry) => {
      if (!canLogTime || task.is_group === 1) return;

      openTimesheetForm({
        title: "Log Time",
        subtitle: `Logging time for ${task.subject}`,
        prefillTask: toPrefillTask(task),
        onSuccess: refreshAfterLog,
      });
    },
    [canLogTime, openTimesheetForm, toPrefillTask, refreshAfterLog],
  );

  const logSelected = useCallback(() => {
    if (!canLogTime) return;
    const picked = pickedTasks.filter((t) => t.is_group !== 1);
    if (picked.length === 0) return;

    openTimesheetForm({
      title: "Log Time",
      subtitle: `Logging time for ${picked.length} task${
        picked.length > 1 ? "s" : ""
      }`,
      prefillTasks: picked.map(toPrefillTask),
      onSuccess: () => {
        clearSelection();
        refreshAfterLog();
      },
    });
  }, [
    canLogTime,
    pickedTasks,
    openTimesheetForm,
    toPrefillTask,
    clearSelection,
    refreshAfterLog,
  ]);

  return { logTime, logSelected };
};