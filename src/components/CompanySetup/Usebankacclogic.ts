import { useEffect, useState } from "react";
import { showApiError } from "../../utils/alert";
import { getBankAccounts,getCompanyAccounts } from "../../api/BankAccountApi";

const today = () => new Date().toISOString().split("T")[0];

type AccountType = "Supplier" | "Customer" | "Company" | "Bank" | "Currency";

export const useBankAccLogic = ({ onSubmit, onClose }: any) => {
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
  });
const [banks, setBanks] = useState<any[]>([]);
const [entities, setEntities] = useState<any[]>([]);
const [currencies, setCurrencies] = useState<any[]>([]);
const [reportingAccounts, setReportingAccounts] = useState<any[]>([]);


useEffect(() => {
  setForm((prev) => ({
    ...prev,
    name: "",
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


  useEffect(() => {
    if (form.accountFor?.toLowerCase() === "company") {
      setForm((prev) => ({
        ...prev,
        currency: "",
      }));
    }
  }, [form.accountFor]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
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
    });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();

    if (
      !form.accountFor ||
      !form.bank ||
      !form.accountNumber
    ) {
      showApiError("Please fill required fields");
      return;
    }

    onSubmit(form);
    handleReset();
    onClose();
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
  };
};