import React, { useEffect, useState, useCallback } from "react";
import {
  Layers,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Tag,
  AlertCircle,
} from "lucide-react";
import { getAllTemplates } from "../../api/salesTaxTemplateApi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TemplateTax {
  name?: string;
  charge_type: string;
  account_head: string;
  rate: number;
  tax_amount: number;
  description?: string;
}

interface Template {
  name: string;
  title: string;
  disabled: number;
  is_default?: number;
  taxes: TemplateTax[];
}

interface InvoiceCharge {
  charge_type: string;
  amount: string;
  rate?: string;
}

interface Totals {
  subTotal: number;
  totalTax: number;
  grandTotal: number;
}

interface InvoiceChargesTabProps {
  charges: InvoiceCharge[];
  currency: string;
  totals: Totals;
  onAdd: () => void;
  onChange: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;

  selectedTemplate?: string;
  onTemplateSelect?: (templateName: string, taxes: TemplateTax[]) => void;

  taxes: any[];
  onTaxChange?: (index: number, field: string, value: any) => void; // ✅ ADD THIS
}

// ─── Component ────────────────────────────────────────────────────────────────

const InvoiceChargesTab: React.FC<InvoiceChargesTabProps> = ({
  charges,
  currency,
  totals,
  onAdd,
  onChange,
  onRemove,
  selectedTemplate = "",
  onTemplateSelect,
  taxes,
  onTaxChange,
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(true);

  // ── Fetch templates once on mount ─────────────────────────────────────────

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    setTemplateError(null);
    try {
      const res = await getAllTemplates(1, 50);
      setTemplates(res?.data?.templates ?? []);
    } catch (err: any) {
      setTemplateError("Failed to load templates");
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const activeTemplates = templates.filter((t) => !t.disabled);

  const selectedTemplateObj =
    templates.find((t) => t.name === selectedTemplate) ?? null;

  const chargesTotal = taxes.reduce(
    (sum, t) => sum + (Number(t.amount) || 0),
    0,
  );

  // CIF = subTotal + charges total + totalTax
  const cifValue = totals.subTotal + chargesTotal;
  // FOB = subTotal (Free On Board — before insurance/freight)
  const fobValue = totals.subTotal;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      onTemplateSelect?.("", []);
      return;
    }
    const tpl = templates.find((t) => t.name === val);
    onTemplateSelect?.(val, tpl?.taxes ?? []);
    setPreviewExpanded(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-4 items-start max-w-[1600px] mx-auto">
      {/* ── Left: Template + Charges ── */}
      <div className="flex-1 flex flex-col gap-4">
        {/* ── Sales Tax Template Selector ── */}
        <div className="bg-card rounded-lg border border-theme overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-theme">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-primary" />
              <span className="text-xs font-semibold text-main">
                Sales Tax Template
              </span>
              {selectedTemplateObj && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  {selectedTemplateObj.title}
                </span>
              )}
            </div>

            {selectedTemplateObj && selectedTemplateObj.taxes.length > 0 && (
              <button
                type="button"
                onClick={() => setPreviewExpanded((p) => !p)}
                className="flex items-center gap-1 text-[10px] text-muted hover:text-main transition-colors bg-transparent border-none cursor-pointer"
              >
                {previewExpanded ? (
                  <>
                    <ChevronDown size={12} /> Hide details
                  </>
                ) : (
                  <>
                    <ChevronRight size={12} /> Show details
                  </>
                )}
              </button>
            )}
          </div>

          {/* Selector */}
          <div className="px-4 py-3">
            {templateError ? (
              <div className="flex items-center gap-2 text-xs text-danger">
                <AlertCircle size={13} />
                {templateError}
                <button
                  type="button"
                  onClick={fetchTemplates}
                  className="underline bg-transparent border-none cursor-pointer text-xs text-primary"
                >
                  Retry
                </button>
              </div>
            ) : (
              <select
                className="w-full border border-theme rounded px-2 py-1.5 text-xs text-main bg-app focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                value={selectedTemplate}
                onChange={handleTemplateChange}
                disabled={loadingTemplates}
              >
                <option value="">
                  {loadingTemplates
                    ? "Loading templates..."
                    : "-- Select a Sales Tax Template (optional) --"}
                </option>
                {activeTemplates.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.title}
                    {t.taxes.length > 0
                      ? ` (${t.taxes.length} charge${t.taxes.length > 1 ? "s" : ""})`
                      : ""}
                  </option>
                ))}
              </select>
            )}

            {/* Clear template */}
            {selectedTemplate && (
              <button
                type="button"
                onClick={() => onTemplateSelect?.("", [])}
                className="mt-1.5 text-[10px] text-muted hover:text-danger transition-colors bg-transparent border-none cursor-pointer"
              >
                × Clear template
              </button>
            )}
          </div>

          {/* Template charges preview */}
          {taxes && taxes.length > 0 && (
            <div className="border-t border-theme">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-primary/5">
                    <th className="px-4 py-2 text-left w-[15%]">
                      Account Head
                    </th>
                    <th className="px-4 py-2 text-left w-[20%]">Charge Type</th>
                    <th className="px-4 py-2 text-left w-[12%]">Rate(%)</th>
                    <th className="px-4 py-2 text-left w-[12%]">Amount</th>
                    <th className="px-4 py-2 text-left w-[30%]">Description</th>
                  </tr>
                </thead>

                <tbody>
                  {taxes.map((tax, i) => (
                    <tr key={i} className="border-t border-theme">
                      <td className="w-[20%] py-1 px-2">
                        <div className="w-full py-1 px-2 border border-transparent rounded text-[11px] text-main bg-primary/5">
                          {tax.accountHead || "-"}
                        </div>
                      </td>

                      <td className="w-[10%] py-1 px-2">
                        <div className="py-1 px-2 text-[11px] text-main">
                          {tax.chargeType}
                        </div>
                      </td>

                      <td className="w-[15%] py-1 px-2">
                        <input
                          type="number"
                          value={tax.rate ?? ""}
                          onChange={(e) =>
                            onTaxChange?.(i, "rate", e.target.value)
                          }
                          disabled={tax.chargeType === "Actual"}
                          className={`w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card focus:outline-none focus:ring-1 focus:ring-primary no-spinner ${
                            tax.chargeType === "Actual"
                              ? "opacity-40 cursor-not-allowed"
                              : ""
                          }`}
                        />
                      </td>

                      <td className="w-[15%] py-1 px-2">
                        <input
                          type="number"
                          value={tax.amount ?? ""}
                          onChange={(e) =>
                            onTaxChange?.(i, "amount", e.target.value)
                          }
                          disabled={tax.chargeType !== "Actual"}
                          className={`w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card focus:outline-none focus:ring-1 focus:ring-primary no-spinner ${
                            tax.chargeType !== "Actual"
                              ? "opacity-40 cursor-not-allowed"
                              : ""
                          }`}
                        />
                      </td>

                      <td className="w-[40%] py-1 px-2">
                        <input
                          value={tax.description}
                          onChange={(e) =>
                            onTaxChange?.(i, "description", e.target.value)
                          }
                          className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedTemplateObj && selectedTemplateObj.taxes.length === 0 && (
            <div className="px-4 pb-3 text-xs text-muted italic">
              This template has no charges defined.
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Summary panel ── */}
      <div className="w-[220px] shrink-0 flex flex-col gap-3 sticky top-0">
        {/* CIF */}
        <div className="bg-card border border-theme rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs font-semibold text-main">Summary</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Subtotal</span>
              <span className="font-medium text-main">
                {totals.subTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Tax</span>
              <span className="font-medium text-main">
                {totals.totalTax.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Charges</span>
              <span className="font-medium text-main">
                {chargesTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* CIF Value */}
        <div className="bg-card border border-theme rounded-lg p-3">
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
            CIF Value
          </p>
          <p className="text-[10px] text-muted mb-2">
            Cost + Insurance + Freight
          </p>
          <p className="text-lg font-bold text-main">{cifValue.toFixed(2)}</p>
        </div>

        {/* FOB Value */}
        <div
          className="rounded-lg p-3"
          style={{ background: "var(--primary, #c97d2e)" }}
        >
          <div className="flex items-center gap-1 mb-1">
            <svg
              className="w-3 h-3 text-white/80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            <p className="text-[10px] font-bold text-white/90 uppercase tracking-wider">
              FOB Value
            </p>
          </div>
          <p className="text-[10px] text-white/70 mb-1">Free On Board</p>
          <p className="text-xl font-bold text-white">{fobValue.toFixed(2)}</p>
        </div>

        {/* Grand total */}
        <div className="bg-card border border-theme rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-main">Grand Total</span>
            <span className="text-sm font-bold text-primary">
              {totals.grandTotal.toFixed(2)}
            </span>
          </div>
          {currency && (
            <p className="text-[10px] text-muted mt-0.5 text-right">
              {currency}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceChargesTab;
