import React, { useState, useEffect } from "react";
import { Plus, Trash2, Package, TrendingDown, DollarSign, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { currencySymbols } from "../../constants/invoice.constants";

interface Props {
  charges: any[];
  currency?: string;
  totals: any;
  onAdd: () => void;
  onChange: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
}

const ITEMS_PER_PAGE = 6;

const InvoiceChargesTab: React.FC<Props> = ({
  charges = [],
  currency,
  totals,
  onAdd,
  onChange,
  onRemove,
}) => {
  const symbol = currencySymbols[currency || ""] || currency || "";
  const [page, setPage] = useState(0);

  const cif = totals?.grandTotal || 0;
  const otherChargesTotal = charges.reduce((sum, ch) => sum + Number(ch.amount || 0), 0);
  const fob = cif - otherChargesTotal;
  const totalCount = charges.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  useEffect(() => {
    const maxPage = Math.max(0, totalPages - 1);
    if (page > maxPage) setPage(maxPage);
  }, [totalCount]);

  useEffect(() => {
    if (totalCount === 0) return;
    setPage(Math.floor((totalCount - 1) / ITEMS_PER_PAGE));
  }, [totalCount]);

  const paginatedCharges = charges.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  const hasPages = totalCount > ITEMS_PER_PAGE;

  return (
    <div className="h-full w-full flex gap-4 p-1 items-start">

      {/* ── LEFT: Main charges table ── */}
      <div className="flex-1 min-w-0 flex flex-col bg-card border border-theme rounded-xl shadow-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-theme bg-app">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-main">Shipping &amp; Other Charges</h3>
              <p className="text-[10px] text-muted mt-0.5">
                {totalCount === 0 ? "No charges added" : `${totalCount} charge${totalCount !== 1 ? "s" : ""} · Total ${symbol} ${otherChargesTotal.toFixed(2)}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-[var(--primary-600)] text-white rounded-lg text-[11px] font-medium transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Charge
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-theme bg-app">
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted uppercase tracking-wider w-12">#</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted uppercase tracking-wider">Charge Name</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted uppercase tracking-wider w-44">
                  Amount {currency ? `(${currency})` : ""}
                </th>
                <th className="w-12" />
              </tr>
            </thead>

            <tbody className="divide-y divide-theme">
              {paginatedCharges.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="flex flex-col items-center justify-center py-14 gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-app border border-theme flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted" />
                      </div>
                      <div className="text-center">
                        <p className="text-[12px] font-medium text-main">No charges yet</p>
                        <p className="text-[11px] text-muted mt-0.5">Click <strong>Add Charge</strong> to add shipping or other charges</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCharges.map((charge, idx) => {
                  const actualIndex = page * ITEMS_PER_PAGE + idx;
                  return (
                    <tr
                      key={actualIndex}
                      className="group hover:bg-app/60 transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        <span className="w-6 h-6 rounded-md bg-app border border-theme flex items-center justify-center text-[10px] font-semibold text-muted">
                          {actualIndex + 1}
                        </span>
                      </td>

                      <td className="px-3 py-2.5">
                        <input
                          value={charge.charge_type || ""}
                          onChange={(e) => onChange(actualIndex, "charge_type", e.target.value)}
                          className="w-full py-1.5 px-3 border border-theme rounded-lg text-[11px] bg-card text-main
                                     focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                                     hover:border-primary/40 transition-all placeholder:text-muted/40"
                          placeholder="e.g. Freight, Insurance, Handling…"
                        />
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-muted font-medium pointer-events-none">
                            {symbol}
                          </span>
                          <input
                            type="number"
                            value={charge.amount || ""}
                            onChange={(e) => onChange(actualIndex, "amount", e.target.value)}
                            className="w-full py-1.5 pl-7 pr-3 border border-theme rounded-lg text-[11px] bg-card text-main text-right
                                       focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                                       hover:border-primary/40 transition-all no-spinner placeholder:text-muted/40"
                            placeholder="0.00"
                          />
                        </div>
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => onRemove(actualIndex)}
                          className="w-7 h-7 rounded-lg bg-transparent border border-transparent
                                     text-muted hover:text-danger hover:bg-danger/10 hover:border-danger/20
                                     flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {hasPages && (
          <div className="px-4 py-2.5 border-t border-theme bg-app flex items-center justify-between">
            <span className="text-[11px] text-muted">
              Showing {page * ITEMS_PER_PAGE + 1}–{Math.min((page + 1) * ITEMS_PER_PAGE, totalCount)} of {totalCount}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-theme bg-card text-main
                           disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary/40 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  className={`w-7 h-7 flex items-center justify-center rounded-md text-[11px] font-medium transition-all
                    ${i === page
                      ? "bg-primary text-white shadow-sm"
                      : "border border-theme bg-card text-muted hover:border-primary/40"
                    }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-theme bg-card text-main
                           disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary/40 transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: Summary panel ── */}
      <div className="w-[200px] shrink-0 flex flex-col gap-3">

        {/* CIF Card */}
        <div className="bg-card border border-theme rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-theme bg-app flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-primary" />
            <h4 className="text-[11px] font-semibold text-main">Summary</h4>
          </div>

          <div className="px-4 py-3 flex flex-col gap-2.5">

            {/* CIF */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-muted uppercase tracking-wide">CIF Value</p>
                <p className="text-[9px] text-muted/60 mt-0.5">Cost + Insurance + Freight</p>
              </div>
              <span className="text-[12px] font-bold text-main">
                {symbol}{cif.toFixed(2)}
              </span>
            </div>

            {/* Charges breakdown */}
            {charges.filter(ch => Number(ch.amount || 0) > 0).length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-theme">
                {charges.map((ch, idx) => {
                  const amount = Number(ch.amount || 0);
                  if (!amount) return null;
                  return (
                    <div key={idx} className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-muted truncate max-w-[100px]" title={ch.charge_type}>
                        − {ch.charge_type || "Charge"}
                      </span>
                      <span className="text-[10px] text-muted shrink-0 font-medium">
                        {symbol}{amount.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Divider + total deductions */}
            {otherChargesTotal > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-dashed border-theme">
                <span className="text-[10px] text-muted">Total Deductions</span>
                <span className="text-[10px] font-semibold text-danger">
                  −{symbol}{otherChargesTotal.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* FOB Result Card */}
        <div className="bg-primary rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingDown className="w-3.5 h-3.5 text-white/70" />
            <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wide">FOB Value</p>
          </div>
          <p className="text-[9px] text-white/60 mb-1">Free On Board</p>
          <p className="text-[20px] font-bold text-white leading-none">
            {symbol}{fob.toFixed(2)}
          </p>
          {otherChargesTotal > 0 && (
            <p className="text-[9px] text-white/60 mt-2">
              CIF {symbol}{cif.toFixed(2)} − charges {symbol}{otherChargesTotal.toFixed(2)}
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default InvoiceChargesTab;