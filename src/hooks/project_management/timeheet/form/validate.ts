import type {
  TimesheetFormState,
  TimesheetLineDraft,
} from "../../../../types/Project_Management/Timesheet/form/timesheetForm.types";

export const OVERLAP_MSG =
  "This time slot overlaps with another entry. Please choose a different time.";

export interface ProjectRange {
  start?: string | null;
  end?: string | null;
}

export function isWithinProjectRange(
  range: ProjectRange | undefined,
  date: string,
  toDate: string,
): boolean {
  if (!range) return true;
  if (range.start && date && date < range.start) return false;
  if (range.end && toDate && toDate > range.end) return false;
  return true;
}

export function formatRangeMsg(range: ProjectRange): string {
  if (range.start && range.end) {
    return `Time can only be logged between ${range.start} and ${range.end} for the selected project.`;
  }
  if (range.start) {
    return `Time can only be logged on or after ${range.start} for the selected project.`;
  }
  return `Time can only be logged on or before ${range.end} for the selected project.`;
}

type ValidationRestrictions = {
  employee?: {
    id: string;
    name: string;
  };
};

type ValidationOptions = {
  form: TimesheetFormState;
  title: string;
  restrictions?: ValidationRestrictions;
  getConflictingLineIds: (lines: TimesheetLineDraft[]) => Set<string>;
  getProjectRange?: (projectId: string) => ProjectRange | undefined;
};

export function validateTimesheet({
  form,
  title,
  restrictions,
  getConflictingLineIds,
  getProjectRange,
}: ValidationOptions): string | null {
  if (!title.trim()) {
    return "Timesheet title is required.";
  }

  if (!form.employee && !restrictions?.employee?.id) {
    return "Please select an employee.";
  }

  if (!form.custom_timesheet_start_date || !form.custom_timesheet_end_date) {
    return "Please select the timesheet period.";
  }

  if (form.custom_timesheet_start_date > form.custom_timesheet_end_date) {
    return "Timesheet period end date cannot be before start date.";
  }

  if (form.lines.length === 0) {
    return "Add at least one time entry.";
  }

  for (let i = 0; i < form.lines.length; i++) {
    const line = form.lines[i];
    const row = i + 1;

    if (!line.project) {
      return `Please select a project in entry ${row}.`;
    }

    // if (!line.task) {
    //   return `Please select a task in entry ${row}.`;
    // }

    // if (!line.activity_type) {
    //   return `Activity Type is required in entry ${row}.`;
    // }

    if (!line.date || !line.to_date) {
      return `Please select dates in entry ${row}.`;
    }

    if (!line.from_time || !line.to_time) {
      return `Please select start and end times in entry ${row}.`;
    }

    if (line.to_date < line.date) {
      return `End date cannot be before start date in entry ${row}.`;
    }

    const range = getProjectRange?.(line.project);
    if (range && !isWithinProjectRange(range, line.date, line.to_date)) {
      return `Entry ${row}: ${formatRangeMsg(range)}`;
    }

    if (line.hours <= 0) {
      return `Entry ${row} must have a duration greater than zero.`;
    }

    // if (line.hours > 24) {
    //   return `Entry ${row} cannot exceed 24 hours.`;
    // }
  }

  // if (getConflictingLineIds(form.lines).size > 0) {
  //   return OVERLAP_MSG;
  // }

  return null;
}