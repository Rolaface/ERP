import { getAllSalesInvoices } from "../api/salesApi"
import type {
  InvoiceAdapter,
  NormalizedInvoice,
  NormalizedPage,
  FetchParams,
  SalesInvoiceRaw,
  ApiPagination,
} from "../types/paymententryrecord.types";


// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function normalizePagination(p: ApiPagination, fallbackPage: number) {
  return {
    page: p?.page ?? fallbackPage,
    totalPages: p?.total_pages ?? 1,
    total: p?.total ?? 0,
    hasNext: p?.has_next ?? false,
    hasPrev: p?.has_prev ?? false,
  };
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

function normalizeSalesInvoice(raw: SalesInvoiceRaw): NormalizedInvoice {
  // Always prefer lowercase — it's the consistent field.
  // Fall back to PascalCase only if lowercase is missing/NaN (backend inconsistency guard).
  const outstanding = Number(raw.outstandingAmount ?? raw.OutStandingAmount ?? 0);
  const totalAmount = Number(raw.totalAmount ?? 0);

  return {
    invoiceNumber: raw.invoiceNumber,
    partyName: raw.customerName ?? "",
    invoiceDate: formatDate(raw.dateOfInvoice),
    dueDate: formatDate(raw.dueDate),
    dueDateRaw: raw.dueDate ?? "9999-12-31",  
    totalAmount,
    paid: totalAmount - outstanding,
    outstanding,
    status: raw.invoiceStatus ?? "Unknown",
  };
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export const salesInvoiceAdapter: InvoiceAdapter = {
  async fetchPage({ page, pageSize, partyName }: FetchParams): Promise<NormalizedPage> {
    const res = await getAllSalesInvoices(
      page,
      pageSize,
      "dueDate",
      "asc",
      undefined,
      partyName,
      0.01   // minOutstanding — backend filter
    );

    const raw: SalesInvoiceRaw[] = res?.data ?? [];

    return {
      data: raw
        .map(normalizeSalesInvoice)
        .filter((inv) => inv.outstanding > 0),  // client-side guard — backend may return 0s
      pagination: normalizePagination(res?.pagination, page),
    };
  },

  async fetchAllForFifo(partyName): Promise<NormalizedInvoice[]> {
    const res = await getAllSalesInvoices(
      1,
      1000,
      "dueDate",
      "asc",
      undefined,
      partyName,
      0.01
    );

    const raw: SalesInvoiceRaw[] = res?.data ?? [];

    return raw
      .map(normalizeSalesInvoice)
      .filter((inv) => inv.outstanding > 0)
      .sort((a, b) => a.dueDateRaw.localeCompare(b.dueDateRaw));
  },
};