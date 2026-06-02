import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";

const api = createAxiosInstance(ERP_BASE);

export async function getPdf(
  name: string,
  doctype: string,
): Promise<Blob> {
  const resp: AxiosResponse = await api.get(
    `${API.invoice.getPdf}`,
    {
      params: {
        doctype,
        name,
        no_letterhead: 0,
        _lang: "en",
        pdf_generator: "chrome",
      },
      responseType: "blob",
    },
  );

  return resp.data;
}