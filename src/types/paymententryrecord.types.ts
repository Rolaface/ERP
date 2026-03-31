// ─── Raw API shapes (exact fields from server, no assumptions) ────────────────

export interface SalesInvoiceRaw {
  invoiceNumber: string;
  customerName: string;
  customerTpin: string | null;
  receiptNumber: string | null;
  currency: string | null;
  exchangeRate: string | null;
  dateOfInvoice: string;         // "YYYY-MM-DD"
  dueDate: string | null;        // "YYYY-MM-DD" | null
  totalAmount: number;
  totalTax: number | null;
  invoiceStatus: string | null;  // "Approved" | "Draft" | "Sent" | null
  outstandingAmount: number;     // lowercase — use this one
  OutStandingAmount: number;     // PascalCase — backend duplicate, ignore
  invoiceTypeParent: string;
  invoiceType: string | null;
}

export interface PurchaseInvoiceRaw {
  pId: string;                   // invoice number — different field name!
  supplierName: string;
  status: string;                // "Submitted" | "Draft" | "Paid"
  poDate: string;                // "YYYY-MM-DD" — creation date
  deliveryDate: string;          // "YYYY-MM-DD" — closest thing to dueDate
  grandTotal: number;            // total amount
  registrationType: string;
  syncStatus: string | null;
  shippingRule: string;
  outstanding_amount:number
}

export interface ApiPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface SalesInvoiceListResponse {
  status_code: number;
  status: string;
  message: string;
  data: SalesInvoiceRaw[];
  pagination: ApiPagination;
}

export interface PurchaseInvoiceListResponse {
  status_code: number;
  status: string;
  message: string;
  data: PurchaseInvoiceRaw[];
  pagination: ApiPagination;
}

// ─── Normalized shape — what every adapter must produce ──────────────────────

export interface NormalizedInvoice {
  invoiceNumber: string;      // unified ID field
  partyName: string;
  invoiceDate: string;        // display string "DD/MM/YYYY"
  dueDate: string;            // display string "DD/MM/YYYY" | "—"
  dueDateRaw: string;         // ISO "YYYY-MM-DD" for FIFO sort, "9999-12-31" if missing
  totalAmount: number;
  paid: number;               // totalAmount - outstanding
  outstanding: number;
  status: string;
}

export interface NormalizedPage {
  data: NormalizedInvoice[];
  pagination: NormalizedPagination;
}

export interface NormalizedPagination {
  page: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─── Adapter contract ─────────────────────────────────────────────────────────

export interface FetchParams {
  page: number;
  pageSize: number;
  partyName?: string;
}

export interface InvoiceAdapter {
  /**
   * Fetch a page of outstanding invoices for the given party.
   * Implementations must filter out fully-paid invoices.
   */
  fetchPage: (params: FetchParams) => Promise<NormalizedPage>;

  /**
   * Fetch ALL outstanding invoices in one call for FIFO allocation.
   * Use a large pageSize (1000). Sorted by dueDateRaw ASC by adapter.
   */
  fetchAllForFifo: (partyName: string | undefined) => Promise<NormalizedInvoice[]>;
}

// ─── Allocation types ─────────────────────────────────────────────────────────

export interface AllocationMap {
  [invoiceNumber: string]: number;
}

export interface AllocationResult {
  selectedInvoices: Array<{ invoiceNumber: string; amount: number }>;
  allocatedAmount: number;
  allocations: AllocationMap;
}