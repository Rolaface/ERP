export interface CFRawRow {
  section?: string;
  section_name?: string;
  account?: string;
  account_name?: string;
  parent_section?: string | null;
  indent?: number;
  currency?: string;
  warn_if_negative?: boolean;
  accounts?: string[];
  total?: number;
  [periodKey: string]: any;
}
 
export interface CFColumn {
  fieldname: string;
  label: string;
  fieldtype: string;
  width?: number;
  options?: string;
  hidden?: number;
}
 
export interface CFSummaryItem {
  label: string;
  value: number;
  datatype?: string;
  currency?: string;
  indicator?: string;
}
 
export interface CFApiData {
  columns: CFColumn[];
  summary: CFSummaryItem[];
  data: CFRawRow[];
}
 
export interface CFResponse {
  message: {
    status_code: number;
    status: string;
    message: string;
    data: CFApiData;
  };
}