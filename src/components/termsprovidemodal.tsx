import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { FaFileAlt, FaPrint, FaTimes, FaEdit, FaCheck, FaPlus, FaTrash } from "react-icons/fa";
import type { TermSection, PaymentTerms, TermPhase } from "../types/termsAndCondition";
import { TemplateField, ConditionCell } from "./TermsAndCondition";

interface TermsPreviewModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  terms: TermSection | null;
  setTerms?: (updated: TermSection) => void;
  type?: "buying" | "selling";
}

type LocalPhase = TermPhase & { id?: string; isDelete?: number };

const ensurePayment = (src: TermSection | null): PaymentTerms => ({
  phases: src?.payment?.phases ?? [],
  dueDates: src?.payment?.dueDates ?? "",
  lateCharges: src?.payment?.lateCharges ?? "",
  taxes: src?.payment?.taxes ?? "",
  notes: src?.payment?.notes ?? "",
});

const emptyPhase = (): TermPhase => ({
  id: "", name: "", percentage: "", condition: "", isDelete: undefined,
});

const emptyTerms: TermSection = {
  general: "",
  payment: { phases: [], dueDates: "", lateCharges: "", taxes: "", notes: "" },
  delivery: "", cancellation: "", warranty: "", liability: "",
};

const TEXT_SECTIONS: { label: string; key: keyof TermSection }[] = [
  { label: "General Service Terms",        key: "general"      },
  { label: "Service Delivery Terms",       key: "delivery"     },
  { label: "Cancellation / Refund Policy", key: "cancellation" },
  { label: "Warranty",                     key: "warranty"     },
  { label: "Limitations and Liability",    key: "liability"    },
];

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3
    className="text-[10px] font-semibold uppercase tracking-widest pb-1.5 mb-3 border-b"
    style={{ color: "var(--primary-600)", borderColor: "var(--primary-600)" }}
  >
    {children}
  </h3>
);

const ReadField: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div className="flex flex-col min-w-0">
    {label && <span className="block text-[10px] font-medium text-gray-500 mb-1">{label}</span>}
    <span className="py-1 px-2 border rounded text-[11px] text-gray-700 bg-white border-gray-200 min-h-[26px]">
      {value && value.trim() ? value : <span className="text-gray-400 italic">—</span>}
    </span>
  </div>
);

const TermsPreviewModal: React.FC<TermsPreviewModalProps> = ({
  open, onClose, title, terms, setTerms, type,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<TermSection | null>(null);
  const [percentageError, setPercentageError] = useState<{ index: number; message: string } | null>(null);

  useEffect(() => {
    if (!open) { setIsEditing(false); setDraft(null); setPercentageError(null); }
  }, [open]);

  if (!open) return null;

  const canEdit = !!setTerms;
  const baseTerms = terms ?? emptyTerms;
  const currentTerms: TermSection = isEditing ? (draft ?? baseTerms) : baseTerms;
  const payment = ensurePayment(currentTerms);
  const phases = (payment.phases as LocalPhase[]).filter((p) => p.isDelete !== 1);

  const updateDraft = (updater: (prev: TermSection) => TermSection) => {
    if (!isEditing) return;
    setDraft((prev) => updater(prev ?? baseTerms));
  };

  const updateTextField = (key: keyof TermSection, value: string) =>
    updateDraft((prev) => ({ ...prev, [key]: value }));

  const updatePayment = (patch: Partial<PaymentTerms>) =>
    updateDraft((prev) => ({ ...prev, payment: { ...ensurePayment(prev), ...patch } }));

  const getTotalPercentage = (ps: TermPhase[]) =>
    ps.reduce((sum, p) => sum + Number(p.percentage || 0), 0);

  const updatePhase = (index: number, patch: Partial<TermPhase>) => {
    if (!isEditing) return;
    const ps = ensurePayment(currentTerms).phases;
    const next = ps.map((p, i) => (i === index ? { ...p, ...patch } : p));
    if (patch.percentage !== undefined) {
      if (Number(patch.percentage) > 100) { setPercentageError({ index, message: "Cannot exceed 100%" }); return; }
      const total = getTotalPercentage(next);
      if (total > 100) { setPercentageError({ index, message: `Total would be ${total}%` }); return; }
    }
    setPercentageError(null);
    updatePayment({ phases: next });
  };

  const addPhase = () => updatePayment({
    phases: [...ensurePayment(currentTerms).phases, emptyPhase()],
  });

  const removePhase = (index: number) => {
    const next = ensurePayment(currentTerms).phases.filter((_, i) => i !== index);
    if (percentageError?.index === index) setPercentageError(null);
    updatePayment({ phases: next });
  };

  const startEditing = () => { setDraft(terms ?? emptyTerms); setIsEditing(true); };
  const cancelEditing = () => { setDraft(null); setIsEditing(false); setPercentageError(null); };
  const saveEditing = () => {
    if (draft && setTerms) setTerms(draft);
    setDraft(null); setIsEditing(false); setPercentageError(null);
  };

  const renderPaymentSection = () => (
    <section>
      <SectionHeading>Payment Terms</SectionHeading>

      {(isEditing || phases.length > 0) ? (
        <div className="border border-gray-200 rounded-lg overflow-visible mb-4">
          <table className="w-full table-fixed">
            <colgroup>
              <col style={{ width: 32 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 86 }} />
              <col />
              {isEditing && <col style={{ width: 36 }} />}
            </colgroup>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500">#</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500">Phase</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500">%</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500">Condition</th>
                {isEditing && <th />}
              </tr>
            </thead>
            <tbody>
              {phases.map((p, i) => {
                const hasError = percentageError?.index === i;
                return (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50 align-middle">
                    <td className="px-4 py-2.5 text-[11px] text-gray-400">{i + 1}</td>
                    <td className="px-4 py-2.5 text-[11px] text-gray-700">
                      {isEditing ? (
                        <input
                          className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-[11px] outline-none focus:border-blue-400"
                          value={p.name} onChange={(e) => updatePhase(i, { name: e.target.value })}
                        />
                      ) : (
                        <span className="block truncate" title={p.name}>{p.name || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-gray-700">
                      {isEditing ? (
                        <div className="flex flex-col gap-0.5">
                          <input
                            type="number" min="0" max="100"
                            className={`w-full bg-white border rounded px-2 py-1 text-[11px] outline-none ${
                              hasError ? "border-red-400 text-red-500" : "border-gray-200 focus:border-blue-400"
                            }`}
                            value={p.percentage} onChange={(e) => updatePhase(i, { percentage: e.target.value })}
                          />
                          {hasError && <span className="text-red-500 text-[10px]">⚠ {percentageError.message}</span>}
                        </div>
                      ) : (p.percentage ? `${p.percentage}%` : "—")}
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-gray-700">
                      <ConditionCell
                        value={p.condition}
                        onChange={(v) => updatePhase(i, { condition: v })}
                        disabled={!isEditing}
                      />
                    </td>
                    {isEditing && (
                      <td className="px-4 py-2.5 text-center">
                        <button type="button" onClick={() => removePhase(i)} className="text-red-400 hover:text-red-600">
                          <FaTrash size={11} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {phases.length === 0 && isEditing && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-[11px] text-gray-400 italic">
                    No phases yet — click "Add Phase" below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-[11px] text-gray-400 italic mb-4">No payment phases defined.</p>
      )}

      {isEditing && (
        <div className="flex justify-end mb-4">
          <button type="button" onClick={addPhase}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white hover:opacity-90"
            style={{ background: "linear-gradient(90deg, var(--primary) 0%, var(--primary-600) 100%)" }}>
            <FaPlus size={10} /> Add Phase
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col">
          <span className="block text-[10px] font-medium text-gray-500 mb-1.5">Due Dates</span>
          {isEditing ? (
            <TemplateField
              prefix="Payment due within" suffix="days" suffixKeyword="days"
              value={payment.dueDates ?? ""} onChange={(v) => updatePayment({ dueDates: v })} disabled={false}
            />
          ) : <ReadField label="" value={payment.dueDates} />}
        </div>
        <div className="flex flex-col">
          <span className="block text-[10px] font-medium text-gray-500 mb-1.5">Late Payment Charges</span>
          {isEditing ? (
            <TemplateField
              prefix="Late payment charges" suffix="% per annum" suffixKeyword="%"
              value={payment.lateCharges ?? ""} onChange={(v) => updatePayment({ lateCharges: v })} disabled={false}
            />
          ) : <ReadField label="" value={payment.lateCharges} />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {isEditing ? (
          <>
            <div className="flex flex-col">
              <span className="block text-[10px] font-medium text-gray-500 mb-1">Tax / Additional Charges</span>
              <input className="bg-white border border-gray-200 rounded px-2 py-1 text-[11px] outline-none focus:border-blue-400"
                value={payment.taxes ?? ""} onChange={(e) => updatePayment({ taxes: e.target.value })} placeholder="e.g. 18% GST" />
            </div>
            <div className="flex flex-col">
              <span className="block text-[10px] font-medium text-gray-500 mb-1">Notes</span>
              <input className="bg-white border border-gray-200 rounded px-2 py-1 text-[11px] outline-none focus:border-blue-400"
                value={payment.notes ?? ""} onChange={(e) => updatePayment({ notes: e.target.value })} placeholder="Additional notes..." />
            </div>
          </>
        ) : (
          <>
            <ReadField label="Tax / Additional Charges" value={payment.taxes} />
            <ReadField label="Notes" value={payment.notes} />
          </>
        )}
      </div>
    </section>
  );

  const renderTextSection = (label: string, key: keyof TermSection) => {
    const content = currentTerms[key] as string | undefined;
    return (
      <section key={key}>
        <SectionHeading>{label}</SectionHeading>
        {isEditing ? (
          <textarea rows={5}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[12px] text-gray-700 outline-none focus:border-blue-400 resize-none leading-relaxed"
            value={content ?? ""} placeholder={`Enter ${label.toLowerCase()}...`}
            onChange={(e) => updateTextField(key, e.target.value)}
          />
        ) : content && content.trim() ? (
          <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
        ) : (
          <p className="text-[11px] text-gray-400 italic">No content added.</p>
        )}
      </section>
    );
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !isEditing) onClose(); }}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl flex flex-col border border-gray-200"
        style={{ width: "min(800px, 95vw)", maxHeight: "90vh" }}
      >
        <div
          className="flex items-center justify-between px-6 py-3.5 rounded-t-xl flex-shrink-0"
          style={{ background: "var(--primary-600)" }}
        >
          <div className="flex items-center gap-2.5">
            <FaFileAlt className="text-white opacity-75" size={13} />
            <div>
              <h2 className="text-white font-semibold text-sm">
                {title ?? "Terms & Conditions"} — {isEditing ? "Editing" : "Full Preview"}
              </h2>
              {type && (
                <span className="text-[10px] text-white/70 font-medium capitalize">
                  {type === "buying" ? "Buying Terms" : "Selling Terms"}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button type="button" onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white border border-white/30 hover:bg-white/15 transition-colors">
                <FaPrint size={11} /> Print
              </button>
            )}
            {canEdit && !isEditing && (
              <button type="button" onClick={startEditing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white border border-white/30 hover:bg-white/15 transition-colors">
                <FaEdit size={11} /> Edit
              </button>
            )}
            {!isEditing && (
              <button type="button" onClick={onClose}
                className="flex items-center justify-center w-7 h-7 rounded-lg text-white hover:bg-white/20 transition-colors">
                <FaTimes size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto px-8 py-6 flex-1 space-y-8 bg-white">
          {renderPaymentSection()}
          {TEXT_SECTIONS.map(({ label, key }) => renderTextSection(label, key))}
        </div>

        <div className="flex justify-end gap-3 px-6 py-3 border-t border-gray-100 bg-white rounded-b-xl flex-shrink-0">
          {isEditing ? (
            <>
              <button type="button" onClick={cancelEditing}
                className="px-4 py-1.5 rounded-lg text-[11px] font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 flex items-center gap-1.5">
                <FaTimes size={10} /> Cancel
              </button>
              <button type="button" onClick={saveEditing}
                className="px-5 py-1.5 rounded-lg text-[11px] font-medium text-white hover:opacity-90 flex items-center gap-1.5"
                style={{ background: "linear-gradient(90deg, var(--primary) 0%, var(--primary-600) 100%)" }}>
                <FaCheck size={10} /> Save Terms
              </button>
            </>
          ) : (
            <button type="button" onClick={onClose}
              className="px-5 py-1.5 rounded-lg text-[11px] font-medium text-white hover:opacity-90"
              style={{ background: "linear-gradient(90deg, var(--primary) 0%, var(--primary-600) 100%)" }}>
              Close Preview
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TermsPreviewModal;