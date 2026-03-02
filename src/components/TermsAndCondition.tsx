import React, { useState } from "react";
import { FaEdit, FaTimes, FaCheck, FaPlus, FaTrash } from "react-icons/fa";
import type {
  TermSection,
  PaymentTerms,
  TermPhase,
} from "../types/termsAndCondition";

interface Props {
  title?: string;
  terms: TermSection | null;
  setTerms: (updated: TermSection) => void;
}

type LocalPhase = TermPhase & { id?: string; isDelete?: number };

const UI_TO_KEY: Record<string, keyof TermSection> = {
  "General Service Terms": "general",
  "Payment Terms": "payment",
  "Service Delivery Terms": "delivery",
  "Cancellation / Refund Policy": "cancellation",
  Warranty: "warranty",
  "Limitations and Liability": "liability",
};

const TABS = Object.keys(UI_TO_KEY);

const emptyPhase = (): TermPhase => ({
  id: "",
  name: "",
  percentage: "",
  condition: "",
  isDelete: undefined,
});

const emptyPayment: PaymentTerms = {
  phases: [],
  dueDates: "",
  lateCharges: "",
  taxes: "",
  notes: "",
};

const emptyTerms: TermSection = {
  general: "",
  payment: emptyPayment,
  delivery: "",
  cancellation: "",
  warranty: "",
  liability: "",
};

const TermsAndCondition: React.FC<Props> = ({ title, terms, setTerms }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(
    "General Service Terms",
  );
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<TermSection | null>(null);

  const baseTerms: TermSection = terms ?? emptyTerms;
  const currentTerms: TermSection = isEditing
    ? (draft ?? baseTerms)
    : baseTerms;

  const activeKey = UI_TO_KEY[selectedTemplate];

  const ensurePayment = (src: TermSection): PaymentTerms => ({
    phases: src.payment?.phases ?? [],
    dueDates: src.payment?.dueDates ?? "",
    lateCharges: src.payment?.lateCharges ?? "",
    taxes: src.payment?.taxes ?? "",
    notes: src.payment?.notes ?? "",
  });

  const startEditing = () => {
    setDraft(terms ?? emptyTerms);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft(null);
    setIsEditing(false);
  };

  const saveEditing = () => {
    if (!draft) {
      setIsEditing(false);
      return;
    }
    setTerms(draft);
    setDraft(null);
    setIsEditing(false);
  };

  const updateDraft = (updater: (prev: TermSection) => TermSection) => {
    if (!isEditing) return;
    setDraft((prev) => {
      const base = prev ?? baseTerms;
      return updater(base);
    });
  };

  const updateTopField = (key: keyof TermSection, value: string) => {
    updateDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updatePayment = (patch: Partial<PaymentTerms>) => {
    updateDraft((prev) => {
      const current = ensurePayment(prev);
      return {
        ...prev,
        payment: {
          ...current,
          ...patch,
        },
      };
    });
  };

  const addPhase = () => {
    if (!isEditing) return;
    const phases = ensurePayment(currentTerms).phases;
    updatePayment({
      phases: [...phases, emptyPhase()],
    });
  };

  const updatePhase = (index: number, patch: Partial<TermPhase>) => {
    if (!isEditing) return;
    const phases = ensurePayment(currentTerms).phases;
    const next = phases.map((p, i) => (i === index ? { ...p, ...patch } : p));
    updatePayment({ phases: next });
  };

 const removePhase = (index: number) => {
  if (!isEditing) return;

  const phases = ensurePayment(currentTerms).phases;

  const next = phases.filter((_, i) => i !== index);

  updatePayment({ phases: next });
};

  const renderPaymentTable = () => {
    const payment = ensurePayment(currentTerms);
    const rawPhases = payment.phases as LocalPhase[];

    return (
      <div className="space-y-5">
        {/* Table */}
        <div className="border border-theme rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head">
                <th className="px-3 py-2 text-left font-medium text-muted">
                  #
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted">
                  Phase
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted">
                  Percentage
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted">
                  Condition
                </th>
                <th className="px-3 py-2 text-center font-medium text-muted">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {rawPhases.map((p, idx) => {
                if (p.isDelete === 1) return null;

                return (
                  <tr
                    key={idx}
                    className="border-b border-theme row-hover last:border-0"
                  >
                    <td className="px-3 py-2">{idx + 1}</td>

                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          className="w-full bg-transparent text-muted outline-none"
                          value={p.name}
                          onChange={(e) =>
                            updatePhase(idx, { name: e.target.value })
                          }
                        />
                      ) : (
                        <span>{p.name}</span>
                      )}
                    </td>

                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          className="w-full bg-transparent text-muted outline-none"
                          value={p.percentage}
                          onChange={(e) =>
                            updatePhase(idx, { percentage: e.target.value })
                          }
                        />
                      ) : (
                        <span>{p.percentage}</span>
                      )}
                    </td>

                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          className="w-full bg-transparent text-muted outline-none"
                          value={p.condition}
                          onChange={(e) =>
                            updatePhase(idx, { condition: e.target.value })
                          }
                        />
                      ) : (
                        <span>{p.condition}</span>
                      )}
                    </td>

                    <td className="px-3 py-2 text-center">
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removePhase(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {isEditing && (
          <div className="flex justify-end w-full">
            <button
              type="button"
              onClick={addPhase}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm flex items-center gap-2"
            >
              <FaPlus className="w-4 h-4" /> Add Phase
            </button>
          </div>
        )}

        {/* Additional Payment Inputs */}
        <div className="space-y-3 text-sm">
          <LabeledRow
            label="Due Dates:"
            value={payment.dueDates ?? ""}
            disabled={!isEditing}
            onChange={(v) => updatePayment({ dueDates: v })}
          />

          <LabeledRow
            label="Late Payment Charges:"
            value={payment.lateCharges ?? ""}
            disabled={!isEditing}
            onChange={(v) => updatePayment({ lateCharges: v })}
          />

          <LabeledRow
            label="Tax / Additional Charges:"
            value={payment.taxes ?? ""}
            disabled={!isEditing}
            onChange={(v) => updatePayment({ taxes: v })}
          />

          <LabeledRow
            label="Notes:"
            value={payment.notes ?? ""}
            disabled={!isEditing}
            onChange={(v) => updatePayment({ notes: v })}
          />
        </div>
      </div>
    );
  };

  const renderTextSection = (field: keyof TermSection) => (
    <textarea
      disabled={!isEditing}
      value={(currentTerms[field] as string) ?? ""}
      onChange={(e) => updateTopField(field, e.target.value)}
      placeholder={`Enter ${selectedTemplate.toLowerCase()}...`}
      className="w-full h-55 bg-card border border-theme rounded-lg px-4 py-3 text-sm text-main focus:ring-2 outline-none"
    />
  );

  return (
    <div className="bg-card rounded-xl border border-theme shadow-sm overflow-hidden">
      <div
        className="px-4 py-2 border-b border-theme flex items-center gap-3"
        style={{
          background: "var(--primary-600)",
          color: "var(--table-head-text)",
        }}
      >
        <h2 className="font-semibold text-white text-sm">
          {title ?? "Terms & Conditions"}
        </h2>

        <select
          disabled={isEditing}
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="ml-auto px-2 py-1 rounded bg-card border border-theme text-sm text-white"
        >
          {TABS.map((tab) => (
            <option key={tab} value={tab} className="text-main">
              {tab}
            </option>
          ))}
        </select>
      </div>

      {/* CONTENT AREA */}
      <div className="p-5 rounded-lg border bg-white shadow-inner min-h-[100px]">
        {activeKey === "payment"
          ? renderPaymentTable()
          : renderTextSection(activeKey)}
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-3 p-4 border-t border-theme">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={cancelEditing}
              className="px-4 py-2 bg-card border border-theme text-muted rounded-lg"
            >
              <FaTimes className="inline mr-2" /> Cancel
            </button>

            <button
              type="button"
              onClick={saveEditing}
              className="px-5 py-2 rounded-lg text-white font-medium"
              style={{
                background:
                  "linear-gradient(90deg, var(--primary) 0%, var(--primary-600) 100%)",
              }}
            >
              <FaCheck className="inline mr-2" /> Save Terms
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="px-5 py-2 bg-primary text-white rounded-lg font-medium flex items-center gap-2"
          >
            <FaEdit /> Edit
          </button>
        )}
      </div>
    </div>
  );
};

const LabeledRow = ({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
}) => (
  <div className="flex text-sm">
    <span className="w-40 flex-shrink-0 text-muted font-medium">{label}</span>
    <input
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 bg-transparent text-muted outline-none"
    />
  </div>
);

export default TermsAndCondition;
