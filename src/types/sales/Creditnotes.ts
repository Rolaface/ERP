

export interface CreditNoteQueryParams {
  filters?: [string, string, string | number][];
  fields?: string[];
  with_pagination?: number;
  limit_start?: number;
  limit_page_length?: number;
}


export interface CreditNote {
  noteNo: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
  invoiceNo: string;
  currency: string;
}



export interface CreditNoteListResponse {
  data: CreditNote[];
  total_count?: number;
}

export interface CreditNoteUpdateItem {
  item_code: string;
  qty: number;
  rate: number;
  batch_no?: string;
  warehouse?: string;
}

export interface CreditNoteUpdatePayload {
  update_stock: number;
  items: CreditNoteUpdateItem[];
}