import React from "react";
import { MoreVertical } from "lucide-react";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import {
  fetchActivityTypeOptions,
  fetchTaskOptions,
} from "../../../hooks/project_management/timeheet/form/useTimesheetModal";
import type { DayOff } from "../../../views/project_management/timesheet/components/dayOff.types";
import DateTimeRangePicker from "../../calendar/DateTimeRangePicker";
import DayOffBadge from "./Dayoffbadge";
import type {
  FetchProjects,
  RowHandlers,
  TimesheetLine,
} from "../../../types/Project_Management/Timesheet/form/Timesheetformmodal";
import {
  dayOffColor,
  dayOffLabel,
  dayOffLetter,
} from "../../../utils/project_management/timehseet/Timesheetformmodal.utils";

interface TimesheetRowProps {
  line: TimesheetLine;
  hasHeaderProject: boolean;
  isEmployee: boolean;
  isConflict: boolean;
  isSelected: boolean;
  getDayOff: (date: string) => DayOff | undefined;
  fetchProjects: FetchProjects;
  handlers: RowHandlers;
  onToggle: (id: string) => void;
  onMonthChange: (from: string, to: string) => void;
}

const rowTone = (isConflict: boolean, isSelected: boolean) =>
  isConflict ? "bg-danger/10" : isSelected ? "bg-primary/5" : "";

const CheckboxCell: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ checked, onChange }) => (
  <td className="p-2 text-center">
    <div className="flex h-9 items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  </td>
);

const TimesheetRow: React.FC<TimesheetRowProps> = ({
  line,
  hasHeaderProject,
  isEmployee,
  isConflict,
  isSelected,
  getDayOff,
  fetchProjects,
  handlers,
  onToggle,
  onMonthChange,
}) => {
  const off = getDayOff(line.date) ?? getDayOff(line.to_date);

  return (
    <tr
      className={`align-top hover:bg-app/40 transition-colors ${rowTone(isConflict, isSelected)}`}
    >
      <CheckboxCell checked={isSelected} onChange={() => onToggle(line.id)} />

      {!hasHeaderProject && (
        <td className="p-2 ts-field min-w-0">
          <SearchSelect2
            label=""
            value={line.project_name}
            fetchOptions={fetchProjects}
            onChange={(val, opt) => handlers.onProject(line.id, val, opt)}
            placeholder="Project"
          />
        </td>
      )}

      <td className="p-2 ts-field min-w-0">
        <SearchSelect2
          label=""
          value={line.task_name}
          disabled={!line.project}
          fetchOptions={(q) => fetchTaskOptions(line.project, q)}
          onChange={(val, opt) => handlers.onTask(line.id, val, opt)}
          placeholder={line.project ? "Task" : "Select project first"}
        />
      </td>

      <td className="p-2 align-top min-w-0">
        <textarea
          value={line.description}
          onChange={(e) =>
            handlers.onUpdate(line.id, { description: e.target.value })
          }
          placeholder="What did you work on?"
          rows={1}
          className="block w-full min-w-0 max-w-full h-9 min-h-[36px] max-h-[200px] resize-y box-border px-2 py-2 leading-tight text-xs rounded-md border border-theme bg-app text-main placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary overflow-auto"
        />
      </td>

      <td className="p-2 ts-field min-w-0">
        <SearchSelect2
          label=""
          value={line.activity_type}
          fetchOptions={fetchActivityTypeOptions}
          onChange={(value, opt) => handlers.onActivity(line.id, value, opt)}
          placeholder="Activity Type"
        />
      </td>

      <td className="p-2 min-w-0">
        <div className={`relative ts-picker ${off ? "ts-has-off" : ""}`}>
          <DateTimeRangePicker
            date={line.date}
            to_date={line.to_date}
            from_time={line.from_time}
            to_time={line.to_time}
            getDayOff={getDayOff}
            onMonthChange={onMonthChange}
            onApply={(date, from, to, toDate) =>
              handlers.onApplyTime(line.id, date, from, to, toDate)
            }
          />
          {off && (
            <DayOffBadge
              letter={`${dayOffLetter(off)}${off.halfDay ? "½" : ""}`}
              color={dayOffColor(off)}
              title={`${dayOffLabel(off)}${off.halfDay ? " (Half day)" : ""}`}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
            />
          )}
        </div>
      </td>

      <td className="p-2">
        <span className="inline-flex h-9 min-w-[56px] items-center justify-center rounded-md bg-primary/10 px-3 font-mono text-xs font-bold text-primary">
          {line.hours.toFixed(1)}h
        </span>
      </td>

      {!isEmployee && (
        <CheckboxCell
          checked={line.is_billable}
          onChange={(is_billable) => handlers.onUpdate(line.id, { is_billable })}
        />
      )}

      <CheckboxCell
        checked={line.is_completed}
        onChange={(is_completed) =>
          handlers.onUpdate(line.id, { is_completed })
        }
      />

      <td className="p-2 text-center">
        <button
          ref={(el) => handlers.registerTrigger(line.id, el)}
          onClick={() => handlers.onToggleActions(line.id)}
          className="inline-flex h-9 w-9 items-center justify-center hover:bg-app rounded border border-theme text-muted hover:text-main transition-colors"
          title="Row actions"
        >
          <MoreVertical size={14} />
        </button>
      </td>
    </tr>
  );
};

export default TimesheetRow;