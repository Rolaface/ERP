import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);
export const CustomerPaymentAPI = API.customer;

/**
 * Payload for receive payment API
 */
export interface ReceiveCustomerPaymentPayload {
  customer_name: string;

  invoice_number: string;
  payment_date: string;
  payment_mode: string;
  amount: number;
  reference_number?: string;
  deposit_into_account?: string;
  notes?: string;
}
/**
 * Receive payment for a customer invoice
 */
export async function receiveCustomerPayment(
  payload: ReceiveCustomerPaymentPayload,
): Promise<any> {
  const resp: AxiosResponse = await api.post(
    CustomerPaymentAPI.receivePayment,
    payload,
  );

  return resp.data;
}

export const getAllPayments = async (
  partyType: "Customer" | "Supplier",
  page: number,
  pageSize: number,
  search?: string,
): Promise<any> => {
  const resp: AxiosResponse = await api.get(
    CustomerPaymentAPI.getAllpayements,
    {
      params: {
        partyType,
        page,
        pageSize,
        search,
      },
    },
  );

  return resp.data;
};

export const getPaymentById = async (paymentId: string): Promise<any> => {
  const resp: AxiosResponse = await api.get(CustomerPaymentAPI.getPaymentById, {
    params: {
      payment_id: paymentId,
    },
  });

  return resp.data;
};
