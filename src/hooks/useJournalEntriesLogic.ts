import { useState, useMemo, useEffect, useCallback } from "react";
import { showApiError, showSuccess } from "../utils/alert";
import {
  createJournalEntry,
  updateJournalEntryById,
  deleteJournalEntryById,
  getJournalEntryById,
  getComponentById,
} from "../api/Accounting/JournalEntryApi";
import { getSupplierList, getCustomerListJe, getCurrencyList } from "../api/lookupApi";

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
  exchange_rate: string;
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
  entryType: "Dr",
  amount: "",
  partyType: "",
  party: "",
  exchange_rate: "1",
  remark: "",
});

const mapOptions = (res: any) => {
  const data = 
    res?.data?.message?.data || 
    res?.data?.message || 
    res?.data?.data || 
    res?.message?.data || 
    res?.data || 
    res || 
    [];
    
  return Array.isArray(data)
    ? data.map((item: any) => {
        const optionValue = item.value || item.name || item.currency_name || "Unknown";
        const optionLabel = item.label || item.name || item.currency_name || optionValue;
        return {
          label: optionLabel,
          value: optionValue,
          currency: item.account_currency || "",
        };
      })
    : [];
};

export const useJournalEntryLogic = (onSuccess?: () => void, entryId?: string) => {
  const [form, setForm] = useState<JournalEntryForm>(emptyForm());
  const [entries, setEntries] = useState<JournalEntryLine[]>([
    { ...emptyEntry(), entryType: "Dr" },
    { ...emptyEntry(), entryType: "Cr" }
  ]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<JournalEntryErrors>({});

  // const [accountOptions, setAccountOptions] = useState<{label: string, value: string}[]>([]);
  const [accountOptions, setAccountOptions] = useState<{label: string, value: string, currency?: string}[]>([]);
  const [partyTypeOptions, setPartyTypeOptions] = useState<{label: string, value: string}[]>([]);
  const [customerOptions, setCustomerOptions] = useState<{label: string, value: string}[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<{label: string, value: string}[]>([]);
  const [currencyOptions, setCurrencyOptions] = useState<{label: string, value: string}[]>([]);

useEffect(() => {
const fetchInitialOptions = async () => {
try {
const [accRes, ptRes] = await Promise.all([
 // Pass the specific fields you need for the Account lookup here
 getComponentById("Account", ["name", "account_currency"]).catch(() => null),
 getComponentById("Party Type").catch(() => null),
]);
setAccountOptions(mapOptions(accRes));
setPartyTypeOptions(mapOptions(ptRes));
   } catch (err) {
console.error("Failed to fetch dropdown options", err);
}
};
fetchInitialOptions()}, []);

  // 2. Fetch Existing Entry (Edit/View Mode)
  const loadEntry = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const res = await getJournalEntryById(id);
      
      // Dig out the document object properly
      const doc = res?.data?.data || res?.data?.message || res?.data || res?.message;

      if (doc) {
        setForm({
          postingDate: doc.postingDate || doc.posting_date,
          isOpening: doc.isOpening || doc.is_opening === "Yes",
          remarks: doc.remark || doc.user_remark || "",
        });

        if (doc.accounts && Array.isArray(doc.accounts)) {
          const loadedEntries = doc.accounts.map((acc: any): JournalEntryLine => {
            // Frappe might return debit_in_account_currency as 0 but debit with the base amount
            const debit = acc.debit_in_account_currency || acc.debit || 0;
            const credit = acc.credit_in_account_currency || acc.credit || 0;
            const isDebit = debit > 0;
            const amountVal = isDebit ? debit : credit;

            return {
                name: acc.name,
                account: acc.account || "",
                ccy: acc.account_currency || acc.currency || "",
                entryType: isDebit ? "Dr" : "Cr",
                amount: amountVal.toString(),
                partyType: acc.party_type || acc.partyType || "",
                party: acc.party || "",
                exchange_rate: (acc.exchange_rate || acc.exchangeRate || 1).toString(),
                remark: acc.user_remark || acc.remark || "",
              };
          });
          
          setEntries(loadedEntries.length > 0 ? loadedEntries : [
            { ...emptyEntry(), entryType: "Dr" },
            { ...emptyEntry(), entryType: "Cr" }
          ]);

          // Lazy load customers/suppliers if the loaded entry already contains them
          if (loadedEntries.some((e) => e.partyType === "Customer")) {
            getCustomerListJe().then(r => setCustomerOptions(mapOptions(r))).catch(() => null);
          }
          if (loadedEntries.some((e) => e.partyType === "Supplier")) {
            getSupplierList().then(r => setSupplierOptions(mapOptions(r))).catch(() => null);
          }
        }
      }
    } catch (err: any) {
      showApiError(err?.message || "Failed to load journal entry");
    } finally {
      setLoading(false);
    }
  }, []);
  console.log("customerOptions", customerOptions);

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
      const updatedRow = { ...newEntries[index], [field]: value };
      
      // 1. AUTO-FILL CURRENCY WHEN ACCOUNT CHANGES
      if (field === "account") {
        const selectedAccount = accountOptions.find((opt) => opt.value === value);
        if (selectedAccount && selectedAccount.currency) {
          updatedRow.ccy = selectedAccount.currency;
        } else {
           // Optional: clear the currency if the newly selected account has no default currency
           updatedRow.ccy = ""; 
        }
      }

      if (field === "partyType") {
        updatedRow.party = ""; 
      }

      if (index === 0 && field === "amount" && newEntries.length >= 2 && !prev[1].amount) {
         newEntries[1] = { ...newEntries[1], amount: value };
      }
      
      newEntries[index] = updatedRow;
      return newEntries;
    });

    // 4. LAZY LOAD: Trigger API call only when user explicitly selects Customer or Supplier
    if (field === "partyType") {
      if (value === "Customer" && customerOptions.length === 0) {
        getCustomerListJe().then((res) => setCustomerOptions(mapOptions(res))).catch(console.error);
      } else if (value === "Supplier" && supplierOptions.length === 0) {
        getSupplierList().then((res) => setSupplierOptions(mapOptions(res))).catch(console.error);
      }
    }
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

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const validEntries = entries.filter((e) => e.account.trim() !== "");
      
      const payload = {
        posting_date: form.postingDate,
        is_opening: form.isOpening ? "Yes" : "No",
        user_remark: form.remarks.trim(),
        multi_currency: 1, 
        accounts: validEntries.map((entry) => {
          const val = Math.abs(parseFloat(entry.amount)) || 0;
          return {
            ...(entry.name ? { name: entry.name } : {}), 
            account: entry.account,
            account_currency: entry.ccy || undefined,
            exchange_rate: parseFloat(entry.exchange_rate) || 1,
            debit_in_account_currency: entry.entryType === "Dr" ? val : 0,
            credit_in_account_currency: entry.entryType === "Cr" ? val : 0,
            party_type: entry.partyType || undefined,
            party: entry.party || undefined,
            user_remark: entry.remark || undefined,
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
    setEntries([{ ...emptyEntry(), entryType: "Dr" }, { ...emptyEntry(), entryType: "Cr" }]);
    setErrors({});
  };

  return {
    form, entries, loading, errors, totals,
    accountOptions, partyTypeOptions, customerOptions, supplierOptions, currencyOptions,
    handleChange, handleEntryChange, handleAddRow, handleRemoveRow,
    handleSubmit, deleteEntry, reset,
  };
};