import { getAllSalesInvoices,getSalesInvoiceById  } from "../api/salesApi"
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
  const outstanding = Number(raw.outstanding_amount ?? raw.OutStandingAmount ?? 0);
const totalAmount = Number(
  raw.totalAmount ??
  (raw as any).total ??
  0
);

  return {
   invoiceNumber: raw.invoiceNumber ?? (raw as any).id,  
    partyName: raw.customerName ?? "",
    invoiceDate: formatDate(raw.dateOfInvoice),
    dueDate: formatDate(raw.dueDate),
    dueDateRaw: raw.dueDate ?? "",  
    totalAmount,
    paid: totalAmount - outstanding,
    outstanding,
    status: raw.status ?? (raw as any).status ?? "Unknown",
  };
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export const salesInvoiceAdapter: InvoiceAdapter = {
  async fetchPage({ page, pageSize, partyId }: FetchParams): Promise<NormalizedPage> {
   const res = await getAllSalesInvoices(
      page, pageSize, "due_date", "desc", undefined, partyId, 0.01,
      ["Partly Paid", "Unpaid", "Overdue"]
    );
    const raw: SalesInvoiceRaw[] = res?.data ?? [];

    return {
      data: raw
        .map(normalizeSalesInvoice)
        .filter((inv) => inv.outstanding > 0), 
      pagination: normalizePagination(res?.pagination, page),
    };
  },

  async fetchAllForFifo(partyId): Promise<NormalizedInvoice[]> {
   const res = await getAllSalesInvoices(
      1, 1000, "dueDate", "desc", undefined, partyId, 0.01,
      ["Partly Paid", "Unpaid", "Overdue"]
    );
    console.log(res?.data?.[0]) 

    const raw: SalesInvoiceRaw[] = res?.data ?? [];

    return raw
      .map(normalizeSalesInvoice)
      .filter((inv) => inv.outstanding > 0)
      .sort((a, b) => a.dueDateRaw.localeCompare(b.dueDateRaw));
  },

    async fetchById(invoiceId): Promise<NormalizedInvoice | null> {
    const res = await getSalesInvoiceById(invoiceId);

    const raw =
      res?.message?.data ??
      res?.data;

    if (!raw) return null;

    return normalizeSalesInvoice({
      ...raw,
      invoiceNumber: raw.id ?? raw.invoiceNumber,
      totalAmount: raw.total ?? raw.totalAmount,
      dateOfInvoice: raw.invoiceDate ?? raw.dateOfInvoice,
    });
  },
  
};
