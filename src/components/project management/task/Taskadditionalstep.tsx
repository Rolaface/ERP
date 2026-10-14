import React, { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import type {
  SetTaskFieldHandler,
  TaskFormOptions,
  TaskFormValues,
} from "../../../types/Project_Management/task/modal/Taskformmodal.types";
import { ModalSelect } from "../../../components/ui/modal/modalComponent";

interface TaskAdditionalStepProps {
  values: TaskFormValues;
  options: TaskFormOptions;
  onChange: SetTaskFieldHandler;
}

const ROW_GRID =
  "grid min-w-[640px] grid-cols-[44px_minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.5fr)_44px] items-center";
const READONLY_CELL = "truncate px-3 py-2 text-xs text-muted";

const TaskAdditionalStep: React.FC<TaskAdditionalStepProps> = ({
  values,
  options,
  onChange,
}) => {
  const rows = values.dependsOn;

  const projectLabel = useMemo(
    () => options.projects.find((p) => p.value === values.project)?.label ?? "",
    [options.projects, values.project],
  );

  const labelByValue = useMemo(
    () => new Map(options.dependencyTasks.map((t) => [t.value, t.label])),
    [options.dependencyTasks],
  );

  const rowOptions = (current: string) =>
    options.dependencyTasks.filter(
      (t) => t.value === current || !rows.includes(t.value),
    );

  const canAdd =
    !rows.includes("") && rows.length < options.dependencyTasks.length;

  const updateRow = (index: number, value: string) =>
    onChange(
      "dependsOn",
      rows.map((r, i) => (i === index ? value : r)),
    );

  const removeRow = (index: number) =>
    onChange(
      "dependsOn",
      rows.filter((_, i) => i !== index),
    );

  const addRow = () => onChange("dependsOn", [...rows, ""]);

  return (
    <div className="space-y-3 rounded-lg border border-theme bg-card px-4 py-3 sm:px-5">
      <div className="flex items-baseline justify-between border-b border-theme pb-1">
        <h5 className="text-[13px] font-semibold text-main">Dependent Tasks</h5>
        <span className="text-[11px] text-muted">{rows.length} added</span>
      </div>

      {!values.project ? (
        <p className="rounded-md border border-dashed border-theme px-3 py-6 text-center text-xs text-muted">
          Select a project in Task Details to add dependent tasks.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border border-theme">
            <div
              className={`${ROW_GRID} border-b border-theme bg-app text-[11px] font-medium text-muted`}
            >
              <span className="px-3 py-2">No.</span>
              <span className="px-3 py-2">Task</span>
              <span className="px-3 py-2">Subject</span>
              <span className="px-3 py-2">Project</span>
              <span />
            </div>

            {rows.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-muted">
                No dependent tasks added.
              </p>
            )}

            {rows.map((row, index) => (
              <div
                key={index}
                className={`${ROW_GRID} border-b border-theme last:border-b-0`}
              >
                <span className="px-3 py-2 text-xs text-muted">{index + 1}</span>
                <div className="min-w-0 px-2 py-1.5">
                  <ModalSelect
                    label=""
                    name={`dependsOn-${index}`}
                    placeholder="Select task"
                    value={row}
                    options={rowOptions(row)}
                    onChange={(e) => updateRow(index, e.target.value)}
                  />
                </div>
                <span className={READONLY_CELL}>
                  {row ? labelByValue.get(row) : ""}
                </span>
                <span className={READONLY_CELL}>{row ? projectLabel : ""}</span>
                <button
                  type="button"
                  aria-label={`Remove dependency ${index + 1}`}
                  onClick={() => removeRow(index)}
                  className="flex h-8 w-8 items-center justify-center justify-self-center rounded-md text-muted transition-colors hover:bg-app hover:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            disabled={!canAdd}
            className="inline-flex items-center gap-1.5 rounded-md bg-app px-3 py-1.5 text-xs font-medium text-main transition-colors hover:bg-card disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={14} />
            Add row
          </button>
        </>
      )}
    </div>
  );
};

export default TaskAdditionalStep;