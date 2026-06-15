import React from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
    X,
    CreditCard,
    FileText,
    Download,
    ArrowLeftRight
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Allocation {
    reference_doctype: string;
    reference_name: string;
    total_amount: number;
    outstanding_amount: number;
    allocated_amount: number;
    account: string;
}

export interface PaymentEntryDetail {
    header: {
        payment_id: string;
        payment_type: string;
        status: string;
        posting_date: string;
        company: string;
        naming_series: string;
    };
    party_info: {
        party_type: string;
        party: string;
        party_name: string;
        contact_person?: string;
    };
    transaction_info: {
        mode_of_payment: string;
        paid_from_account_name: string;
        paid_from_currency: string;
        paid_to_account_name: string;
        paid_to_currency: string;
        bank?: string;
        bank_account_no?: string;
        reference_no?: string;
        reference_date?: string;
    };
    amounts: {
        paid_amount: number;
        received_amount: number;
        total_allocated_amount: number;
        unallocated_amount: number;
        amount_in_words: string;
        source_exchange_rate?: number;
        target_exchange_rate?: number;
    };
    allocations: Allocation[];
    remarks?: string;
    contact_email?: string;
    attachments: { name: string; file_name: string; file_url: string; file_size: number; file_type: string; is_private: number; creation: string }[];
}

interface Props {
    open: boolean;
    data: PaymentEntryDetail | null;
    loading: boolean;
    onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const formatDate = (d?: string | null): string => {
    if (!d) return "—";
    const [year, month, day] = d.split("T")[0].split("-").map(Number);
    return `${String(day).padStart(2, "0")}-${MONTHS[month - 1]}-${year}`;
};

const fmtINR = (n?: number) =>
    n == null ? "—" : `\u00A0${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const ALLOC_THRESHOLD = 7;

function exportAllocationsToExcel(allocations: Allocation[], paymentId: string) {
    const rows = allocations.map((a) => ({
        "Document Type": a.reference_doctype,
        "Reference": a.reference_name,
        "Total Amount": a.total_amount,
        "Outstanding Amount": a.outstanding_amount,
        "Allocated Amount": a.allocated_amount,
        "Account": a.account,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Allocations");
    saveAs(
        new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `${paymentId}_Allocations.xlsx`,
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "4px 0" }}>
            <style>{`@keyframes pe-pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
            {[55, 80, 40, 70, 55, 90, 45].map((w, i) => (
                <div key={i} style={{
                    height: "12px", width: `${w}%`, borderRadius: "4px",
                    background: "var(--border, rgba(0,0,0,0.08))",
                    animation: `pe-pulse 1.4s ease-in-out ${i * 0.07}s infinite`,
                }} />
            ))}
        </div>
    );
}

// ─── Allocations Table ────────────────────────────────────────────────────────

function AllocationsTable({ allocations, paymentId }: { allocations: Allocation[]; paymentId: string }) {
    if (!allocations.length) {
        return <p style={{ fontSize: "12px", color: "var(--muted)", textAlign: "center", padding: "16px 0", margin: 0 }}>No allocations found.</p>;
    }

    const totalAllocated = allocations.reduce((s, a) => s + a.allocated_amount, 0);
    const showExport = allocations.length > ALLOC_THRESHOLD;

    const thStyle: React.CSSProperties = {
        padding: "7px 12px",
        fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.07em", color: "var(--muted)",
        borderBottom: "1px solid var(--border, rgba(0,0,0,0.08))",
        whiteSpace: "nowrap", background: "transparent",
    };

    return (
        <>
            {showExport && (
                <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 12px 0" }}>
                    <button
                        type="button"
                        onClick={() => exportAllocationsToExcel(allocations, paymentId)}
                        style={{
                            display: "inline-flex", alignItems: "center", gap: "5px",
                            fontSize: "11px", fontWeight: 600,
                            color: "var(--primary)", cursor: "pointer",
                            background: "color-mix(in srgb, var(--primary) 8%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--primary) 22%, transparent)",
                            borderRadius: "6px", padding: "4px 10px",
                        }}
                    >
                        <Download size={11} /> Export Excel
                    </button>
                </div>
            )}
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, textAlign: "left" }}>Document</th>
                            <th style={{ ...thStyle, textAlign: "left" }}>Reference</th>
                            <th style={{ ...thStyle, textAlign: "right" }}>Total Amt</th>
                            <th style={{ ...thStyle, textAlign: "right" }}>Outstanding</th>
                            <th style={{ ...thStyle, textAlign: "right" }}>Allocated</th>
                            <th style={{ ...thStyle, textAlign: "left" }}>Account</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allocations.map((a, i) => (
                            <tr
                                key={i}
                                style={{ borderBottom: "1px solid var(--border, rgba(0,0,0,0.05))" }}
                            >
                                <td style={{ padding: "8px 12px", color: "var(--muted)", whiteSpace: "nowrap", fontSize: "11px" }}>
                                    {a.reference_doctype}
                                </td>
                                <td style={{ padding: "8px 12px" }}>
                                    <span style={{
                                        display: "inline-flex", alignItems: "center", gap: "4px",
                                        background: "color-mix(in srgb, var(--primary) 9%, transparent)",
                                        color: "var(--primary)", fontSize: "11px", fontWeight: 600,
                                        padding: "2px 8px", borderRadius: "999px",
                                        border: "1px solid color-mix(in srgb, var(--primary) 18%, transparent)",
                                    }}>
                                        <FileText size={10} />{a.reference_name}
                                    </span>
                                </td>
                                <td style={{ padding: "8px 12px", textAlign: "right", color: "var(--text)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                                    {a.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </td>
                                <td style={{ padding: "8px 12px", textAlign: "right", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                                    <span style={{ color: a.outstanding_amount > 0 ? "var(--danger, #ef4444)" : "var(--success, #22c55e)", fontWeight: 500 }}>
                                        {a.outstanding_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                    </span>
                                </td>
                                <td style={{ padding: "8px 12px", textAlign: "right", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                                    <span style={{ color: "var(--success, #22c55e)", fontWeight: 600 }}>
                                        {a.allocated_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                    </span>
                                </td>
                                <td style={{ padding: "8px 12px", color: "var(--muted)", whiteSpace: "nowrap", fontSize: "11px" }}>
                                    {a.account}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ background: "color-mix(in srgb, var(--primary) 4%, transparent)", borderTop: "1px solid var(--border, rgba(0,0,0,0.08))" }}>
                            <td colSpan={4} style={{ padding: "8px 12px", fontSize: "11px", fontWeight: 700, color: "var(--text)", textAlign: "right" }}>
                                Total Allocated
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--primary)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                                {totalAllocated.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td />
                        </tr>
                    </tfoot>
                </table>
            </div>
        </>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PaymentEntryDetailModal: React.FC<Props> = ({ open, data, loading, onClose }) => {
    if (!open) return null;

    // Flat meta items — rendered as a single horizontal strip
    const metaItems = data ? [
        { label: "Name", value: data.party_info.party_name },
        { label: "Type", value: data.party_info.party_type },
        { label: "From", value: data.transaction_info.paid_from_account_name },
        { label: "Mode", value: data.transaction_info.mode_of_payment },
        { label: "Email", value: data.contact_email },
        { label: "Reference Number", value: data.transaction_info.reference_no },
        { label: "Reference Date", value: data.transaction_info.reference_date ? formatDate(data.transaction_info.reference_date) : null },
        { label: "To", value: data.transaction_info.paid_to_account_name },
        { label: "Bank", value: data.transaction_info.bank },
    ].filter((m) => !!m.value) : [];

    // Split into two columns for the meta grid
    const half = Math.ceil(metaItems.length / 2);
    const col1 = metaItems.slice(0, half);
    const col2 = metaItems.slice(half);

    const divider: React.CSSProperties = {
        height: "1px",
        background: "var(--border, rgba(0,0,0,0.07))",
        margin: "0 -20px",
        flexShrink: 0,
    };

    return (
        <div
            style={{
                position: "fixed", inset: 0,
                background: "rgba(15,23,42,0.42)",
                backdropFilter: "blur(3px)",
                zIndex: 2000,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "16px",
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                style={{
                    background: "var(--card, #fff)",
                    borderRadius: "16px",
                    boxShadow: "0 32px 80px rgba(15,23,42,0.22), 0 4px 16px rgba(15,23,42,0.08)",
                    width: "100%", maxWidth: "760px",
                    maxHeight: "88vh",
                    display: "flex", flexDirection: "column",
                    overflow: "hidden",
                }}
                role="dialog" aria-modal aria-label="Payment Entry Detail"
            >

                {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 20px", flexShrink: 0,
                    borderBottom: "1px solid var(--border, rgba(0,0,0,0.08))",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                            width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
                            background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "var(--primary)",
                        }}>
                            <CreditCard size={15} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text)", lineHeight: 1.3 }}>
                                {data?.header.payment_id ?? "Payment Entry"}
                            </p>
                            {data && (
                                <p style={{ margin: 0, fontSize: "11px", color: "var(--muted)", lineHeight: 1.3 }}>
                                    {data.header.payment_type} · {formatDate(data.header.posting_date)} · {data.header.company}
                                </p>
                            )}
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {data && (
                            <span style={{
                                fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "999px",
                                background: data.header.status === "Submitted"
                                    ? "color-mix(in srgb, #22c55e 12%, transparent)"
                                    : "color-mix(in srgb, var(--muted) 12%, transparent)",
                                color: data.header.status === "Submitted" ? "#16a34a" : "var(--muted)",
                                border: `1px solid ${data.header.status === "Submitted" ? "color-mix(in srgb,#22c55e 28%,transparent)" : "color-mix(in srgb,var(--muted) 28%,transparent)"}`,
                            }}>
                                {data.header.status}
                            </span>
                        )}
                        <button type="button" onClick={onClose} style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: "28px", height: "28px", borderRadius: "6px",
                            border: "none", cursor: "pointer", background: "transparent", color: "var(--muted)",
                        }}>
                            <X size={15} />
                        </button>
                    </div>
                </div>

                {/* ══ BODY ════════════════════════════════════════════════════════════ */}
                <div style={{ overflowY: "auto", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "0" }}>

                    {loading ? <Skeleton /> : !data ? (
                        <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "13px", padding: "48px 0", margin: 0 }}>
                            No data available.
                        </p>
                    ) : (
                        <>


                            {/* ── AMOUNT STRIP ─────────────────────────────────────────── */}
                            <div style={{ display: "flex", alignItems: "stretch", gap: "0", marginBottom: "16px" }}>

                                {/* Paid */}
                                <div style={{
                                    flex: 1,
                                    background: "color-mix(in srgb, var(--primary) 7%, transparent)",
                                    border: "1px solid color-mix(in srgb, var(--primary) 18%, transparent)",
                                    borderRadius: "10px 0 0 10px", padding: "11px 14px",
                                    borderRight: "none",
                                }}>
                                    <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--primary)", opacity: 0.75 }}>
                                        Paid · {data.transaction_info.paid_from_currency}
                                    </p>
                                    <p style={{ margin: "3px 0 0", fontSize: "18px", fontWeight: 800, color: "var(--primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                                        {fmtINR(data.amounts.paid_amount)}
                                    </p>
                                </div>

                                {/* Centre connector */}
                                <div style={{
                                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                    padding: "0 10px",
                                    background: "var(--input-bg, #f8fafc)",
                                    border: "1px solid var(--border, rgba(0,0,0,0.08))",
                                    borderLeft: "1px solid color-mix(in srgb, var(--primary) 18%, transparent)",
                                    borderRight: "1px solid var(--border, rgba(0,0,0,0.08))",
                                    minWidth: "72px",
                                    gap: "4px",
                                }}>
                                    <ArrowLeftRight size={14} color="var(--primary)" opacity={0.6} />
                                    {(data.amounts.source_exchange_rate != null && data.amounts.source_exchange_rate !== 1) && (
                                        <span style={{ fontSize: "9px", color: "var(--muted)", fontWeight: 600, textAlign: "center", lineHeight: 1.4 }}>
                                            1 {data.transaction_info.paid_from_currency}<br />
                                            = {data.amounts.source_exchange_rate} {data.transaction_info.paid_to_currency}
                                        </span>
                                    )}
                                </div>

                                {/* Received */}
                                <div style={{
                                    flex: 1,
                                    background: "var(--input-bg, #f8fafc)",
                                    border: "1px solid var(--border, rgba(0,0,0,0.08))",
                                    borderRadius: "0 10px 10px 0", padding: "11px 14px",
                                    borderLeft: "none",
                                }}>
                                    <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)" }}>
                                        Received · {data.transaction_info.paid_to_currency}
                                    </p>
                                    <p style={{ margin: "3px 0 0", fontSize: "18px", fontWeight: 800, color: "var(--text)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                                        {fmtINR(data.amounts.received_amount)}
                                    </p>
                                </div>

                            </div>

                            {/* ── ALLOCATIONS ──────────────────────────────────────────── */}
                            <div style={{ marginBottom: "14px" }}>
                                <p style={{
                                    margin: "0 0 6px",
                                    fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
                                    letterSpacing: "0.08em", color: "var(--muted)",
                                    display: "flex", alignItems: "center", gap: "5px",
                                }}>
                                    <FileText size={11} /> Allocations ({data.allocations.length})
                                </p>
                                <div style={{
                                    background: "var(--input-bg, #f8fafc)",
                                    border: "1px solid var(--border, rgba(0,0,0,0.08))",
                                    borderRadius: "10px", overflow: "hidden",
                                }}>
                                    <AllocationsTable allocations={data.allocations} paymentId={data.header.payment_id} />
                                </div>
                            </div>

                            {/* ── META GRID ────────────────────────────────────────────── */}
                            <div style={{
                                display: "grid", gridTemplateColumns: "1fr 1fr",
                                gap: "0 24px",
                                background: "var(--input-bg, #f8fafc)",
                                border: "1px solid var(--border, rgba(0,0,0,0.08))",
                                borderRadius: "10px", padding: "10px 14px",
                                marginBottom: "14px",
                            }}>
                                {[col1, col2].map((col, ci) => (
                                    <div key={ci} style={{ display: "flex", flexDirection: "column" }}>
                                        {col.map((item, ii) => (
                                            <div key={item.label} style={{
                                                display: "flex", alignItems: "baseline", justifyContent: "space-between",
                                                gap: "8px",
                                                padding: "5px 0",
                                                borderBottom: ii < col.length - 1 ? "1px solid var(--border, rgba(0,0,0,0.05))" : "none",
                                            }}>
                                                <span style={{ fontSize: "11px", color: "var(--muted)", flexShrink: 0, minWidth: "60px" }}>
                                                    {item.label}
                                                </span>
                                                <span style={{ fontSize: "11px", color: "var(--text)", fontWeight: 500, textAlign: "right", wordBreak: "break-all" }}>
                                                    {item.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>



                            {/* ── REMARKS ──────────────────────────────────────────────── */}
                            {data.remarks && (
                                <div style={{
                                    background: "var(--input-bg, #f8fafc)",
                                    border: "1px solid var(--border, rgba(0,0,0,0.08))",
                                    borderRadius: "10px", padding: "10px 14px",
                                }}>
                                    <p style={{
                                        margin: "0 0 5px",
                                        fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
                                        letterSpacing: "0.08em", color: "var(--muted)",
                                        display: "flex", alignItems: "center", gap: "5px",
                                    }}>
                                        <FileText size={11} /> Remarks
                                    </p>
                                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text)", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                                        {data.remarks}
                                    </p>
                                </div>
                            )}

                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default PaymentEntryDetailModal;