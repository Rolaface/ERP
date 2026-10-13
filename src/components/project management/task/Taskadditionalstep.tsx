

import React from "react";
import type {
  SetTaskFieldHandler,
  TaskFieldKey,
  TaskFlag,
  TaskFormValues,
} from "../../../types/Project_Management/task/modal/Taskformmodal.types";
import { TASK_FLAG_OPTIONS } from "../../../utils/project_management/task/Taskformmodal.utils";
import { noop } from "../../../utils/project_management/project/Projectformmodal.utils";
import { ModalInput, ToggleSwitch } from "../../../components/ui/modal/modalComponent";

interface TaskAdditionalStepProps {
  values: TaskFormValues;
  getFieldError: (key: TaskFieldKey) => string | undefined;
  onChange: SetTaskFieldHandler;
}

const TaskAdditionalStep: React.FC<TaskAdditionalStepProps> = ({
  values,
  getFieldError,
  onChange,
}) => (
  <div className="space-y-5 rounded-lg border border-theme bg-card px-5 py-4">
    <section>
      <div className="mb-3 flex items-baseline justify-between border-b border-theme pb-1.5">
        <h5 className="text-[13px] font-semibold text-main">Task settings</h5>
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-3">
        <ToggleSwitch
          name="isGroup"
          label="Is Group"
          checked={false}
          onChange={noop}
          options={TASK_FLAG_OPTIONS}
          value={String(values.isGroup)}
          onValueChange={(v) => onChange("isGroup", Number(v) as TaskFlag)}
        />
        </div>
        <div className="lg:col-span-3">
        <ToggleSwitch
          name="isMilestone"
          label="Is Milestone"
          checked={false}
          onChange={noop}
          options={TASK_FLAG_OPTIONS}
          value={String(values.isMilestone)}
          onValueChange={(v) => onChange("isMilestone", Number(v) as TaskFlag)}
        />
        </div>
        <div className="lg:col-span-3">
        <ModalInput
          label="Task Weight"
          name="taskWeight"
          type="number"
          min={0}
          placeholder="0"
          value={values.taskWeight}
          error={getFieldError("taskWeight")}
          onChange={(e) => onChange("taskWeight", e.target.value)}
        />
        </div>
      </div>
    </section>
  </div>
);

export default TaskAdditionalStep;