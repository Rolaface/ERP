import { useState, useMemo, useEffect, useCallback } from "react";
import { showApiError, showSuccess } from "../utils/alert";
import {
  createJournalEntry,
  updateJournalEntryById,
  deleteJournalEntryById,
  getJournalEntryById,
  getComponentById,
} from "../api/Accounting/JournalEntryApi";
import { getSupplierList, getCustomerListJe } from "../api/lookupApi";
import { getAllCurrencyExchanges } from "../api/currencyExchangeApi";

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

const parseFrappeError = (err: any): string => {
  const data = err?.response?.data;
  if (!data) return err?.message || "An unknown error occurred.";

  if (data._server_messages) {
    try {
      const messages = JSON.parse(data._server_messages);
      if (messages.length > 0) {
        const msgObj = JSON.parse(messages[0]);
        if (msgObj.message) return msgObj.message;
      }
    } catch (e) {
      console.error("Failed to parse _server_messages", e);
    }
  }

   if (data.exception) {
    const parts = String(data.exception).split(":");
    if (parts.length > 1) {
      return parts.slice(1).join(":").trim(); 
    }
    return data.exception;
  }

  // 3. Generic fallback
  return data.message || err?.message || "An error occurred.";
};

export const useJournalEntryLogic = (isOpen: boolean, onSuccess?: () => void, entryId?: string) => {
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
  const [missingExchanges, setMissingExchanges] = useState<string[]>([]);

const reset = useCallback(() => {
    setForm(emptyForm());
    setEntries([{ ...emptyEntry(), entryType: "Dr" }, { ...emptyEntry(), entryType: "Cr" }]);
    setErrors({});
  }, []);

  const fetchAccountOptions = async () => {
  try {
    const accRes = await getComponentById("Account", ["name", "account_currency"], [["is_group", "=", 1]]);
    
    const rawAccounts = 
      accRes?.data?.message?.data || 
      accRes?.data?.message || 
      accRes?.data?.data || 
      accRes?.data || [];

    const formattedAccountOptions = Array.isArray(rawAccounts) ? rawAccounts.map((item: any) => ({
      label: `${item.name} -> (${item.account_currency})`,
      value: item.name,
      currency: item.account_currency || "",
    })) : [];

    setAccountOptions(formattedAccountOptions);
  } catch (err) {
    console.error("Failed to fetch account options", err);
  }
};

useEffect(() => {
  const fetchInitialOptions = async () => {
    try {
      const ptRes = await getComponentById("Party Type").catch(() => null);
      setPartyTypeOptions(mapOptions(ptRes));
    } catch (err) {
      console.error("Failed to fetch party type options", err);
    }
  };
  
  fetchInitialOptions();
}, []);

  const loadEntry = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const res = await getJournalEntryById(id);
      
      const doc = res?.data?.data || res?.data?.message || res?.data || res?.message;

      if (doc) {
        setForm({
          postingDate: doc.postingDate || doc.posting_date,
          isOpening: doc.isOpening || doc.is_opening === "Yes",
          remarks: doc.remark || doc.user_remark || "",
        });

        if (doc.accounts && Array.isArray(doc.accounts)) {
          const loadedEntries = doc.accounts.map((acc: any): JournalEntryLine => {
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

  useEffect(() => {
    if (isOpen) {
      if (entryId) loadEntry(entryId);
      else reset();
    } else {
      reset(); // Clean up state behind the scenes when modal closes
    }
  }, [isOpen, entryId, loadEntry, reset]);

const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;
    entries.forEach((entry) => {
      const val = Math.abs(parseFloat(entry.amount)) || 0;
      // Fallback to 1 if the exchange rate is blank/missing
      const rate = parseFloat(entry.exchange_rate) || 1; 
      const baseValue = val * rate;
      
      if (entry.entryType === "Dr") debit += baseValue;
      else if (entry.entryType === "Cr") credit += baseValue;
    });
    return { debit, credit };
  }, [entries]);

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    
    setForm((prev) => ({ ...prev, [name]: val }));
    if (errors[name as keyof JournalEntryForm]) setErrors((prev) => ({ ...prev, [name]: undefined }));

    // Re-evaluate the pair of rates if the date changes
    if (name === "postingDate") {
      updateExchangeRates(entries, val as string);
    }
  };
 
const calculateAmounts = (currentEntries: JournalEntryLine[], editedIndex: number) => {
  const newEntries = [...currentEntries];

  // Figure out if the edited row is even (Dr) or odd (Cr) to find its partner
  const isEven = editedIndex % 2 === 0;
  const pairIndex = isEven ? editedIndex + 1 : editedIndex - 1;

  // Only proceed if the partner row exists
  if (newEntries[editedIndex] && newEntries[pairIndex]) {
    const inputAmount = parseFloat(newEntries[editedIndex].amount) || 0;

    if (inputAmount > 0 && newEntries[editedIndex].ccy && newEntries[pairIndex].ccy) {
      const rate1 = parseFloat(newEntries[editedIndex].exchange_rate) || 1;
      const rate2 = parseFloat(newEntries[pairIndex].exchange_rate) || 1;

      const convertedAmount = (inputAmount * rate1) / rate2;
      newEntries[pairIndex].amount = convertedAmount ? Number(convertedAmount.toFixed(2)).toString() : "";
    } else if (inputAmount > 0 && !newEntries[pairIndex].ccy) {
      newEntries[pairIndex].amount = inputAmount.toString();
    } else if (!inputAmount) {
      newEntries[pairIndex].amount = "";
    }
  }
  return newEntries;
};

const updateExchangeRates = async (currentEntries: JournalEntryLine[], date: string, triggerIndex?: number) => {
  let newEntries = [...currentEntries];
  const missingExchanges: Set<string> = new Set();
  const processPair = async (index: number) => {
    const isEven = index % 2 === 0;
    const idx1 = isEven ? index : index - 1;
    const idx2 = isEven ? index + 1 : index;

    if (!newEntries[idx1] || !newEntries[idx2]) return;

    const ccy1 = newEntries[idx1].ccy;
    const ccy2 = newEntries[idx2].ccy;

    if (!ccy1 || !ccy2) return;

    if (ccy1 === ccy2) {
      newEntries[idx1].exchange_rate = ccy1 ? "1" : "";
      newEntries[idx2].exchange_rate = ccy2 ? "1" : "";
      return;
    }

    try {
      let res = await getAllCurrencyExchanges(1, 10, undefined, ccy1, ccy2, date);
      let data = res?.message?.data?.data || [];

      if (data.length > 0) {
        newEntries[idx1].exchange_rate = data[0].exchange_rate.toString();
        newEntries[idx2].exchange_rate = "1";
      } else {
        res = await getAllCurrencyExchanges(1, 10, undefined, ccy2, ccy1, date);
        data = res?.message?.data?.data || [];
        if (data.length > 0) {
          newEntries[idx2].exchange_rate = data[0].exchange_rate.toString();
          newEntries[idx1].exchange_rate = "1";
        }
        else {
          missingExchanges.add(`${ccy1} to ${ccy2}`);
          
          newEntries[idx1].exchange_rate = "";
          newEntries[idx2].exchange_rate = "";
        }
      }
    } catch (error) {
      console.error("Exchange rate fetch failed:", error);
    }
  };

  // If a specific row triggered this, only update its pair
  if (triggerIndex !== undefined) {
    await processPair(triggerIndex);
    newEntries = calculateAmounts(newEntries, triggerIndex);
  } else {
    // If the Date changed, loop through and update ALL pairs
    for (let i = 0; i < newEntries.length; i += 2) {
      await processPair(i);
      newEntries = calculateAmounts(newEntries, i);
    }
  }

  setEntries(newEntries);
  const missingArray = Array.from(missingExchanges);
  setMissingExchanges(missingArray);
  if (missingExchanges.size > 0) {
    const missingList = Array.from(missingExchanges).join(", ");
    showApiError(`Please maintain the currency exchange first for: ${missingList}`);
  }
};
  
// Add `extraUpdates` as a 4th optional parameter
const handleEntryChange = (
  index: number,
  field: keyof JournalEntryLine,
  value: string,
  extraUpdates?: Partial<JournalEntryLine>
) => {
  // 1. Build the new state synchronously
  let updatedEntries = [...entries];
  let updatedRow = { ...updatedEntries[index], [field]: value };

  // Apply any extra fields passed in (like CCY and Exchange Rate)
  if (extraUpdates) {
    updatedRow = { ...updatedRow, ...extraUpdates };
  }

  // --- REMOVED THE OLD if (field === "account") BLOCK HERE ---

  if (field === "partyType") {
    updatedRow.party = "";
  }

  updatedEntries[index] = updatedRow;

  if (field === "entryType") {
    const isEven = index % 2 === 0;
    const pairIndex = isEven ? index + 1 : index - 1;
    
    // Make sure the partner row exists
    if (updatedEntries[pairIndex]) {
      updatedEntries[pairIndex].entryType = value === "Dr" ? "Cr" : "Dr";
    }
  }
  
  if (field === "amount") {
    updatedEntries = calculateAmounts(updatedEntries, index);
  }

  // 3. Update UI state
  setEntries(updatedEntries);

  // 4. Lazy Load Party Options
  if (field === "partyType") {
    if (value === "Customer" && customerOptions.length === 0) {
      getCustomerListJe().then((res) => setCustomerOptions(mapOptions(res))).catch(console.error);
    } else if (value === "Supplier" && supplierOptions.length === 0) {
      getSupplierList().then((res) => setSupplierOptions(mapOptions(res))).catch(console.error);
    }
  }

  // 5. Trigger API ONLY if the account (and therefore currency) changed
  if (field === "account") {
    updateExchangeRates(updatedEntries, form.postingDate, index);
  }
};

 const handleAddRow = () => {
  setEntries((prev) => [
    ...prev, 
    { ...emptyEntry(), entryType: "Dr" }, 
    { ...emptyEntry(), entryType: "Cr" }
  ]);
};
  const handleRemoveRow = (index: number) => setEntries((prev) => prev.filter((_, i) => i !== index));

  const validate = (): boolean => {
    const newErrors: JournalEntryErrors = {};
    if (!form.postingDate) newErrors.postingDate = "Posting Date is required";
    setErrors(newErrors);

    if (missingExchanges.length > 0) {
      showApiError(`Please maintain the currency exchange first for: ${missingExchanges.join(", ")}`);
      return false;
    }

    if (entries.filter(e => e.account.trim()).length < 2) {
      showApiError("A journal entry requires at least two valid rows.");
      return false;
    }

    // if (totals.debit === 0 && totals.credit === 0) {
    //   showApiError("Total Debit and Credit cannot be zero.");
    //   return false;
    // }
    
    // if (Math.abs(totals.debit - totals.credit) > 0.01) { 
    //   showApiError(`Entries do not balance. Difference: ${Math.abs(totals.debit - totals.credit).toFixed(2)}`);
    //   return false;
    // }

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
      // showApiError(err?.response?.data?.message || err?.message || "Failed to save journal entry.");
      showApiError(parseFrappeError(err) || "Failed to save journal entry.");
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
      //  showApiError(err?.response?.data?.message || err?.message || "Failed to delete entry.");
       showApiError(parseFrappeError(err) || "Failed to delete entry.");
    }
  };

  return {
    form, entries, loading, errors, totals,
    accountOptions, partyTypeOptions, customerOptions, supplierOptions, currencyOptions,
    handleChange, handleEntryChange, handleAddRow, handleRemoveRow,
    handleSubmit, deleteEntry, reset,
    fetchAccountOptions,
  };
};