// ─── Raw API shapes (exact fields from server, no assumptions) ────────────────

export interface SalesInvoiceRaw {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerTpin: string | null;
  receiptNumber: string | null;
  currency: string | null;
  exchangeRate: string | null;
  dateOfInvoice: string; 
  dueDate: string | null; 
  totalAmount: number;
  totalTax: number | null;
  status: string | null;
  outstanding_amount: number;
  OutStandingAmount: number; 
  invoiceTypeParent: string;
  invoiceType: string | null;
}

export interface PurchaseInvoiceRaw {
  pId: string; 
  supplierName: string;
  status: string; 
  poDate: string; 
  deliveryDate: string; 
  grandTotal: number; 
  registrationType: string;
  syncStatus: string | null;
  shippingRule: string;
  outstanding_amount: number;
  paidAmount: number;
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



export interface NormalizedInvoice {
  invoiceNumber: string; 
  partyName: string;
  invoiceDate: string; 
  dueDate: string; 
  dueDateRaw: string; 
  totalAmount: number;
  paid: number; 
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
  partyId?: string;
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
  fetchAllForFifo: (
    partyId: string | undefined,
  ) => Promise<NormalizedInvoice[]>;
  fetchById(invoiceId: string): Promise<NormalizedInvoice | null>;
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
