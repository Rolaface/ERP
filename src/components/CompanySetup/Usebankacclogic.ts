import { useEffect, useState } from "react";
import { showApiError , showSuccess } from "../../utils/alert";
import { getBankAccounts } from "../../api/BankAccountApi";
import { createNewBankAccount } from "../../api/BankAccountApi";


const today = () => new Date().toISOString().split("T")[0];

type AccountType = "Supplier" | "Customer" | "Company" | "Bank" | "Currency";

type Option = {
  label: string;
  value: string;
  meta?: Record<string, any>;
};


export const useBankAccLogic = ({ onSubmit,onClose  }: any) => {
  const [form, setForm] = useState({
    dateAdded: today(),
    accountFor: "" as AccountType | "",
    name: "",
    bank: "",
    swiftCode: "",
    currency: "",
    accountNumber: "",
    accountHolder: "",
    sortCode: "",
    address: "",
    iban: "",
    isDefault: false,
    isDisabled: false,
    reportingAccount: "",
    accountHolderEdited: false,
  });

  const [banks, setBanks] = useState<Option[]>([]);
  const [entities, setEntities] = useState<Option[]>([]);
  const [reportingAccounts, setReportingAccounts] = useState<Option[]>([]);

  const isCompany = form.accountFor === "Company";

  // Auto-fill company name when accountFor = Company and only one entity exists
  useEffect(() => {
    if (form.accountFor === "Company" && entities.length === 1 && !form.name) {
      const company = entities[0];
      setForm((prev) => ({
        ...prev,
        name: company.label,
        accountHolder: company.label,
        accountHolderEdited: false,
        currency: company.meta?.currency || prev.currency,
      }));
    }
  }, [form.accountFor, entities, form.name]);

  // Reset name/holder/reportingAccount when accountFor changes
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: "",
      accountHolder: "",
      accountHolderEdited: false,
      reportingAccount: "",
      currency: form.accountFor === "Company" ? "" : prev.currency,
    }));
  }, [form.accountFor]);

  // Load banks dropdown
  useEffect(() => {
    (async () => {
      try {
        const data = await getBankAccounts("Bank");
        setBanks(Array.isArray(data) ? data : []);
      } catch {
        showApiError("Failed to load banks");
      }
    })();
  }, []);

  // Load party entities dropdown based on accountFor
  useEffect(() => {
    if (!form.accountFor) return;
    (async () => {
      try {
        const data = await getBankAccounts(form.accountFor as AccountType);
        setEntities(Array.isArray(data) ? data : []);
      } catch {
        showApiError("Failed to load data");
      }
    })();
  }, [form.accountFor]);

  // Load reporting accounts — only for Company type, silently fail if unavailable
  useEffect(() => {
    if (form.accountFor !== "Company") return;
    (async () => {
      try {
        const data = await getBankAccounts("Account");
        setReportingAccounts(Array.isArray(data) ? data : []);
      } catch {
        setReportingAccounts([]); // silently ignore
      }
    })();
  }, [form.accountFor]);



  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "accountHolder") {
      setForm((prev) => ({ ...prev, accountHolder: value, accountHolderEdited: true }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, value: string) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleReset = () => {
    setForm({
      dateAdded: today(),
      accountFor: "" as AccountType | "",
      name: "",
      bank: "",
      swiftCode: "",
      currency: "",
      accountNumber: "",
      accountHolder: "",
      sortCode: "",
      address: "",
      iban: "",
      isDefault: false,
      isDisabled: false,
      reportingAccount: "",
      accountHolderEdited: false,
    });
  };

  // ✅ handleSubmit only validates and passes payload to parent via onSubmit
  // Parent component (PaymentInfoTab, CompanySetup etc.) handles the actual API call
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!form.accountFor || !form.bank || !form.accountNumber || !form.name) {
      showApiError("Please fill required fields");
      return;
    }

    const payload = {
      accountHolderName: form.accountHolder,
      accountNo: form.accountNumber,
      bankName: form.bank,
      branchAddress: form.address,
      currency: form.currency,
      dateAdded: form.dateAdded,
      sortCode: form.sortCode,
      iban: form.iban,
      accountFor: form.accountFor,
      partyName: form.name,
      isDefault: form.isDefault ? "1" : "0",
      reportingAccount: form.reportingAccount,
    };


   try {
  const res = await createNewBankAccount(payload);

  const isSuccess =
    res?.status === "success" ||
    res?.message?.status === "success" ||
    res?.message?.status_code === 200 ||
    res?.message?.status_code === 201;

  if (!isSuccess) {
    showApiError(res);
    return;
  }

  
  onSubmit?.({
    ...payload,
    bank_account_id:
      res?.data?.bank_account_id ||
      res?.message?.data?.bank_account_id,
  });
  showSuccess(
  res?.message?.message || 
  res?.data?.message || 
  "Bank account added successfully"
);
  onClose?.();

} catch (err) {
  showApiError(err);
}
    
  };

  return {
    form,
    setForm,
    handleChange,
    handleDateChange,
    handleSubmit,
    handleReset,
    banks,
    entities,
    reportingAccounts,
    isCompany,
  };
};