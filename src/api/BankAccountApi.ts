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
  filter: "Supplier" | "Customer" | "Company" | "Bank" | "Currency" | "Account" | "Shareholder" | "Employee",
  reference_doctype?: string,
  search?: string
) {

  let url = `${Account.getBankAccounts}?filter=${filter}`;
  if (reference_doctype) url += `&reference_doctype=${encodeURIComponent(reference_doctype)}`;
  if (search?.trim()) url += `&search=${encodeURIComponent(search.trim())}`;

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
  search?: string;
  page?: number;
  page_size?: number;
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
  if (filters?.search) params.append("search", filters.search);
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
  search?: string,
  enabled?: 0 | 1
) {
  try {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(page_size),
    });

    if (enabled !== undefined) {
      params.append("enabled", String(enabled));
    }
    if (search?.trim()) {
      params.append("search", search.trim());
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
  companyDefaultCurrency: string;
  total_outstanding_amount?: number;
};

export async function getPartyDetails(
  party: string,
  party_type: "Supplier" | "Customer" | "Employee" | "Shareholder"
): Promise<PartyDetails> {
  try {
    const resp: AxiosResponse = await api.post(
      Account.GetPartyDetails,
      { party, party_type }
    );
    
    const res = resp?.data?.message;   
    
    if (res?.status_code !== 201) {
      throw new Error(res?.message || "Failed to fetch party details");
    }

    const d = res?.data;

    return {
      partyLedgerAccount: d?.party_ledger_account ?? "",
      partyName: d?.party_name ?? "",
      partyAccountCurrency: d?.party_account_currency ?? "",
      partyBankAccount: d?.party_bank_account ?? "",
      companyBankAccount: d?.company_bank_account ?? "",
      companyLedgerAccount: d?.company_account_ledger ?? "",
      companyLedgerCurrency: d?.company_account_ledger_currency ?? "",
      companyDefaultCurrency: d?.company_default_currency ?? "",
      total_outstanding_amount: d?.total_outstanding_amount ?? null,
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


export async function getBankAccountOptions(filters: {
  company?: boolean;
  party_type?: string;
  party?: string;
  search?: string;
}): Promise<BankAccountOption[]> {
  console.log("STEP 6 👉 FINAL API PARAM:", {
    party_type: filters.party_type,
    party: filters.party,
  });
  try {
    const params = new URLSearchParams();
    if (filters.company) params.append("company", "true");
    if (filters.party_type) params.append("party_type", filters.party_type);
    if (filters.party) params.append("party", filters.party);
    if (filters.search?.trim()) params.append("search", filters.search.trim());


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
    return [];
  }
}


export type LedgerAccountOption = {
  name: string;
  account_currency: string;
  account_number: string;
};


export async function getLedgerAccount(
  paymentType: "Pay" | "Receive" | "Internal Transfer",
  filter: "from" | "to",
  partyType: "Supplier" | "Customer" | "Employee" | "Shareholder" | "",
  search?: string,
): Promise<LedgerAccountOption[]> {
  try {
    const resp: AxiosResponse = await api.get(
      Account.getLedgerAccount,
      {
        params: {
          paymentType,
          filter,
          ...(partyType ? { partyType } : {}),
          ...(search?.trim() ? { search: search.trim() } : {}),
        },
      }
    );

    const raw: any[] = resp?.data?.data ?? [];

    return raw.map((item) => ({
      name: item.name,
      account_currency: item.account_currency ?? "",
      account_number: item.account_number ?? "",
    }));
  } catch (error) {
    return [];
  }
}



export type ExchangeRateResult =
  | { rate: number; error: null }
  | { rate: null; error: string };

export async function getExchangeRate(
  from_currency: string,
  to_currency: string,
  transaction_date: string,
  args: "for_selling" | "for_buying" = "for_selling",
): Promise<ExchangeRateResult> {
  try {
    const resp: AxiosResponse = await api.post(
      Account.getExchangeRate,
      {
        from_currency,
        to_currency,
        transaction_date,
        args,
      },
    );

    const data = resp?.data;
    const rate = data?.message;

    if (!rate || rate === 0) {
      let errorMsg = "Exchange rate not found. Please enter manually.";
      try {
        const raw: string = data?._server_messages ?? "";
        if (raw) {
          const parsed: Array<{ message?: string }> = JSON.parse(raw);
          const first = parsed?.[0];
          const inner = typeof first === "string" ? JSON.parse(first) : first;
          if (inner?.message) errorMsg = inner.message;
        }
      } catch { }
      return { rate: null, error: errorMsg };
    }

    return { rate: Number(rate), error: null };
  } catch (error: any) {
    return {
      rate: null,
      error: error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch exchange rate.",
    };
  }
}



export type PaymentReference = {
  reference_doctype: string;
  reference_name: string;
  allocated_amount: number;
  due_date?: string;
};

/** One row in the taxes & charges array */
export type PaymentTax = {
  type: string;
  account_head: string;
  tax_rate: number;
  amount: number;
  total: number;
};

/** Full payload sent to createPaymentEntry */
export type CreatePaymentEntryPayload = {
  payment_type: "Pay" | "Receive" | "Internal Transfer";
  party_type: string;
  party_id: string; // ERPNext name field — same as display name for Supplier/Customer

  mode_of_payment: string;
  payment_date: string; // YYYY-MM-DD
  reference_no?: string;
  reference_date?: string; // YYYY-MM-DD

  project?: string;
  cost_center?: string;

  exchange_rate: number;

  paid_from: string; // GL account
  paid_from_bank_account?: string;
  paid_from_account_currency: string;
  paid_from_amount: number;

  paid_to: string; // GL account
  paid_to_bank_account?: string;
  paid_to_account_currency: string;
  paid_to_amount: number;

  references: PaymentReference[];
  taxes: PaymentTax[];
};


export type CreatePaymentEntryResponse = {
  status_code: 201;
  status: "success";
  message: string;
data: {
  paymentId: string;
  paymentType: string;
  partyType: string;
  partyName: string;
  paidFrom: string;
  paidTo: string;
  paidAmount: number;
  receivedAmount: number;
  paymentDate: string;
  referenceNo: string;
  status: string;
};
};

export async function createPaymentEntry(
  payload: CreatePaymentEntryPayload
): Promise<CreatePaymentEntryResponse> {
  const resp: AxiosResponse = await api.post(
    Account.createPaymentEntry,
    payload
  );

  const data = resp?.data;

  // The API returns 201 on success
  if (data?.status_code !== 201) {
    // Throw with the backend message so SweetAlert shows it verbatim
    throw new Error(data?.message || "Failed to create payment entry.");
  }

  return data as CreatePaymentEntryResponse;
}
