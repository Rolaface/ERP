import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
 
import { API, ERP_BASE } from "../../config/api";
const api = createAxiosInstance(ERP_BASE);
 
export const InventoryImportAPI = API.inventoryImport;
 
export interface InventoryImportReconciliation {
  warehouse: string;
  name: string;
  status: string;
}
 
export interface InventoryImportResult {
  success: boolean;
  queued?: boolean;
  message?: string;
  total_rows?: number;
  items_processed?: number;
  unique_items?: number;
  reconciliations?: InventoryImportReconciliation[];
  errors?: string[];
}
 
export async function uploadInventoryImportFile(
  file: File,
): Promise<InventoryImportResult> {
  const formData = new FormData();
  formData.append("file", file);
 
  const resp: AxiosResponse = await api.post(
    InventoryImportAPI.upload,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return resp.data.message ?? resp.data;
}