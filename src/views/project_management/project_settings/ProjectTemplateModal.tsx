import React, { useState } from "react";
import { Copy, FileText, Plus, Trash2 } from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import ModalFooter from "../../../components/common/ModalFooter";
import {
  showApiError,
  showSuccess,
  showValidationError,
} from "../../../utils/alert";
import {
  CheckboxField,
  Field,
  ModalTabs,
  SelectInput,
  TextInput,
  useModalForm,
  useModalId,
  usePmLinkOptions,
} from "./PmModalParts";

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

const TABS = [
  { id: "details", label: "Details" },
] as const;

type TabId = (typeof TABS)[number]["id"];

let rowSeq = 1; // row 1 is the initial row
const newRow = (): TaskRow => ({ id: ++rowSeq, task: "", subject: "" });

const ProjectTemplateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const modalId = useModalId("project-template-create");
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);

  const projectTypeOptions = usePmLinkOptions("Project Type");

  const { values, set, reset, confirmClose } = useModalForm({
    name: "",
    projectType: "",
    disabled: false,
    tasks: [{ id: 1, task: "", subject: "" }] as TaskRow[],
  });

  const handleClose = confirmClose(onClose);

  /* ── task table helpers ── */
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

  /* ── save ── */
  const handleSave = async () => {
    if (submitting) return;

    if (!values.name.trim()) {
      setActiveTab("details");
      showValidationError("Name is required");
      return;
    }

    // ignore fully empty rows; a row with a subject but no task title is invalid
    const tasks = values.tasks.filter((r) => r.task.trim() || r.subject.trim());
    const bad = tasks.findIndex((r) => !r.task.trim());
    if (bad >= 0) {
      setActiveTab("details");
      showValidationError(`Task is required in row ${bad + 1}`);
      return;
    }

    try {
      setSubmitting(true);
      // TODO: API → create "Project Template"
      // await createProjectTemplate({
      //   name: values.name.trim(),
      //   project_type: values.projectType,
      //   disabled: values.disabled ? 1 : 0,
      //   tasks: tasks.map(({ task, subject }) => ({ task, subject })),
      // });
      showSuccess("Project Template saved successfully");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      showApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const onReset = () => {
    reset();
    setSelected([]);
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
          onReset={onReset}
          onSave={handleSave}
          currentTab={TABS.findIndex((t) => t.id === activeTab)}
          totalTabs={TABS.length}
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
        <ModalTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
          {activeTab === "details" && (
            <div className="flex flex-col gap-3">
              {/* Name / Project Type / Disabled */}
              <div className="flex flex-wrap items-end gap-3">
                <Field label="Name" required className="w-full sm:w-[240px]">
                  <TextInput
                    name="name"
                    value={values.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Enter template name..."
                  />
                </Field>

                <Field label="Project Type" className="w-full sm:w-[240px]">
                  <SelectInput
                    value={values.projectType}
                    onChange={(v) => set("projectType", v)}
                    options={projectTypeOptions}
                    placeholder="Select Project Type..."
                  />
                </Field>

                <div className="h-8 flex items-center">
                  <CheckboxField
                    label="Disabled"
                    checked={values.disabled}
                    onChange={(v) => set("disabled", v)}
                  />
                </div>
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
                        <tr key={row.id} className="border-b border-theme last:border-0">
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
                            <TextInput
                              value={row.task}
                              onChange={(e) =>
                                updateRow(row.id, { task: e.target.value })
                              }
                              placeholder="Task title"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <TextInput
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
          )}

          
        </div>
      </form>
    </MinimizableModal>
  );
};

export default ProjectTemplateModal;