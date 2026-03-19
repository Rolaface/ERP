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

const validAccountTypes = ["Supplier", "Customer", "Company", "Bank"];

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



export async function getAllBankAccounts(
  onlyCompany = false
): Promise<BankAccount[]> {
  const url = onlyCompany
    ? `${Account.getAllBankAccounts}?company=true`
    : Account.getAllBankAccounts;

  const resp: AxiosResponse = await api.get(url);

  const uiData = mapGetBankAccounts(resp.data);

  return uiData.map((item) => ({
    id: item.id,
    bankName: item.bankName,
    accountNo: item.accountNo,
    accountHolderName: item.accountHolderName,
    swiftCode: "", 
    sortCode: item.sortCode,
    currency: item.currency,
    openingBalance: 0,
    dateAdded: item.dateAdded,
    branchAddress: item.branchAddress,
    isDefault: item.isDefault,
    isDisabled:item.isDisabled,
    accountFor: validAccountTypes.includes(item.accountFor)
    ? (item.accountFor as "Supplier" | "Customer" | "Company" | "Bank")
    : "",
  }));
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