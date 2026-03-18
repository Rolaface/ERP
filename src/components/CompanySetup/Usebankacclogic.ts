import { useEffect, useState } from "react";
import { showApiError } from "../../utils/alert";
import { getBankAccounts } from "../../api/BankAccountApi";

const today = () => new Date().toISOString().split("T")[0];

export const useBankAccLogic = ({ onSubmit, onClose }: any) => {
  const [form, setForm] = useState({
    dateAdded: today(),
    accountFor: "",
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
  });

  const [bankOptions, setBankOptions] = useState<any[]>([]);
  const [accountForOptions, setAccountForOptions] = useState<any[]>([]);
  const [currencyOptions, setCurrencyOptions] = useState<any[]>([]);

  const isCompany =
    form.accountFor?.toLowerCase() === "company";
  // 🔹 Fetch Bank
  useEffect(() => {
    (async () => {
      try {
        const res = await getBankAccounts();
        const data = res?.message?.data?.data || [];

        setBankOptions(
          data.map((b: any) => ({
            value: b.value,
            label: b.value,
            swiftCode: b.description,
          }))
        );
      } catch {
        showApiError("Failed to load banks");
      }
    })();
  }, []);



  // 🔹 Fetch Account For
  useEffect(() => {
    (async () => {
      try {
        const res = await getCompanyAccounts();
        const data = res?.message?.data?.data || [];

        setAccountForOptions(
          data.map((a: any) => ({
            value: a.value,
            label: a.value,
          }))
        );
      } catch {
        showApiError("Failed to load account types");
      }
    })();
  }, []);


  useEffect(() => {
    (async () => {
      try {
        const res = await getCurrencies();
        const data = res?.message?.data?.data || [];

        setCurrencyOptions(
          data.map((c: any) => ({
            value: c.code,
            label: c.code,
          }))
        );
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
      accountFor: "",
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
    bankOptions,
    accountForOptions,
    currencyOptions,
    isCompany
  };
};