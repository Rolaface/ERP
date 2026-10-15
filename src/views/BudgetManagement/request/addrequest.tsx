import React, { useEffect, useMemo, useRef, useState } from "react";
import { Paperclip, Save, Send, X } from "lucide-react";

import { showApiError } from "../../../utils/alert";
import { fireManagedSwal } from "../../../utils/swalManager";

// ─── Types / constants ────────────────────────────────────────────────────────

export type BudgetRequestStatus = "Inputs Pending" | "Draft" | "Submitted";

export interface RequestLine {
  id: string;
  headName: string;
  previousActual: number;
  requested: string; // digit string so the input stays editable
}

export interface RequestAttachment {
  name: string;
  size: number;
}

export interface BudgetRequestDetail {
  id?: string;
  budgetId: string;
  planName: string;
  branch: string;
  financialYear: string;
  lines: RequestLine[];
  justification: string;
  attachments: RequestAttachment[];
  status: BudgetRequestStatus;
}

export type SubmitAction = "draft" | "submit";

// Dummy plans. Replace with an API call later.
export const PLAN_OPTIONS: Omit<BudgetRequestDetail, "id" | "justification" | "attachments" | "status">[] = [
  {
    budgetId: "BUD-2027-001",
    planName: "Annual Budget FY 2027-28",
    branch: "Meerut Branch",
    financialYear: "2027-2028",
    lines: [
      { id: "BH-1001", headName: "Office Rent", previousActual: 450000, requested: "" },
      { id: "BH-1002", headName: "Electricity", previousActual: 90000, requested: "" },
      { id: "BH-1003", headName: "IT Equipment", previousActual: 100000, requested: "" },
      { id: "BH-1004", headName: "Staff Training", previousActual: 40000, requested: "" },
      { id: "BH-1005", headName: "Travel Expenses", previousActual: 70000, requested: "" },
    ],
  },
  {
    budgetId: "BUD-2027-002",
    planName: "Annual Budget FY 2027-28",
    branch: "Agra Branch",
    financialYear: "2027-2028",
    lines: [
      { id: "BH-1001", headName: "Office Rent", previousActual: 380000, requested: "" },
      { id: "BH-1002", headName: "Electricity", previousActual: 75000, requested: "" },
      { id: "BH-1004", headName: "Staff Training", previousActual: 30000, requested: "" },
    ],
  },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export const sumPrevious = (lines: RequestLine[]) => lines.reduce((s, l) => s + l.previousActual, 0);
export const sumRequested = (lines: RequestLine[]) => lines.reduce((s, l) => s + (Number(l.requested) || 0), 0);

const STATUS_STYLE: Record<BudgetRequestStatus, string> = {
  "Inputs Pending": "bg-amber-50 text-amber-700",
  Draft: "bg-blue-50 text-blue-700",
  Submitted: "bg-emerald-50 text-emerald-700",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  initial: BudgetRequestDetail | null; // null = create
  onClose: () => void;
  /** Return an error message to show in the form, or nothing when saved. */
  onSubmit: (data: BudgetRequestDetail, action: SubmitAction) => string | void;
}

const BudgetRequestModal: React.FC<Props> = ({ open, initial, onClose, onSubmit }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const [planIdx, setPlanIdx] = useState(0);
  const [lines, setLines] = useState<RequestLine[]>([]);
  const [justification, setJustification] = useState("");
  const [attachments, setAttachments] = useState<RequestAttachment[]>([]);
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});
  const [justificationError, setJustificationError] = useState("");
  const [formError, setFormError] = useState("");

  const isEdit = !!initial?.id;
  const readOnly = initial?.status === "Submitted";

  // Reset whenever the modal opens
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setLines(initial.lines.map((l) => ({ ...l })));
      setJustification(initial.justification);
      setAttachments(initial.attachments);
    } else {
      setPlanIdx(0);
      setLines(PLAN_OPTIONS[0].lines.map((l) => ({ ...l })));
      setJustification("");
      setAttachments([]);
    }
    setLineErrors({});
    setJustificationError("");
    setFormError("");
  }, [open, initial]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const plan = initial ?? { ...PLAN_OPTIONS[planIdx], status: "Inputs Pending" as BudgetRequestStatus };
  const totalPrevious = useMemo(() => sumPrevious(lines), [lines]);
  const totalRequested = useMemo(() => sumRequested(lines), [lines]);

  if (!open) return null;

  // ── Handlers ──
  const handlePlanChange = (idx: number) => {
    setPlanIdx(idx);
    setLines(PLAN_OPTIONS[idx].lines.map((l) => ({ ...l })));
    setLineErrors({});
  };

  const handleAmount = (id: string, raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, requested: digits } : l)));
    setLineErrors((prev) => ({ ...prev, [id]: "" }));
    setFormError("");
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    const tooBig = picked.filter((f) => f.size > MAX_FILE_SIZE);
    if (tooBig.length) showApiError(`${tooBig.map((f) => f.name).join(", ")} exceeds 5 MB`);
    const ok = picked
      .filter((f) => f.size <= MAX_FILE_SIZE)
      .map((f) => ({ name: f.name, size: f.size }));
    setAttachments((prev) => [...prev, ...ok.filter((f) => !prev.some((p) => p.name === f.name && p.size === f.size))]);
  };

  const buildData = (status: BudgetRequestStatus): BudgetRequestDetail => ({
    id: initial?.id,
    budgetId: plan.budgetId,
    planName: plan.planName,
    branch: plan.branch,
    financialYear: plan.financialYear,
    lines,
    justification: justification.trim(),
    attachments,
    status,
  });

  const finish = (result: string | void) => {
    if (typeof result === "string") {
      setFormError(result);
      return;
    }
    onClose();
  };

  const handleSaveDraft = () => finish(onSubmit(buildData("Draft"), "draft"));

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    lines.forEach((l) => {
      if (!l.requested || Number(l.requested) <= 0) errs[l.id] = "Enter an amount";
    });
    const jErr = justification.trim() ? "" : "Justification is required";
    setLineErrors(errs);
    setJustificationError(jErr);
    if (Object.keys(errs).length || jErr) {
      setFormError("Please fix the highlighted fields.");
      return;
    }
    const result = await fireManagedSwal({
      icon: "question",
      title: "Submit to Zonal Manager?",
      text: `Total requested ${formatINR(totalRequested)}. You won't be able to edit after submitting.`,
      showCancelButton: true,
      confirmButtonColor: "#ef0000",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, submit",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    finish(onSubmit(buildData("Submitted"), "submit"));
  };

  // ── Render ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h3 className="text-base font-semibold">
            {readOnly ? "View" : isEdit ? "Edit" : "Add"} Branch Budget Requirements
          </h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-gray-800">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 overflow-y-auto px-5 py-4">
          {formError && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}

          {/* Plan info */}
          <div className="rounded-md border border-gray-200 p-3 text-sm">
            {!isEdit && (
              <div className="mb-3">
                <label htmlFor="plan" className="mb-1 block text-xs font-medium text-muted">
                  Budget Plan
                </label>
                <select
                  id="plan"
                  value={planIdx}
                  onChange={(e) => handlePlanChange(Number(e.target.value))}
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-gray-400"
                >
                  {PLAN_OPTIONS.map((p, i) => (
                    <option key={p.budgetId} value={i}>
                      {p.planName} — {p.branch} ({p.budgetId})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
              <Info label="Budget Plan" value={plan.planName} />
              <Info label="Budget ID" value={plan.budgetId} />
              <Info label="Branch" value={plan.branch} />
              <Info label="Financial Year" value={plan.financialYear} />
              <div className="flex gap-2">
                <dt className="text-muted">Status:</dt>
                <dd>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[plan.status]}`}>{plan.status}</span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Requirements */}
          <div className="rounded-md border border-gray-200">
            <div className="border-b border-gray-200 px-3 py-2 text-sm font-medium">Enter Budget Requirements</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase text-muted">
                    <th className="px-3 py-2 font-medium">Budget Head</th>
                    <th className="px-3 py-2 text-right font-medium">Previous Actual</th>
                    <th className="px-3 py-2 text-right font-medium">Requested Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-2">{l.headName}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right">{formatINR(l.previousActual)}</td>
                      <td className="px-3 py-2">
                        <div className="ml-auto w-40">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={l.requested ? `₹${Number(l.requested).toLocaleString("en-IN")}` : ""}
                            onChange={(e) => handleAmount(l.id, e.target.value)}
                            disabled={readOnly}
                            placeholder="₹0"
                            aria-label={`Requested amount for ${l.headName}`}
                            className={`w-full rounded-md border px-2 py-1.5 text-right text-sm outline-none focus:ring-1 disabled:bg-gray-50 disabled:text-gray-500 ${
                              lineErrors[l.id] ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-gray-400"
                            }`}
                          />
                          {lineErrors[l.id] && <span className="mt-0.5 block text-right text-xs text-red-500">{lineErrors[l.id]}</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-1 border-t border-gray-200 px-3 py-2 text-sm">
              <div className="flex gap-3">
                <span className="text-muted">Total Previous Actual:</span>
                <span className="font-medium">{formatINR(totalPrevious)}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-muted">Total Requested:</span>
                <span className="font-medium">{formatINR(totalRequested)}</span>
              </div>
            </div>
          </div>

          {/* Justification */}
          <div>
            <label htmlFor="justification" className="mb-1 block text-sm font-medium">
              Justification
            </label>
            <textarea
              id="justification"
              rows={3}
              value={justification}
              onChange={(e) => {
                setJustification(e.target.value);
                setJustificationError("");
                setFormError("");
              }}
              disabled={readOnly}
              placeholder="Explain the branch's budget requirements"
              className={`w-full resize-y rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 disabled:bg-gray-50 disabled:text-gray-500 ${
                justificationError ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-gray-400"
              }`}
            />
            {justificationError && <span className="mt-0.5 block text-xs text-red-500">{justificationError}</span>}
          </div>

          {/* Attachments */}
          <div>
            <span className="mb-1 block text-sm font-medium">Attachments</span>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={readOnly}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Paperclip size={14} /> Upload Document
            </button>
            {attachments.length > 0 && (
              <ul className="mt-2 space-y-1">
                {attachments.map((f, i) => (
                  <li key={`${f.name}-${f.size}`} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-1.5 text-xs">
                    <span className="truncate">
                      {f.name} <span className="text-muted">({Math.ceil(f.size / 1024)} KB)</span>
                    </span>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                        aria-label={`Remove ${f.name}`}
                        className="ml-2 text-gray-500 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            {readOnly ? "Close" : "Cancel"}
          </button>
          {!readOnly && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                <Save size={14} /> Save Draft
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#ef0000] px-4 py-2 text-sm text-white hover:opacity-90"
              >
                <Send size={14} /> Submit to Zonal Manager
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex gap-2">
    <dt className="text-muted">{label}:</dt>
    <dd className="font-medium">{value}</dd>
  </div>
);

export default BudgetRequestModal;