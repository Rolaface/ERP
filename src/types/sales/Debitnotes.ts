export interface DebitNote  {
  noteNo: string;
  purchase_invoiceNo: string;
  supplier: string;
  date: string;
  amount: number;
  status: string;
  currency:string
};


export interface DebitNoteResponse {
  status_code: number;
  data: Record<string, any> | null;
  message: string;
  _server_messages?: string;
}
 
