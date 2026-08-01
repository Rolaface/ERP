export interface ImportedDeclarationItemRaw {
  task_code: string;
  declaration_no: string;
  declaration_date: string; // "YYYY-MM-DD"
  item_sequence: number;
  hs_code: string;
  item_name: string;
  origin_country: string;
  export_country: string;
  quantity: number;
  quantity_unit: string;
  package_count: number;
  package_unit: string;
  total_weight: number;
  net_weight: number;
  invoice_amount: number;
  currency: string;
  exchange_rate: number;
  base_invoice_amount: number;
  supplier_name: string | null;
  agent_name: string;
  status: string;
  status_code: string;
  mapped_erp_item: string | null;
  remarks: string | null;
  checker: string;
  checked_at: string; // "YYYY-MM-DD HH:mm:ss"
}

// Endpoint returns a flat array of these directly — no wrapper.
export type ImportedDeclarationsApiResponse = ImportedDeclarationItemRaw[];