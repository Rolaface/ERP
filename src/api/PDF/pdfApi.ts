import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";

const api = createAxiosInstance(ERP_BASE);

export async function getSalesInvoicePdf(
  name: string,
  doctype: string = "Sales Invoice",
): Promise<Blob> {
  const resp: AxiosResponse = await api.get(
    `${API.pdf.getDocumentPdf}`,
    {
      params: {
        name,
        doctype,
      },
      responseType: "blob",
    },
  );

  return resp.data;
}