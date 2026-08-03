export interface ImportedDeclarationItemRaw {
    name: string; 

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
export interface ImportedDeclarationsApiResponse {
  status_code: number;
  status: string;
  message: string;
  data: ImportedDeclarationItemRaw[];
  pagination?: {

    [key: string]: unknown;
  };
}

export interface ImportedDeclarationDetailRaw {
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
  mapped_erp_item: string | null;
  remarks: string | null;
  checker: string | null;
  checked_at: string | null;
  creation: string;
  modified: string;
  docstatus: number;
}

export interface ImportedDeclarationDetailApiResponse {
  message: {
    status_code: number;
    status: string;
    message: string;
    data: ImportedDeclarationDetailRaw;
  };
}