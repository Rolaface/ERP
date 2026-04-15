import { useState, useMemo } from "react";
import { showApiError, showSuccess } from "../utils/alert";

// NOTE: You will need to import your actual API method here, similar to createChartOfAccount
// import { createJournalEntry, type CreateJournalEntryPayload } from "../api/Accounting/JournalEntryApi";

export interface JournalEntryForm {
  postingDate: string;
  isOpening: boolean;
  remarks: string;
}

export interface JournalEntryLine {
  account: string;
  ccy: string;
  amount: string; // Positive for Debit, Negative for Credit
  partyType: string;
  party: string;
  exchangeRate: string;
  remark: string;
}

export type JournalEntryErrors = Partial<Record<keyof JournalEntryForm, string>>;

const emptyForm = (): JournalEntryForm => ({
  postingDate: new Date().toISOString().split("T")[0], // Defaults to today
  isOpening: false,
  remarks: "",
});

const emptyEntry = (): JournalEntryLine => ({
  account: "",
  ccy: "",
  amount: "",
  partyType: "",
  party: "",
  exchangeRate: "1", // Default exchange rate
  remark: "",
});

export const useJournalEntryLogic = (onSuccess?: () => void) => {
  const [form, setForm] = useState<JournalEntryForm>(emptyForm());
  // Initialize with two empty rows as a standard starting point
  const [entries, setEntries] = useState<JournalEntryLine[]>([emptyEntry(), emptyEntry()]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<JournalEntryErrors>({});

  // Automatically calculate Debit and Credit totals based on positive/negative amounts
  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;
    
    entries.forEach((entry) => {
      const val = parseFloat(entry.amount);
      if (!isNaN(val)) {
        if (val > 0) {
          debit += val;
        } else if (val < 0) {
          credit += Math.abs(val);
        }
      }
    });
    
    return { debit, credit };
  }, [entries]);

  // Handle Meta form fields
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setForm((prev) => ({ ...prev, [name]: val }));

    if (errors[name as keyof JournalEntryForm]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle Table line item changes
  const handleEntryChange = (index: number, field: keyof JournalEntryLine, value: string) => {
    setEntries((prev) => {
      const newEntries = [...prev];
      newEntries[index] = { ...newEntries[index], [field]: value };
      return newEntries;
    });
  };

  const handleAddRow = () => {
    setEntries((prev) => [...prev, emptyEntry()]);
  };

  const handleRemoveRow = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const newErrors: JournalEntryErrors = {};

    if (!form.postingDate) {
      newErrors.postingDate = "Posting Date is required";
    }

    setErrors(newErrors);

    // Business Logic Validations via Toast/Alert
    if (entries.length < 2) {
      showApiError("A journal entry requires at least two rows.");
      return false;
    }

    if (totals.debit === 0 && totals.credit === 0) {
      showApiError("Total Debit and Credit cannot be zero.");
      return false;
    }

    if (totals.debit !== totals.credit) {
      const diff = Math.abs(totals.debit - totals.credit).toFixed(2);
      showApiError(`Entries do not balance. Difference: ${diff}`);
      return false;
    }

    const hasMissingAccounts = entries.some(
      (e) => parseFloat(e.amount) !== 0 && !isNaN(parseFloat(e.amount)) && !e.account.trim()
    );
    
    if (hasMissingAccounts) {
      showApiError("Account is required for all rows containing an amount.");
      return false;
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      // Filter out entirely blank rows before sending to API
      const validEntries = entries.filter((e) => e.account.trim() !== "" || e.amount !== "");

      // Map to your API payload structure
      const payload = {
        doctype: "Journal Entry",
        posting_date: form.postingDate,
        is_opening: form.isOpening ? "Yes" : "No",
        user_remark: form.remarks.trim() || undefined,
        accounts: validEntries.map((entry) => {
          const val = parseFloat(entry.amount) || 0;
          return {
            account: entry.account,
            account_currency: entry.ccy || undefined,
            exchange_rate: parseFloat(entry.exchangeRate) || 1,
            debit_in_account_currency: val > 0 ? val : 0,
            credit_in_account_currency: val < 0 ? Math.abs(val) : 0,
            party_type: entry.partyType || undefined,
            party: entry.party || undefined,
            user_remark: entry.remark || undefined,
          };
        }),
      };

      // REPLACE WITH YOUR ACTUAL API CALL
      // const res = await createJournalEntry(payload);
      // const isSuccess = !!res?.message;
      // if (!res || !isSuccess) {
      //   showApiError(res?.message ?? res);
      //   return;
      // }

      // Mock success for now
      showSuccess("Journal Entry created successfully");
      reset();
      onSuccess?.();

    } catch (err: any) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm(emptyForm());
    setEntries([emptyEntry(), emptyEntry()]);
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
    reset,
  };
};