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
  entryType: "Dr" | "Cr"; // Explicitly track Debit or Credit
  amount: string;         // Always a positive absolute number in UI
  partyType: string;
  party: string;
  exchangeRate: string;
  remark: string;
}

export type JournalEntryErrors = Partial<Record<keyof JournalEntryForm, string>>;

const emptyForm = (): JournalEntryForm => ({
  postingDate: new Date().toISOString().split("T")[0],
  isOpening: false,
  remarks: "",
});

const emptyEntry = (): JournalEntryLine => ({
  account: "",
  ccy: "",
  entryType: "Dr", // Defaulting to Dr
  amount: "",
  partyType: "",
  party: "",
  exchangeRate: "1",
  remark: "",
});

export const useJournalEntryLogic = (onSuccess?: () => void, entryId?: string) => {
  const [form, setForm] = useState<JournalEntryForm>(emptyForm());
  
  // Default: Row 1 is Debit, Row 2 is Credit
  const [entries, setEntries] = useState<JournalEntryLine[]>([
    { ...emptyEntry(), entryType: "Dr" },
    { ...emptyEntry(), entryType: "Cr" }
  ]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<JournalEntryErrors>({});

  // --- Fetch Existing Entry for Edit Mode ---
  const loadEntry = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const res = await getJournalEntryById(id);
      const data = res?.data || res?.message;

      if (data) {
        setForm({
          postingDate: data.postingDate || data.posting_date,
          isOpening: data.isOpening || data.is_opening === "Yes",
          remarks: data.remark || data.user_remark || "",
        });

        if (data.accounts && Array.isArray(data.accounts)) {
          const loadedEntries = data.accounts.map((acc: any): JournalEntryLine => {
            const debit = acc.debit || acc.debit_in_account_currency || 0;
            const credit = acc.credit || acc.credit_in_account_currency || 0;
            const isDebit = debit > 0;
            const amountVal = isDebit ? debit : credit;

            return {
              name: acc.name,
              account: acc.account,
              ccy: acc.currency || acc.account_currency || "",
              entryType: isDebit ? "Dr" : "Cr",
              amount: amountVal.toString(),
              partyType: acc.partyType || acc.party_type || "",
              party: acc.party || "",
              exchangeRate: (acc.exchangeRate || acc.exchange_rate || 1).toString(),
              remark: acc.remark || acc.user_remark || "",
            };
          });
          setEntries(loadedEntries.length > 0 ? loadedEntries : [
            { ...emptyEntry(), entryType: "Dr" },
            { ...emptyEntry(), entryType: "Cr" }
          ]);
        }
      }
    } catch (err: any) {
      showApiError(err?.message || "Failed to load journal entry");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (entryId) {
      loadEntry(entryId);
    } else {
      reset();
    }
  }, [entryId, loadEntry]);

  // --- Calculations & Handlers ---
  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;
    entries.forEach((entry) => {
      const val = Math.abs(parseFloat(entry.amount)) || 0;
      if (entry.entryType === "Dr") debit += val;
      else if (entry.entryType === "Cr") credit += val;
    });
    return { debit, credit };
  }, [entries]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((prev) => ({ ...prev, [name]: val }));
    if (errors[name as keyof JournalEntryForm]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleEntryChange = (index: number, field: keyof JournalEntryLine, value: string) => {
    setEntries((prev) => {
      const newEntries = [...prev];
      newEntries[index] = { ...newEntries[index], [field]: value };
      
      // Auto-fill Credit amount if first row Debit is entered
      if (index === 0 && field === "amount" && newEntries.length >= 2 && !prev[1].amount) {
         newEntries[1] = { ...newEntries[1], amount: value };
      }
      
      return newEntries;
    });
  };

  const handleAddRow = () => setEntries((prev) => [...prev, { ...emptyEntry(), entryType: "Dr" }]);
  const handleRemoveRow = (index: number) => setEntries((prev) => prev.filter((_, i) => i !== index));

  const validate = (): boolean => {
    const newErrors: JournalEntryErrors = {};
    if (!form.postingDate) newErrors.postingDate = "Posting Date is required";
    setErrors(newErrors);

    if (entries.filter(e => e.account.trim()).length < 2) {
      showApiError("A journal entry requires at least two valid rows.");
      return false;
    }
    if (totals.debit === 0 && totals.credit === 0) {
      showApiError("Total Debit and Credit cannot be zero.");
      return false;
    }
    if (Math.abs(totals.debit - totals.credit) > 0.01) { 
      showApiError(`Entries do not balance. Difference: ${Math.abs(totals.debit - totals.credit).toFixed(2)}`);
      return false;
    }
    return Object.keys(newErrors).length === 0;
  };

  // --- API Integrations ---
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const validEntries = entries.filter((e) => e.account.trim() !== "");
      
      const payload = {
        postingDate: form.postingDate,
        isOpening: form.isOpening,
        remark: form.remarks.trim(),
        accounts: validEntries.map((entry) => {
          const val = Math.abs(parseFloat(entry.amount)) || 0;
          return {
            ...(entry.name ? { name: entry.name } : {}), 
            account: entry.account,
            partyType: entry.partyType || undefined,
            party: entry.party || undefined,
            currency: entry.ccy || undefined,
            exchangeRate: parseFloat(entry.exchangeRate) || 1,
            // Automatically splits based on Dr/Cr selection
            debit: entry.entryType === "Dr" ? val : 0,
            credit: entry.entryType === "Cr" ? val : 0,
            remark: entry.remark || undefined,
          };
        }),
      };

      if (entryId) {
        await updateJournalEntryById(entryId, payload);
        showSuccess("Journal Entry updated successfully");
      } else {
        await createJournalEntry(payload as any); 
        showSuccess("Journal Entry created successfully");
      }
      
      onSuccess?.();
    } catch (err: any) {
      showApiError(err?.response?.data?.message || err?.message || "Failed to save journal entry.");
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await deleteJournalEntryById(id);
      showSuccess("Journal Entry deleted successfully");
      onSuccess?.();
    } catch (err: any) {
       showApiError(err?.response?.data?.message || err?.message || "Failed to delete entry.");
    }
  };

  const reset = () => {
    setForm(emptyForm());
    setEntries([
      { ...emptyEntry(), entryType: "Dr" },
      { ...emptyEntry(), entryType: "Cr" }
    ]);
    setErrors({});
  };

  return {
    form, entries, loading, errors, totals,
    handleChange, handleEntryChange, handleAddRow, handleRemoveRow,
    handleSubmit, deleteEntry, reset,
  };
};