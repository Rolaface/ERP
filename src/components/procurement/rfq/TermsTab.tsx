import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "../../ui/modal/formComponent";
import type { PaymentRow } from "../../../types/Supply/rfq";

interface TermsTabProps {
  paymentRows: PaymentRow[];
  termsAndConditions: string;
  onPaymentRowChange: (
    idx: number,
    field: keyof PaymentRow,
    value: any,
  ) => void;
  onAddPaymentRow: () => void;
  onRemovePaymentRow: (idx: number) => void;
  onTermsChange: (value: string) => void;
}

export const TermsTab: React.FC<TermsTabProps> = ({
  paymentRows,
  termsAndConditions,
  onPaymentRowChange,
  onAddPaymentRow,
  onRemovePaymentRow,
  onTermsChange,
}) => {
  // ✅ Pagination Logic
  const ITEMS_PER_PAGE = 5;
  const [page, setPage] = useState(0);

  useEffect(() => {
    const newPage = Math.floor((paymentRows.length - 1) / ITEMS_PER_PAGE);
    if (newPage !== page) setPage(newPage);
  }, [paymentRows.length]);

  const paginatedRows = paymentRows.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  return (
    <Card title="Terms & Conditions">
      <div className="space-y-8 mx-auto bg-card text-main rounded-lg p-6 border border-theme">
        {/* ================= PAYMENT TERMS ================= */}
        <div>
          <h3 className="mb-2 text-lg font-semibold text-main">
            Payment Terms
          </h3>
          <div className="mt-4">
            <span className="font-medium text-muted">Payment Schedule</span>

            {/* Pagination Info */}
            <div className="flex justify-between text-sm text-muted mt-2">
              <span>
                Showing {page * ITEMS_PER_PAGE + 1}–
                {Math.min((page + 1) * ITEMS_PER_PAGE, paymentRows.length)} of{" "}
                {paymentRows.length}
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
                  disabled={(page + 1) * ITEMS_PER_PAGE >= paymentRows.length}
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
                    <th className="px-2 py-2">No.</th>
                    <th className="px-2 py-2">Payment Term</th>
                    <th className="px-2 py-2">Description</th>
                    <th className="px-2 py-2">Due Date</th>
                    <th className="px-2 py-2">Invoice Portion</th>
                    <th className="px-2 py-2">Payment Amount</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>

                <tbody className="divide-y border-theme">
                  {paymentRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-6 text-muted">
                        No Data
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row, idx) => {
                      const i = page * ITEMS_PER_PAGE + idx;

                      return (
                        <tr key={i} className="row-hover">
                          <td className="px-3 py-2 text-center">{i + 1}</td>

                          <td className="px-1 py-1">
                            <input
                              className="w-full rounded border border-theme bg-app p-1 text-sm"
                              value={row.paymentTerm}
                              onChange={(e) =>
                                onPaymentRowChange(
                                  i,
                                  "paymentTerm",
                                  e.target.value,
                                )
                              }
                            />
                          </td>

                          <td className="px-1 py-1">
                            <input
                              className="w-full rounded border border-theme bg-app p-1 text-sm"
                              value={row.description}
                              onChange={(e) =>
                                onPaymentRowChange(
                                  i,
                                  "description",
                                  e.target.value,
                                )
                              }
                            />
                          </td>

                          <td className="px-1 py-1">
                            <input
                              type="date"
                              className="w-full rounded border border-theme bg-app p-1 text-sm"
                              value={row.dueDate}
                              onChange={(e) =>
                                onPaymentRowChange(i, "dueDate", e.target.value)
                              }
                            />
                          </td>

                          <td className="px-1 py-1">
                            <input
                              type="number"
                              className="w-full rounded border border-theme bg-app p-1 text-sm"
                              value={row.invoicePortion}
                              onChange={(e) =>
                                onPaymentRowChange(
                                  i,
                                  "invoicePortion",
                                  Number(e.target.value),
                                )
                              }
                            />
                          </td>

                          <td className="px-1 py-1">
                            <input
                              type="number"
                              className="w-full rounded border border-theme bg-app p-1 text-sm"
                              value={row.paymentAmount}
                              onChange={(e) =>
                                onPaymentRowChange(
                                  i,
                                  "paymentAmount",
                                  Number(e.target.value),
                                )
                              }
                            />
                          </td>

                          <td className="px-1 py-1 text-center">
                            <button
                              type="button"
                              onClick={() => onRemovePaymentRow(i)}
                              className="p-1 text-danger row-hover rounded"
                              disabled={paymentRows.length === 1}
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

            {/* Add Row Button */}
            <button
              type="button"
              onClick={onAddPaymentRow}
              className="flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-sm font-medium text-white mt-2"
            >
              <Plus className="w-4 h-4" /> Add Row
            </button>
          </div>
        </div>

        {/* ================= TERMS TEXTAREA ================= */}
        <div className="bg-card rounded-lg border border-theme">
          <div className="p-4 border-b border-theme">
            <h3 className="font-semibold text-main">Terms and Conditions</h3>
          </div>

          <div className="p-6">
            <textarea
              value={termsAndConditions}
              onChange={(e) => onTermsChange(e.target.value)}
              className="w-full px-3 py-2 border border-theme bg-app rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
              rows={12}
              placeholder="Enter terms and conditions..."
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
