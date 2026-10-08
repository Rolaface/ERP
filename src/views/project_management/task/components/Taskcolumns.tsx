import { Clock } from "lucide-react";

import type { ColumnDef } from "@tanstack/react-table";

import DateDisplay from "../../../../components/UI_Utils/Datedisplay";

import ActionButton, {
  ActionGroup,
} from "../../../../components/ui/Table/ActionButton";

import { parseAssignedEmails } from "../../../../api/project/task/taskapi";

import type { TaskEntry } from "../../../../types/Project_Management/task/table/Task.types";

import AssigneeCell from "./AssigneeCell";
import PriorityChip from "./PriorityChip";
import StatusCell from "./StatusCell";

import { STATUS_CELL_OPTIONS, type TaskRow } from "./Tasktable.config";
import { fetchProjectAssigneeOptions } from "./Taskoptionfetchers";

import {
  GroupCheckbox,
  ProgressBar,
  TaskTreeCell,
} from "./Tasktreeparts";

export interface TaskSelectionApi {
  enabled: boolean;
  isSelected: (t: TaskEntry) => boolean;
  onToggle: (t: TaskEntry) => void;
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: () => void;
}

interface TaskColumnsContext {
  expanded: Set<string>;
  loadingGroups: Set<string>;
  childrenMap: Record<string, TaskEntry[]>;
  assigneeActive: boolean;
  canWriteTask: boolean;
  canLogTime: boolean;
  selection: TaskSelectionApi;
  getProjectDisplayName: (code: string | null) => string;
  onToggleGroup: (name: string) => void;
  onView: (name: string) => void;
  onStatusChange: (
    name: string,
    status: string,
    progress?: number,
  ) => Promise<unknown>;
  onAssigneesChange: (
    name: string,
    emails: string[],
  ) => Promise<void>;
  onLogTime: (task: TaskEntry) => void;
}

export const buildTaskColumns = (
  ctx: TaskColumnsContext,
): ColumnDef<TaskRow>[] => [
  {
    id: "select",
    size: 40,
    minSize: 40,
    maxSize: 40,
    enableSorting: false,
    enableHiding: false,
    meta: {
      cellClassName: "pl-3 pr-1 py-1.5",
      stickyLeft: 0,
    },
    header: () =>
      ctx.selection.enabled ? (
        <GroupCheckbox
          checked={ctx.selection.allSelected}
          indeterminate={
            ctx.selection.someSelected && !ctx.selection.allSelected
          }
          onChange={ctx.selection.onToggleAll}
          label="Select all"
        />
      ) : null,
    cell: ({ row }) => {
      const t = row.original;

      if (t.is_group !== 1 || !ctx.selection.enabled) {
        return null;
      }

      const kids = ctx.childrenMap[t.name] ?? [];
      const picked = kids.filter((k) =>
        ctx.selection.isSelected(k),
      ).length;

      const checked =
        ctx.selection.isSelected(t) ||
        (kids.length > 0 && picked === kids.length);

      const indeterminate = !checked && picked > 0;

      return (
        <GroupCheckbox
          checked={checked}
          indeterminate={indeterminate}
          onChange={() => ctx.selection.onToggle(t)}
          label={`Select ${t.subject}`}
        />
      );
    },
  },

  {
    id: "subject",
    header: "Task",
    size: 300,
    minSize: 220,
    enableHiding: false,
    meta: {
      align: "left",
      cellClassName: "p-0",
      stickyLeft: 40,
    },
    cell: ({ row }) => {
      const t = row.original;

      return (
        <TaskTreeCell
          name={t.subject}
          taskId={t.name}
          description={
            (t as { description?: string | null }).description
          }
          isGroup={t.is_group === 1}
          depth={t._depth}
          guides={t._guides}
          isLast={t._isLast}
          expanded={ctx.expanded.has(t.name)}
          loading={ctx.loadingGroups.has(t.name)}
          childCount={ctx.childrenMap[t.name]?.length}
          showToggle={t.is_group === 1 && !ctx.assigneeActive}
          onToggle={() => ctx.onToggleGroup(t.name)}
          selectable={ctx.selection.enabled}
          selected={ctx.selection.isSelected(t)}
          onSelect={() => ctx.selection.onToggle(t)}
          onView={() => ctx.onView(t.name)}
        />
      );
    },
  },

  {
    id: "priority",
    header: "Priority",
    size: 82,
    minSize: 75,
    maxSize: 90,
    meta: {
      align: "left",
    },
    cell: ({ row }) => (
      <PriorityChip priority={row.original.priority} />
    ),
  },

  {
    id: "project",
    header: "Project",
    size: 95,
    minSize: 80,
    maxSize: 110,
    meta: {
      align: "left",
    },
    cell: ({ row }) => (
      <span className="block max-w-full truncate text-xs font-medium text-main">
        {ctx.getProjectDisplayName(row.original.project)}
      </span>
    ),
  },

  {
    id: "exp_end_date",
    header: "Due Date",
    size: 105,
    minSize: 90,
    maxSize: 115,
    meta: {
      align: "left",
    },
    cell: ({ row }) =>
      row.original.exp_end_date ? (
        <DateDisplay
          date={row.original.exp_end_date}
          className="whitespace-nowrap text-xs text-muted"
        />
      ) : (
        <span className="text-xs text-muted">—</span>
      ),
  },

  {
    id: "status",
    header: "Status",
    size: 115,
    minSize: 105,
    maxSize: 125,
    meta: {
      align: "left",
    },
    cell: ({ row }) => {
      const t = row.original;

      return (
        <StatusCell
          status={t.status}
          progress={t.progress ?? 0}
          options={STATUS_CELL_OPTIONS}
          disabled={!ctx.canWriteTask}
          onChange={(nextStatus, nextProgress) =>
            ctx.onStatusChange(
              t.name,
              nextStatus,
              nextProgress,
            )
          }
        />
      );
    },
  },

  {
    id: "_assign",
    header: "Assignees",
    size: 120,
    minSize: 100,
    maxSize: 135,
    enableSorting: false,
    meta: {
      align: "left",
    },
    cell: ({ row }) => {
      const t = row.original;

      if (
        t.status === "Completed" ||
        t.status === "Cancelled"
      ) {
        return (
          <span className="text-xs text-muted">
            —
          </span>
        );
      }

      return (
        <AssigneeCell
          emails={parseAssignedEmails(t._assign)}
          disabled={!ctx.canWriteTask || !t.project}
          fetchOptions={(q) =>
            fetchProjectAssigneeOptions(
              t.project ?? "",
              q,
            )
          }
          onChange={(nextValues) =>
            ctx.onAssigneesChange(
              t.name,
              nextValues,
            )
          }
        />
      );
    },
  },

  {
    id: "progress",
    header: "Progress",
    size: 125,
    minSize: 105,
    maxSize: 140,
    enableSorting: false,
    meta: {
      align: "left",
    },
    cell: ({ row }) => (
      <ProgressBar
        value={row.original.progress}
      />
    ),
  },

  {
    id: "actions",
    header: "Actions",
    size: 80,
    minSize: 70,
    maxSize: 90,
    enableSorting: false,
    enableHiding: false,
    meta: {
      align: "center",
    },
    cell: ({ row }) => {
      const t = row.original;

      return (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={() => ctx.onView(t.name)}
            iconOnly
          />

          {ctx.canLogTime && (
            <button
              type="button"
              onClick={() => ctx.onLogTime(t)}
              disabled={t.is_group === 1}
              className="rounded border border-theme p-1.5 text-muted transition-colors hover:bg-app hover:text-main disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted"
              title={
                t.is_group === 1
                  ? "Time can't be logged on a group task"
                  : "Log time"
              }
            >
              <Clock size={14} />
            </button>
          )}
        </ActionGroup>
      );
    },
  },
];