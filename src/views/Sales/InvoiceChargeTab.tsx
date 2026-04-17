import React, { useEffect, useState, useCallback } from "react";
import { Layers, Plus, Trash2, ChevronDown, ChevronRight, Tag, AlertCircle } from "lucide-react";
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
  charge_type: string; // maps to accountHead in payload
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
  // Template props
  selectedTemplate?: string;
  onTemplateSelect?: (templateName: string, taxes: TemplateTax[]) => void;
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

  const selectedTemplateObj = templates.find((t) => t.name === selectedTemplate) ?? null;

  const chargesTotal = charges.reduce((sum, ch) => sum + (Number(ch.amount) || 0), 0);

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
              <span className="text-xs font-semibold text-main">Sales Tax Template</span>
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
                  {loadingTemplates ? "Loading templates..." : "-- Select a Sales Tax Template (optional) --"}
                </option>
                {activeTemplates.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.title}
                    {t.taxes.length > 0 ? ` (${t.taxes.length} charge${t.taxes.length > 1 ? "s" : ""})` : ""}
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
          {selectedTemplateObj && selectedTemplateObj.taxes.length > 0 && previewExpanded && (
            <div className="border-t border-theme">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-primary/5">
                    <th className="text-left px-4 py-2 font-semibold text-muted text-[10px] uppercase tracking-wider">
                      Account Head
                    </th>
                    <th className="text-left px-4 py-2 font-semibold text-muted text-[10px] uppercase tracking-wider">
                      Charge Type
                    </th>
                    <th className="text-right px-4 py-2 font-semibold text-muted text-[10px] uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="text-right px-4 py-2 font-semibold text-muted text-[10px] uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-left px-4 py-2 font-semibold text-muted text-[10px] uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTemplateObj.taxes.map((tax, i) => (
                    <tr
                      key={i}
                      className="border-t border-theme transition-colors hover:bg-primary/5"
                      style={{ background: i % 2 !== 0 ? "rgba(var(--primary-rgb, 201,125,46),0.03)" : "transparent" }}
                    >
                      <td className="px-4 py-2 font-medium text-main text-xs">
                        {tax.account_head}
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-border/40 text-muted font-medium">
                          {tax.charge_type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {tax.charge_type === "Actual" ? (
                          <span className="text-muted italic text-[10px]">N/A</span>
                        ) : (
                          <span className="font-semibold text-primary text-xs">
                            {Number(tax.rate).toFixed(2)}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {Number(tax.tax_amount) > 0 ? (
                          <span className="font-semibold text-main text-xs">
                            {Number(tax.tax_amount).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-muted text-xs">
                        {tax.description || "—"}
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

        {/* ── Manual Charges Table ── */}
        {/* <div className="bg-card rounded-lg border border-theme overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-theme">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-primary" />
              <span className="text-xs font-semibold text-main">
                Shipping &amp; Other Charges
              </span>
              <span className="text-[10px] text-muted">
                {charges.length} charge{charges.length !== 1 ? "s" : ""} · Total{" "}
                {chargesTotal.toFixed(2)}
              </span>
            </div>
            <button
              type="button"
              onClick={onAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-primary text-white border-none cursor-pointer hover:opacity-90 transition-opacity"
            >
              <Plus size={12} />
              Add Charge
            </button>
          </div>

          {charges.length > 0 ? (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-primary/5">
                  <th className="text-center px-3 py-2 font-semibold text-muted text-[10px] uppercase tracking-wider w-10">
                    #
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-muted text-[10px] uppercase tracking-wider">
                    Charge Name / Account Head
                  </th>
                  <th className="text-right px-3 py-2 font-semibold text-muted text-[10px] uppercase tracking-wider w-40">
                    Amount
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {charges.map((charge, idx) => (
                  <tr
                    key={idx}
                    className="border-t border-theme group transition-colors hover:bg-primary/5"
                  >
                    <td className="px-3 py-2 text-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-semibold bg-border/50 text-muted">
                        {idx + 1}
                      </span>
                    </td>

                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={charge.charge_type}
                        onChange={(e) => onChange(idx, "charge_type", e.target.value)}
                        placeholder="e.g. Freight, Insurance, Handling..."
                        className="w-full bg-transparent border border-theme rounded px-2 py-1 text-xs text-main placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                      />
                    </td>

                    <td className="px-3 py-2">
                      <div className="relative">
                        <input
                          type="number"
                          value={charge.amount}
                          onChange={(e) => onChange(idx, "amount", e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="w-full bg-transparent border border-theme rounded px-2 py-1 text-xs text-right text-main placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                        />
                      </div>
                    </td>

                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => onRemove(idx)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-danger/10 text-muted hover:text-danger bg-transparent border-none cursor-pointer"
                        title="Remove charge"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="border-t-2 border-theme bg-primary/5">
                  <td colSpan={2} className="px-3 py-2 text-right text-xs font-semibold text-muted">
                    Total Charges
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-bold text-primary">
                    {chargesTotal.toFixed(2)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
              <Layers size={28} className="text-muted/30" />
              <p className="text-xs text-muted">No charges added yet.</p>
              <button
                type="button"
                onClick={onAdd}
                className="mt-1 text-xs text-primary underline bg-transparent border-none cursor-pointer"
              >
                Add a charge
              </button>
            </div>
          )}
        </div> */}
      </div>

      {/* ── Right: Summary panel ── */}
      <div className="w-[220px] shrink-0 flex flex-col gap-3 sticky top-0">
        {/* CIF */}
        <div className="bg-card border border-theme rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-primary text-sm">$</span>
            <span className="text-xs font-semibold text-main">Summary</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Subtotal</span>
              <span className="font-medium text-main">{totals.subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Tax</span>
              <span className="font-medium text-main">{totals.totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Charges</span>
              <span className="font-medium text-main">{chargesTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* CIF Value */}
        <div className="bg-card border border-theme rounded-lg p-3">
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
            CIF Value
          </p>
          <p className="text-[10px] text-muted mb-2">Cost + Insurance + Freight</p>
          <p className="text-lg font-bold text-main">{cifValue.toFixed(2)}</p>
        </div>

        {/* FOB Value */}
        <div className="rounded-lg p-3" style={{ background: "var(--primary, #c97d2e)" }}>
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
            <p className="text-[10px] text-muted mt-0.5 text-right">{currency}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceChargesTab;