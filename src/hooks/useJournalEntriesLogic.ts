import { useState, useMemo, useEffect, useCallback } from "react";
import { showApiError, showSuccess } from "../utils/alert";
import {
  createJournalEntry,
  updateJournalEntryById,
  deleteJournalEntryById,
  getJournalEntryById,
} from "../api/Accounting/JournalEntryApi";

export interface JournalEntryForm {
  postingDate: string;
  isOpening: boolean;
  remarks: string;
}

export interface JournalEntryLine {
  name?: string;
  account: string;
  ccy: string;
  entryType: "Dr" | "Cr";
  amount: string;
  partyType: string;
  party: string;
  exchangeRate: string;
  remark: string;
}

export type JournalEntryErrors = Partial<
  Record<keyof JournalEntryForm, string>
>;

const emptyForm = (): JournalEntryForm => ({
  postingDate: new Date().toISOString().split("T")[0],
  isOpening: false,
  remarks: "",
});

const emptyEntry = (): JournalEntryLine => ({
  account: "",
  ccy: "",
  entryType: "Dr",
  amount: "",
  partyType: "",
  party: "",
  exchangeRate: "1",
  remark: "",
});

export const useJournalEntryLogic = (
  onSuccess?: () => void,
  entryId?: string
) => {
  const [form, setForm] = useState<JournalEntryForm>(emptyForm());

  const [entries, setEntries] = useState<JournalEntryLine[]>([
    { ...emptyEntry(), entryType: "Dr" },
    { ...emptyEntry(), entryType: "Cr" },
  ]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<JournalEntryErrors>({});

  const loadEntry = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const res = await getJournalEntryById(id);
      const data = res?.data || res?.message;

      if (data) {
        setForm({
          postingDate: data.posting_date || data.postingDate,
          isOpening: data.is_opening === "Yes" || data.isOpening,
          remarks: data.user_remark || data.remark || "",
        });

        if (Array.isArray(data.accounts)) {
          const loadedEntries = data.accounts.map(
            (acc: any): JournalEntryLine => {
              const debit =
                acc.debit_in_account_currency || acc.debit || 0;
              const credit =
                acc.credit_in_account_currency || acc.credit || 0;

              const isDebit = debit > 0;
              const amountVal = isDebit ? debit : credit;

              return {
                name: acc.name,
                account: acc.account,
                ccy: acc.account_currency || acc.currency || "",
                entryType: isDebit ? "Dr" : "Cr",
                amount: amountVal.toString(),
                partyType: acc.party_type || acc.partyType || "",
                party: acc.party || "",
                exchangeRate: (
                  acc.exchange_rate || acc.exchangeRate || 1
                ).toString(),
                remark: acc.user_remark || acc.remark || "",
              };
            }
          );

          setEntries(
            loadedEntries.length > 0
              ? loadedEntries
              : [
                  { ...emptyEntry(), entryType: "Dr" },
                  { ...emptyEntry(), entryType: "Cr" },
                ]
          );
        }
      }
    } catch (err: any) {
      showApiError(err?.message || "Failed to load journal entry");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (entryId) loadEntry(entryId);
    else reset();
  }, [entryId, loadEntry]);

  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;

    entries.forEach((entry) => {
      const val = Math.abs(parseFloat(entry.amount)) || 0;
      if (entry.entryType === "Dr") debit += val;
      if (entry.entryType === "Cr") credit += val;
    });

    return { debit, credit };
  }, [entries]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const val =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : value;

    setForm((prev) => ({ ...prev, [name]: val }));

    if (errors[name as keyof JournalEntryForm]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleEntryChange = (
    index: number,
    field: keyof JournalEntryLine,
    value: string
  ) => {
    setEntries((prev) => {
      const newEntries = [...prev];
      newEntries[index] = { ...newEntries[index], [field]: value };

      if (
        index === 0 &&
        field === "amount" &&
        newEntries.length >= 2 &&
        !prev[1].amount
      ) {
        newEntries[1] = { ...newEntries[1], amount: value };
      }

      return newEntries;
    });
  };

  const handleAddRow = () =>
    setEntries((prev) => [...prev, { ...emptyEntry(), entryType: "Dr" }]);

  const handleRemoveRow = (index: number) =>
    setEntries((prev) => prev.filter((_, i) => i !== index));

  const validate = (): boolean => {
    const newErrors: JournalEntryErrors = {};

    if (!form.postingDate)
      newErrors.postingDate = "Posting Date is required";

    setErrors(newErrors);

    const validRows = entries.filter((e) => e.account.trim());

    if (validRows.length < 2) {
      showApiError("Minimum two rows required");
      return false;
    }

    if (totals.debit === 0 && totals.credit === 0) {
      showApiError("Amounts cannot be zero");
      return false;
    }

    if (Math.abs(totals.debit - totals.credit) > 0.01) {
      showApiError("Debit and Credit must match");
      return false;
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const validEntries = entries.filter((e) => e.account.trim());

      const payload = {
        posting_date: form.postingDate,
        voucher_type: "Journal Entry",
        is_opening: form.isOpening ? "Yes" : "No",
        user_remark: form.remarks,
        multi_currency: 1,

        accounts: validEntries.map((entry) => {
          const val = Math.abs(parseFloat(entry.amount)) || 0;

          return {
            ...(entry.name ? { name: entry.name } : {}),

            account: entry.account,
            account_currency: entry.ccy || undefined,
            exchange_rate: parseFloat(entry.exchangeRate) || 1,

            debit_in_account_currency:
              entry.entryType === "Dr" ? val : 0,

            credit_in_account_currency:
              entry.entryType === "Cr" ? val : 0,

            party_type: entry.partyType || undefined,
            party: entry.party || undefined,

            user_remark: entry.remark || undefined,
          };
        }),
      };

      if (entryId) {
        await updateJournalEntryById(entryId, payload);
        showSuccess("Updated successfully");
      } else {
        await createJournalEntry(payload as any);
        showSuccess("Created successfully");
      }

      onSuccess?.();
    } catch (err: any) {
      showApiError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save"
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await deleteJournalEntryById(id);
      showSuccess("Deleted successfully");
      onSuccess?.();
    } catch (err: any) {
      showApiError(err?.message || "Delete failed");
    }
  };

  const reset = () => {
    setForm(emptyForm());
    setEntries([
      { ...emptyEntry(), entryType: "Dr" },
      { ...emptyEntry(), entryType: "Cr" },
    ]);
    setErrors({});
  };

  return {
    form,
    entries,
    loading,
    errors,
    totals,
    handleChange,
    handleEntryChange,
    handleAddRow,
    handleRemoveRow,
    handleSubmit,
    deleteEntry,
    reset,
  };
};