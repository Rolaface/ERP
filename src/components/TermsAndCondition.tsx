import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaFileAlt } from "react-icons/fa";
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
  isViewMode?: boolean;
  compact?: boolean; // ← pass true inside modals/invoices
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
        <div className="flex items-center gap-1 flex-1 min-w-0 flex-wrap">
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
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      {isCustom ? (
        <input
          className="flex-1 bg-transparent text-muted outline-none border-b border-theme focus:border-primary text-sm min-w-0"
          value={value}
          placeholder="Enter full text..."
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="flex items-center gap-1.5 flex-1 flex-wrap min-w-0">
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
  isViewMode = false,
  compact = false,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const currentTerms: TermSection = terms ?? emptyTerms;
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
    const total = currentPaymentPhases.reduce(
      (sum, p) => sum + Number(p.credit_days || 0),
      0,
    );
    const current = ensurePayment(currentTerms).dueDates;
    const next = total ? `Payment due within ${total} days` : "";
    if (current !== next) {
      updatePayment({ dueDates: next });
    }
  }, [currentPaymentPhases]);

  const updateTopField = (key: keyof TermSection, value: string) =>
    setTerms({ ...currentTerms, [key]: value });

  const updatePayment = (patch: Partial<PaymentTerms>) =>
    setTerms({
      ...currentTerms,
      payment: { ...ensurePayment(currentTerms), ...patch },
    });

  const addPhase = () => {
    updatePayment({
      phases: [...ensurePayment(currentTerms).phases, emptyPhase()],
    });
  };

  const updatePhase = (index: number, patch: Partial<TermPhase>) => {
    const phases = ensurePayment(currentTerms).phases;
    const next = phases.map((p, i) => (i === index ? { ...p, ...patch } : p));
    updatePayment({ phases: next });
  };

  const removePhase = (index: number) => {
    const next = ensurePayment(currentTerms).phases.filter(
      (_, i) => i !== index,
    );
    updatePayment({ phases: next });
  };

  const totalCreditDays = currentPaymentPhases.reduce(
    (sum, p) => sum + Number(p.credit_days || 0),
    0,
  );

  // ── Cell padding — tighter in compact mode ──────────────────────────────────
  const cellPy = compact ? "py-1" : "py-2.5";

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderPaymentTable = () => {
    const payment = ensurePayment(currentTerms);
    const rawPhases = payment.phases as LocalPhase[];
    const visiblePhases = rawPhases.filter((p) => p.isDelete !== 1);

    return (
      <div className={compact ? "space-y-2" : "space-y-4"}>
        {/* Table */}
        <div className="border border-theme rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <colgroup>
              <col style={{ width: 28 }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: 64 }} />
              <col />
              <col style={{ width: 90 }} />
              {!isViewMode && <col style={{ width: 32 }} />}
            </colgroup>
            <thead>
              <tr className="table-head">
                <th className="px-2 py-1.5 text-left text-xs font-medium">#</th>
                <th className="px-2 py-1.5 text-left text-xs font-medium">Phase</th>
                <th className="px-2 py-1.5 text-left text-xs font-medium">%</th>
                <th className="px-2 py-1.5 text-left text-xs font-medium">Description</th>
                <th className="px-2 py-1.5 text-left text-xs font-medium">Credit Days</th>
                {!isViewMode && <th style={{ width: 32 }} />}
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
                    <td className={`px-2 ${cellPy} text-xs text-muted`}>{idx + 1}</td>

                    <td className={`px-2 ${cellPy} overflow-hidden`}>
                      {isViewMode ? (
                        <span className="block truncate text-xs" title={p.name}>
                          {p.name || "—"}
                        </span>
                      ) : (
                        <input
                          className="w-full bg-transparent text-muted outline-none text-xs"
                          value={p.name}
                          placeholder="Phase name..."
                          onChange={(e) =>
                            updatePhase(idx, { name: e.target.value })
                          }
                        />
                      )}
                    </td>

                    <td className={`px-2 ${cellPy} overflow-hidden`}>
                      {isViewMode ? (
                        <span className="text-xs">{p.percentage || "—"}</span>
                      ) : (
                        <NumericInput
                          name="percentage"
                          value={p.percentage ? Number(p.percentage) : null}
                          placeholder="0"
                          onChange={(value) =>
                            updatePhase(idx, {
                              percentage: value == null ? "" : String(value),
                            })
                          }
                          className={`w-full text-xs ${isOverLimit ? "text-danger" : "text-muted"}`}
                        />
                      )}
                    </td>

                    <td className={`px-2 ${cellPy} overflow-hidden`}>
                      {isViewMode ? (
                        <span className="block truncate text-xs" title={p.condition}>
                          {p.condition || "—"}
                        </span>
                      ) : (
                        <input
                          className="w-full bg-transparent text-muted outline-none text-xs"
                          value={p.condition}
                          placeholder="Enter description..."
                          onChange={(e) =>
                            updatePhase(idx, { condition: e.target.value })
                          }
                        />
                      )}
                    </td>

                    <td className={`px-2 ${cellPy} overflow-hidden`}>
                      {isViewMode ? (
                        <span className="text-xs font-medium block text-center">
                          {p.credit_days || "—"}
                        </span>
                      ) : (
                        <NumericInput
                          name="credit_days"
                          value={p.credit_days ? Number(p.credit_days) : null}
                          placeholder="0"
                          onChange={(value) =>
                            updatePhase(idx, {
                              credit_days: value == null ? "" : String(value),
                            })
                          }
                          className="w-full text-center text-xs"
                        />
                      )}
                    </td>

                    {!isViewMode && (
                      <td className={`px-2 ${cellPy} text-center align-middle`}>
                        <button
                          type="button"
                          onClick={() => removePhase(idx)}
                          className="flex items-center justify-center text-danger opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <FaTrash size={10} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}

              {visiblePhases.length === 0 && (
                <tr>
                  <td
                    colSpan={isViewMode ? 5 : 6}
                    className="px-3 py-3 text-center text-xs text-muted"
                  >
                    {isViewMode
                      ? "No phases defined."
                      : 'No phases yet. Click "+ Add Phase" below to begin.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Over-limit warning */}
        {!isViewMode && isOverLimit && (
          <span className="block text-danger text-xs">
            Total percentage cannot exceed 100% (currently {totalPercentage}%)
          </span>
        )}

        {/* "Add Phase" button — always below the table, size adapts to compact */}
        {!isViewMode && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={addPhase}
              className={`bg-primary text-white rounded-lg flex items-center gap-1.5 ${
                compact
                  ? "px-3 py-1 text-xs"
                  : "px-4 py-1.5 text-sm"
              }`}
            >
              <FaPlus size={compact ? 9 : 11} /> Add Phase
            </button>
          </div>
        )}

        {/* Payment meta fields */}
        {/* compact → 2-col grid; default → stacked */}
        <div
          className={
            compact
              ? "grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pt-2 border-t border-theme text-sm"
              : "space-y-2 text-sm pt-1"
          }
        >
          {/* Due Dates — always read-only */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-h-[24px]">
            <span className={`flex-shrink-0 text-muted font-medium text-xs ${compact ? "w-28" : "w-44"}`}>
              Due Dates:
            </span>
            <TemplateField
              prefix="Payment due within"
              suffix="days"
              suffixKeyword="days"
              value={`Payment due within ${totalCreditDays} days${
                totalCreditDays ? ` (Due on ${getDueDate(totalCreditDays)})` : ""
              }`}
              onChange={() => {}}
              disabled={true}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-h-[24px]">
            <span className={`flex-shrink-0 text-muted font-medium text-xs ${compact ? "w-28" : "w-44"}`}>
              Late Payment Charges:
            </span>
            <TemplateField
              prefix="Late payment charges"
              suffix="% per annum"
              suffixKeyword="%"
              value={payment.lateCharges ?? ""}
              onChange={(v) => updatePayment({ lateCharges: v })}
              disabled={isViewMode}
            />
          </div>

          <LabeledRow
            label="Tax / Additional Charges:"
            value={payment.taxes ?? ""}
            disabled={isViewMode}
            onChange={(v) => updatePayment({ taxes: v })}
            compact={compact}
          />
          <LabeledRow
            label="Notes:"
            value={payment.notes ?? ""}
            disabled={isViewMode}
            onChange={(v) => updatePayment({ notes: v })}
            compact={compact}
          />
        </div>
      </div>
    );
  };

  const renderTextSection = (key: keyof TermSection, label: string) => (
    <textarea
      disabled={isViewMode}
      value={(currentTerms[key] as string) ?? ""}
      onChange={(e) => updateTopField(key, e.target.value)}
      placeholder={`Enter ${label.toLowerCase()}...`}
      className={`w-full bg-card border border-theme rounded-lg px-4 py-3 text-sm text-main focus:ring-2 outline-none resize-none disabled:opacity-60 disabled:cursor-not-allowed ${
        compact ? "h-32" : "h-48"
      }`}
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

      <div className="bg-card rounded-xl border border-theme shadow-sm overflow-hidden w-full">
        {/* Header */}
        <div
          className="px-3 py-2 flex items-center gap-2"
          style={{ background: "var(--primary-600)" }}
        >
          <h2 className="font-semibold text-white text-xs sm:text-sm truncate flex-1 min-w-0">
            {title ?? "Terms & Conditions"}
          </h2>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-white border border-white/30 hover:bg-white/15 transition-colors whitespace-nowrap"
          >
            <FaFileAlt size={10} />
            <span>Preview</span>
          </button>
        </div>

        {/* Tab pills — always scrollable */}
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-theme bg-card overflow-x-auto scrollbar-none">
          {TABS.map((tab, i) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(i)}
              className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
                ${i === activeTab ? "text-white shadow-sm" : "text-muted hover:bg-theme"}`}
              style={i === activeTab ? { background: "var(--primary-600)" } : {}}
            >
              {tab.short}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={`bg-card ${compact ? "p-2 sm:p-3" : "p-3 sm:p-5"} min-h-[80px]`}>
          {activeKey === "payment"
            ? renderPaymentTable()
            : renderTextSection(activeKey, TABS[activeTab].label)}
        </div>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LabeledRow
// ─────────────────────────────────────────────────────────────────────────────
const LabeledRow = ({
  label,
  value,
  disabled,
  onChange,
  compact = false,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
  compact?: boolean;
}) => (
  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-h-[24px]">
    <span className={`flex-shrink-0 text-muted font-medium text-xs ${compact ? "w-28" : "w-44"}`}>
      {label}
    </span>
    <input
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={disabled ? "" : "Enter value..."}
      className="flex-1 min-w-0 bg-transparent text-muted outline-none text-xs disabled:opacity-60 disabled:cursor-not-allowed"
    />
  </div>
);

export default TermsAndCondition;