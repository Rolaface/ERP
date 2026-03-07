import React, { useState } from "react";
import { FaEdit, FaTimes, FaCheck, FaPlus, FaTrash } from "react-icons/fa";
import type {
  TermSection,
  PaymentTerms,
  TermPhase,
} from "../types/termsAndCondition";

interface Props {
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
  tax: "",
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

const TermsAndCondition: React.FC<Props> = ({ terms, setTerms }) => {
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
    tax: src.payment?.tax ?? "",
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

    const phases = ensurePayment(currentTerms).phases as LocalPhase[];

    const next = phases
      .map((p, i) => {
        if (i !== index) return p;

        if (p.id) {
          return { ...p, isDelete: 1 };
        }

        return null;
      })
      .filter(Boolean) as LocalPhase[];

    updatePayment({ phases: next });
  };

  const renderPaymentTable = () => {
    const payment = ensurePayment(currentTerms);
    const rawPhases = payment.phases as LocalPhase[];

    return (
      <div className="space-y-5">
        {/* Section Title */}
        <div className="flex items-center justify-between pb-1 border-b">
          <h4 className="text-lg font-semibold text-main">Payment Structure</h4>

          {isEditing && (
            <button
              onClick={addPhase}
              type="button"
              className="flex items-center gap-2 px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary-600 transition"
            >
              <FaPlus /> Add Phase
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-lg border border-theme bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="table-head border-b border-theme">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-main">#</th>
                <th className="px-4 py-3 text-left font-medium text-main">
                  Phase
                </th>
                <th className="px-4 py-3 text-left font-medium text-main">
                  Percentage
                </th>
                <th className="px-4 py-3 text-left font-medium text-main">
                  Condition
                </th>
                <th className="px-4 py-3 text-center font-medium text-main w-12">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {rawPhases.map((p, realIndex) => {
                if (p.isDelete === 1) return null; // hide deleted rows

                return (
                  <tr key={realIndex} className="row-hover">
                    <td className="px-4 py-2">
                      <span className="text-main">{realIndex + 1}</span>
                    </td>

                    {/* PHASE */}
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <input
                          className="w-full border rounded px-2 py-1 text-sm"
                          value={p.name}
                          onChange={(e) =>
                            updatePhase(realIndex, { name: e.target.value })
                          }
                        />
                      ) : (
                        <span className="text-main">{p.name}</span>
                      )}
                    </td>

                    {/* PERCENTAGE */}
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <input
                          className="w-full border rounded px-2 py-1 text-sm"
                          value={p.percentage}
                          onChange={(e) =>
                            updatePhase(realIndex, {
                              percentage: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <span>{p.percentage}</span>
                      )}
                    </td>

                    {/* CONDITION */}
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <input
                          className="w-full border rounded px-2 py-1 text-sm"
                          value={p.condition}
                          onChange={(e) =>
                            updatePhase(realIndex, {
                              condition: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <span>{p.condition}</span>
                      )}
                    </td>

                    {/* DELETE */}
                    <td className="px-4 py-2 text-center">
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removePhase(realIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {rawPhases.filter((p) => p.isDelete !== 1).length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-4 text-center text-muted italic"
                  >
                    No phases added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* EXTRA PAYMENT FIELDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Due Dates"
            disabled={!isEditing}
            value={payment.dueDates ?? ""}
            onChange={(v) => updatePayment({ dueDates: v })}
          />
          <InputField
            label="Late Charges"
            disabled={!isEditing}
            value={payment.lateCharges ?? ""}
            onChange={(v) => updatePayment({ lateCharges: v })}
          />
          <InputField
            label="Tax"
            disabled={!isEditing}
            value={payment.tax ?? ""}
            onChange={(v) => updatePayment({ tax: v })}
          />
        </div>

        <TextareaField
          label="Notes"
          disabled={!isEditing}
          value={payment.notes ?? ""}
          onChange={(v) => updatePayment({ notes: v })}
        />
      </div>
    );
  };

  const renderTextSection = (field: keyof TermSection) => (
    <TextareaField
      label={selectedTemplate}
      disabled={!isEditing}
      value={(currentTerms[field] as string) ?? ""}
      onChange={(v) => updateTopField(field, v)}
    />
  );

  return (
    <div className="p-6 space-y-8 bg-card text-main rounded-lg border border-theme mt-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-main">Terms & Conditions</h2>

        <div className="flex items-center gap-3">
          <label className="text-sm text-muted font-medium">
            Choose Section
          </label>

          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            disabled={isEditing}
            className="px-3 py-1.5 border border-theme rounded-md bg-app row-hover text-sm"
          >
            {TABS.map((tab) => (
              <option key={tab}>{tab}</option>
            ))}
          </select>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="p-5 rounded-lg border border-theme bg-card min-h-[auto]">
        {activeKey === "payment"
          ? renderPaymentTable()
          : renderTextSection(activeKey)}
      </div>

      {/* BUTTONS */}
      <div className="flex justify-end gap-3 pt-2">
        {isEditing ? (
          <>
            <button
              type="button"
              className="px-5 py-2 rounded-md bg-app border border-theme text-main row-hover flex items-center gap-2"
              onClick={cancelEditing}
            >
              <FaTimes /> Cancel
            </button>

            <button
              type="button"
              className="px-5 py-2 rounded-md bg-primary text-white hover:bg-primary-600 flex items-center gap-2"
              onClick={saveEditing}
            >
              <FaCheck /> Save
            </button>
          </>
        ) : (
          <button
            type="button"
            className="px-6 py-2 rounded-md bg-primary text-white hover:bg-primary-600 flex items-center gap-2"
            onClick={startEditing}
          >
            <FaEdit /> Edit
          </button>
        )}
      </div>
    </div>
  );
};

const InputField = ({
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
  <label className="space-y-1 text-sm">
    <span className="font-medium text-main">{label}</span>
    <input
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 rounded border text-sm ${
        disabled
          ? "bg-app text-muted cursor-not-allowed"
          : "focus:ring-2 focus:ring-primary/30"
      }`}
    />
  </label>
);

const TextareaField = ({
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
  <label className="space-y-1 text-sm">
    <span className="font-medium text-main">{label}</span>
    <textarea
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 min-h-[140px] rounded border text-sm ${
        disabled
          ? "bg-app text-muted cursor-not-allowed"
          : "focus:ring-2 focus:ring-primary/30"
      }`}
    />
  </label>
);

export default TermsAndCondition;
