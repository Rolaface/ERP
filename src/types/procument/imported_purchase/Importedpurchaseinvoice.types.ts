// Mirrors ImportedItem.types.ts, renamed for the Purchase Invoice domain.
export interface ImportedPurchaseInvoiceItemRaw {
  taskCd: string;
  dclDe: string; // e.g., "20231209"
  itemSeq: number;
  dclNo: string;
  hsCd: string;
  itemNm: string;
  imptItemsttsCd: string;
  orgnNatCd: string;
  exptNatCd: string;
  pkg: number;
  pkgUnitCd: string;
  qty: number;
  qtyUnitCd: string;
  totWt: number;
  netWt: number;
  spplrNm: string | null;
  agntNm: string;
  invcFcurAmt: number;
  invcFcurCd: string;
  invcFcurExcrt: number;
  dclRefNum: string | null;

  // Custom/ERP-specific fields (optional, appear once saved/mapped)
  name?: string;
  mapped_purchase_invoice?: string | null; // was mapped_erp_item
  remarks?: string | null;
  checker?: string;
  checked_at?: string; // "YYYY-MM-DD HH:mm:ss"
}

export interface ImportedPurchaseInvoicesApiResponse {
  status_code: number;
  status: string;
  message: string;
  data: ImportedPurchaseInvoiceItemRaw[];
  pagination?: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface ImportedPurchaseInvoiceDetailRaw {
  name: string;
  task_code: string | null;
  declaration_no: string;
  declaration_date: string | null;
  item_sequence: number | null;
  hs_code: string | null;
  item_name: string | null;
  origin_country: string | null;
  export_country: string | null;
  quantity: number | null;
  quantity_unit: string | null;
  package_count: number | null;
  package_unit: string | null;
  total_weight: number | null;
  net_weight: number | null;
  invoice_amount: number | null;
  currency: string | null;
  exchange_rate: number | null;
  base_invoice_amount: number | null;
  supplier_name: string | null;
  agent_name: string | null;
  status: string | null;
  status_code: string | null;
  mapped_purchase_invoice: string | null; // was mapped_erp_item
  remarks: string | null;
  checker: string | null;
  checked_at: string | null;
  creation: string;
  modified: string;
  docstatus: number;
}

export interface ImportedPurchaseInvoiceDetailApiResponse {
  message: {
    status_code: number;
    status: string;
    message: string;
    data: ImportedPurchaseInvoiceDetailRaw;
  };
}