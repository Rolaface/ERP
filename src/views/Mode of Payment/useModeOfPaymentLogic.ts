import { useEffect, useState } from "react";
import { showApiError, showSuccess } from "../../utils/alert";
import {
  createModeOfPayment,
  getDefaultAccounts,
  getBankAccounts,
} from "../../api/BankAccountApi";

type Option = {
  label: string;
  value: string;
  meta?: Record<string, any>;
};

export const useModeOfPaymentLogic = ({
  onSubmit,
  onClose,
}: any) => {
  const [form, setForm] = useState({
    name: "",
    type: "",
    enabled: true,
    company: "",
    defaultAccount: "",
  });

  const [companies, setCompanies] = useState<Option[]>([]);
  const [accounts, setAccounts] = useState<Option[]>([]);

  const [loading, setLoading] = useState(false);
  const [accLoading, setAccLoading] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);

  /* ───────────── LOAD COMPANIES ───────────── */
  useEffect(() => {
    (async () => {
      try {
        setCompanyLoading(true);
        const data = await getBankAccounts("Company");
        setCompanies(Array.isArray(data) ? data : []);
      } catch(err) {
        showApiError(err);
      } finally {
        setCompanyLoading(false);
      }
    })();
  }, []);

  /* ───────────── LOAD DEFAULT ACCOUNTS ───────────── */
  useEffect(() => {
    (async () => {
      try {
        setAccLoading(true);
        const data = await getDefaultAccounts();
        setAccounts(Array.isArray(data) ? data : []);
      } catch(err) {
        showApiError(err);
      } finally {
        setAccLoading(false);
      }
    })();
  }, []);

  /* ───────────── CHANGE HANDLER ───────────── */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ───────────── SUBMIT ───────────── */
  const handleSubmit = async () => {
    try {
      if (!form.name.trim()) {
        throw new Error("Mode of Payment name is required");
      }

      if (!form.type) {
        throw new Error("Type is required");
      }

      if (!form.defaultAccount) {
        throw new Error("Default account is required");
      }

      setLoading(true);

      await createModeOfPayment({
        name: form.name.trim(),
        type: form.type,
        default_account: form.defaultAccount,
        enabled: form.enabled ? 1 : 0,
      });

      showSuccess("Mode of Payment created successfully");

      onSubmit?.();
      onClose?.();

      // reset
      setForm({
        name: "",
        type: "",
        enabled: true,
        company: "",
        defaultAccount: "",
      });

    } catch (err: any) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    setForm,
    handleChange,
    handleSubmit,
    loading,
    companies,
    accounts,
    accLoading,
    companyLoading,
  };
};