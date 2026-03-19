// ─── Chart of Accounts — shared types ───────────────────────────────────────

export type COAAccount = {
  name: string;
  account_name: string;
  account_number: string | null;
  parent_account: string | null;
  account_type: string;
  root_type: string;
  is_group: 0 | 1;
  account_currency: string | null;
  disabled: 0 | 1;
  balance: number;
  balance_in_account_currency?: number;
  children: COAAccount[];
};

export type COAResponseData = {
  company: string;
  base_currency: string;
  total: number;
  accounts: COAAccount[];
};

export type COAResponse = {
  message: {
    status_code: number;
    status: string;
    message: string;
    data: COAResponseData;
  };
};

// ─── New Account Modal — form types ─────────────────────────────────────────

export interface NewAccountForm {
  accountName: string;
  accountNumber: string;
  isGroup: boolean;
  accountType: string;
  currency: string;
  company: string;
  rootType?: string;
  parentAccount?: string;
}

export type NewAccountErrors = Partial<Record<keyof NewAccountForm, string>>;

// ─── New Account API payload ─────────────────────────────────────────────────

export interface NewAccountPayload {
  accountName: string;
  accountNumber?: string;
  isGroup: 0 | 1;
  accountType?: string;
  currency?: string;
  company: string;
}