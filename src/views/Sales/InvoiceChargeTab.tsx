import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { currencySymbols } from "../../constants/invoice.constants";

interface Props {
  charges: any[];
  currency?: string;
  totals: any;
  onAdd: () => void;
  onChange: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
}

const ITEMS_PER_PAGE = 7;

const InvoiceChargesTab: React.FC<Props> = ({
  charges = [],
  currency,
  totals,
  onAdd,
  onChange,
  onRemove,
}) => {
  const symbol = currencySymbols[currency || ""] || currency;
  const [page, setPage] = useState(0);
  const cif = totals?.grandTotal || 0;

  const otherChargesTotal = (charges || []).reduce(
    (sum, ch) => sum + Number(ch.amount || 0),
    0,
  );

  const fob = cif - otherChargesTotal;
  const totalCount = charges.length;

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(totalCount / ITEMS_PER_PAGE) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [totalCount, page]);

  useEffect(() => {
    if (totalCount === 0) return;
    const newPage = Math.floor((totalCount - 1) / ITEMS_PER_PAGE);
    if (newPage !== page) setPage(newPage);
  }, [totalCount]);

  const paginatedCharges = charges.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  return (
    <div className="flex gap-3 w-fit items-start p-3">

      {/* LEFT: Table card */}
      <div className="w-[480px] min-w-0 bg-card rounded-lg shadow-sm border border-theme flex flex-col">

        <div className="px-4 py-2.5 border-b bg-primary">
          <h3 className="text-xs font-semibold text-main tracking-wide">
            Shipping & Other Charges
          </h3>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-theme bg-app">
                <th className="px-3 py-2 text-left text-muted font-medium text-[11px] w-[52px]">
                  S.No.
                </th>
                <th className="px-3 py-2 text-left text-muted font-medium text-[11px]">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-muted font-medium text-[11px] w-[140px]">
                  Amount{currency ? ` (${currency})` : ""}
                </th>
                <th className="w-[44px]" />
              </tr>
            </thead>

            <tbody>
              {paginatedCharges.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-[11px] text-muted">
                    No charges added yet. Click <strong>Add Charge</strong> to begin.
                  </td>
                </tr>
              )}

              {paginatedCharges.map((charge, idx) => {
                const actualIndex = page * ITEMS_PER_PAGE + idx;
                return (
                  <tr
                    key={actualIndex}
                    className="border-b border-theme last:border-0 hover:bg-app/50 transition-colors"
                  >
                    <td className="px-3 py-2 text-[11px] text-muted">
                      {actualIndex + 1}
                    </td>

                    <td className="px-2 py-2">
                      <input
                        value={charge.name || ""}
                        onChange={(e) => onChange(actualIndex, "name", e.target.value)}
                        className="w-full py-1.5 px-2.5 border border-theme rounded-md text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted/50"
                        placeholder="e.g. Shipping"
                      />
                    </td>

                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={charge.amount || ""}
                        onChange={(e) => onChange(actualIndex, "amount", e.target.value)}
                        className="w-full py-1.5 px-2.5 border border-theme rounded-md text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner placeholder:text-muted/50"
                        placeholder="0.00"
                      />
                    </td>

                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => onRemove(actualIndex)}
                        className="p-1 rounded bg-danger/10 text-danger hover:bg-danger/20 transition"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-theme flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onAdd}
            className="px-3 py-1.5 bg-primary hover:bg-[var(--primary-600)] text-white rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Charge
          </button>

          {(totalCount > ITEMS_PER_PAGE || page > 0) && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted whitespace-nowrap">
                {page * ITEMS_PER_PAGE + 1}–{Math.min((page + 1) * ITEMS_PER_PAGE, totalCount)} of {totalCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2 py-1 bg-card text-main border border-theme rounded text-[11px] disabled:opacity-40"
              >
                ‹ Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => (p + 1) * ITEMS_PER_PAGE >= totalCount ? p : p + 1)}
                disabled={(page + 1) * ITEMS_PER_PAGE >= totalCount}
                className="px-2 py-1 bg-card text-main border border-theme rounded text-[11px] disabled:opacity-40"
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Charges Preview */}
      <div className="w-[168px] shrink-0 bg-card border border-theme rounded-lg shadow-sm overflow-hidden">

        <div className="px-3 py-2.5 border-b bg-primary">
          <h3 className="text-[11px] font-semibold text-main tracking-wide">
            Charges Preview
          </h3>
        </div>

        <div className="px-3 py-3 flex flex-col gap-2 text-[11px]">
          <div className="flex justify-between items-center">
            <span className="text-muted font-medium">CIF</span>
            <span className="text-main font-semibold">
              {symbol} {cif.toFixed(2)}
            </span>
          </div>

          {charges.map((ch, idx) => {
            const amount = Number(ch.amount || 0);
            if (!amount) return null;
            return (
              <div key={idx} className="flex justify-between items-center gap-1">
                <span className="text-muted truncate max-w-[80px]">
                  − {ch.name || "Charge"}
                </span>
                <span className="text-muted shrink-0">
                  {symbol} {amount.toFixed(2)}
                </span>
              </div>
            );
          })}

          <div className="border-t border-theme pt-2 mt-1">
            <div className="flex justify-between items-center bg-primary rounded-md px-2.5 py-2">
              <span className="text-white font-semibold">FOB</span>
              <span className="text-white font-semibold">
                {symbol} {fob.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default InvoiceChargesTab;