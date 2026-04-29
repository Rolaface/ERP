

export interface CreditNoteQueryParams {
  filters?: [string, string, string | number][];
  fields?: string[];
  with_pagination?: number;
  limit_start?: number;
  limit_page_length?: number;
}


export interface CreditNote {
  name: string;
  customer_name: string;
  grand_total: number;
  status: string;
  posting_date: string;
  return_against: string;
}



export interface CreditNoteListResponse {
  data: CreditNote[];
  total_count?: number;
}