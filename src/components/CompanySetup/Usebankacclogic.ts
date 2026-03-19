import { useEffect, useState } from "react";
import { showApiError, showSuccess } from "../../utils/alert";
import { getBankAccounts, getCompanyAccounts, createNewBankAccount } from "../../api/BankAccountApi";

const today = () => new Date().toISOString().split("T")[0];

type AccountType = "Supplier" | "Customer" | "Company" | "Bank" | "Currency";

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
  const [banks, setBanks] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [reportingAccounts, setReportingAccounts] = useState<any[]>([]);

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
  }, [form.accountFor, entities]);

  useEffect(() => {
    if (form.accountFor !== "Company") {
      setForm((prev) => ({
        ...prev,
        reportingAccount: "",
      }));
    }
  }, [form.accountFor]);


  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: "",
      accountHolder: "",
      accountHolderEdited: false,
      reportingAccount: "",
      currency: prev.accountFor === "Company" ? "" : prev.currency,
    }));
  }, [form.accountFor]);


  useEffect(() => {
    (async () => {
      try {
        const data = await getBankAccounts("Bank");
        setBanks(data);
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
        setEntities(data);
      } catch {
        showApiError("Failed to load data");
      }
    })();
  }, [form.accountFor]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getCompanyAccounts();
        setReportingAccounts(data);
      } catch {
        showApiError("Failed to load reporting accounts");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await getBankAccounts("Currency");
        setCurrencies(data);
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