import React from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Loader2,
} from "lucide-react";
import type { TaskRow } from "./Tasktable.config";
import TaskTreeGuides from "./Tasktreeguides";

interface TaskSubjectCellProps {
  task: TaskRow;
  isOpen: boolean;
  isLoading: boolean;
  childCount?: number;
  showToggle: boolean;
  onToggle: (name: string) => void;
  onOpen: (name: string) => void;
}

const TaskSubjectCell: React.FC<TaskSubjectCellProps> = ({
  task,
  isOpen,
  isLoading,
  childCount,
  showToggle,
  onToggle,
  onOpen,
}) => {
  const isGroup = task.is_group === 1;
  const isEmpty = isOpen && childCount === 0;
  const FolderIcon = isOpen ? FolderOpen : Folder;

  return (
    <div className="flex items-stretch">
      {task._depth > 0 && (
        <TaskTreeGuides guides={task._guides} isLast={task._isLast} />
      )}

      <span className="flex w-5 shrink-0 items-start justify-center pt-0.5">
        {showToggle && (
          <button
            type="button"
            aria-label={isOpen ? "Collapse group" : "Expand group"}
            aria-expanded={isOpen}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(task.name);
            }}
            className="flex h-5 w-5 items-center justify-center rounded text-muted transition-colors hover:bg-row-hover hover:text-main focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border)]"
          >
            {isLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : isOpen ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        )}
      </span>

      <div className="min-w-0 py-0.5 pl-1">
        <div className="flex items-center gap-1.5">
          {isGroup && <FolderIcon size={13} className="shrink-0 text-muted" />}
          <span
            title={task.subject}
            onClick={(e) => {
              e.stopPropagation();
              onOpen(task.name);
            }}
            className={`max-w-[22rem] cursor-pointer truncate text-xs text-main hover:underline ${
              isGroup ? "font-bold" : "font-medium"
            }`}
          >
            {task.subject}
          </span>
          {isGroup && childCount !== undefined && (
            <span className="shrink-0 rounded-full border border-theme px-1.5 text-[10px] font-medium text-muted">
              {childCount} {childCount === 1 ? "task" : "tasks"}
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] text-muted">{task.name}</span>
        {isEmpty && (
          <span className="ml-2 text-[10px] italic text-muted">
            No child tasks
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskSubjectCell;