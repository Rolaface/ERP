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
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [totalCount, page]);

  useEffect(() => {
    if (totalCount === 0) return;

    const newPage = Math.floor((totalCount - 1) / ITEMS_PER_PAGE);

    if (newPage !== page) {
      setPage(newPage);
    }
  }, [totalCount]);

  const paginatedCharges = charges.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto">
      <div className="bg-card rounded-lg p-2 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-main">
            Shipping & Other Charges
          </h3>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[10px] leading-tight">
            <thead>
              <tr className="border-b border-theme">
                <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[50px]">
                  S.No.
                </th>
                <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[200px]">
                  Name
                </th>
                <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[120px]">
                  Amount {currency ? `(${currency})` : ""}
                </th>
                <th className="w-[40px]"></th>
              </tr>
            </thead>

            <tbody>
              {paginatedCharges.map((charge, idx) => {
                const actualIndex = page * ITEMS_PER_PAGE + idx;

                return (
                  <tr
                    key={actualIndex}
                    className="border-b border-theme bg-card row-hover"
                  >
                    <td className="px-2 py-1 text-[10px] text-muted">
                      {actualIndex + 1}
                    </td>

                    <td className="px-1 py-1">
                      <input
                        value={charge.name || ""}
                        onChange={(e) =>
                          onChange(actualIndex, "name", e.target.value)
                        }
                        className="w-full py-1 px-2 border border-theme rounded text-[10px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="e.g. Shipping"
                      />
                    </td>

                    <td className="px-1 py-1">
                      <input
                        type="number"
                        value={charge.amount || ""}
                        onChange={(e) =>
                          onChange(actualIndex, "amount", e.target.value)
                        }
                        className="w-full py-1 px-2 border border-theme rounded text-[10px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
                        placeholder="0.00"
                      />
                    </td>

                    <td className="px-1 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => onRemove(actualIndex)}
                        className="p-0.5 rounded bg-danger/10 text-danger hover:bg-danger/20 transition"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
        </div>
        

        {/* Empty State
        {totalCount === 0 && (
          <div className="text-center text-[11px] text-muted py-3">
            No charges added yet
          </div>
        )} */}

        {/* Footer */}
        <div className="flex justify-between mt-3">
          <button
            type="button"
            onClick={onAdd}
            className="px-4 py-1.5 bg-primary hover:bg-[var(--primary-600)] text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Charge
          </button>

          {(totalCount > ITEMS_PER_PAGE || page > 0) && (
            <div className="flex items-center gap-3 py-1 px-2 bg-app rounded">
              <div className="text-[11px] text-muted whitespace-nowrap">
                Showing {page * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min((page + 1) * ITEMS_PER_PAGE, totalCount)} of{" "}
                {totalCount} charges
              </div>

              <div className="flex gap-1.5 items-center">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-2.5 py-1 bg-card text-main border border-theme rounded text-[11px]"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((p) =>
                      (p + 1) * ITEMS_PER_PAGE >= totalCount ? p : p + 1,
                    )
                  }
                  disabled={(page + 1) * ITEMS_PER_PAGE >= totalCount}
                  className="px-2.5 py-1 bg-card text-main border border-theme rounded text-[11px]"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        
      </div>

      <div className="mt-4 flex justify-end">
            <div className="w-[260px] bg-card border border-theme rounded-lg p-3">
              <h3 className="text-xs font-semibold text-main mb-2">
                Charges Preview
              </h3>

              <div className="flex flex-col gap-2 text-xs">
                {/* Grand Total */}
                <div className="flex justify-between font-semibold">
                  <span className="text-muted">CIF</span>
                  <span className="text-main">
                    {symbol} {cif.toFixed(2)}
                  </span>
                </div>

                {/* Individual Charges */}
                {charges.map((ch, idx) => {
                  const amount = Number(ch.amount || 0);
                  if (!amount) return null;

                  return (
                    <div key={idx} className="flex justify-between ">
                      <span>{ch.name || "Charge"}</span>
                      <span>
                        {symbol} {amount.toFixed(2)}
                      </span>
                    </div>
                  );
                })}

                {/* Divider */}
                <div className="border-t mt-2 pt-2" />

                {/* Final */}
                <div className="p-2 bg-primary rounded">
                  <div className="flex justify-between text-white font-semibold">
                    <span>FOB</span>
                    <span>
                      {symbol} {fob.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
    </div>
  );
};

export default InvoiceChargesTab;
