import { useState, useEffect } from "react";
import { showApiError, showSuccess } from "../utils/alert";
import type { NewAccountForm, NewAccountErrors, COAAccount } from "../types/coa";
import { createChartOfAccount, updateChartOfAccount, type CreateCOAPayload } from "../api/Accounting/AccountApi";
import { getBankAccounts } from "../api/BankAccountApi";

const companyId = import.meta.env.VITE_COMPANY_ID;
const companyName = import.meta.env.VITE_COMPANY_NAME;


export { type NewAccountForm };

const emptyForm = (): NewAccountForm => ({
  accountName: "",
  accountNumber: "",
  isGroup: false,
  rootType: "",
  accountType: "",
  currency: "",
  company: "",
  parentAccount: "",
});

export const ACCOUNT_TYPE_OPTIONS = [
  "Accumulated Depreciation",
  "Asset Received But Not Billed",
  "Bank",
  "Cash",
  "Chargeable",
  "Capital Work in Progress",
  "Cost of Goods Sold",
  "Current Asset",
  "Current Liability",
  "Depreciation",
  "Direct Expense",
  "Direct Income",
  "Equity",
  "Expense Account",
  "Expenses Included In Asset Valuation",
  "Expenses Included In Valuation",
  "Fixed Asset",
  "Income Account",
  "Indirect Expense",
  "Indirect Income",
  "Liability",
  "Payable",
  "Receivable",
  "Round Off",
  "Round Off for Opening",
  "Stock",
  "Stock Adjustment",
  "Stock Received But Not Billed",
  "Service Received But Not Billed",
  "Tax",
  "Temporary",
];

export const ROOT_TYPE_OPTIONS = [
  "Asset",
  "Liability",
  "Income",
  "Expense",
  "Equity",
];

export const useCoaLogic = (
  onSuccess?: () => void,
  parentAccount?: COAAccount | null,
  editAccount?: COAAccount | null,
) => {
  const [form, setForm] = useState<NewAccountForm>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<NewAccountErrors>({});
  const [companies, setCompanies] = useState<{ label: string; value: string }[]>([]);
  const [currencies, setCurrencies] = useState<{ label: string; value: string }[]>([]);
  const isEditMode = !!editAccount;


  // When parentAccount changes, reset form and pre-fill parent

  useEffect(() => {
    if (parentAccount) {
      setForm(prev => ({
        ...emptyForm(),
        company: prev.company,
        parentAccount: parentAccount.name,
        // Pre-fill account type from parent if available
        accountType: parentAccount.account_type ?? "",
      }));
    } else {
      setForm(emptyForm());
    }
    setErrors({});
  }, [parentAccount]);

  useEffect(() => {
    if (!editAccount) return;
    setForm(prev => ({
      ...prev,
      accountNumber: editAccount.account_number ?? "",
      isGroup: editAccount.is_group === 1,
      rootType: editAccount.root_type ?? "",
      accountType: editAccount.account_type ?? "",
      currency: editAccount.account_currency ?? "",
    }));
    setErrors({});
  }, [editAccount]);

  // Load company and currency options from API
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [companyData, currencyData] = await Promise.all([
          getBankAccounts("Company"),
          getBankAccounts("Currency"),
        ]);

        const companyOptions = companyData.map((c: any) => ({
          label: c.label,
          value: c.label,
        }));

        const currencyOptions = currencyData.map((c: any) => ({
          label: c.label,
          value: c.value,
        }));

        setCompanies(companyOptions);
        setCurrencies(currencyOptions);

        // Auto-select first company if form company is empty
        if (companyOptions.length > 0) {
          setForm(prev => ({
            ...prev,
            company: companyOptions[0].value,
          }));
        }

      } catch (err) {
        console.error("Failed to load company/currency options", err);
      }
    };

    loadOptions();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox"
      ? (e.target as HTMLInputElement).checked
      : value;

    setForm(prev => ({ ...prev, [name]: val }));

    if (errors[name as keyof NewAccountForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: NewAccountErrors = {};

    // account name only required in create mode
    if (!isEditMode && !form.accountName.trim()) {
      newErrors.accountName = "Account name is required";
    }

    if (form.isGroup && !form.rootType) {
      newErrors.rootType = "Root type is required for group accounts";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      if (isEditMode && editAccount) {
        const payload: CreateCOAPayload & { name: string } = {
          doctype: "Account",
          is_root: "false",
          name: editAccount.name,
          account_name: editAccount.account_name,
          company: form.company,
          is_group: form.isGroup ? 1 : 0,
          account_number: form.accountNumber.trim(),
          account_currency: form.currency.trim() || undefined,
          account_type: form.accountType || undefined,
          root_type: form.isGroup ? form.rootType : undefined,
          parent: form.parentAccount || undefined,
        };

        const res = await updateChartOfAccount(editAccount.name, payload);
        const isSuccess = !!res?.data || !!res?.message;

        if (!res || !isSuccess) {
          showApiError(res?.message ?? res);
          return;
        }

        const successMsg =
          res?.message?.message ||
          (typeof res?.message === "string" ? res.message : null) ||
          "Account updated successfully";

        showSuccess(successMsg);
        reset();
        onSuccess?.();

      } else {
        const payload: CreateCOAPayload = {
          doctype: "Account",
          is_root: "false",
          account_name: form.accountName.trim(),
          company: form.company,
          is_group: form.isGroup ? 1 : 0,
          account_number: form.accountNumber.trim(),
          account_currency: form.currency.trim() || undefined,
          account_type: form.accountType || undefined,
          root_type: form.isGroup ? form.rootType : undefined,
          parent: form.parentAccount || undefined,
        };

        const res = await createChartOfAccount(payload);
        const isSuccess = !!res?.message;

        if (!res || !isSuccess) {
          showApiError(res?.message ?? res);
          return;
        }

        const successMsg =
          res?.message?.message ||
          (typeof res?.message === "string" ? res.message : null) ||
          "Account created successfully";

        showSuccess(successMsg);
        reset();
        onSuccess?.();
      }

    } catch (err: any) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    if (isEditMode && editAccount) {
      setForm(prev => ({
        ...emptyForm(),
        company: prev.company,
        accountNumber: editAccount.account_number ?? "",
        isGroup: editAccount.is_group === 1,
        rootType: editAccount.root_type ?? "",
        accountType: editAccount.account_type ?? "",
        currency: editAccount.account_currency ?? "",
      }));
    } else if (parentAccount) {
      setForm(prev => ({
        ...emptyForm(),
        company: prev.company,
        parentAccount: parentAccount.name,
      }));
    } else {
      setForm(emptyForm());
    }
    setErrors({});
  };

  return { form, loading, errors, handleChange, handleSubmit, reset, companies, currencies, isEditMode };
};