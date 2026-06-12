import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
export const CustomerAPI = API.customer;
export const SupplierAPI = API.supplier;

// ─── Filter shape ─────────────────────────────────────────────────────────────

interface StatementFilters {
  from_date?:    string;
  to_date?:      string;
  voucher_type?: string;
}

// ─── Customer Statement ───────────────────────────────────────────────────────

export async function getCustomerStatement(
  customerId: string,
  page:        number = 1,
  page_size:   number = 10,
  filters:     StatementFilters = {},
): Promise<any> {
  const resp: AxiosResponse = await api.get(CustomerAPI.getStatement, {
    params: {
      id: customerId,
      page,
      page_size,
      ...filters,          
    },
  });
  return resp.data;
}

export async function getCustomerStatementPdf(
  customerId: string,
  filters: StatementFilters = {},
): Promise<Blob> {
  const resp: AxiosResponse = await api.get(CustomerAPI.getcusotmerstatementpdf, {
    params: {
      id: customerId,
      ...filters,
    },
    responseType: "blob",   
  });
  return resp.data;      
}
// ─── Supplier Statement ───────────────────────────────────────────────────────

export async function getSupplierStatement(
  supplierId: string,
  page:        number = 1,
  page_size:   number = 10,
  filters:     StatementFilters = {},
): Promise<any> {
  const resp: AxiosResponse = await api.get(SupplierAPI.getStatement, {
    params: {
      supplierId,
      page,
      page_size,
      ...filters,
    },
  });
  return resp.data;
}