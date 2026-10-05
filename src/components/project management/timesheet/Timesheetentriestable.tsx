import React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Trash2 } from "lucide-react";
import type { DayOff } from "../../../views/project_management/timesheet/components/dayOff.types";
import EntriesToolbar from "./Entriestoolbar";
import TimesheetRow from "./Timesheetrow";
import type {
  FetchProjects,
  RowHandlers,
  SortDir,
  TimesheetLine,
} from "../../../types/Project_Management/Timesheet/form/Timesheetformmodal";

const BASE_COLUMNS = 8;

const COL_CHECKBOX = "w-9";
const COL_TASK_WITH_HEADER_PROJECT = "w-[28%]";
const COL_DATE_TIME = "w-[24%]";
const COL_HOURS = "w-16";
const COL_BILLABLE = "w-16";
const COL_DONE = "w-14";
const COL_ACTIONS = "w-16";

interface SelectionState {
  selectedIds: Set<string>;
  allSelected: boolean;
  someSelected: boolean;
  toggleRow: (id: string) => void;
  toggleAll: () => void;
  deleteSelected: () => void;
}

interface SortState {
  sortDir: SortDir;
  toggleSort: () => void;
}

interface DayOffState {
  getDayOff: (date: string) => DayOff | undefined;
  anyDayOff: boolean;
  onMonthChange: (from: string, to: string) => void;
}

interface TimesheetEntriesTableProps {
  lines: TimesheetLine[];
  conflictIds: Set<string>;
  isEmployee: boolean;
  hasHeaderProject: boolean;
  selection: SelectionState;
  sort: SortState;
  dayOffs: DayOffState;
  fetchProjects: FetchProjects;
  handlers: RowHandlers;
  onAddRow: () => void;
}

const sortIcon = (dir: SortDir) =>
  dir === "asc" ? ArrowUp : dir === "desc" ? ArrowDown : ArrowUpDown;

const AddRowButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:opacity-90 text-primary-foreground rounded-lg text-xs font-semibold transition-opacity"
  >
    <Plus size={12} /> Add Row
  </button>
);

const EmptyState: React.FC<{ colSpan: number; onAddRow: () => void }> = ({
  colSpan,
  onAddRow,
}) => (
  <tr>
    <td colSpan={colSpan} className="p-10 text-center text-muted">
      <div className="flex flex-col items-center gap-2">
        <span className="text-2xl">📁</span>
        <span className="font-medium text-xs">No time entries yet</span>
        <span className="text-[11px] mb-1">
          Add your first row to start logging task hours.
        </span>
        <AddRowButton onClick={onAddRow} />
      </div>
    </td>
  </tr>
);

const TimesheetEntriesTable: React.FC<TimesheetEntriesTableProps> = ({
  lines,
  conflictIds,
  isEmployee,
  hasHeaderProject,
  selection,
  sort,
  dayOffs,
  fetchProjects,
  handlers,
  onAddRow,
}) => {
  const SortIcon = sortIcon(sort.sortDir);
  const columnCount =
    BASE_COLUMNS + (hasHeaderProject ? 0 : 1) + (isEmployee ? 0 : 1);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-card border border-theme rounded-xl overflow-hidden">
      <EntriesToolbar count={lines.length} showLegend={dayOffs.anyDayOff} />

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <table className="w-full table-fixed text-left text-xs border-collapse">
          <colgroup>
            <col className={COL_CHECKBOX} />
            {!hasHeaderProject && <col />}
            <col className={hasHeaderProject ? COL_TASK_WITH_HEADER_PROJECT : undefined} />
            <col />
            <col />
            <col className={COL_DATE_TIME} />
            <col className={COL_HOURS} />
            {!isEmployee && <col className={COL_BILLABLE} />}
            <col className={COL_DONE} />
            <col className={COL_ACTIONS} />
          </colgroup>

          <thead className="sticky top-0 bg-app z-10">
            <tr className="border-b border-theme text-xs text-muted font-semibold">
              <th className="p-2 text-center">
                <input
                  type="checkbox"
                  checked={selection.allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = selection.someSelected;
                  }}
                  onChange={selection.toggleAll}
                  disabled={lines.length === 0}
                />
              </th>
              {!hasHeaderProject && <th className="p-2">Project</th>}
              <th className="p-2">Task</th>
              <th className="p-2">Worked On</th>
              <th className="p-2">Activity Type</th>
              <th className="p-2">
                <button
                  onClick={sort.toggleSort}
                  className="inline-flex items-center gap-1 font-semibold hover:text-main transition-colors"
                  title="Sort by date & time"
                >
                  Date &amp; Time
                  <SortIcon size={11} />
                </button>
              </th>
              <th className="p-2">Hours</th>
              {!isEmployee && <th className="p-2 text-center">Billable</th>}
              <th className="p-2 text-center">Done</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-theme">
            {lines.length === 0 && (
              <EmptyState colSpan={columnCount} onAddRow={onAddRow} />
            )}
            {lines.map((line) => (
              <TimesheetRow
                key={line.id}
                line={line}
                hasHeaderProject={hasHeaderProject}
                isEmployee={isEmployee}
                isConflict={conflictIds.has(line.id)}
                isSelected={selection.selectedIds.has(line.id)}
                getDayOff={dayOffs.getDayOff}
                fetchProjects={fetchProjects}
                handlers={handlers}
                onToggle={selection.toggleRow}
                onMonthChange={dayOffs.onMonthChange}
              />
            ))}
          </tbody>
        </table>

        {lines.length > 0 && (
          <div className="p-3 flex items-center gap-2">
            <AddRowButton onClick={onAddRow} />
            {selection.selectedIds.size > 0 && (
              <button
                onClick={selection.deleteSelected}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 rounded-lg text-xs font-semibold transition-colors"
              >
                <Trash2 size={12} /> Delete ({selection.selectedIds.size})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimesheetEntriesTable;