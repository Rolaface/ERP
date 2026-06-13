import React, { useCallback, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import { fetchCostCenters } from "../../api/getAllApi";
import { getDeductionAccounts } from "../../api/BankAccountApi";
import { NumericInput } from "../ui/modal/modalComponent";

export interface DeductionRow {
    uid: string;
    account: string;
    account_label: string;
    cost_center: string;
    cost_center_label: string;
    amount: number | null;
}

interface Props {
    rows: DeductionRow[];
    onRowsChange: (rows: DeductionRow[]) => void;
}

const PAGE_SIZE = 8;

function makeEmptyRow(): DeductionRow {
    return {
        uid: `${Date.now()}-${Math.random()}`,
        account: "",
        account_label: "",
        cost_center: "",
        cost_center_label: "",
        amount: null,
    };
}

const PaymentDeductionsTab: React.FC<Props> = ({ rows, onRowsChange }) => {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const pagedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const startIdx = (currentPage - 1) * PAGE_SIZE;

    const handleAddRow = useCallback(() => {
        const newRows = [...rows, makeEmptyRow()];
        onRowsChange(newRows);
        setCurrentPage(Math.ceil(newRows.length / PAGE_SIZE));
    }, [rows, onRowsChange]);

    const handleRemoveRow = useCallback((uid: string) => {
        onRowsChange(rows.filter((r) => r.uid !== uid));
        const newLen = rows.length - 1;
        const newTotalPages = Math.max(1, Math.ceil(newLen / PAGE_SIZE));
        if (currentPage > newTotalPages) setCurrentPage(newTotalPages);
    }, [rows, onRowsChange, currentPage]);

    const handleFieldChange = useCallback(
        (uid: string, updates: Partial<DeductionRow>) => {
            onRowsChange(
                rows.map((r) => (r.uid === uid ? { ...r, ...updates } : r)),
            );
        },
        [rows, onRowsChange],
    );

    const handleAmountChange = useCallback(
        (uid: string, value: number | null) => {
            onRowsChange(
                rows.map((r) => (r.uid === uid ? { ...r, amount: value } : r)),
            );
        },
        [rows, onRowsChange],
    );

    const fetchAccounts = useCallback(async (search: string) => {
        const opts = await getDeductionAccounts(search);
        return opts.map((o) => ({
            value: o.value,
            label: o.label,
            subLabel: o.subLabel,
        }));
    }, []);

    const fetchCostCenterOptions = useCallback(async (search: string) => {
        return fetchCostCenters(search);
    }, []);

    const totalDeductionAmount = rows.reduce(
        (sum, r) => sum + (r.amount ?? 0),
        0,
    );

    return (
        <div className="space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-main">Payment Deductions or Loss</h3>
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

            {/* Table */}
            <div className="rounded-xl border border-[var(--border)] overflow-hidden">

                {/* Header row */}
                <div className="grid grid-cols-[32px_2fr_2fr_1.2fr_40px] bg-[var(--row-hover)] border-b border-[var(--border)] px-4 py-2.5 gap-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">#</div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        GL Account <span className="text-danger">*</span>
                    </div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Cost Center <span className="text-danger">*</span>
                    </div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted text-right">
                        Amount
                    </div>
                    <div />
                </div>

                {/* Empty state */}
                {rows.length === 0 ? (
                    <div className="flex items-center justify-center py-10 text-muted">
                        <span className="text-sm">
                            No deductions added.{" "}
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
                        {pagedRows.map((row, idx) => (
                            <div
                                key={row.uid}
                                className="grid grid-cols-[32px_2fr_2fr_1.2fr_40px] px-4 py-2.5 gap-2 items-center
                  hover:bg-[var(--row-hover)] transition-colors"
                            >
                                {/* # */}
                                <span className="text-xs text-muted font-mono">{startIdx + idx + 1}</span>

                                {/* Account */}
                                <SearchSelect2
                                    label=""
                                    value={row.account_label}
                                    onChange={(val, option: any) => {
                                        handleFieldChange(row.uid, {
                                            account: val,
                                            account_label: option?.label ?? val,
                                        });
                                    }}
                                    fetchOptions={fetchAccounts}
                                    placeholder="Search account..."
                                    allowCustomInput={false}
                                />

                                {/* Cost Center */}
                                <SearchSelect2
                                    label=""
                                    value={row.cost_center_label}
                                    onChange={(val, option: any) => {
                                        handleFieldChange(row.uid, {
                                            cost_center: val,
                                            cost_center_label: option?.label ?? val,
                                        });
                                    }}
                                    fetchOptions={fetchCostCenterOptions}
                                    placeholder="Search cost center..."
                                    allowCustomInput={false}
                                />

                                {/* Amount */}
                                <NumericInput
                                    value={row.amount}
                                    onChange={(val) => handleAmountChange(row.uid, val)}
                                    placeholder="0"
                                    decimalScale={2}
                                    allowNegative={false}
                                    className="w-full text-right"
                                />

                                {/* Delete */}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveRow(row.uid)}
                                    title="Remove row"
                                    className="w-7 h-7 flex items-center justify-center rounded
                    text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer totals */}
                {rows.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border)] bg-[var(--row-hover)]">
                        <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                            Total Deductions
                        </span>
                        <span className="text-xs font-bold text-primary font-mono">
                            {totalDeductionAmount.toLocaleString()}
                        </span>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted">
                        Showing {startIdx + 1}–{Math.min(currentPage * PAGE_SIZE, rows.length)} of {rows.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1.5 text-xs font-medium text-primary
                hover:text-primary/80 border border-primary/30 hover:border-primary/60
                rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            ‹ Previous
                        </button>
                        <span className="text-[11px] font-semibold text-main px-1">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1.5 text-xs font-medium text-primary
                hover:text-primary/80 border border-primary/30 hover:border-primary/60
                rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Next ›
                        </button>
                    </div>
                </div>
            )}

            {/* Hint */}
            <p className="text-[11px] text-muted leading-relaxed">
                Only rows with <strong>Account</strong>, <strong>Cost Center</strong>, and a valid <strong>Amount</strong> will be included in the payment.
            </p>
        </div>
    );
};

export default PaymentDeductionsTab;