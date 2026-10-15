import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { ModalInput } from "../../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BudgetHeadStatus = "Active" | "Inactive";
export type HeadType = "Operating" | "Capital" | "Revenue" | "Headcount";
/**
 * How much freedom a submitter has on this head:
 *  Free   - submitter decides the amount
 *  Capped - submitter decides, but not above the cap
 *  Fixed  - amount is set from above (or a system source) and locked
 */
export type ControlLevel = "Free" | "Capped" | "Fixed";

export interface BudgetHeadDetail {
  id: string;
  headName: string;
  /** Parent head, so totals roll up (IT Equipment > Laptops). Empty = top-level head */
  parentHead: string;
  headType: HeadType;
  glCode: string;
  controlLevel: ControlLevel;
  /** Default cap, used when controlLevel is Capped. Can be overridden per plan. */
  defaultCap: string;
  /** Optional defaults. The real cost centre / programme is picked when the plan is created. */
  costCentre: string;
  programme: string;
  projectCode: string;
  attachmentRequired: boolean;
  instructions: string;
  status: BudgetHeadStatus;
}

interface BudgetHeadModalProps {
  open: boolean;
  /** null = create, object = edit */
  initial: BudgetHeadDetail | null;
  onClose: () => void;
  /**
   * Called when the form is valid. Return an error message to show it in the form
   * (for example a duplicate head), or nothing to close the modal.
   */
  onSubmit: (data: BudgetHeadDetail) => string | void;
  /** Company-level settings: some companies make these mandatory, others hide them */
  requireCostCentre?: boolean;
  requireProgramme?: boolean;
}

type Opt = { value: string; label: string };

const HEAD_TYPES: HeadType[] = ["Operating", "Capital", "Revenue", "Headcount"];

const CONTROL_LEVELS: { value: ControlLevel; label: string; hint: string }[] = [
  { value: "Free", label: "Free", hint: "Submitter decides the amount." },
  { value: "Capped", label: "Capped", hint: "Submitter decides, but not above the cap." },
  { value: "Fixed", label: "Fixed", hint: "Amount is set from above and locked." },
];

// TODO: replace with master-data APIs (parent heads, cost centres, programmes).
const PARENT_HEADS = ["Operating Expenses", "Capital Expenditure Items", "Staff Costs", "IT Equipment"];
const COST_CENTRES = ["CC-101 Branch Operations", "CC-201 Information Technology", "CC-301 Human Resources"];
const PROGRAMMES = ["PRG-01 Branch Operations", "PRG-02 Digital Banking", "PRG-03 People Development"];

const filterStatic = (list: string[], search: string): Opt[] =>
  list
    .filter((o) => o.toLowerCase().includes((search || "").toLowerCase()))
    .map((o) => ({ value: o, label: o }));

const inputCls =
  "w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-main placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary";

// ─── Form (mounted fresh every time the modal opens) ──────────────────────────

const BudgetHeadForm: React.FC<Omit<BudgetHeadModalProps, "open">> = ({
  initial,
  onClose,
  onSubmit,
  requireCostCentre = false,
  requireProgramme = false,
}) => {
  const isEdit = !!initial;
  const [headName, setHeadName] = useState(initial?.headName ?? "");
  const [parentHead, setParentHead] = useState(initial?.parentHead ?? "");
  const [headType, setHeadType] = useState<HeadType>(initial?.headType ?? "Operating");
  const [glCode, setGlCode] = useState(initial?.glCode ?? "");
  const [controlLevel, setControlLevel] = useState<ControlLevel>(initial?.controlLevel ?? "Free");
  const [defaultCap, setDefaultCap] = useState(initial?.defaultCap ?? "");
  const [costCentre, setCostCentre] = useState(initial?.costCentre ?? "");
  const [programme, setProgramme] = useState(initial?.programme ?? "");
  const [projectCode, setProjectCode] = useState(initial?.projectCode ?? "");
  const [attachmentRequired, setAttachmentRequired] = useState(initial?.attachmentRequired ?? false);
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [active, setActive] = useState((initial?.status ?? "Active") === "Active");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const saving = false;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const fetchParents = useCallback(
    async (s: string) => filterStatic(PARENT_HEADS.filter((p) => p !== headName.trim()), s),
    [headName],
  );
  const fetchTypes = useCallback(async (s: string) => filterStatic(HEAD_TYPES, s), []);
  const fetchCostCentres = useCallback(async (s: string) => filterStatic(COST_CENTRES, s), []);
  const fetchProgrammes = useCallback(async (s: string) => filterStatic(PROGRAMMES, s), []);

  const clear = (k: string) => setErrors((p) => ({ ...p, [k]: "", form: "" }));

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!headName.trim()) e.headName = "Enter the budget head name";
    if (!glCode.trim()) e.glCode = "Enter the GL code";
    if (controlLevel === "Capped" && !(Number(defaultCap) > 0)) e.defaultCap = "Enter a cap above zero";
    if (requireCostCentre && !costCentre) e.costCentre = "Select a cost centre";
    if (requireProgramme && !programme) e.programme = "Select a programme";
    setErrors(e);
    if (Object.keys(e).length) return;

    const result = onSubmit({
      id: initial?.id ?? "",
      headName: headName.trim(),
      parentHead,
      headType,
      glCode: glCode.trim(),
      controlLevel,
      defaultCap: controlLevel === "Capped" ? defaultCap : "",
      costCentre,
      programme,
      projectCode: projectCode.trim(),
      attachmentRequired,
      instructions: instructions.trim(),
      status: active ? "Active" : "Inactive",
    });
    if (typeof result === "string") {
      setErrors({ form: result });
      return;
    }
    onClose();
  };

  const activeHint = CONTROL_LEVELS.find((c) => c.value === controlLevel)?.hint;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit budget head" : "Add budget head"}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-xl bg-[var(--card,#fff)] shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h3 className="text-base font-semibold text-main">{isEdit ? "Edit budget head" : "Add budget head"}</h3>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="text-muted hover:text-main">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto px-5 py-4">
          {errors.form && (
            <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {errors.form}
            </div>
          )}

          {/* Identity */}
          <div className="grid grid-cols-2 items-start gap-4">
            <ModalInput
              label="Budget head"
              name="headName"
              value={headName}
              onChange={(e) => { setHeadName(e.target.value); clear("headName"); }}
              error={errors.headName}
              required
              placeholder="For example: Laptops"
            />
            <SearchSelect2
              label="Parent head"
              value={parentHead}
              onChange={(v) => setParentHead(v || "")}
              fetchOptions={fetchParents}
              placeholder="None (top-level head)"
            />
          </div>

          <div className="grid grid-cols-2 items-start gap-4">
            <SearchSelect2
              label="Head type"
              required
              value={headType}
              onChange={(v) => setHeadType((v as HeadType) || "Operating")}
              fetchOptions={fetchTypes}
              placeholder="Select type"
            />
            <ModalInput
              label="GL code"
              name="glCode"
              value={glCode}
              onChange={(e) => { setGlCode(e.target.value); clear("glCode"); }}
              error={errors.glCode}
              required
              placeholder="For example: 5101001"
            />
          </div>

          {/* Control */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">How is this head controlled?</label>
            <div role="radiogroup" aria-label="Control level" className="grid grid-cols-3 gap-2">
              {CONTROL_LEVELS.map((c) => {
                const on = controlLevel === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => { setControlLevel(c.value); clear("defaultCap"); }}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      on ? "border-primary bg-primary/5 font-medium text-primary" : "border-[var(--border)] text-main hover:bg-[var(--border)]/15"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[11px] text-muted">{activeHint}</p>
            {controlLevel === "Capped" && (
              <div className="mt-3 max-w-xs">
                <ModalInput
                  label="Default cap"
                  name="defaultCap"
                  type="number"
                  value={defaultCap}
                  onChange={(e) => { setDefaultCap(e.target.value); clear("defaultCap"); }}
                  error={errors.defaultCap}
                  required
                  placeholder="Maximum per unit"
                />
                <p className="mt-1 text-[11px] text-muted">Can be changed for each plan.</p>
              </div>
            )}
          </div>

          {/* Optional defaults */}
          <div>
            <div className="grid grid-cols-3 items-start gap-4">
              <SearchSelect2
                label="Default cost centre"
                required={requireCostCentre}
                value={costCentre}
                onChange={(v) => { setCostCentre(v || ""); clear("costCentre"); }}
                fetchOptions={fetchCostCentres}
                placeholder="Select cost centre"
                error={errors.costCentre}
              />
              <SearchSelect2
                label="Programme"
                required={requireProgramme}
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
                onChange={(e) => setProjectCode(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Instructions for submitters</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="What should they include or attach when requesting this head?"
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-main">
              <input type="checkbox" checked={attachmentRequired} onChange={(e) => setAttachmentRequired(e.target.checked)} />
              Supporting documents required
              <span className="text-xs text-muted">Quotes, last year's report or approvals must be attached.</span>
            </label>
          </div>
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