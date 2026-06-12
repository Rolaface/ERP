import React, { useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ModalSelect, ModalInput } from "../ui/modal/modalComponent";

// Types

export type TaxRow = {
  id: string; 
  type: "Actual" | "On Net Total" | "On Previous Row Amount" | "On Previous Row Total" | "";
  account_head: string;
  tax_rate: number | "";
  amount: number | "";
  total: number | "";
};

interface PaymentTaxesTabProps {
  form: Record<string, any>;
  onFormChange: (updates: Record<string, any>) => void;
}

// Helpers

function makeEmptyRow(): TaxRow {
  return {
    id: `tax_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: "",
    account_head: "",
    tax_rate: "",
    amount: "",
    total: "",
  };
}

const TAX_TYPE_OPTIONS = [
  { label: "Select type…", value: "" },
  { label: "Actual", value: "Actual" },
  { label: "On Net Total", value: "On Net Total" },
  { label: "On Previous Row Amount", value: "On Previous Row Amount" },
  { label: "On Previous Row Total", value: "On Previous Row Total" },
];

// Component

const PaymentTaxesTab: React.FC<PaymentTaxesTabProps> = ({
  form,
  onFormChange,
}) => {
  // Taxes live in form.taxes — initialise to one empty row if not present
  const taxes: TaxRow[] = form?.taxes?.length > 0
    ? form.taxes
    : [];

  const pushUpdate = useCallback(
    (updated: TaxRow[]) => onFormChange({ taxes: updated }),
    [onFormChange]
  );

  // ── Row operations 

  const handleAddRow = () => {
    pushUpdate([...taxes, makeEmptyRow()]);
  };

  const handleDeleteRow = (id: string) => {
    pushUpdate(taxes.filter((r) => r.id !== id));
  };

  const handleCellChange = (
    id: string,
    field: keyof TaxRow,
    value: string
  ) => {
    const updated = taxes.map((row) => {
      if (row.id !== id) return row;

      const next = { ...row, [field]: value };

      if (field === "amount" && next.type === "Actual") {
        const base = Number(form?.amountFrom ?? form?.amount ?? 0);
        const amt = Number(value) || 0;
        next.total = base + amt;
      }

      return next;
    });

    pushUpdate(updated);
  };

  // ── Totals row 
  const totalTaxAmount = taxes.reduce(
    (sum, r) => sum + (Number(r.amount) || 0),
    0
  );

  // ── Empty state 
  const isEmpty = taxes.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-main">Taxes and Charges</h3>
        <button
          type="button"
          onClick={handleAddRow}
          className="flex items-center gap-1.5 text-xs font-medium text-primary
            hover:text-primary/80 border border-primary/30 hover:border-primary/60
            rounded-lg px-3 py-1.5 transition-colors"
        >
          <Plus size={13} />
          Add Row
        </button>
      </div>

      <div className="rounded-xl border border-[var(--border)] overflow-hidden">

        {/* Header */}
        <div className="grid grid-cols-[32px_1.5fr_2fr_1fr_1fr_1fr_40px] bg-[var(--row-hover)] border-b border-[var(--border)] px-4 py-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">#</div>
          {(["Type", "GL Account", "Tax Rate (%)", "Amount", "Total"] as const).map(
            (h, i) => (
              <div
                key={h}
                className={`text-[11px] font-semibold uppercase tracking-wide text-muted ${
                  i >= 2 ? "text-right" : ""
                }`}
              >
                {h}
              </div>
            )
          )}
          <div />
        </div>

        {/* Rows */}
        {isEmpty ? (
          <div className="flex items-center justify-center py-10 text-muted">
            <span className="text-sm">
              No taxes added.{" "}
              <button
                type="button"
                onClick={handleAddRow}
                className="text-primary underline hover:opacity-80"
              >
                Add a row
              </button>{" "}
              to get started.
            </span>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {taxes.map((row, idx) => (
              <div
                key={row.id}
                className="grid grid-cols-[32px_1.5fr_2fr_1fr_1fr_1fr_40px] px-4 py-2.5 gap-2 items-center
                  hover:bg-[var(--row-hover)] transition-colors"
              >
                {/* # */}
                <span className="text-xs text-muted font-mono">{idx + 1}</span>

                {/* Type */}
                <ModalSelect
                  label=""
                  name={`tax_type_${row.id}`}
                  value={row.type}
                  onChange={(e) =>
                    handleCellChange(row.id, "type", e.target.value)
                  }
                  options={TAX_TYPE_OPTIONS}
                />

                {/* Account Head */}
                <ModalInput
                  label=""
                  name={`tax_account_${row.id}`}
                  value={row.account_head}
                  onChange={(e) =>
                    handleCellChange(row.id, "account_head", e.target.value)
                  }
                />

                {/* Tax Rate */}
                <ModalInput
                  label=""
                  name={`tax_rate_${row.id}`}
                  type="number"
                  value={row.tax_rate === "" ? "" : String(row.tax_rate)}
                  placeholder="0"
                  className="text-right no-spinner"
                  onChange={(e) =>
                    handleCellChange(row.id, "tax_rate", e.target.value)
                  }
                />

                {/* Amount */}
                <ModalInput
                  label=""
                  name={`tax_amount_${row.id}`}
                  type="number"
                  value={row.amount === "" ? "" : String(row.amount)}
                  placeholder="0"
                  className="text-right no-spinner"
                  onChange={(e) =>
                    handleCellChange(row.id, "amount", e.target.value)
                  }
                />

                {/* Total */}
                <ModalInput
                  label=""
                  name={`tax_total_${row.id}`}
                  type="number"
                  value={row.total === "" ? "" : String(row.total)}
                  placeholder="0"
                  className="text-right no-spinner"
                  onChange={(e) =>
                    handleCellChange(row.id, "total", e.target.value)
                  }
                />

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDeleteRow(row.id)}
                  title="Remove row"
                  className="w-7 h-7 flex items-center justify-center rounded
                    text-muted hover:text-red-500 hover:bg-red-50
                    transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer totals */}
        {!isEmpty && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border)] bg-[var(--row-hover)]">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">
              Total Tax
            </span>
            <span className="text-xs font-bold text-primary font-mono">
              {totalTaxAmount.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Hint */}
      <p className="text-[11px] text-muted leading-relaxed">
        For <strong>Actual</strong> type, the Total is auto-calculated as Payment
        Amount + Tax Amount. For other types, fill in the Total manually.
      </p>
    </div>
  );
};

export default PaymentTaxesTab;