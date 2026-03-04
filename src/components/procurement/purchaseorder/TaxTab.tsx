import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "../../ui/modal/formComponent";
import type {
  TaxRow,
  PurchaseOrderFormData,
} from "../../../types/Supply/purchaseOrder";

interface TaxTabProps {
  form: PurchaseOrderFormData;
  taxRows: TaxRow[];
  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTaxRowChange: (idx: number, key: keyof TaxRow, value: any) => void;
  onAddTaxRow: () => void;
  onRemoveTaxRow: (idx: number) => void;
}

const TAX_TYPES = [
  "Actual",
  "On Net Total",
  "On Previous Row Amount",
  "On Previous Row Total",
  "On Item Quantity",
];

const ACCOUNT_HEADS = [
  "Expenses Included In Valuation - I",
  "Freight and Forwarding Charges - I",
  "Marketing Expenses - I",
  "Miscellaneous Expenses - I",
];

export const TaxTab: React.FC<TaxTabProps> = ({
  form,
  taxRows,
  onFormChange,
  onTaxRowChange,
  onAddTaxRow,
  onRemoveTaxRow,
}) => {
  const ITEMS_PER_PAGE = 5;
  const [page, setPage] = useState(0);

  useEffect(() => {
    const newPage = Math.floor((taxRows.length - 1) / ITEMS_PER_PAGE);
    if (newPage !== page) setPage(newPage);
  }, [taxRows.length]);

  const paginatedRows = taxRows.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6 mt-6 bg-card text-main p-4 rounded-lg border border-theme">
      <h3 className="mb-4 text-lg font-semibold text-main underline">
        Taxes and Charges
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Purchase Taxes and Charges Template"
          name="taxesChargesTemplate"
          value={form.taxesChargesTemplate}
          onChange={onFormChange}
        />
      </div>

      <div>
        <span className="font-medium text-muted">
          Purchase Taxes and Charges
        </span>

        {/* Pagination */}
        <div className="flex justify-between text-sm text-muted mt-2">
          <span>
            Showing {page * ITEMS_PER_PAGE + 1}–
            {Math.min((page + 1) * ITEMS_PER_PAGE, taxRows.length)} of{" "}
            {taxRows.length}
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-1 bg-app border border-theme rounded disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * ITEMS_PER_PAGE >= taxRows.length}
              className="px-2 py-1 bg-app border border-theme rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-theme mt-2">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-2 py-2 text-left">#</th>
                <th className="px-2 py-2 text-left">Type *</th>
                <th className="px-2 py-2 text-left">Account Head *</th>
                <th className="px-2 py-2 text-left">Tax Rate</th>
                <th className="px-2 py-2 text-left">Amount</th>
                <th className="px-2 py-2 text-right">Total</th>
                <th></th>
              </tr>
            </thead>

            <tbody className="divide-y border-theme">
              {taxRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-6 text-muted">
                    No Data
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const i = page * ITEMS_PER_PAGE + idx;
                  const total = (row.taxRate * row.amount) / 100;

                  return (
                    <tr key={i} className="row-hover">
                      <td className="px-3 py-2 text-center">{i + 1}</td>

                      <td className="px-1 py-1">
                        <select
                          className="w-full rounded border border-theme bg-app p-1 text-sm"
                          value={row.type}
                          onChange={(e) =>
                            onTaxRowChange(i, "type", e.target.value)
                          }
                        >
                          <option value="">Select Type</option>
                          {TAX_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-1 py-1">
                        <select
                          className="w-full rounded border border-theme bg-app p-1 text-sm"
                          value={row.accountHead}
                          onChange={(e) =>
                            onTaxRowChange(i, "accountHead", e.target.value)
                          }
                        >
                          <option value="">Select Account Head</option>
                          {ACCOUNT_HEADS.map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-1 py-1">
                        <input
                          type="number"
                          className="w-full rounded border border-theme bg-app p-1 text-sm"
                          value={row.taxRate}
                          onChange={(e) =>
                            onTaxRowChange(i, "taxRate", Number(e.target.value))
                          }
                        />
                      </td>

                      <td className="px-1 py-1">
                        <input
                          type="number"
                          className="w-full rounded border border-theme bg-app p-1 text-sm"
                          value={row.amount}
                          onChange={(e) =>
                            onTaxRowChange(i, "amount", Number(e.target.value))
                          }
                        />
                      </td>

                      <td className="px-1 py-1 text-right font-medium">
                        {total.toFixed(2)}
                      </td>

                      <td className="px-1 py-1 text-center">
                        <button
                          onClick={() => onRemoveTaxRow(i)}
                          className="p-1 text-danger hover:bg-app rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={onAddTaxRow}
          className="flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-sm font-medium text-white mt-2"
        >
          <Plus className="w-4 h-4" /> Add Row
        </button>
      </div>
    </div>
  );
};
