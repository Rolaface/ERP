

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