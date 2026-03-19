import { useEffect, useState } from "react";
import { showApiError, showSuccess } from "../../utils/alert";
import { getBankAccounts, createNewBankAccount } from "../../api/BankAccountApi";

const today = () => new Date().toISOString().split("T")[0];

type AccountType = "Supplier" | "Customer" | "Company" | "Bank" | "Currency";

type Option = {
  label: string;
  value: string;
  meta?: Record<string, any>;
};

export const useBankAccLogic = ({ onSubmit, onClose, skipApi = false }: any) => {
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
  const [currencies, setCurrencies] = useState<Option[]>([]);
  const [reportingAccounts, setReportingAccounts] = useState<Option[]>([]);

  const isCompany = form.accountFor === "Company";


  useEffect(() => {
    if (
      form.accountFor === "Company" &&
      entities.length === 1 &&
      !form.name
    ) {
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

  useEffect(() => {
    if (form.accountFor !== "Company") return;

    (async () => {
      try {
        const data = await getBankAccounts("Account");
        setReportingAccounts(Array.isArray(data) ? data : []);
      } catch {
        showApiError("Failed to load reporting accounts");
      }
    })();
  }, [form.accountFor]);


  useEffect(() => {
    (async () => {
      try {
        const data = await getBankAccounts("Currency");
        setCurrencies(Array.isArray(data) ? data : []);
      } catch {
        showApiError("Failed to load currencies");
      }
    })();
  }, []);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;


    if (name === "accountHolder") {
      setForm((prev) => ({
        ...prev,
        accountHolder: value,
        accountHolderEdited: true,
      }));
      return;
    }


    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!form.accountFor || !form.bank || !form.accountNumber || !form.name) {
      showApiError("Please fill required fields");
      return;
    }

    try {
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


      if (skipApi) {
        onSubmit?.(payload);
        handleReset();
        onClose();
        return;
      }


      const res = await createNewBankAccount(payload);

      const successMsg =
        res?.message?.message;
      showSuccess(successMsg);

      onSubmit?.(payload);
      handleReset();
      onClose();

    } catch (err: any) {
      const msg =
        err?.response?.data?.message?.message;

      showApiError(msg);
    }
  };
  return {
    form,
    setForm,
    handleChange,
    handleDateChange,
    handleSubmit,
    handleReset,
    currencies,
    banks,
    entities,
    reportingAccounts,
    isCompany
  };
};