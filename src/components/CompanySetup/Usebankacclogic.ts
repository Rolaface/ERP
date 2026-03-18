import { useState, useEffect } from "react";
import type { BankAccount } from "../../types/company";
import { showApiError } from "../../utils/alert";
import {
  getCompanyBankAccounts,
  getCompanyAccounts,
} from "../../api/companySetupApi";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

// ── Extended form type (includes UI-only fields) ──────────────────────────────
export interface BankAccFormExtended extends BankAccount {
  accountType?: string;
  accountSubtype?: string;
  lastIntegrationDate?: string;
}

export interface UseBankAccLogicProps {
  onSubmit: (account: BankAccount) => void;
  onClose: () => void;
  /** Company name to display when "Is Company Account" is checked */
  companyName?: string;
}

export interface UseBankAccLogicReturn {
  // form
  form: BankAccFormExtended;
  // toggles
  isCompanyAccount: boolean;
  isDefaultAccount: boolean;
  isDisabled: boolean;
  // party (only when NOT company account)
  partyType: string;
  party: string;
  // options
  bankOptions: { value: string; label: string }[];
  accountOptions: { value: string; label: string }[];
  // handlers
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleDateChange: (name: string, value: string) => void;
  handleReset: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  setIsCompanyAccount: (v: boolean) => void;
  setIsDefaultAccount: (v: boolean) => void;
  setIsDisabled: (v: boolean) => void;
  setPartyType: (v: string) => void;
  setParty: (v: string) => void;
  companyName: string;

}

// ── Helpers ───────────────────────────────────────────────────────────────────
const todayIso = () => new Date().toISOString().split("T")[0];

const emptyForm = (bankName = "", accountName = ""): BankAccFormExtended => ({
  accountNo: "",
  accountHolderName: "",
  sortCode: "",
  accountName,
  iban: "",
  bankName,
  branchAddress: "",
  currency: "",
  dateAdded: todayIso(),
  isdefault: false,
  accountType: "",
  accountSubtype: "",
  lastIntegrationDate: "",
});

// ═══════════════════════════════════════════════════════════════════════════════
export const useBankAccLogic = ({
  onSubmit,
  onClose,
}: UseBankAccLogicProps): UseBankAccLogicReturn => {
  const [form, setForm] = useState<BankAccFormExtended>(emptyForm());
  const [isCompanyAccount, setIsCompanyAccount] = useState(false);
  const [isDefaultAccount, setIsDefaultAccount] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [partyType, setPartyType] = useState("");
  const [party, setParty] = useState("");
  const [bankOptions, setBankOptions] = useState<{ value: string; label: string }[]>([]);
  const [accountOptions, setAccountOptions] = useState<{ value: string; label: string }[]>([]);
  const [companyName, setCompanyName] = useState("");
  //--fetch company
  useEffect(() => {
  const fetchCompany = async () => {
    try {
      const res = await fetch(
        `/api/company/${COMPANY_ID}`
      );
      const data = await res.json();

      if (data?.status === "success") {
        setCompanyName(data.data.companyName);
      }
    } catch (err) {
      console.error("Company fetch failed", err);
    }
  };

  fetchCompany();
}, []);
  // ── Fetch banks ─────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await getCompanyBankAccounts();
        const banks: { value: string; label: string }[] =
          res?.message?.data?.data?.map((item: any) => ({
            value: item.value,
            label: item.value,
          })) || [];
        setBankOptions(banks);
        if (banks.length > 0)
          setForm((p) => ({ ...p, bankName: banks[0].value }));
      } catch {
        showApiError("Failed to load banks");
      }
    })();
  }, []);

  // ── Fetch account names ─────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await getCompanyAccounts();
        const accounts: { value: string; label: string }[] =
          res?.message?.data?.data?.map((item: any) => ({
            value: item.value,
            label: item.value,
          })) || [];
        setAccountOptions(accounts);
        if (accounts.length > 0)
          setForm((p) => ({ ...p, accountName: accounts[0].value }));
      } catch {
        showApiError("Failed to load account names");
      }
    })();
  }, []);

  // ── When company account is unchecked, clear party fields ──────────────────
  const handleSetIsCompanyAccount = (v: boolean) => {
    setIsCompanyAccount(v);
    if (v) {
      // reset party when switching to company account
      setPartyType("");
      setParty("");
    }
  };

  // ── Generic field change ────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleDateChange = (name: string, value: string) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setForm(emptyForm(bankOptions[0]?.value ?? "", accountOptions[0]?.value ?? ""));
    setIsCompanyAccount(false);
    setIsDefaultAccount(false);
    setIsDisabled(false);
    setPartyType("");
    setParty("");
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accountNo || !form.bankName || !form.currency || !form.accountName) {
      showApiError("Please fill in all required fields.");
      return;
    }
    // Strip UI-only fields so BankAccount type stays clean
    const { accountType, accountSubtype, lastIntegrationDate, ...bankAccount } = form;
    onSubmit({ ...bankAccount, isdefault: isDefaultAccount });
    handleReset();
    onClose();
  };

  return {
    form,
    isCompanyAccount,
    isDefaultAccount,
    isDisabled,
    partyType,
    party,
    bankOptions,
    accountOptions,
    handleChange,
    handleDateChange,
    handleReset,
    handleSubmit,
    setIsCompanyAccount: handleSetIsCompanyAccount,
    setIsDefaultAccount,
    setIsDisabled,
    setPartyType,
    setParty,
    companyName,
  
  };
};