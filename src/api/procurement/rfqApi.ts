import type { Axios, AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";
import { RFQListResponse } from "../../types/Supply/rfq";
  import { buildListParams } from "../../api/utils/queryBuilder";

const api = createAxiosInstance(ERP_BASE);
export const rfqapi = API.rfq;


export async function createRFQ(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(rfqapi.create, payload);
  return resp.data;
}

export async function getRFQ(
  start: number,
  pageSize: number,
  search: string,
  status?: string,
): Promise<RFQListResponse> {
  try {
    const query = buildListParams({
      fields: ["name", "transaction_date", "schedule_date", "status"],
      start,
      pageSize,
      search,
      searchFields: ["name", "status"],
      status,
    });

    const resp = await api.get(`${rfqapi.GetAll}?${query}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
}
export async function getRFQById(name: string): Promise<any> {
  const resp: AxiosResponse = await api.get(
    `${rfqapi.GetAll}/${encodeURIComponent(name)}`
  );

  return resp.data?.data ?? null;
}

export async function updateRFQ(name: string, payload: any): Promise<any> {
  const resp: AxiosResponse = await api.put(
    `${rfqapi.update}?id=${encodeURIComponent(name)}`,
    payload
  );
  return resp.data;
}
export async function updateStatus(
  name: string,
  action: "submit" | "cancel"
): Promise<any> {
  const resp: AxiosResponse = await api.post(rfqapi.updateStatus, {
    doctype: "Request for Quotation",
    action,
    docnames: [name],
  });
  return resp.data;
}