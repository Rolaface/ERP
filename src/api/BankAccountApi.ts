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

export async function createModeOfPayment(payload: {
  name: string;
  type: string;
  default_account?: string;
  enabled?: number;
}) {
  try {
    const resp: AxiosResponse = await api.post(
      Account.ModeOfPayment,
      payload
    );

    const data = resp?.data;

    if (data?.status_code !== 201) {
      throw new Error(data?.message || "Failed to create mode of payment");
    }

    return data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error.message ||
      "Something went wrong"
    );
  }
}

type ModeOfPayment = {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  defaultAccount?: string;
};

type ModeOfPaymentResponse = {
  data: ModeOfPayment[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
};

export async function getAllModeOfPayment(
  page = 1,
  page_size = 10
) {
  try {
    const url = `${Account.GetModeOfPayment}?page=${page}&page_size=${page_size}`;

    const resp: AxiosResponse = await api.get(url);

    const res = resp?.data; 

    if (res?.status_code !== 200) {
      throw new Error(res?.message || "Failed to fetch mode of payment");
    }

    const raw = res?.data;

    return {
      data:
        raw?.modeOfPayments?.map((item: any) => ({
          id: item.name,
          name: item.modeOfPayment,
          type: item.type,
          enabled: item.enabled === 1,
          defaultAccount: item.defaultAccount,
        })) || [],
      pagination: raw?.pagination || {
        total: 0,
        page: 1,
        page_size: 10,
        total_pages: 1,
      },
    };
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error.message ||
      "Something went wrong"
    );
  }
}

export async function getDefaultAccounts() {
  try {
    const resp: AxiosResponse = await api.get(
      Account.GetDefaultAccounts
    );

    const res = resp?.data;

    if (res?.status_code !== 200) {
      throw new Error(res?.message || "Failed to fetch default accounts");
    }

    return (
      res?.data?.map((item: any) => ({
        label: item.value,
        value: item.value,
      })) || []
    );
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error.message ||
      "Something went wrong"
    );
  }
}


export async function updateModeOfPaymentStatus(payload: {
  name: string;
  enabled: 0 | 1;
}) {
  try {
    const resp: AxiosResponse = await api.put(
      Account.UpdateStatusModeOfPayment,
      payload
    );

    const data = resp?.data;

    if (data?.status_code !== 200) {
      throw new Error(data?.message || "Failed to update mode of payment");
    }

    return data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error.message ||
      "Something went wrong"
    );
  }
}