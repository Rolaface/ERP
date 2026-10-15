import React, { useState } from "react";
import { Copy, FileText, Plus, Trash2 } from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import ModalFooter from "../../../components/common/ModalFooter";
import {
  showApiError,
  showSuccess,
  showValidationError,
} from "../../../utils/alert";
import { ModalInput, ModalSelect, ToggleSwitch } from "../../../components/ui/modal/modalComponent";
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface TaskRow {
  id: number;
  task: string;
  subject: string;
}

interface FormValues {
  name: string;
  projectType: string;
  disabled: boolean;
  tasks: TaskRow[];
}

interface Option {
  label: string;
  value: string | number;
}

let rowSeq = 1; 
const newRow = (): TaskRow => ({ id: ++rowSeq, task: "", subject: "" });

const makeInitial = (): FormValues => ({
  name: "",
  projectType: "",
  disabled: false,
  tasks: [{ id: 1, task: "", subject: "" }],
});

const cellInputCls =
  "w-full h-7 py-1 px-2 border border-theme rounded text-[11px] text-main bg-card transition-all hover:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary";

const ProjectTemplateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const modalId = "project-template-create";
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [initial] = useState<FormValues>(makeInitial);
  const [values, setValues] = useState<FormValues>(initial);

  
  const projectTypeOptions: Option[] = [];

  const set = <K extends keyof FormValues>(key: K, v: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const reset = () => {
    setValues(makeInitial());
    setSelected([]);
  };

  const isDirty = JSON.stringify(values) !== JSON.stringify(initial);

  const handleClose = () => {
    if (isDirty && !window.confirm("Discard unsaved changes?")) return;
    reset();
    onClose();
  };

     const updateRow = (id: number, patch: Partial<TaskRow>) =>
    set(
      "tasks",
      values.tasks.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );

  const addRow = () => set("tasks", [...values.tasks, newRow()]);

  const duplicateRow = (id: number) => {
    const i = values.tasks.findIndex((r) => r.id === id);
    if (i < 0) return;
    const copy = { ...values.tasks[i], id: ++rowSeq };
    const next = [...values.tasks];
    next.splice(i + 1, 0, copy);
    set("tasks", next);
  };

  const removeRows = (ids: number[]) => {
    set(
      "tasks",
      values.tasks.filter((r) => !ids.includes(r.id)),
    );
    setSelected((prev) => prev.filter((id) => !ids.includes(id)));
  };

  const allSelected =
    values.tasks.length > 0 && selected.length === values.tasks.length;

  const toggleAll = () =>
    setSelected(allSelected ? [] : values.tasks.map((r) => r.id));

  const toggleOne = (id: number) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleSave = async () => {
    if (submitting) return;

    if (!values.name.trim()) {
      showValidationError("Name is required");
      return;
    }

    const tasks = values.tasks.filter((r) => r.task.trim() || r.subject.trim());
    const bad = tasks.findIndex((r) => !r.task.trim());
    if (bad >= 0) {
      showValidationError(`Task is required in row ${bad + 1}`);
      return;
    }

    try {
      setSubmitting(true);

      showSuccess("Project Template saved successfully");
      onSuccess?.();
      reset();
      onClose();
    } catch (error: any) {
      showApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={handleClose}
      title="New Project Template"
      subtitle="Add and manage project templates and default task lists"
      icon={FileText}
      footer={
        <ModalFooter
          onCancel={handleClose}
          onReset={reset}
          onSave={handleSave}
          currentTab={0}
          totalTabs={1}
          saving={submitting}
        />
      }
      maxWidth="full"
      height="520px"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="h-full flex flex-col"
        autoComplete="off"
      >
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-full sm:w-[240px]">
                <ModalInput
                  label="Name"
                  name="name"
                  required
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Enter template name..."
                  className="w-full"
                />
              </div>

              <div className="w-full sm:w-[240px]">
                <ModalSelect
                  label="Project Type"
                  value={values.projectType}
                  onChange={(e) => set("projectType", e.target.value)}
                  options={projectTypeOptions}
                  placeholder="Select Project Type..."
                  className="w-full"
                />
              </div>

              <ToggleSwitch
                name="disabled"
                label="Disabled"
                checked={values.disabled}
                onChange={(e) => set("disabled", e.target.checked)}
              />
            </div>

            {/* Tasks table */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <h3 className="text-[12px] font-semibold text-main">Tasks</h3>
                <span className="rounded-full bg-app px-1.5 text-[10px] text-muted">
                  {values.tasks.length}
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-theme bg-card">
                <table className="w-full min-w-[560px] text-xs">
                  <thead>
                    <tr className="border-b border-theme text-left text-[11px] text-muted">
                      <th className="w-9 px-2 py-1.5">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleAll}
                          className="h-3.5 w-3.5 accent-[var(--primary,#1e3a8a)]"
                        />
                      </th>
                      <th className="w-10 px-2 py-1.5 font-medium">#</th>
                      <th className="px-2 py-1.5 font-medium">
                        Task <span className="text-danger">*</span>
                      </th>
                      <th className="px-2 py-1.5 font-medium">Subject</th>
                      <th className="w-24 px-2 py-1.5 text-center font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {values.tasks.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-2 py-3 text-center text-muted"
                        >
                          No tasks yet. Click "Add row" to create one.
                        </td>
                      </tr>
                    )}
                    {values.tasks.map((row, i) => (
                      <tr
                        key={row.id}
                        className="border-b border-theme last:border-0"
                      >
                        <td className="px-2 py-1">
                          <input
                            type="checkbox"
                            checked={selected.includes(row.id)}
                            onChange={() => toggleOne(row.id)}
                            className="h-3.5 w-3.5 accent-[var(--primary,#1e3a8a)]"
                          />
                        </td>
                        <td className="px-2 py-1 text-muted">{i + 1}</td>
                        <td className="px-2 py-1">
                          <input
                            type="text"
                            className={cellInputCls}
                            value={row.task}
                            onChange={(e) =>
                              updateRow(row.id, { task: e.target.value })
                            }
                            placeholder="Task title"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="text"
                            className={cellInputCls}
                            value={row.subject}
                            onChange={(e) =>
                              updateRow(row.id, { subject: e.target.value })
                            }
                            placeholder="Task subject or details"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <div className="flex items-center justify-center gap-2 text-muted">
                            <button
                              type="button"
                              title="Duplicate row"
                              onClick={() => duplicateRow(row.id)}
                              className="hover:text-main"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              type="button"
                              title="Delete row"
                              onClick={() => removeRows([row.id])}
                              className="hover:text-danger"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addRow}
                    className="flex h-7 items-center gap-1 rounded-md bg-primary px-3 text-[11px] font-medium text-white hover:opacity-90"
                  >
                    <Plus size={12} />
                    Add row
                  </button>
                  {selected.length > 0 && (
                    <button
                      type="button"
                      onClick={() => removeRows(selected)}
                      className="flex h-7 items-center gap-1 rounded-md border border-theme px-3 text-[11px] text-danger hover:bg-app"
                    >
                      <Trash2 size={12} />
                      Delete ({selected.length})
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-muted">
                  Press Tab inside cell to jump to next input
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </MinimizableModal>
  );
};

export default ProjectTemplateModal;