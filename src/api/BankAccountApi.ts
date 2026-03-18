import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
export const Account = API.Account;

export async function createNewBankAccount(payload: any) {
  const resp: AxiosResponse = await api.post(
    Account.createnewBankaccount,
    payload
  );

  return resp.data;
}

export async function getBankAccounts(
  filter: "Supplier" | "Customer" | "Company" | "Bank" | "Currency"
) {
  const resp: AxiosResponse = await api.get(
    `${Account.getBankAccounts}?filter=${filter}`
  );

  return mapBankResponse(filter, resp.data);
}


type Option = {
  label: string;
  value: string;
  meta?: Record<string, any>;
};

const mapBankResponse = (
  filter: "Supplier" | "Customer" | "Company" | "Bank" | "Currency",
  response: any
): Option[] => {
  const raw = response?.message?.data?.data;

  if (!raw) return [];

  switch (filter) {
    case "Supplier":
      return raw.map((item: any) => ({
        label: item.supplier_name,
        value: item.name,
        meta: {
          currency: item.default_currency,
        },
      }));

    case "Customer":
      return raw.map((item: any) => ({
        label: item.customer_name,
        value: item.name,
        meta: {
          mobile: item.mobile_no,
        },
      }));

    case "Company":
      return [
        {
          label: raw,
          value: raw,
        },
      ];

    case "Bank":
      return raw.map((item: any) => ({
        label: item.name,
        value: item.name,
        meta: {
          swiftCode: item.swift_number,
        },
      }));

    case "Currency":
      return raw.map((item: any) => ({
        label: item.name || item.code,
        value: item.code || item.name,
      }));

    default:
      return [];
  }
};

export async function getCompanyAccounts() {
  const resp: AxiosResponse = await api.get(
    "/api/method/custom_api.api.search.get_company_ledger_accounts"
  );

  const raw = resp?.data?.message?.data?.data;

  if (!raw) return [];

  return raw.map((item: any) => ({
    label: item.name,
    value: item.name,
    meta: {
      accountNumber: item.account_number,
    },
  }));
}