import React, { useEffect, useState } from "react";
import { showApiError, showSuccess } from "../../utils/alert";
import {
  createModeOfPayment,
  updateModeOfPayment,
  getDefaultAccounts,
  getBankAccounts,
  getModeOfPaymentByName,
} from "../../api/BankAccountApi";

export const useModeOfPaymentLogic = ({ onSubmit, onClose, initialData, isEdit }: any) => {
  const [form, setForm] = useState({
    name: "",
    type: "",
    enabled: true,
    company: "",
    defaultAccount: "",
  });
  const [fetchLoading, setFetchLoading] = useState(false);
  const [companies, setCompanies] = useState<Option[]>([]);
  const [accounts, setAccounts] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [accLoading, setAccLoading] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);

  /* ───────── FETCH & POPULATE FORM ON EDIT ───────── */
  useEffect(() => {
    if (!isEdit || !initialData?.name) return;

    (async () => {
      try {
        setFetchLoading(true);
        const res = await getModeOfPaymentByName(initialData.name);
        const record = res?.data?.modeOfPayments?.[0];

        if (!record) throw new Error("Mode of Payment not found");

        setForm({
          name: record.modeOfPayment ?? record.name ?? "",
          type: record.type ?? "",
          enabled: record.enabled === 1,
          company: record.company ?? "",
          defaultAccount: record.defaultAccount ?? "",
        });
      } catch (err: any) {
        showApiError(err.message);
      } finally {
        setFetchLoading(false);
      }
    })();
  }, [isEdit, initialData?.name]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (!form.name.trim()) throw new Error("Mode of Payment name is required");
      if (!form.type) throw new Error("Type is required");
      if (!form.defaultAccount) throw new Error("Default account is required");

      setLoading(true);

      if (isEdit) {
        await updateModeOfPayment({
          name: initialData.name,
          type: form.type,
          default_account: form.defaultAccount,
          enabled: form.enabled ? 1 : 0,
        });
        showSuccess("Mode of Payment updated successfully");
      } else {
        await createModeOfPayment({
          name: form.name.trim(),
          type: form.type,
          default_account: form.defaultAccount,
          enabled: form.enabled ? 1 : 0,
        });
        showSuccess("Mode of Payment created successfully");
      }

      onSubmit?.();
      onClose?.();
      setForm({ name: "", type: "", enabled: true, company: "", defaultAccount: "" });
      return true;
    } catch (err: any) {
      showApiError(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    setForm,
    handleChange,
    handleSubmit,
    loading: loading || fetchLoading,  // ← block save while fetching too
    companies,
    accounts,
    accLoading,
    companyLoading,
    fetchLoading,
  };
};
