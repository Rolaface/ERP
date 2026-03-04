import React from "react";
import ReactDOM from "react-dom";
import { FaFileAlt, FaPrint, FaTimes } from "react-icons/fa";
import type { TermSection, PaymentTerms, TermPhase } from "../types/termsAndCondition";

interface TermsPreviewModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  terms: TermSection | null;
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
    <span className="block text-[10px] font-medium text-gray-500 mb-1">{label}</span>
    <span className="py-1 px-2 border rounded text-[11px] text-gray-700 bg-white border-gray-200 min-h-[26px]">
      {value && value.trim() ? value : <span className="text-gray-400 italic">—</span>}
    </span>
  </div>
);

const TermsPreviewModal: React.FC<TermsPreviewModalProps> = ({ open, onClose, title, terms, type }) => {
  if (!open) return null;

  const payment = ensurePayment(terms);
  const phases = (payment.phases as LocalPhase[]).filter((p) => p.isDelete !== 1);

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl flex flex-col border border-gray-200"
        style={{ width: "min(800px, 95vw)", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-3.5 rounded-t-xl flex-shrink-0"
          style={{ background: "var(--primary-600)" }}
        >
          <div className="flex items-center gap-2.5">
            <FaFileAlt className="text-white opacity-75" size={13} />
            <div className="flex flex-col">
              <h2 className="text-white font-semibold text-sm tracking-wide">
                {title ?? "Terms & Conditions"} — Full Preview
              </h2>
              {type && (
                <span className="text-[10px] text-white/70 font-medium tracking-wide capitalize">
                  {type === "buying" ? "Buying Terms" : "Selling Terms"}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white border border-white/30 hover:bg-white/15 transition-colors"
            >
              <FaPrint size={11} /> Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-white hover:bg-white/20 transition-colors"
            >
              <FaTimes size={13} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-8 py-6 flex-1 space-y-8 bg-white">

          {/* Payment Terms */}
          <section>
            <SectionHeading>Payment Terms</SectionHeading>

            {phases.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden mb-5">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 w-10">#</th>
                      <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500">Phase</th>
                      <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500">Percentage</th>
                      <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500">Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phases.map((p, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 text-[11px] text-gray-400">{i + 1}</td>
                        <td className="px-4 py-2.5 text-[11px] text-gray-700">{p.name || "—"}</td>
                        <td className="px-4 py-2.5 text-[11px] text-gray-700">{p.percentage ? `${p.percentage}%` : "—"}</td>
                        <td className="px-4 py-2.5 text-[11px] text-gray-700">{p.condition || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 italic mb-5">No payment phases defined.</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <ReadField label="Due Dates"                value={payment.dueDates}    />
              <ReadField label="Late Payment Charges"     value={payment.lateCharges} />
              <ReadField label="Tax / Additional Charges" value={payment.taxes}       />
              <ReadField label="Notes"                    value={payment.notes}       />
            </div>
          </section>

          {/* Text Sections */}
          {TEXT_SECTIONS.map(({ label, key }) => {
            const content = terms?.[key] as string | undefined;
            return (
              <section key={key}>
                <SectionHeading>{label}</SectionHeading>
                {content && content.trim() ? (
                  <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {content}
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-400 italic">No content added.</p>
                )}
              </section>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 border-t border-gray-100 bg-white rounded-b-xl flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-[11px] font-medium text-white hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(90deg, var(--primary) 0%, var(--primary-600) 100%)" }}
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TermsPreviewModal;