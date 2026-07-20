export interface SalesDebitNoteQueryParams {
  filters?: [string, string, string | number][];
  fields?: string[];
  with_pagination?: number;
  limit_start?: number;
  limit_page_length?: number;
}

export interface SalesDebitNote {
  noteNo: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
  invoiceNo: string;
  currency: string;
}

export interface SalesDebitNoteListResponse {
  data: SalesDebitNote[];
  total_count?: number;
}

export interface SalesDebitNoteUpdateItem {
  item_code: string;
  qty: number; 
  rate: number;
  batch_no?: string;
  warehouse?: string;
}

export interface SalesDebitNoteUpdatePayload {
  update_stock: number; 
  items: SalesDebitNoteUpdateItem[];
}