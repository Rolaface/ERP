import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";
import { mapGetBankAccounts } from "../types/BankAccount/BankMapper";
import type { BankAccount } from "../types/BankAccount/bank";

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
  filter: "Supplier" | "Customer" | "Company" | "Bank" | "Currency" | "Account"
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


type BankAccountFilters = {
  company?: boolean;
  party_type?: "Supplier" | "Customer";
  party?: string;
  page?:number;
  page_size?:number;
};



const validAccountTypes = ["Supplier", "Customer", "Company", "Bank"];

const mapBankResponse = (
  filter: "Supplier" | "Customer" | "Company" | "Bank" | "Currency" | "Account",
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
  return raw?.company
    ? [
        {
          label: raw.company,
          value: raw.company,
          meta: {
            currency: raw.currency, 
          },
        },
      ]
    : [];

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

   case "Account":
  return raw.map((item: any) => ({
    label: item.name,
    value: item.name,
    meta: {
      accountNumber: item.account_number,
    },
  }));

    default:
      return [];
  }
};


type BankAccountResponse = {
  data: BankAccount[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
};

export async function getAllBankAccounts(
  filters?: BankAccountFilters
): Promise<BankAccountResponse> {

  const params = new URLSearchParams();

  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.page_size) params.append("page_size", String(filters.page_size));
  if (filters?.company) params.append("company", "true");
  if (filters?.party_type) params.append("party_type", filters.party_type);
  if (filters?.party) params.append("party", filters.party);

  const url = params.toString()
    ? `${Account.getAllBankAccounts}?${params.toString()}`
    : Account.getAllBankAccounts;

  const resp: AxiosResponse = await api.get(url);


  const raw = resp?.data?.message?.data;

  return {
    data: mapGetBankAccounts(raw), 
    pagination: raw?.pagination || {
      total: 0,
      page: 1,
      page_size: 10,
      total_pages: 1,
    },
  };
}

type UpdateBankStatusPayload = {
  bankAccountId: string;
  isDefault?: 0 | 1;
  isDisabled?: 0 | 1;
};

export async function updateBankAccountStatus(
  payload: UpdateBankStatusPayload
) {
  try {
    const resp: AxiosResponse = await api.put(
      Account.updateStatus,
      payload
    );

    const res = resp?.data?.message;

    if (res?.status_code !== 200) {
      throw new Error(res?.message || "Failed to update bank status");
    }

    return res;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message?.message ||
        error.message ||
        "Something went wrong"
    );
  }
}