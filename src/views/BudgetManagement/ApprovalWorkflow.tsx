import React, { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import Table from "../../components/ui/Table/Table";
import ActionButton from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import { ModalInput } from "../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../components/ui/modal/SearchSelect2";
import { usePermission } from "../../hooks/permission/usePermission";
import { showSuccess } from "../../utils/alert";
import { FormModal, Field, inputCls, staticFetcher, useLocalTable, formatDate, today, fmt, ROLES, WORKFLOWS, type Workflow } from "./sharedbudget";

const MODULE = "Budget Head";
const APPLIES_TO: Workflow["appliesTo"][] = ["Budget plan", "Transfer", "Supplementary"];

const ApprovalWorkflow: React.FC = () => {
  const { can } = usePermission();
  const [rows, setRows] = useState<Workflow[]>(WORKFLOWS);
  const [editing, setEditing] = useState<Workflow | null>(null);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [appliesTo, setAppliesTo] = useState<Workflow["appliesTo"]>("Budget plan");
  const [steps, setSteps] = useState<{ role: string; above: string }[]>([]);

  const { tableProps } = useLocalTable(rows, {
    searchKeys: ["name", "appliesTo"],
    sortBy: "updatedAt",
    filters: [{ key: "appliesTo", label: "Applies to", options: APPLIES_TO.map((v) => ({ label: v, value: v })) }],
  });

  const openForm = (w: Workflow | null) => {
    setEditing(w);
    setName(w?.name ?? "");
    setAppliesTo(w?.appliesTo ?? "Budget plan");
    setSteps(w ? w.steps.map((s) => ({ role: s.role, above: s.above ? String(s.above) : "" })) : [{ role: "Head of Finance", above: "" }]);
    setOpen(true);
  };

  const save = () => {
    const data: Workflow = {
      id: editing?.id ?? `WF-${Date.now()}`,
      name: name.trim(),
      appliesTo,
      steps: steps.map((s) => ({ role: s.role, above: Number(s.above) || 0 })),
      updatedAt: today(),
    };
    setRows((p) => (editing ? p.map((w) => (w.id === data.id ? data : w)) : [data, ...p]));
    showSuccess(editing ? "Workflow updated" : "Workflow created");
    setOpen(false);
  };

  const columns: Column<Workflow>[] = useMemo(
    () => [
      { key: "name", header: "Workflow", align: "left", sortable: true, render: (w) => <div className="py-1.5 font-medium">{w.name}</div> },
      { key: "appliesTo", header: "Applies to", align: "left", sortable: true, render: (w) => <div className="py-1.5">{w.appliesTo}</div> },
      {
        key: "steps",
        header: "Approval steps",
        align: "left",
        render: (w) => (
          <div className="flex flex-wrap items-center gap-1 py-1.5">
            {w.steps.map((s, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-muted">→</span>}
                <span className="rounded-full bg-[var(--border)]/30 px-2 py-0.5 text-xs">
                  {s.role}
                  {s.above > 0 && <span className="text-muted"> · above ₹{fmt(s.above)}</span>}
                </span>
              </React.Fragment>
            ))}
          </div>
        ),
      },
      { key: "updatedAt", header: "Last updated", align: "center", sortable: true, render: (w) => <div className="py-1.5">{formatDate(w.updatedAt)}</div> },
      {
        key: "actions",
        header: "Actions",
        align: "center",
        render: (w) => (
          <div className="flex justify-center">
            <ActionButton type="edit" iconOnly title="Edit workflow" onClick={(e) => { e?.stopPropagation(); openForm(w); }} />
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        rowKey={(r) => r.id}
        tableId="budget-workflows"
        loading={false}
        isFetching={false}
        showToolbar
        enableAdd={can(MODULE, "create")}
        addLabel="Add Workflow"
        onAdd={() => openForm(null)}
        enableColumnSelector
        enableExport={false}
        {...tableProps}
      />

      {open && (
        <FormModal title={editing ? "Edit workflow" : "Add workflow"} submitLabel={editing ? "Save changes" : "Add workflow"} onClose={() => setOpen(false)} onSubmit={save} wide>
          <div className="grid grid-cols-2 items-start gap-4">
            <ModalInput label="Workflow name" name="wfName" value={name} onChange={(e) => setName(e.target.value)} required placeholder="For example: Standard plan approval" />
            <SearchSelect2 label="Applies to" required value={appliesTo} onChange={(v) => setAppliesTo((v as Workflow["appliesTo"]) || "Budget plan")} fetchOptions={staticFetcher(APPLIES_TO)} placeholder="Select" />
          </div>

          <Field label="Approval steps (in order)">
            <div className="flex flex-col gap-2">
              {steps.map((s, i) => (
                <div key={i} className="grid grid-cols-[28px_1fr_180px_28px] items-center gap-2">
                  <span className="text-center text-xs text-muted">{i + 1}</span>
                  <select value={s.role} onChange={(e) => setSteps((p) => p.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))} className={inputCls} aria-label={`Step ${i + 1} role`}>
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                  <input
                    type="number"
                    min={0}
                    value={s.above}
                    onChange={(e) => setSteps((p) => p.map((x, j) => (j === i ? { ...x, above: e.target.value } : x)))}
                    placeholder="Applies above ₹ (optional)"
                    aria-label={`Step ${i + 1} threshold`}
                    className={`${inputCls} text-right`}
                  />
                  <button type="button" aria-label="Remove step" onClick={() => setSteps((p) => p.filter((_, j) => j !== i))} className="text-muted hover:text-danger">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSteps((p) => [...p, { role: "Head of Finance", above: "" }])}
                className="inline-flex w-fit items-center gap-1 text-sm text-primary hover:underline"
              >
                <Plus size={14} /> Add step
              </button>
            </div>
          </Field>
        </FormModal>
      )}
    </div>
  );
};

export default ApprovalWorkflow;