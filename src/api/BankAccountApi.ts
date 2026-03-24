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
  filter: "Supplier" | "Customer" | "Company" | "Bank" | "Currency" | "Account" | "Shareholder" | "Employee", // ← added 2 new filters
  reference_doctype?: string 
) {
  const url = reference_doctype
    ? `${Account.getBankAccounts}?filter=${filter}&reference_doctype=${encodeURIComponent(reference_doctype)}`
    : `${Account.getBankAccounts}?filter=${filter}`;

  const resp: AxiosResponse = await api.get(url);

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


const mapBankResponse = (
   filter: "Supplier" | "Customer" | "Company" | "Bank" | "Currency" | "Account" | "Shareholder" | "Employee",
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

  case "Shareholder":
      return raw.map((item: any) => ({
        label: item.shareholder_name || item.name,
        value: item.name,
      }));

    case "Employee":
      return raw.map((item: any) => ({
        label: item.employee_name || item.name,
        value: item.name,
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
  currency?: string;
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
  page_size = 10,
  enabled?: 0 | 1  
) {
  try {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(page_size),
    });

    // Only appended when explicitly passed — existing callers unaffected
    if (enabled !== undefined) {
      params.append("enabled", String(enabled));
    }

    const url = `${Account.GetModeOfPayment}?${params.toString()}`;

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
          currency: item.currency ?? "",
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



export type PartyDetails = {
  partyLedgerAccount: string;
  partyName: string;
  partyAccountCurrency: string;
  partyBankAccount: string;
  companyBankAccount: string;
   companyLedgerAccount: string;      
  companyLedgerCurrency: string;   
};

export async function getPartyDetails(
  party: string,
  party_type: "Supplier" | "Customer"
): Promise<PartyDetails> {
  try {
    const resp: AxiosResponse = await api.post(
      Account.GetPartyDetails,
      { party, party_type }
    );
    const res = resp?.data;               

    if (res?.status_code !== 201) {
      throw new Error(res?.message || "Failed to fetch party details");
    }

    const d = res?.data;                       

    return {
      partyLedgerAccount:   d?.party_ledger_account ?? "",
      partyName:            d?.party_name ?? "",
      partyAccountCurrency: d?.party_account_currency ?? "",
      partyBankAccount:     d?.party_bank_account ?? "",
      companyBankAccount:   d?.company_bank_account ?? "",
      companyLedgerAccount: d?.company_account_ledger ?? "",
      companyLedgerCurrency: d?.company_account_ledger_currency ?? "",
    };
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error.message ||
        "Something went wrong"
    );
  }
}



// ── Add type (exported for use in hooks + component) ─────────────────────────
export type BankAccountOption = {
  label: string;
  value: string;
  ledgerAccount: string;
  currency: string;
};

// ── Add one new function at the bottom ───────────────────────────────────────
export async function getBankAccountOptions(filters: {
  company?: boolean;
  party_type?: string;
  party?: string;
}): Promise<BankAccountOption[]> {
  try {
    const params = new URLSearchParams();
    if (filters.company)      params.append("company", "true");
    if (filters.party_type)   params.append("party_type", filters.party_type);
    if (filters.party)        params.append("party", filters.party);

    const url = params.toString()
      ? `${Account.getBankAccountMain}?${params.toString()}`
      : Account.getBankAccountMain;

    const resp: AxiosResponse = await api.get(url);
    const raw: any[] = resp?.data?.message?.data?.bank_accounts ?? [];

    return raw
      .filter((item) => item.isDisabled !== 1)  // exclude disabled accounts
      .map((item) => ({
        label: item.name,
        value: item.name,
        ledgerAccount: item.ledgerAccount ?? "",
        currency: item.currency ?? "",
      }));
  } catch {
    return []; // silent fail — dropdowns just show empty
  }
}


export type LedgerAccountOption = {
  name: string;
  account_currency: string;
  account_number: string;
};
export async function getLedgerAccount(
  payment_type: "Pay" | "Receive",
  filter: "from" | "to"
): Promise<LedgerAccountOption[]> {
  try {
    const resp: AxiosResponse = await api.get(
      Account.getLedgerAccount,
      {
        params: {
          payment_type,
          filter,
        },
      }
    );

    const raw: any[] = resp?.data?.message?.data ?? [];

    return raw.map((item) => ({
      name: item.name,
      account_currency: item.account_currency ?? "",
      account_number: item.account_number ?? "",
    }));
  } catch (error) {
    return [];
  }
}
 