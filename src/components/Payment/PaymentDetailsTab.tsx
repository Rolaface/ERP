import React, { useEffect, useMemo, useRef, useCallback } from "react";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import { MoveRight, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { useCompanyStore } from "../../store/companyStore";
import dayjs from "dayjs";
import {
  usePaymentModes,
  usePartyOptions,
  usePartyDetails,
  useCompanyBankAccounts,
  usePartyBankAccounts,
  useLedgerOptions,
  useExchangeRate,
  type PartyOption,
} from "../../views/PaymentEntry/usePaymentEntryLogic";
import DatePickerInput from "../calendar/DatePickerInput";
import CostCenterSelect from "../selects/CostCenterSelect";
import ProjectSelect from "../selects/ProjectSelect";

interface PaymentDetailsTabProps {
  form: Record<string, any>;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  onFormChange: (updates: Record<string, any>) => void;
  onAllocate?: () => void;
  islocked?: boolean;
  isPartyLocked?: boolean;
  partyFetchKeyRef: React.MutableRefObject<string>;
}

const PARTY_FILLED_FIELDS = {
  partyName: "",
  glFrom: "",
  glTo: "",
  currencyFrom: "",
  currencyTo: "",
  companyBankAccount: "",
  partyBankAccount: "",
  totalOutstanding: null,
};

const PaymentDetailsTab: React.FC<PaymentDetailsTabProps> = ({
  form,
  onChange,
  onFormChange,
  onAllocate,
  islocked = false,
  isPartyLocked = false,
  partyFetchKeyRef,
}) => {
  const isMountedRef = useRef(false);
  const {
    options: modeOptions,
    isLoading: modesLoading,
    fetchModes,
  } = usePaymentModes();
  const { fetchPartyDetails, isLoadingDetails } = usePartyDetails();
  const {
    companyBankOptions,
    isLoadingCompanyBanks,
    fetchCompanyBanks,
    clearCompanyBanks,
  } = useCompanyBankAccounts();
  const {
    partyBankOptions,
    isLoadingPartyBanks,
    fetchPartyBanks,
    clearPartyBanks,
  } = usePartyBankAccounts();


  const paymentType =
    (form.paymentType as "Pay" | "Receive" | "Internal Transfer") || "Pay";
  const partyType =
    (form.partyType as "Supplier" | "Customer" | "Shareholder" | "Employee") ||
    "";
  const isInternalTransfer = paymentType === "Internal Transfer";


  const companyBaseCurrency = useCompanyStore((s) => s.baseCurrency);

  const { partyOptions, isLoadingParties, fetchParties } =
    usePartyOptions(partyType);

  // ── selectedMode: find full option object for auto-fill ──────────────────
  const selectedMode = useMemo(
    () => modeOptions.find((opt) => opt.value === form.mode) ?? null,
    [form.mode, modeOptions],
  );

  // ── Hook 8: GL ledger options for From + To ───────────────────────────────
  const {
    fromOptions: ledgerFromOptions,
    toOptions: ledgerToOptions,
    isLoadingLedgers,
    fetchFromOptions,
    fetchToOptions,
  } = useLedgerOptions(paymentType, partyType);

  // ── Clear GL + mode when paymentType or partyType changes ─────────────────
  const prevRef = useRef({ paymentType, partyType });
  useEffect(() => {
  if (!form.mode && modeOptions.length > 0) {
    onFormChange({
      mode: modeOptions[0].value,
    });
  }
}, [modeOptions]);

  useEffect(() => {
    const prev = prevRef.current;

    if (prev.paymentType !== paymentType || prev.partyType !== partyType) {
      onFormChange({
        glFrom: "",
        currencyFrom: "",
        glTo: "",
        currencyTo: "",
        
        ...(paymentType === "Internal Transfer"
          ? { partyType: "", partyName: "", partyId: "", allocations: {}, selectedInvoices: [], allocatedAmount: 0 }
          : {}),
      });
    }

    prevRef.current = { paymentType, partyType };
  }, [paymentType, partyType]);
  // ── Hook 9: Exchange rate ─────────────────────────────────────────────────
  const currencyFrom = form.currencyFrom ?? "";
  const currencyTo = form.currencyTo ?? "";
  const date = form.date || dayjs().format("YYYY-MM-DD");

  const {
    rate: fetchedRate,
    error: rateError,
    isLoadingRate,
    currenciesDiffer,
  } = useExchangeRate(
    currencyFrom,
    currencyTo,
    date,
    companyBaseCurrency,
  );

  // Sync exchange rate result into form state
  useEffect(() => {
    if (!currenciesDiffer) {
      onFormChange({ exchangeRate: null });
    } else if (fetchedRate !== null) {
      onFormChange({ exchangeRate: fetchedRate });
    } else if (rateError) {
      onFormChange({ exchangeRate: "" });
    }
  }, [fetchedRate, rateError, currenciesDiffer]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Default date on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (!form.date) onFormChange({ date: dayjs().format("YYYY-MM-DD") });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mode of payment → auto-fill glFrom (Pay) or glTo (Receive) ───────────
  useEffect(() => {
    if (!form.mode) {
      if (paymentType === "Pay") {
        onFormChange({ glFrom: "", currencyFrom: "" });
      } else if (paymentType === "Receive") {
        onFormChange({ glTo: "", currencyTo: "" });
      } else {
        onFormChange({
          glFrom: "",
          currencyFrom: "",
          glTo: "",
          currencyTo: "",
        });
      }
      return;
    }

    // ignore temporary null (loading case)
    if (!selectedMode) return;

    // normal autofill
    if (paymentType === "Pay") {
      onFormChange({
        glFrom: selectedMode.defaultAccount ?? "",
        currencyFrom: selectedMode.currency ?? "",
      });
    } else if (paymentType === "Receive") {
      onFormChange({
        glTo: selectedMode.defaultAccount ?? "",
        currencyTo: selectedMode.currency ?? "",
      });
    } else if (paymentType === "Internal Transfer") {
      // Internal Transfer: defaultAccount → Paid From (glFrom) only
      // glTo user manually select karega
      onFormChange({
        glFrom: selectedMode.defaultAccount ?? "",
        currencyFrom: selectedMode.currency ?? "",
      });
    }
  }, [selectedMode, paymentType, form.mode]);

  // ── Party change → auto-fill GL + bank accounts ───────────────────────────
  // LOGIC:
  //   Pay:     Paid From = company bank,  Paid To = party bank
  //   Receive: Paid From = party bank,    Paid To = company bank
  const requestRef = useRef(0);

  useEffect(() => {
    const partyKey = form.partyId || form.partyName;
    if (
      !partyKey ||
      (form.partyType !== "Customer" && form.partyType !== "Supplier")
    )
      return;

    const stableKey = `${form.partyType}::${partyKey}::${form.paymentType}`;
    if (partyFetchKeyRef.current === stableKey && form.glFrom && form.glTo)
      return;
    partyFetchKeyRef.current = stableKey;

    const requestId = ++requestRef.current;

    const run = async () => {
      const [details] = await Promise.all([
        fetchPartyDetails(
          form.partyName,
          form.partyType as
          | "Supplier"
          | "Customer"
          | "Employee"
          | "Shareholder",
        ),
        fetchCompanyBanks(),
        fetchPartyBanks(form.partyType, form.partyName),
      ]);

      if (requestId !== requestRef.current) return;
      if (!details) return;
      if (form.glFrom && form.glTo) return;

      if (form.paymentType === "Pay") {
        // Pay: Paid From = company, Paid To = party
        onFormChange({
          partyName: details.partyName,
          totalOutstanding: details.total_outstanding_amount ?? null,
          companyBankAccount: details.companyBankAccount, // → Paid From bank
          partyBankAccount: details.partyBankAccount, // → Paid To bank
          companyDefaultCurrency: details.companyDefaultCurrency,
          glFrom: details.companyLedgerAccount,
          currencyFrom: details.companyLedgerCurrency,
          glTo: details.partyLedgerAccount,
          currencyTo: details.partyAccountCurrency,
        });
      } else {
        // Receive: Paid From = party, Paid To = company
        onFormChange({
          partyName: details.partyName,
          totalOutstanding: details.total_outstanding_amount ?? null,
          companyBankAccount: details.companyBankAccount, // stored for reference
          partyBankAccount: details.partyBankAccount, // stored for reference
          companyDefaultCurrency: details.companyDefaultCurrency,
          glFrom: details.partyLedgerAccount,
          currencyFrom: details.partyAccountCurrency,
          glTo: details.companyLedgerAccount,
          currencyTo: details.companyLedgerCurrency,
        });
      }
    };

    run();
  }, [form.partyId, form.partyName, form.partyType, form.paymentType]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePartyTypeChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    onChange(e);
    onFormChange({
      ...PARTY_FILLED_FIELDS,
      allocatedAmount: 0,
      selectedInvoices: [],
      allocations: {},
    });
    clearCompanyBanks();
    clearPartyBanks();
  };

  const handlePartyNameSelect = useCallback(
    async (_: string, option: PartyOption | null) => {
      if (!option?.value) {
        onFormChange({
          ...PARTY_FILLED_FIELDS,
          allocatedAmount: 0,
          selectedInvoices: [],
          allocations: {},
        });
        clearCompanyBanks();
        clearPartyBanks();
        return;
      }

      onFormChange({ partyName: option.label });

      if (partyType !== "Supplier" && partyType !== "Customer") return;

      const [details] = await Promise.all([
        fetchPartyDetails(option.value, partyType),
        fetchCompanyBanks(),
        fetchPartyBanks(partyType, option.value),
      ]);

      if (!details) return;

      const base = { partyName: details.partyName || option.label };
      const companyDefaultCurrency = {
        companyDefaultCurrency: details.companyDefaultCurrency,
      };

      if (paymentType === "Pay") {
        // Pay: Paid From = company bank, Paid To = party bank
        onFormChange({
          ...base,
          ...companyDefaultCurrency,
          totalOutstanding: details.total_outstanding_amount ?? null,
          companyBankAccount: details.companyBankAccount, // → Paid From bank
          partyBankAccount: details.partyBankAccount, // → Paid To bank
          glFrom: details.companyLedgerAccount,
          currencyFrom: details.companyLedgerCurrency,
          glTo: details.partyLedgerAccount,
          currencyTo: details.partyAccountCurrency,
        });
      } else {
        // Receive: Paid From = party bank, Paid To = company bank
        onFormChange({
          ...base,
          ...companyDefaultCurrency,
          totalOutstanding: details.total_outstanding_amount ?? null,
          companyBankAccount: details.companyBankAccount, // stored for reference
          partyBankAccount: details.partyBankAccount, // stored for reference
          glFrom: details.partyLedgerAccount,
          currencyFrom: details.partyAccountCurrency,
          glTo: details.companyLedgerAccount,
          currencyTo: details.companyLedgerCurrency,
        });
      }
    },
    [
      onFormChange,
      partyType,
      paymentType,
      fetchPartyDetails,
      fetchCompanyBanks,
      fetchPartyBanks,
      clearCompanyBanks,
      clearPartyBanks,
    ],
  );

  const handleAmountToChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const val =
      parseFloat((e as React.ChangeEvent<HTMLInputElement>).target.value) || 0;
    const rate = parseFloat(form.exchangeRate) || 1;
    onChange(e);
    onFormChange({
      amount: val ? String(val) : "",
      amountFrom: val ? String(+(val / rate).toFixed(4)) : "",
    });
  };

  const handleAmountFromChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const val =
      parseFloat((e as React.ChangeEvent<HTMLInputElement>).target.value) || 0;
    const rate = parseFloat(form.exchangeRate) || 1;
    onChange(e);
    onFormChange({
      amountTo: val ? String(+(val * rate).toFixed(4)) : "",
      amount: val ? String(+(val * rate).toFixed(4)) : "",
    });
  };

  // ── Auto-recalculate amountTo when exchange rate changes ─────────────────
  useEffect(() => {
    const from = parseFloat(form.amountFrom) || 0;
    const rate = parseFloat(form.exchangeRate) || 1;
    if (!from) return;
    onFormChange({
      amountTo: String(+(from * rate).toFixed(4)),
      amount: String(+(from * rate).toFixed(4)),
    });
  }, [form.exchangeRate]); // eslint-disable-line react-hooks/exhaustive-deps

  const canAllocate =
    Number(form?.amountTo || 0) > 0 &&
    !!form?.partyName &&
    !form?.referenceInvoice;

  // ── Mode of Payment fetch ─────────────────────────────────────────────────
  const handleModeFetchOptions = useCallback(
    async (q: string) => {
      const fresh = await fetchModes(q || undefined);
      return fresh.map((o) => ({ label: o.label, value: o.value }));
    },
    [fetchModes],
  );

  // ── Party Name fetch ──────────────────────────────────────────────────────
  const handlePartyFetchOptions = useCallback(
    async (q: string): Promise<PartyOption[]> => {
      const fresh = await fetchParties(q || undefined);
      return fresh;
    },
    [fetchParties],
  );

  // ── Bank account fetch options — swapped based on paymentType ─────────────
  // Pay:     Paid From dropdown = company banks,  Paid To dropdown = party banks
  // Receive: Paid From dropdown = party banks,    Paid To dropdown = company banks
  // Internal Transfer: no bank API calls

  const handleFromBankFetchOptions = useCallback(
    async (q: string) => {

      if (paymentType === "Pay") {
        // Paid From = company bank
        const fresh = await fetchCompanyBanks(q || undefined);
        return (fresh ?? []).map((o) => ({
          label: `${o.label} (${o.currency ?? ""})`,
          value: o.value,
        }));
      } else {
        // Receive: Paid From = party bank
        if (!form.partyType || !form.partyName) return [];
        const fresh = await fetchPartyBanks(
          form.partyType,
          form.partyName,
          q || undefined,
        );
        return (fresh ?? []).map((o) => ({
          label: `${o.label} (${o.currency ?? ""})`,
          value: o.value,
        }));
      }
    },
    [
      paymentType,
      fetchCompanyBanks,
      fetchPartyBanks,
      form.partyType,
      form.partyName,
    ],
  );

  const handleToBankFetchOptions = useCallback(
    async (q: string) => {

      if (paymentType === "Pay") {
        // Paid To = party bank
        if (!form.partyType || !form.partyName) return [];
        const fresh = await fetchPartyBanks(
          form.partyType,
          form.partyName,
          q || undefined,
        );
        return (fresh ?? []).map((o) => ({
          label: `${o.label} (${o.currency ?? ""})`,
          value: o.value,
        }));
      } else {
        // Receive: Paid To = company bank
        const fresh = await fetchCompanyBanks(q || undefined);
        return (fresh ?? []).map((o) => ({
          label: `${o.label} (${o.currency ?? ""})`,
          value: o.value
        }));
      }
    },
    [
      paymentType,
      fetchCompanyBanks,
      fetchPartyBanks,
      form.partyType,
      form.partyName,
    ],
  );

  // ── Bank account selection handlers — swapped based on paymentType ─────────
  // Pay:     From bank selection updates companyBankAccount + glFrom + currencyFrom
  //          To bank selection updates partyBankAccount + glTo + currencyTo
  // Receive: From bank selection updates partyBankAccount + glFrom + currencyFrom
  //          To bank selection updates companyBankAccount + glTo + currencyTo

  const handleFromBankChange = useCallback(
    (_: string, option: any) => {
      if (!option?.value) {
        if (paymentType === "Pay") {
          onFormChange({ companyBankAccount: "" });
        } else {
          onFormChange({ partyBankAccount: "" });
        }
        return;
      }

      if (paymentType === "Pay") {
        // From = company bank pool
        const selected = companyBankOptions.find(
          (o) => o.value === option.value,
        );
        onFormChange({
          companyBankAccount: option.value,
          glFrom: selected?.ledgerAccount ?? "",
          currencyFrom: selected?.currency ?? "",
        });
      } else {
        // Receive: From = party bank pool
        const selected = partyBankOptions.find((o) => o.value === option.value);
        onFormChange({
          partyBankAccount: option.value,
          glFrom: selected?.ledgerAccount ?? "",
          currencyFrom: selected?.currency ?? "",
        });
      }
    },
    [paymentType, onFormChange, companyBankOptions, partyBankOptions],
  );

  const handleToBankChange = useCallback(
    (_: string, option: any) => {
      if (!option?.value) {
        if (paymentType === "Pay") {
          onFormChange({ partyBankAccount: "" });
        } else {
          onFormChange({ companyBankAccount: "" });
        }
        return;
      }

      if (paymentType === "Pay") {
        // To = party bank pool
        const selected = partyBankOptions.find((o) => o.value === option.value);
        onFormChange({
          partyBankAccount: option.value,
          glTo: selected?.ledgerAccount ?? "",
          currencyTo: selected?.currency ?? "",
        });
      } else {
        // Receive: To = company bank pool
        const selected = companyBankOptions.find(
          (o) => o.value === option.value,
        );
        onFormChange({
          companyBankAccount: option.value,
          glTo: selected?.ledgerAccount ?? "",
          currencyTo: selected?.currency ?? "",
        });
      }
    },
    [paymentType, onFormChange, companyBankOptions, partyBankOptions],
  );

  // ── GL account handlers ───────────────────────────────────────────────────
  const handleGlFromFetchOptions = useCallback(
    async (q: string) => {
      const results = await fetchFromOptions(q || undefined);
      return results.map((o) => ({ label: o.label, value: o.value }));
    },
    [fetchFromOptions],
  );

  const handleGlToFetchOptions = useCallback(
    async (q: string) => {
      const results = await fetchToOptions(q || undefined);
      return results.map((o) => ({ label: o.label, value: o.value }));
    },
    [fetchToOptions],
  );

  const handleGlFromChange = useCallback(
    (_: string, option: any) => {
      const selected = ledgerFromOptions.find((o) => o.value === option.value);
      onFormChange({
        glFrom: option.value ?? "",
        currencyFrom: selected?.currency ?? "",
      });
    },
    [onFormChange, ledgerFromOptions],
  );

  const handleGlToChange = useCallback(
    (_: string, option: any) => {
      const selected = ledgerToOptions.find((o) => o.value === option.value);
      onFormChange({
        glTo: option.value ?? "",
        currencyTo: selected?.currency ?? "",
      });
    },
    [onFormChange, ledgerToOptions],
  );

  const handleModeChange = useCallback(
    (_: string, option: any) => {
      onFormChange({ mode: option?.value ?? "" });
    },
    [onFormChange],
  );

  // ── Derive which form field maps to which side for bank account display ───
  // Pay:     Paid From bank = companyBankAccount, Paid To bank = partyBankAccount
  // Receive: Paid From bank = partyBankAccount,   Paid To bank = companyBankAccount
  const fromBankValue =
    paymentType === "Receive"
      ? (form.partyBankAccount ?? "")
      : (form.companyBankAccount ?? "");

  const toBankValue =
    paymentType === "Receive"
      ? (form.companyBankAccount ?? "")
      : (form.partyBankAccount ?? "");

  const isFromBankLoading =
    paymentType === "Receive" ? isLoadingPartyBanks : isLoadingCompanyBanks;
  const isToBankLoading =
    paymentType === "Receive" ? isLoadingCompanyBanks : isLoadingPartyBanks;

  return (
    <div className="space-y-5">
      {islocked && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-xs text-primary leading-relaxed">
            Party details are pre-filled from{" "}
            <span className="font-bold">{form?.referenceInvoice}</span>. Payment
            Type, Party Type and Name cannot be changed.
          </span>
        </div>
      )}

      {!islocked && isPartyLocked && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
          <span className="text-xs text-amber-700 leading-relaxed">
            Party is selected. Go to{" "}
            <span className="font-bold">Invoices tab</span> to allocate. Party
            Type and Name cannot be changed now.
          </span>
        </div>
      )}

      {/* Row 1 */}
      <div className="grid grid-cols-4 gap-3">
        <ModalSelect
          label="Payment Type"
          name="paymentType"
          value={form.paymentType}
          onChange={onChange}
          disabled={islocked}
          options={[
            { label: "Pay", value: "Pay" },
            { label: "Receive", value: "Receive" },
            { label: "Internal Transfer", value: "Internal Transfer" }
          ]}
        />
        <ModalSelect
          label="Party Type"
          name="partyType"
          value={form.partyType}
          disabled={islocked || isPartyLocked || isInternalTransfer}
          onChange={handlePartyTypeChange}
          options={[
            { label: "Supplier", value: "Supplier" },
            { label: "Customer", value: "Customer" },
            { label: "Shareholder", value: "Shareholder" },
            { label: "Employee", value: "Employee" },
          ]}
        />
        <SearchSelect2
          label="Name"
          value={form.partyName ?? ""}
          disabled={islocked || isPartyLocked || !partyType || isLoadingParties || isInternalTransfer}
          onChange={handlePartyNameSelect}
          fetchOptions={handlePartyFetchOptions}
        />
        <DatePickerInput
          label="Date"
          name="date"
          value={form.date}
          onChange={(name, value) => onFormChange({ [name]: value })}
        />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-3 gap-3">
        <SearchSelect2
          label="Mode of Payment"
          value={form.mode ?? ""}
          disabled={modesLoading}
          onChange={handleModeChange}
          fetchOptions={handleModeFetchOptions}
        />
        <ModalInput
          label="Cheque / Reference No"
          name="referenceNo"
          value={form.referenceNo}
          onChange={onChange}
          required
        />
        <DatePickerInput
          label="Cheque / Reference Date"
          name="referenceDate"
          value={form.referenceDate}
          onChange={(name, value) => onFormChange({ [name]: value })}
          required
        />
      </div>

      {/* From / To box */}
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="grid grid-cols-2 bg-[var(--row-hover)] border-b border-[var(--border)]">
          <div className="px-5 py-2.5 text-xs font-semibold text-main border-r border-[var(--border)]">
            Paid From
          </div>
          <div className="px-5 py-2.5 text-xs font-semibold text-main">
            Paid To
          </div>
        </div>

        <div className="relative grid grid-cols-2">
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10
                        flex items-center justify-center w-8 h-8 rounded-full bg-card border border-[var(--border)] shadow-sm"
          >
            <MoveRight size={14} className="text-primary" />
          </div>

          {/* LEFT — Paid From */}
          <div className="border-r border-[var(--border)] px-5 py-4 space-y-3">

            {!isInternalTransfer && (
              <SearchSelect2
                label="Bank Account"
                value={fromBankValue}
                disabled={

                  !form.partyName ||
                  isFromBankLoading
                }
                onChange={handleFromBankChange}
                fetchOptions={handleFromBankFetchOptions}
              />
            )}
            <div className="grid grid-cols-[1fr_100px] gap-2">
              <SearchSelect2
                label="Account (GL)"
                value={form.glFrom ?? ""}
                onChange={handleGlFromChange}
                fetchOptions={handleGlFromFetchOptions}
              />
              <ModalInput
                label="Currency"
                name="currencyFrom"
                value={form.currencyFrom ?? ""}
                onChange={() => { }}
                disabled
              />
            </div>
          </div>

          {/* RIGHT — Paid To */}
          <div className="px-5 py-4 space-y-3">
            {!isInternalTransfer && (
              <SearchSelect2
                label="Bank Account"
                value={toBankValue}
                disabled={

                  !form.partyName ||
                  isToBankLoading
                }
                onChange={handleToBankChange}
                fetchOptions={handleToBankFetchOptions}
              />
            )}
            <div className="grid grid-cols-[1fr_100px] gap-2">
              <SearchSelect2
                label="Account (GL)"
                value={form.glTo ?? ""}
                onChange={handleGlToChange}
                fetchOptions={handleGlToFetchOptions}
              />
              <ModalInput
                label="Currency"
                name="currencyTo"
                value={form.currencyTo ?? ""}
                onChange={() => { }}
                disabled
              />
            </div>
          </div>
        </div>

        {/* Amount row */}
        <div className="border-t border-[var(--border)] grid grid-cols-[1fr_auto_1fr]">
          <div className="border-r border-[var(--border)] px-5 py-4">
            <ModalInput
              label="Amount"
              name="amountFrom"
              type="number"
              value={form.amountFrom ?? ""}
              onChange={handleAmountFromChange}
              className="no-spinner"
            />
          </div>

          <div className="flex flex-col items-center justify-end py-4 gap-1 px-2 min-w-[80px]">
            <span className="text-xs text-muted whitespace-nowrap">
              Exch. Rate
            </span>
            <div className="relative w-full">
              <input
                type="number"
                name="exchangeRate"
                value={!currenciesDiffer ? "" : (form.exchangeRate ?? "")}
                onChange={onChange as any}
                placeholder="—"
                disabled={!currenciesDiffer || isLoadingRate}
                className={[
                  "w-full px-2 py-[7px] text-xs border rounded focus:outline-none",
                  "focus:ring-1 focus:ring-primary text-center no-spinner",
                  !currenciesDiffer
                    ? "bg-[var(--row-hover)] border-[var(--border)] text-muted cursor-not-allowed opacity-80"
                    : rateError
                      ? "border-red-300 focus:ring-red-400 bg-card"
                      : "border-[var(--border)] bg-card",
                  isLoadingRate && currenciesDiffer
                    ? "opacity-50 cursor-not-allowed"
                    : "",
                ].join(" ")}
              />
              {isLoadingRate && currenciesDiffer && (
                <Loader2
                  size={11}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted animate-spin"
                />
              )}
            </div>
            {rateError && !isLoadingRate && currenciesDiffer && (
              <div className="flex items-start gap-1 mt-0.5 w-full max-w-[160px]">
                <AlertCircle
                  size={10}
                  className="text-red-400 flex-shrink-0 mt-[1px]"
                />
                <p className="text-[10px] text-red-500 leading-tight">
                  {rateError}
                </p>
              </div>
            )}
          </div>

          <div className="border-l border-[var(--border)] px-5 py-4 flex flex-col gap-1">
            <ModalInput
              label="Amount"
              name="amountTo"
              type="number"
              value={form.amountTo ?? ""}
              onChange={handleAmountToChange}
              className="no-spinner"
            />
            {canAllocate && onAllocate && (
              <button
                type="button"
                onClick={onAllocate}
                className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-medium transition-colors w-fit"
              >
                Modify Allocation Order <ArrowRight size={11} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Project & Cost Centre */}
      <div className="grid grid-cols-2 gap-3">
        <ProjectSelect
    value={form.project ?? ""}
    onChange={(val) =>
      onChange({
        target: { name: "project", value: val },
      } as React.ChangeEvent<HTMLInputElement>)
    }
  />
        <CostCenterSelect
          value={form.costCenter ?? ""}
          onChange={(val) =>
            onChange({
              target: { name: "costCenter", value: val },
            } as React.ChangeEvent<HTMLInputElement>)
          }
        />
      </div>

      {isLoadingDetails && (
        <p className="text-xs text-muted animate-pulse">
          Fetching party details...
        </p>
      )}
    </div>
  );
};

export default PaymentDetailsTab;
