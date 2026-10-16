import React, { useCallback, useEffect, useId, useState } from "react";
import { ModalInput } from "../../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import {
  Segmented,
  Field,
  inputCls,
  staticFetcher,
  btnGhost,
  btnPrimary,
  GROUPS,
  COST_CENTRES,
  PROGRAMMES,
  type ControlLevel,
  type Overspend,
} from "../sharedbudget";


export type BudgetHeadStatus = "Active" | "Inactive";
export type HeadType = "Operating" | "Capital" | "Revenue" | "Headcount";
export type YearEnd = "Lapse" | "Carry forward";

export interface BudgetHeadDetail {
  id: string;
  headCode: string;
  headName: string;
  parentHead: string;
  headType: HeadType;
  glCode: string;
  controlLevel: ControlLevel;
  defaultCap: string;
  overspend: Overspend;
  costCentre: string;
  programme: string;
  projectCode: string;
  yearEnd: YearEnd;
  transferable: boolean;
  attachmentRequired: boolean;
  instructions: string;
  status: BudgetHeadStatus;
}

interface BudgetHeadModalProps {
  open: boolean;
  /** null = create, object = edit */
  initial: BudgetHeadDetail | null;
  onClose: () => void;
  onSubmit: (data: BudgetHeadDetail) => void;
}

const HEAD_TYPES: HeadType[] = ["Operating", "Capital", "Revenue", "Headcount"];
const PARENT_HEADS = [...GROUPS.map((g) => g.label), "IT Equipment"];


const BudgetHeadForm: React.FC<Omit<BudgetHeadModalProps, "open">> = ({ initial, onClose, onSubmit }) => {
  const isEdit = !!initial;
  const modalId = useId();
  const [headCode, setHeadCode] = useState(initial?.headCode ?? "");
  const [headName, setHeadName] = useState(initial?.headName ?? "");
  const [parentHead, setParentHead] = useState(initial?.parentHead ?? "");
  const [headType, setHeadType] = useState<HeadType>(initial?.headType ?? "Operating");
  const [glCode, setGlCode] = useState(initial?.glCode ?? "");
  const [controlLevel, setControlLevel] = useState<ControlLevel>(initial?.controlLevel ?? "Free");
  const [defaultCap, setDefaultCap] = useState(initial?.defaultCap ?? "");
  const [overspend, setOverspend] = useState<Overspend>(initial?.overspend ?? "Warn");
  const [costCentre, setCostCentre] = useState(initial?.costCentre ?? "");
  const [programme, setProgramme] = useState(initial?.programme ?? "");
  const [projectCode, setProjectCode] = useState(initial?.projectCode ?? "");
  const [yearEnd, setYearEnd] = useState<YearEnd>(initial?.yearEnd ?? "Lapse");
  const [transferable, setTransferable] = useState(initial?.transferable ?? true);
  const [attachmentRequired, setAttachmentRequired] = useState(initial?.attachmentRequired ?? false);
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fetchParents = useCallback(async (s: string) => staticFetcher(PARENT_HEADS.filter((p) => p !== headName.trim()))(s), [headName]);

  const submit = () => {
    onSubmit({
      id: initial?.id ?? "",
      headCode: headCode.trim(),
      headName: headName.trim(),
      parentHead,
      headType,
      glCode: glCode.trim(),
      controlLevel,
      defaultCap: controlLevel === "Capped" ? defaultCap : "",
      overspend,
      costCentre,
      programme,
      projectCode: projectCode.trim(),
      yearEnd,
      transferable,
      attachmentRequired,
      instructions: instructions.trim(),
      status: initial?.status ?? "Active",
    });
    onClose();
  };

  return (
    <MinimizableModal
      modalId={`budget-head-${modalId}`}
      isOpen
      onClose={onClose}
      title={isEdit ? "Edit budget head" : "Add budget head"}
      maxWidth="2xl"
      height="auto"
      hideMinimize
      footer={
        <div className="flex w-full justify-end gap-2">
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancel
          </button>
          <button type="button" onClick={submit} className={btnPrimary}>
            {isEdit ? "Save changes" : "Add budget head"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 items-start gap-4">
          <ModalInput label="Head code" name="headCode" value={headCode} onChange={(e) => setHeadCode(e.target.value)} placeholder="For example: OPX-005" />
          <ModalInput label="Budget head" name="headName" value={headName} onChange={(e) => setHeadName(e.target.value)} required placeholder="For example: Laptops" />
          <SearchSelect2 label="Parent head" value={parentHead} onChange={(v) => setParentHead(v || "")} fetchOptions={fetchParents} placeholder="None (top-level head)" />
          <SearchSelect2
            label="Head type"
            required
            value={headType}
            onChange={(v) => setHeadType((v as HeadType) || "Operating")}
            fetchOptions={staticFetcher(HEAD_TYPES)}
            placeholder="Select type"
          />
          <ModalInput label="GL code" name="glCode" value={glCode} onChange={(e) => setGlCode(e.target.value)} required placeholder="For example: 5101001" />
          <ModalInput label="Project code" name="projectCode" value={projectCode} onChange={(e) => setProjectCode(e.target.value)} placeholder="Optional" />
          <SearchSelect2 label="Default cost centre" value={costCentre} onChange={(v) => setCostCentre(v || "")} fetchOptions={staticFetcher(COST_CENTRES)} placeholder="Select cost centre" />
          <SearchSelect2 label="Programme" value={programme} onChange={(v) => setProgramme(v || "")} fetchOptions={staticFetcher(PROGRAMMES)} placeholder="Select programme" />
        </div>

        <div className="grid grid-cols-2 items-start gap-4">
          <Field label="Planning control">
            <Segmented<ControlLevel> value={controlLevel} options={["Free", "Capped", "Fixed"]} onChange={setControlLevel} />
          </Field>
          <Field label="On overspend">
            <Segmented<Overspend> value={overspend} options={["Allow", "Warn", "Block"]} onChange={setOverspend} />
          </Field>
          {controlLevel === "Capped" && (
            <ModalInput label="Default cap" name="defaultCap" type="number" value={defaultCap} onChange={(e) => setDefaultCap(e.target.value)} placeholder="Maximum per unit" />
          )}
        </div>

        <div className="grid grid-cols-2 items-end gap-4">
          <div className="flex flex-col gap-2 pb-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-main">
              <input type="checkbox" checked={transferable} onChange={(e) => setTransferable(e.target.checked)} />
              Allow budget transfers
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-main">
              <input type="checkbox" checked={attachmentRequired} onChange={(e) => setAttachmentRequired(e.target.checked)} />
              Supporting documents required
            </label>
          </div>
        </div>

        <Field label="Instructions for submitters">
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
            placeholder="What should they include or attach when requesting this head?"
            className={`${inputCls} resize-none`}
          />
        </Field>
      </div>
    </MinimizableModal>
  );
};

const BudgetHeadModal: React.FC<BudgetHeadModalProps> = ({ open, ...rest }) =>
  open ? <BudgetHeadForm key={rest.initial?.id ?? "new"} {...rest} /> : null;

export default BudgetHeadModal;