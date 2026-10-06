import { useEffect, useRef, useState } from "react";
import { getTimesheetById } from "../../../../api/project/timesheet/timesheet.api";
import { showApiError } from "../../../../utils/alert";
import type {
  PrefillEmployee,
  PrefillTask,
  TimesheetModalState,
} from "../../../../types/Project_Management/Timesheet/form/Timesheetformmodal";

export const useTimesheetDetail = (
  isOpen: boolean,
  timesheetId: string | undefined,
  loadFromDetail: TimesheetModalState["loadFromDetail"],
) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !timesheetId) return;
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const detail = await getTimesheetById(timesheetId);
        if (!cancelled && detail) loadFromDetail(detail);
      } catch (e) {
        if (!cancelled) showApiError(e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, timesheetId, loadFromDetail]);

  return isLoading;
};

interface PrefillParams {
  isOpen: boolean;
  timesheetId?: string;
  prefillTask?: PrefillTask;
  prefillTasks?: PrefillTask[];
  prefillDate?: string;
  prefillEmployee?: PrefillEmployee;
  addLine: TimesheetModalState["addLine"];
  addLines: TimesheetModalState["addLines"];
  setEmployee: TimesheetModalState["setEmployee"];
}

export const useTimesheetPrefill = ({
  isOpen,
  timesheetId,
  prefillTask,
  prefillTasks,
  prefillDate,
  prefillEmployee,
  addLine,
  addLines,
  setEmployee,
}: PrefillParams) => {
  const appliedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      appliedRef.current = false;
      return;
    }
    if (timesheetId || appliedRef.current) return;

    const items = prefillTasks?.length
      ? prefillTasks
      : prefillTask
        ? [prefillTask]
        : [];
    if (items.length === 0 && !prefillDate) return;

    appliedRef.current = true;

    if (prefillEmployee) {
      setEmployee(prefillEmployee.id, {
        label: prefillEmployee.name,
        value: prefillEmployee.id,
      });
    }

    if (items.length === 0) {
      addLine(undefined, prefillDate);
      return;
    }

    addLines(
      items.map((p) => ({
        project: p.project,
        project_name: p.projectName,
        task: p.task,
        task_name: p.taskName,
      })),
      prefillDate,
    );
  }, [
    isOpen,
    prefillTask,
    prefillTasks,
    prefillDate,
    prefillEmployee,
    timesheetId,
    addLine,
    addLines,
    setEmployee,
  ]);
};