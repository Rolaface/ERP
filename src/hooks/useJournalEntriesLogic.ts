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
      // Fallback to 1 if the exchange rate is blank/missing
      const rate = parseFloat(entry.exchange_rate) || 1; 
      const baseValue = val * rate;
      
      if (entry.entryType === "Dr") debit += baseValue;
      else if (entry.entryType === "Cr") credit += baseValue;
    });
    return { debit, credit };
  }, [entries]);
  // const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  //   const { name, value, type } = e.target;
  //   const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
  //   setForm((prev) => ({ ...prev, [name]: val }));
  //   if (errors[name as keyof JournalEntryForm]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  // };
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

  const fetchRowExchangeRate = async (currency: string, date: string, index: number) => {
    if (!currency) return;
    
    try {
      // Fetch rate for the specific currency and date
      // const res = await getAllCurrencyExchanges(1, 1, undefined, currency, undefined, date);
      const res = await getAllCurrencyExchanges(1, 1, undefined, currency, "INR", date);
      const exchangeData = res?.message?.data?.data || [];
      
    //    const rate = exchangeData.length > 0 ? exchangeData[0].exchange_rate : 1;

    //   setEntries((prev) => {
    //     const newEntries = [...prev];
    //     newEntries[index] = { ...newEntries[index], exchange_rate: rate.toString() };
    //     return newEntries;
    //   });
    // } catch (error) {
    //   console.error(`Failed to fetch exchange rate for ${currency}:`, error);
    //   // Fallback to 1 if API fails
    //   setEntries((prev) => {
    //     const newEntries = [...prev];
    //     newEntries[index] = { ...newEntries[index], exchange_rate: "1" };
    //     return newEntries;
    //   });
    const rate = exchangeData.length > 0 ? exchangeData[0].exchange_rate : 1;

      setEntries((prev) => {
        const newEntries = [...prev];
        newEntries[index] = { ...newEntries[index], exchange_rate: rate.toString() };
        
        // Auto-recalculate Row 2 if a rate finishes loading
        if (newEntries.length >= 2 && newEntries[0].amount) {
           const amount1 = parseFloat(newEntries[0].amount) || 0;
           const rate1 = parseFloat(newEntries[0].exchange_rate) || 1;
           const rate2 = parseFloat(newEntries[1].exchange_rate) || 1;
           
           const convertedAmount = (amount1 * rate1) / rate2;
           newEntries[1] = { 
             ...newEntries[1], 
             amount: convertedAmount ? convertedAmount.toString() : "" 
           };
        }

        return newEntries;
      });
      } catch (error) {
      console.error(`Failed to fetch exchange rate for ${currency}:`, error);
      // Fallback to 1 if API fails
      setEntries((prev) => {
        const newEntries = [...prev];
        newEntries[index] = { ...newEntries[index], exchange_rate: "1" };
        return newEntries;
      });
    }
  };

// HELPER 1: Calculates Row 2 amount based on Row 1 and current exchange rates
  const calculateAmounts = (currentEntries: JournalEntryLine[]) => {
    const newEntries = [...currentEntries];
    if (newEntries.length >= 2) {
      const inputAmount = parseFloat(newEntries[0].amount) || 0;
      
      if (inputAmount > 0 && newEntries[0].ccy && newEntries[1].ccy) {
        // If rates are empty/missing, default to 1 for the math so it doesn't break
        const rate1 = parseFloat(newEntries[0].exchange_rate) || 1;
        const rate2 = parseFloat(newEntries[1].exchange_rate) || 1;
        
        const convertedAmount = (inputAmount * rate1) / rate2;
        newEntries[1].amount = convertedAmount ? Number(convertedAmount.toFixed(2)).toString() : "";
      } else if (inputAmount > 0 && !newEntries[1].ccy) {
        // Just mirror the amount if Row 2 doesn't have a currency yet
        newEntries[1].amount = inputAmount.toString();
      } else if (!inputAmount) {
        newEntries[1].amount = "";
      }
    }
    return newEntries;
  };

  // HELPER 2: Evaluates the currency pair and fetches the correct rates
  const updateExchangeRates = async (currentEntries: JournalEntryLine[], date: string) => {
    let newEntries = [...currentEntries];
    
    // Get unique currencies currently selected in the table
    const currencies = [...new Set(newEntries.map((e) => e.ccy).filter(Boolean))];

    if (currencies.length === 1) {
      // RULE 1: USD to USD (Same currency) -> Exchange rate is 1-1
      newEntries = newEntries.map((e) => ({ ...e, exchange_rate: e.ccy ? "1" : "" }));
      
    } else if (currencies.length === 2) {
      // RULE 2: Mixed currencies (e.g., USD to INR) -> Fetch from API
      const [ccy1, ccy2] = currencies;
      try {
        // Try to find the rate for CCY1 -> CCY2
        let res = await getAllCurrencyExchanges(1, 10, undefined, ccy1, ccy2, date);
        let data = res?.message?.data?.data || [];
        
        if (data.length > 0) {
          const rate = data[0].exchange_rate;
          newEntries = newEntries.map((e) => ({
            ...e,
            exchange_rate: e.ccy === ccy1 ? rate.toString() : e.ccy === ccy2 ? "1" : "",
          }));
        } else {
          // If not found, try the reverse: CCY2 -> CCY1
          res = await getAllCurrencyExchanges(1, 10, undefined, ccy2, ccy1, date);
          data = res?.message?.data?.data || [];
          
          if (data.length > 0) {
            const rate = data[0].exchange_rate;
            newEntries = newEntries.map((e) => ({
              ...e,
              exchange_rate: e.ccy === ccy2 ? rate.toString() : e.ccy === ccy1 ? "1" : "",
            }));
          } else {
            // RULE 3: Not exist in API -> Don't pass anything (empty string)
            newEntries = newEntries.map((e) => ({ ...e, exchange_rate: e.ccy ? "" : "" }));
          }
        }
      } catch (error) {
        console.error("Exchange rate fetch failed:", error);
        newEntries = newEntries.map((e) => ({ ...e, exchange_rate: e.ccy ? "" : "" }));
      }
    }

    // After rates are updated, recalculate the amounts so the UI stays in sync
    newEntries = calculateAmounts(newEntries);
    setEntries(newEntries);
  };
// const handleEntryChange = (index: number, field: keyof JournalEntryLine, value: string) => {
//     setEntries((prev) => {
//       const newEntries = [...prev];
//       const updatedRow = { ...newEntries[index], [field]: value };
      
//        if (field === "account") {
//         const selectedAccount = accountOptions.find((opt) => opt.value === value);
//         if (selectedAccount && selectedAccount.currency) {
//           updatedRow.ccy = selectedAccount.currency;
//         } else {
//             updatedRow.ccy = ""; 
//         }
//       }
//      if (index === 0 && field === "amount" && newEntries.length >= 2) {
//         const inputAmount = parseFloat(value) || 0;
        
//          if (!newEntries[1].ccy) {
//            newEntries[1] = { ...newEntries[1], amount: value };
//         } else {
//             const rate1 = parseFloat(updatedRow.exchange_rate) || 1;
//            const rate2 = parseFloat(newEntries[1].exchange_rate) || 1;
//            const convertedAmount = (inputAmount * rate1) / rate2;
           
//            newEntries[1] = { 
//              ...newEntries[1], 
//              amount: convertedAmount ? Number(convertedAmount.toFixed(2)).toString() : "" 
//            };
//         }
//       }
//       if (field === "account") {
//         const selectedAccount = accountOptions.find((opt) => opt.value === value);
//         if (selectedAccount && selectedAccount.currency) {
//           updatedRow.ccy = selectedAccount.currency;
          
//            fetchRowExchangeRate(selectedAccount.currency, form.postingDate, index);
//         } else {
//            updatedRow.ccy = ""; 
//            updatedRow.exchange_rate = "1"; // Reset rate if no currency
//         }
//       }
//       if (field === "partyType") {
//         updatedRow.party = ""; 
//       }

//       if (index === 0 && field === "amount" && newEntries.length >= 2 && !prev[1].amount) {
//          newEntries[1] = { ...newEntries[1], amount: value };
//       }
      
//       newEntries[index] = updatedRow;
//       return newEntries;
//     });

//     // 4. LAZY LOAD: Trigger API call only when user explicitly selects Customer or Supplier
//     if (field === "partyType") {
//       if (value === "Customer" && customerOptions.length === 0) {
//         getCustomerListJe().then((res) => setCustomerOptions(mapOptions(res))).catch(console.error);
//       } else if (value === "Supplier" && supplierOptions.length === 0) {
//         getSupplierList().then((res) => setSupplierOptions(mapOptions(res))).catch(console.error);
//       }
//     }
//   };
  
const handleEntryChange = (index: number, field: keyof JournalEntryLine, value: string) => {
    // 1. Build the new state synchronously
    let updatedEntries = [...entries];
    const updatedRow = { ...updatedEntries[index], [field]: value };

    if (field === "account") {
      const selectedAccount = accountOptions.find((opt) => opt.value === value);
      if (selectedAccount && selectedAccount.currency) {
        updatedRow.ccy = selectedAccount.currency;
      } else {
        updatedRow.ccy = "";
        updatedRow.exchange_rate = "";
      }
    }

    if (field === "partyType") {
      updatedRow.party = ""; 
    }

    updatedEntries[index] = updatedRow;

    // 2. If amount changed, do the math immediately without hitting the API
    if (field === "amount") {
      updatedEntries = calculateAmounts(updatedEntries);
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
      updateExchangeRates(updatedEntries, form.postingDate);
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