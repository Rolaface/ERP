import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { ModalInput } from "../../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import { showApiError, showSuccess } from "../../../utils/alert";


// ─── Types ────────────────────────────────────────────────────────────────────

export type BudgetHeadStatus = "Active" | "Inactive";

export interface BudgetHeadDetail {
  id: string;
  headName: string;
  subHead: string;
  glCode: string;
  costCentre: string;
  programme: string;
  projectCode: string;
  instructions: string;
  status: BudgetHeadStatus;
}

interface BudgetHeadModalProps {
  open: boolean;
  /** null = create, object = edit */
  initial: BudgetHeadDetail | null;
  onClose: () => void;
  /** Called after a successful save so the table can refetch */
  onSaved: () => void;
}

type Opt = { value: string; label: string };

// TODO: replace with master-data APIs (cost centres, programmes, GL accounts).
const COST_CENTRES = ["CC-101 Branch Operations", "CC-201 Information Technology", "CC-301 Human Resources"];
const PROGRAMMES = ["PRG-01 Branch Operations", "PRG-02 Digital Banking", "PRG-03 People Development"];

const filterStatic = (list: string[], search: string): Opt[] =>
  list
    .filter((o) => o.toLowerCase().includes((search || "").toLowerCase()))
    .map((o) => ({ value: o, label: o }));

const inputCls =
  "w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-main placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary";

const isOk = (res: any) => (res?.message?.status_code ?? res?.status_code) === 200;

// ─── Form (mounted fresh every time the modal opens) ──────────────────────────

const BudgetHeadForm: React.FC<Omit<BudgetHeadModalProps, "open">> = ({ initial, onClose, onSaved }) => {
  const isEdit = !!initial;
  const [headName, setHeadName] = useState(initial?.headName ?? "");
  const [subHead, setSubHead] = useState(initial?.subHead ?? "");
  const [glCode, setGlCode] = useState(initial?.glCode ?? "");
  const [costCentre, setCostCentre] = useState(initial?.costCentre ?? "");
  const [programme, setProgramme] = useState(initial?.programme ?? "");
  const [projectCode, setProjectCode] = useState(initial?.projectCode ?? "");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [active, setActive] = useState((initial?.status ?? "Active") === "Active");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const fetchCostCentres = useCallback(async (s: string) => filterStatic(COST_CENTRES, s), []);
  const fetchProgrammes = useCallback(async (s: string) => filterStatic(PROGRAMMES, s), []);

  const clear = (k: string) => setErrors((p) => ({ ...p, [k]: "", form: "" }));

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!headName.trim()) e.headName = "Enter the budget head name";
    if (!glCode.trim()) e.glCode = "Enter the GL code";
    if (!costCentre) e.costCentre = "Select a cost centre";
    if (!programme) e.programme = "Select a programme";
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload = {
      head_name: headName.trim(),
      sub_head: subHead.trim(),
      gl_code: glCode.trim(),
      cost_centre: costCentre,
      programme,
      project_code: projectCode.trim(),
      instructions: instructions.trim(),
      status: active ? "Active" : "Inactive",
    };

    setSaving(true);
    try {
      const res = isEdit ? await updateBudgetHead(initial!.id, payload) : await createBudgetHead(payload);
      if (!isOk(res)) {
        // A duplicate head + GL + cost centre + programme + project combination
        // should come back from the server as a message; show it in the form.
        const msg = res?.message?.message ?? res?.message ?? "Could not save the budget head";
        setErrors({ form: typeof msg === "string" ? msg : "Could not save the budget head" });
        return;
      }
      showSuccess(isEdit ? "Budget head updated" : "Budget head created");
      onSaved();
      onClose();
    } catch (err) {
      showApiError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit budget head" : "Add budget head"}
        className="flex max-h-[92vh] w-full max-w-xl flex-col rounded-xl bg-[var(--card,#fff)] shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h3 className="text-base font-semibold text-main">{isEdit ? "Edit budget head" : "Add budget head"}</h3>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="text-muted hover:text-main">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          {errors.form && (
            <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {errors.form}
            </div>
          )}

          <div className="grid grid-cols-2 items-start gap-4">
            <ModalInput
              label="Budget head"
              name="headName"
              value={headName}
              onChange={(e) => { setHeadName(e.target.value); clear("headName"); }}
              error={errors.headName}
              required
              placeholder="For example: IT Equipment"
            />
            <ModalInput
              label="Sub-head"
              name="subHead"
              value={subHead}
              onChange={(e) => { setSubHead(e.target.value); clear("subHead"); }}
              placeholder="For example: Laptops"
            />
          </div>

          <div className="grid grid-cols-2 items-start gap-4">
            <ModalInput
              label="GL code"
              name="glCode"
              value={glCode}
              onChange={(e) => { setGlCode(e.target.value); clear("glCode"); }}
              error={errors.glCode}
              required
              placeholder="For example: 5101001"
            />
            <SearchSelect2
              label="Cost centre"
              required
              value={costCentre}
              onChange={(v) => { setCostCentre(v || ""); clear("costCentre"); }}
              fetchOptions={fetchCostCentres}
              placeholder="Select cost centre"
              error={errors.costCentre}
            />
          </div>

          <div className="grid grid-cols-2 items-start gap-4">
            <SearchSelect2
              label="Programme"
              required
              value={programme}
              onChange={(v) => { setProgramme(v || ""); clear("programme"); }}
              fetchOptions={fetchProgrammes}
              placeholder="Select programme"
              error={errors.programme}
            />
            <ModalInput
              label="Project code"
              name="projectCode"
              value={projectCode}
              onChange={(e) => { setProjectCode(e.target.value); clear("projectCode"); }}
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Instructions for branch users</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="What should branches include or attach when requesting this head?"
              className={`${inputCls} resize-none`}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-main">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
            <span className="text-xs text-muted">Inactive heads can't be added to new plans.</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-main hover:bg-[var(--border)]/20 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add budget head"}
          </button>
        </div>
      </div>
    </div>
  );
};

const BudgetHeadModal: React.FC<BudgetHeadModalProps> = ({ open, ...rest }) =>
  open ? <BudgetHeadForm key={rest.initial?.id ?? "new"} {...rest} /> : null;

export default BudgetHeadModal;