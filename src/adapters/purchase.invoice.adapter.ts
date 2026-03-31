import { getPurchaseInvoices } from "../api/procurement/PurchaseInvoiceApi";
import type {
  InvoiceAdapter,
  NormalizedInvoice,
  NormalizedPage,
  FetchParams,
  PurchaseInvoiceRaw,
} from "../types/paymententryrecord.types";


// ─── Constants ────────────────────────────────────────────────────────────────

// Purchase invoices with these statuses have nothing left to pay
const PAID_STATUSES = new Set(["Paid", "Cancelled", "Closed"]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

// ─── Normalizer ───────────────────────────────────────────────────────────────
// 
// CRITICAL: Purchase API does NOT return outstandingAmount.
// Strategy:
//   - If status is in PAID_STATUSES → outstanding = 0 (filter these out)
//   - Otherwise → outstanding = grandTotal (full amount is unpaid)
//   - This is a safe assumption; backend should add outstandingAmount in future
//
function normalizePurchaseInvoice(raw: PurchaseInvoiceRaw): NormalizedInvoice {
  const totalAmount = Number(raw.grandTotal ?? 0);
  // TODO think about it
  const isPaid = PAID_STATUSES.has(raw.status);
  const outstanding = Number(raw.outstanding_amount ?? 0);
  const paid = Number(raw.paidAmount ?? 0);

  // deliveryDate is the only date usable for FIFO — no actual dueDate in API
  const dueDateRaw = raw.deliveryDate ?? raw.poDate ?? "9999-12-31";

  return {
    invoiceNumber: raw.pId,              // pId is the invoice ID in purchase API
    partyName: raw.supplierName ?? "",
    invoiceDate: formatDate(raw.poDate),
    dueDate: formatDate(raw.deliveryDate), // best available proxy for due date
    dueDateRaw,
    totalAmount,
    // paid: isPaid ? totalAmount : 0,
    paid,
    outstanding,
    status: raw.status ?? "Unknown",
  };
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export const purchaseInvoiceAdapter: InvoiceAdapter = {
  async fetchPage({ page, pageSize, partyName }: FetchParams): Promise<NormalizedPage> {
    const res = await getPurchaseInvoices(page, pageSize, {
      supplier: partyName,
    });

    const raw: PurchaseInvoiceRaw[] = res?.data ?? [];

    return {
      data: raw
        .map(normalizePurchaseInvoice)
        .filter((inv) => inv.outstanding > 0),  // removes Paid/Cancelled
      pagination: {
        page: res?.pagination?.page ?? page,
        totalPages: res?.pagination?.total_pages ?? 1,
        total: res?.pagination?.total ?? 0,
        hasNext: res?.pagination?.has_next ?? false,
        hasPrev: res?.pagination?.has_prev ?? false,
      },
    };
  },

  async fetchAllForFifo(partyName): Promise<NormalizedInvoice[]> {
    const res = await getPurchaseInvoices(1, 1000, { supplier: partyName });
    const raw: PurchaseInvoiceRaw[] = res?.data ?? [];

    return raw
      .map(normalizePurchaseInvoice)
      .filter((inv) => inv.outstanding > 0)
      .sort((a, b) => a.dueDateRaw.localeCompare(b.dueDateRaw));
  },
};