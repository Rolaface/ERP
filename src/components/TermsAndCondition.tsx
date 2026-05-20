import React, { useState } from "react";
import { useEffect } from "react";
import {
  FaEdit,
  FaTimes,
  FaCheck,
  FaPlus,
  FaTrash,
  FaFileAlt,
} from "react-icons/fa";
import { MdOutlineTextFields, MdOutlineCalendarToday } from "react-icons/md";
import { NumericInput } from "../components/ui/modal/modalComponent";
import type {
  TermSection,
  PaymentTerms,
  TermPhase,
} from "../types/termsAndCondition";
import TermsPreviewModal from "./termsprovidemodal";

interface Props {
  title?: string;
  terms: TermSection | null;
  setTerms: (updated: TermSection) => void;
  type?: "buying" | "selling";
}

type LocalPhase = TermPhase & { id?: string; isDelete?: number };

const TABS: { label: string; short: string; key: keyof TermSection }[] = [
  { label: "General Service Terms", short: "General", key: "general" },
  { label: "Payment Terms", short: "Payment", key: "payment" },
  { label: "Service Delivery Terms", short: "Delivery", key: "delivery" },
  {
    label: "Cancellation / Refund Policy",
    short: "Cancellation",
    key: "cancellation",
  },
  { label: "Warranty", short: "Warranty", key: "warranty" },
  { label: "Limitations and Liability", short: "Liability", key: "liability" },
];

const emptyPhase = (): TermPhase => ({
  id: "",
  name: "",
  percentage: "",
  condition: "",
  credit_days: "",
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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
export function extractNumber(value: string): string {
  const m = value.match(/\d+(\.\d+)?/);
  return m ? m[0] : "";
}

export function isTemplateValue(value: string, suffixKeyword: string): boolean {
  if (!value.trim()) return true;
  return value.toLowerCase().includes(suffixKeyword.toLowerCase());
}

// ─────────────────────────────────────────────────────────────────────────────
// ConditionCell
// ─────────────────────────────────────────────────────────────────────────────
interface ConditionCellProps {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}

export const ConditionCell: React.FC<ConditionCellProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const [isCustom, setIsCustom] = useState(() => {
    if (!value) return false;
    return !/^payable within \d+(\.\d+)? days$/i.test(value.trim());
  });
  const [numVal, setNumVal] = useState(() => extractNumber(value));

  const buildFull = (n: string) => (n ? `Payable within ${n} days` : "");

  const handleNumChange = (n: string) => {
    setNumVal(n);
    onChange(buildFull(n));
  };

  const toggle = () => {
    if (isCustom) {
      const n = extractNumber(value);
      setNumVal(n);
      onChange(buildFull(n));
      setIsCustom(false);
    } else {
      setIsCustom(true);
    }
  };

  if (disabled) {
    return (
      <span className="text-sm truncate block" title={value}>
        {value || "—"}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {isCustom ? (
        <input
          className="flex-1 min-w-0 bg-transparent text-muted outline-none border-b border-theme focus:border-primary text-sm"
          value={value}
          placeholder="Enter condition..."
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <span className="text-muted text-sm whitespace-nowrap">
            Payable within
          </span>
          <NumericInput
            name="conditionDays"
            value={numVal ? Number(numVal) : null}
            placeholder="0"
            onChange={(value) =>
              handleNumChange(value == null ? "" : String(value))
            }
            className="w-10 text-center"
          />
          <span className="text-muted text-sm whitespace-nowrap">days</span>
        </div>
      )}
      <button
        type="button"
        title={isCustom ? "Switch to days template" : "Switch to custom text"}
        onClick={toggle}
        className="flex-shrink-0 text-muted hover:text-primary transition-colors"
      >
        {isCustom ? (
          <MdOutlineCalendarToday size={14} />
        ) : (
          <MdOutlineTextFields size={14} />
        )}
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TemplateField
// ─────────────────────────────────────────────────────────────────────────────
export interface TemplateFieldProps {
  prefix: string;
  suffix: string;
  suffixKeyword: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  inputWidth?: string;
}

export const TemplateField: React.FC<TemplateFieldProps> = ({
  prefix,
  suffix,
  suffixKeyword,
  value,
  onChange,
  disabled,
  inputWidth = "w-14",
}) => {
  const [isCustom, setIsCustom] = useState(
    () => !!value && !isTemplateValue(value, suffixKeyword),
  );
  const [numVal, setNumVal] = useState(() => extractNumber(value));

  const buildFull = (n: string) => (n ? `${prefix} ${n} ${suffix}` : "");

  const handleNumChange = (n: string) => {
    setNumVal(n);
    onChange(buildFull(n));
  };

  const toggle = () => {
    if (isCustom) {
      const n = extractNumber(value);
      setNumVal(n);
      onChange(buildFull(n));
      setIsCustom(false);
    } else {
      setIsCustom(true);
    }
  };

  if (disabled) {
    return <span className="text-muted text-sm">{value || "—"}</span>;
  }

  return (
    <div className="flex items-center gap-1.5 flex-1">
      {isCustom ? (
        <input
          className="flex-1 bg-transparent text-muted outline-none border-b border-theme focus:border-primary text-sm"
          value={value}
          placeholder="Enter full text..."
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="flex items-center gap-1.5 flex-1 flex-wrap">
          <span className="text-muted text-sm whitespace-nowrap">{prefix}</span>
          <NumericInput
            name="templateNumber"
            value={numVal ? Number(numVal) : null}
            placeholder="0"
            onChange={(value) =>
              handleNumChange(value == null ? "" : String(value))
            }
            className={inputWidth}
          />
          <span className="text-muted text-sm whitespace-nowrap">{suffix}</span>
        </div>
      )}
      <button
        type="button"
        title={isCustom ? "Switch to template" : "Switch to custom text"}
        onClick={toggle}
        className="flex-shrink-0 text-muted hover:text-primary transition-colors"
      >
        {isCustom ? (
          <MdOutlineCalendarToday size={14} />
        ) : (
          <MdOutlineTextFields size={14} />
        )}
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
const TermsAndCondition: React.FC<Props> = ({
  title,
  terms,
  setTerms,
  type,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<TermSection | null>(null);

  const baseTerms: TermSection = terms ?? emptyTerms;
  const currentTerms: TermSection = isEditing
    ? (draft ?? baseTerms)
    : baseTerms;
  const activeKey = TABS[activeTab].key;

  const ensurePayment = (src: TermSection): PaymentTerms => ({
    phases: src.payment?.phases ?? [],
    dueDates: src.payment?.dueDates ?? "",
    lateCharges: src.payment?.lateCharges ?? "",
    taxes: src.payment?.taxes ?? "",
    notes: src.payment?.notes ?? "",
  });

  const getTotalPercentage = (phases: TermPhase[]) =>
    phases.reduce((sum, p) => sum + Number(p.percentage || 0), 0);

  const currentPaymentPhases = ensurePayment(currentTerms).phases;
  const totalPercentage = getTotalPercentage(currentPaymentPhases);
  const isOverLimit = totalPercentage > 100;

  const getDueDate = (days: number) => {
    if (!days) return "";
    const today = new Date();
    today.setDate(today.getDate() + days);
    return today.toLocaleDateString("en-GB");
  };

  useEffect(() => {
    if (!isEditing) return;

    const total = currentPaymentPhases.reduce(
      (sum, p) => sum + Number(p.credit_days || 0),
      0,
    );

    updatePayment({
      dueDates: total ? `Payment due within ${total} days` : "",
    });
  }, [currentPaymentPhases]);

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
    if (isOverLimit) return;
    setTerms(draft);
    setDraft(null);
    setIsEditing(false);
  };

  const updateDraft = (updater: (prev: TermSection) => TermSection) => {
    if (!isEditing) return;
    setDraft((prev) => updater(prev ?? baseTerms));
  };

  const updateTopField = (key: keyof TermSection, value: string) =>
    updateDraft((prev) => ({ ...prev, [key]: value }));

  const updatePayment = (patch: Partial<PaymentTerms>) =>
    updateDraft((prev) => ({
      ...prev,
      payment: { ...ensurePayment(prev), ...patch },
    }));

  const addPhase = () => {
    if (!isEditing) return;
    updatePayment({
      phases: [...ensurePayment(currentTerms).phases, emptyPhase()],
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
    const next = ensurePayment(currentTerms).phases.filter(
      (_, i) => i !== index,
    );
    updatePayment({ phases: next });
  };

  const totalCreditDays = currentPaymentPhases.reduce(
    (sum, p) => sum + Number(p.credit_days || 0),
    0,
  );

  const renderPaymentTable = () => {
    const payment = ensurePayment(currentTerms);
    const rawPhases = payment.phases as LocalPhase[];

    return (
      <div className="space-y-4">
        <div className="border border-theme rounded-lg overflow-visible">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col style={{ width: 32 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 86 }} />
              <col />
              <col style={{ width: 110 }} />
              <col style={{ width: 36 }} />
            </colgroup>
            <thead>
              <tr className="table-head">
                <th className="px-3 py-2 text-left text-xs font-medium">#</th>
                <th className="px-3 py-2 text-left text-xs font-medium">
                  Phase
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium">%</th>
                <th className="px-3 py-2 text-left text-xs font-medium">
                  Description
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium">
                  Credit Days
                </th>
              </tr>
            </thead>
            <tbody>
              {rawPhases.map((p, idx) => {
                if (p.isDelete === 1) return null;
                return (
                  <tr
                    key={idx}
                    className="border-t border-theme row-hover align-middle"
                  >
                    <td className="px-3 py-2.5 text-xs text-muted">
                      {idx + 1}
                    </td>

                    <td className="px-3 py-2.5 overflow-hidden">
                      {isEditing ? (
                        <input
                          className="w-full bg-transparent text-muted outline-none text-sm"
                          value={p.name}
                          onChange={(e) =>
                            updatePhase(idx, { name: e.target.value })
                          }
                        />
                      ) : (
                        <span className="block truncate text-sm" title={p.name}>
                          {p.name || "—"}
                        </span>
                      )}
                    </td>

                    {/* % cell — text turns danger color when over limit */}
                    <td className="px-3 py-2.5 overflow-hidden">
                      {isEditing ? (
                        <NumericInput
                          name="percentage"
                          value={p.percentage ? Number(p.percentage) : null}
                          placeholder="0"
                          onChange={(value) =>
                            updatePhase(idx, {
                              percentage: value == null ? "" : String(value),
                            })
                          }
                          className={`w-full ${
                            isOverLimit ? "text-danger" : "text-muted"
                          }`}
                        />
                      ) : (
                        <span className="text-sm">{p.percentage || "—"}</span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 overflow-hidden">
                      {isEditing ? (
                        <input
                          className="w-full bg-transparent text-muted outline-none text-sm"
                          value={p.condition}
                          placeholder="Enter description..."
                          onChange={(e) =>
                            updatePhase(idx, { condition: e.target.value })
                          }
                        />
                      ) : (
                        <span
                          className="block truncate text-sm"
                          title={p.condition}
                        >
                          {p.condition || "—"}
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 overflow-hidden">
                      {isEditing ? (
                        <NumericInput
                          name="credit_days"
                          value={p.credit_days ? Number(p.credit_days) : null}
                          placeholder="0"
                          onChange={(value) =>
                            updatePhase(idx, {
                              credit_days: value == null ? "" : String(value),
                            })
                          }
                          className="w-full text-center"
                        />
                      ) : (
                        <span className="text-sm font-medium block text-center">
                          {p.credit_days || "—"}
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-center align-middle">
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removePhase(idx)}
                          className="flex items-center justify-center text-danger opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <FaTrash size={11} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Fixed-height slot for over-limit warning */}
        <div style={{ minHeight: 16 }} className="flex items-center">
          {isEditing && isOverLimit && (
            <span className="text-danger text-xs">
              Total percentage cannot exceed 100% (currently {totalPercentage}%)
            </span>
          )}
        </div>

        {isEditing && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={addPhase}
              className="px-4 py-1.5 bg-primary text-white rounded-lg text-sm flex items-center gap-1.5"
            >
              <FaPlus size={11} /> Add Phase
            </button>
          </div>
        )}

        <div className="space-y-2 text-sm pt-1">
          <div className="flex items-center min-h-[28px]">
            <span className="w-48 flex-shrink-0 text-muted font-medium">
              Due Dates:
            </span>
            <TemplateField
              prefix="Payment due within"
              suffix="days"
              suffixKeyword="days"
              value={`Payment due within ${totalCreditDays} days ${
                totalCreditDays ? `(Due on ${getDueDate(totalCreditDays)})` : ""
              }`}
              onChange={() => {}}
              disabled={true}
            />
          </div>
          <div className="flex items-center min-h-[28px]">
            <span className="w-48 flex-shrink-0 text-muted font-medium">
              Late Payment Charges:
            </span>
            <TemplateField
              prefix="Late payment charges"
              suffix="% per annum"
              suffixKeyword="%"
              value={payment.lateCharges ?? ""}
              onChange={(v) => updatePayment({ lateCharges: v })}
              disabled={!isEditing}
            />
          </div>
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

  const renderTextSection = (key: keyof TermSection, label: string) => (
    <textarea
      disabled={!isEditing}
      value={(currentTerms[key] as string) ?? ""}
      onChange={(e) => updateTopField(key, e.target.value)}
      placeholder={`Enter ${label.toLowerCase()}...`}
      className="w-full h-48 bg-card border border-theme rounded-lg px-4 py-3 text-sm text-main focus:ring-2 outline-none resize-none"
    />
  );

  return (
    <>
      <TermsPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={title}
        terms={terms}
        setTerms={setTerms}
        type={type}
      />

      <div className="bg-card rounded-xl border border-theme shadow-sm overflow-hidden">
        {/* Header */}
        <div
          className="px-4 py-2.5 flex items-center"
          style={{ background: "var(--primary-600)" }}
        >
          <h2 className="font-semibold text-white text-sm">
            {title ?? "Terms & Conditions"}
          </h2>
          <div className="ml-auto">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-white border border-white/30 hover:bg-white/15 transition-colors"
            >
              <FaFileAlt size={10} /> Preview All
            </button>
          </div>
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-theme bg-card overflow-x-auto">
          {TABS.map((tab, i) => (
            <button
              key={tab.key}
              type="button"
              disabled={false}
              onClick={() => setActiveTab(i)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all
                ${i === activeTab ? "text-white shadow-sm" : "text-muted hover:bg-theme"}
                
              `}
              style={
                i === activeTab ? { background: "var(--primary-600)" } : {}
              }
            >
              {tab.short}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 bg-card min-h-[120px]">
          {activeKey === "payment"
            ? renderPaymentTable()
            : renderTextSection(activeKey, TABS[activeTab].label)}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-4 py-3 border-t border-theme">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={cancelEditing}
                className="px-4 py-1.5 bg-card border border-theme text-muted rounded-lg text-sm flex items-center gap-1.5"
              >
                <FaTimes size={11} /> Cancel
              </button>

              <button
                type="button"
                onClick={saveEditing}
                disabled={isOverLimit}
                title={
                  isOverLimit
                    ? `Total is ${totalPercentage}% — must be 100% or less`
                    : ""
                }
                className={`px-5 py-1.5 rounded-lg text-white text-sm font-medium flex items-center gap-1.5 transition-all duration-200 ${
                  isOverLimit ? "opacity-40 cursor-not-allowed" : ""
                }`}
                style={
                  !isOverLimit
                    ? {
                        background:
                          "linear-gradient(90deg, var(--primary) 0%, var(--primary-600) 100%)",
                      }
                    : { background: "var(--muted)" }
                }
              >
                <FaCheck size={11} /> Apply Changes
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="px-5 py-1.5 bg-primary text-white rounded-lg text-sm font-medium flex items-center gap-1.5"
            >
              <FaEdit size={11} /> Edit
            </button>
          )}
        </div>
      </div>
    </>
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
  <div className="flex items-center min-h-[28px]">
    <span className="w-48 flex-shrink-0 text-muted font-medium">{label}</span>
    <input
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 bg-transparent text-muted outline-none text-sm"
    />
  </div>
);

export default TermsAndCondition;
