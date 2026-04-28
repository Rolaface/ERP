import type { Axios, AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";
import { RFQListResponse } from "../../types/Supply/rfq";

const api = createAxiosInstance(ERP_BASE);
export const rfqapi = API.rfq;


export async function createRFQ(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(rfqapi.create, payload);
  return resp.data;
}

export async function getRFQ(
  page = 1,
  pageSize = 10
): Promise<RFQListResponse> {

  const start = (page - 1) * pageSize;

  const resp = await api.get(
    `${rfqapi.GetAll}?fields=["name","transaction_date","schedule_date","status"]&with_pagination=1&limit_start=${start}&limit_page_length=${pageSize}`
  );

  return {
    data: resp.data?.data ?? [],
    pagination: resp.data?.pagination,
  };
}

export async function getRFQById(name: string): Promise<any> {
  const resp: AxiosResponse = await api.get(
    `${rfqapi.GetAll}/${encodeURIComponent(name)}`
  );

  return resp.data?.data ?? null;
}

export async function updateRFQ(name: string, payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(
    `${rfqapi.update}?id=${encodeURIComponent(name)}`,
    payload
  );
  return resp.data;
}