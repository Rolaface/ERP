import { useCallback, useMemo, useState } from "react";
import { useDayOffs } from "../../../../hooks/project_management/timeheet/useDayOffs";
import { showDayOffToast } from "../../../../utils/alert";
import type { DayOff } from "../../../../views/project_management/timesheet/components/dayOff.types";
import type { DateRange, TimesheetForm } from "../../../../types/Project_Management/Timesheet/form/Timesheetformmodal";
import {
  dayOffLabel,
  formatDateLabel,
  getLinesRange,
} from "../../../../utils/project_management/timehseet/Timesheetformmodal.utils";

interface Params {
  lines: TimesheetForm["lines"];
  employee: TimesheetForm["employee"];
  employeeName: TimesheetForm["employee_name"];
  fallbackDate?: string;
  isEmployee: boolean;
}

export const useTimesheetDayOffs = ({
  lines,
  employee,
  employeeName,
  fallbackDate,
  isEmployee,
}: Params) => {
  const [pickerRange, setPickerRange] = useState<DateRange | null>(null);

  const onMonthChange = useCallback(
    (from: string, to: string) =>
      setPickerRange((prev) =>
        prev && prev.from === from && prev.to === to ? prev : { from, to },
      ),
    [],
  );

  const resetPickerRange = useCallback(() => setPickerRange(null), []);

  const range = useMemo(
    () => getLinesRange(lines, fallbackDate, pickerRange),
    [lines, fallbackDate, pickerRange],
  );

  const dayOffs = useDayOffs(range.from, range.to, !isEmployee);

  const getDayOff = useCallback(
    (date: string): DayOff | undefined => {
      if (!date) return undefined;
      const holiday = dayOffs.holidayOn(date);
      if (holiday) return holiday;
      if (isEmployee) return dayOffs.leaveOn(date);
      return (
        (employee ? dayOffs.leaveOn(date, employee) : undefined) ??
        (employeeName ? dayOffs.leaveOn(date, employeeName) : undefined)
      );
    },
    [dayOffs, isEmployee, employee, employeeName],
  );

  const anyDayOff = lines.some(
    (l) => getDayOff(l.date) ?? getDayOff(l.to_date),
  );

  const warnIfDayOff = useCallback(
    (date: string, toDate: string) => {
      const startOff = getDayOff(date);
      const off = startOff ?? (toDate !== date ? getDayOff(toDate) : undefined);
      if (!off) return;
      showDayOffToast({
        dateLabel: formatDateLabel(startOff ? date : toDate),
        kind: off.kind,
        label: dayOffLabel(off),
        halfDay: off.halfDay,
        who: isEmployee ? undefined : employeeName || undefined,
      });
    },
    [getDayOff, isEmployee, employeeName],
  );

  return { getDayOff, anyDayOff, warnIfDayOff, onMonthChange, resetPickerRange };
};