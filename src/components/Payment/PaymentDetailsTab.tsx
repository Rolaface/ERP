import React, { useEffect, useMemo, useRef } from "react";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
import SearchSelect2 from "../ui/modal/SearchSelect";
import { MoveRight, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import {
  usePaymentModes,
  usePartyOptions,
  usePartyDetails,
  useCompanyBankAccounts,
  usePartyBankAccounts,
  useCurrencyOptions,
  useLedgerOptions,
  useExchangeRate,
  type PartyOption,
} from "../../views/PaymentEntry/usePaymentEntryLogic";
import DatePickerInput from "../calendar/DatePickerInput";

interface PaymentDetailsTabProps {
  form: Record<string, any>;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  onFormChange: (updates: Record<string, any>) => void;
  onAllocate?: () => void;
  islocked?: boolean;
  isPartyLocked?: boolean;
}

const PARTY_FILLED_FIELDS = {
  partyName:          "",
  glFrom:             "",
  glTo:               "",
  currencyFrom:       "",
  currencyTo:         "",
  companyBankAccount: "",
  partyBankAccount:   "",
};

const PaymentDetailsTab: React.FC<PaymentDetailsTabProps> = ({
  form,
  onChange,
  onFormChange,
  onAllocate,
  islocked      = false,
  isPartyLocked = false,
}) => {
  const { options: modeOptions, isLoading: modesLoading } = usePaymentModes();
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
    (form.partyType as "Supplier" | "Customer" | "Shareholder" | "Employee") || "";

  const { partyOptions, isLoadingParties } = usePartyOptions(partyType);

  // ── selectedMode: needed for mode-of-payment auto-fill ───────────────────
  const selectedMode = useMemo(
    () => modeOptions.find((opt) => opt.value === form.mode) ?? null,
    [form.mode, modeOptions],
  );

  // ── Hook 7: Currency dropdown options ────────────────────────────────────
  const { currencyOptions } = useCurrencyOptions();

  const buildCurrencyOptions = (currentValue: string) => {
    if (currencyOptions.length > 0) return currencyOptions;
    return currentValue
      ? [{ label: currentValue, value: currentValue }]
      : [{ label: "Loading...", value: "" }];
  };

  // ── Hook 8: GL ledger options for From + To ───────────────────────────────
  const {
    fromOptions: ledgerFromOptions,
    toOptions:   ledgerToOptions,
    isLoadingLedgers,
  } = useLedgerOptions(paymentType, partyType);

  // Clear GL fields when ledger options reset (partyType / paymentType changed)
  useEffect(() => {
    onFormChange({ glFrom: "", currencyFrom: "", glTo: "", currencyTo: "" });
  }, [paymentType, partyType]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hook 9: Exchange rate ─────────────────────────────────────────────────
  const currencyFrom = form.currencyFrom ?? "";
  const currencyTo   = form.currencyTo   ?? "";
  const date         = form.date || dayjs().format("YYYY-MM-DD");

  const {
    rate:             fetchedRate,
    error:            rateError,
    isLoadingRate,
    currenciesDiffer,
  } = useExchangeRate(currencyFrom, currencyTo, date,form.companyDefaultCurrency);

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

  // ── Mode of payment → auto-fill glFrom or glTo ───────────────────────────
  useEffect(() => {
    if (!selectedMode) {
      if (paymentType === "Pay")
        onFormChange({ glFrom: "", currencyFrom: "" });
      else if (paymentType === "Receive")
        onFormChange({ glTo: "", currencyTo: "" });
      else
        onFormChange({ glFrom: "", currencyFrom: "", glTo: "", currencyTo: "" });
      return;
    }
    if (paymentType === "Pay")
      onFormChange({ glFrom: selectedMode.defaultAccount, currencyFrom: selectedMode.currency });
    else if (paymentType === "Receive")
      onFormChange({ glTo: selectedMode.defaultAccount, currencyTo: selectedMode.currency });
    else
      onFormChange({ glFrom: "", currencyFrom: "", glTo: "", currencyTo: "" });
  }, [selectedMode, paymentType]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Party change → auto-fill GL + bank accounts ───────────────────────────
  const requestRef = useRef(0);

  useEffect(() => {
    const partyKey = form.partyId || form.partyName;
    if (!partyKey || (form.partyType !== "Customer" && form.partyType !== "Supplier")) return;

    const requestId = ++requestRef.current;

    const run = async () => {
      const [details] = await Promise.all([
        fetchPartyDetails(form.partyName, form.partyType),
        fetchCompanyBanks(),
        fetchPartyBanks(form.partyType, form.partyName),
      ]);

      if (requestId !== requestRef.current) return;
      if (!details) return;

      onFormChange({
        partyName:          details.partyName,
        companyBankAccount: details.companyBankAccount,
        partyBankAccount:   details.partyBankAccount,
        glFrom:
          form.paymentType === "Pay"
            ? details.companyLedgerAccount
            : details.partyLedgerAccount,
        currencyFrom:
          form.paymentType === "Pay"
            ? details.companyLedgerCurrency
            : details.partyAccountCurrency,
        glTo:
          form.paymentType === "Pay"
            ? details.partyLedgerAccount
            : details.companyLedgerAccount,
        currencyTo:
          form.paymentType === "Pay"
            ? details.partyAccountCurrency
            : details.companyLedgerCurrency,
      });
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
      allocatedAmount:  0,
      selectedInvoices: [],
      allocations:      {},
    });
    clearCompanyBanks();
    clearPartyBanks();
  };

  const handlePartyNameSelect = async (_: string, option: PartyOption | null) => {
    if (!option?.value) {
      onFormChange({
        ...PARTY_FILLED_FIELDS,
        allocatedAmount:  0,
        selectedInvoices: [],
        allocations:      {},
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

    const base  = { partyName: details.partyName || option.label };
    const banks = {
      companyBankAccount: details.companyBankAccount,
      partyBankAccount:   details.partyBankAccount,
    };

    if (paymentType === "Pay") {
      onFormChange({
        ...base, ...banks,
        glFrom:       details.companyLedgerAccount,
        currencyFrom: details.companyLedgerCurrency,
        glTo:         details.partyLedgerAccount,
        currencyTo:   details.partyAccountCurrency,
      });
    } else {
      onFormChange({
        ...base, ...banks,
        glFrom:       details.partyLedgerAccount,
        currencyFrom: details.partyAccountCurrency,
        glTo:         details.companyLedgerAccount,
        currencyTo:   details.companyLedgerCurrency,
      });
    }
  };

  const handleCompanyBankSelect = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const val = (e as React.ChangeEvent<HTMLSelectElement>).target.value;
    if (!val) { onFormChange({ companyBankAccount: "" }); return; }
    const selected = companyBankOptions.find((o) => o.value === val);
    if (!selected) return;
    onFormChange({
      companyBankAccount: selected.value,
      glFrom:             selected.ledgerAccount,
      currencyFrom:       selected.currency,
    });
  };

  const handlePartyBankSelect = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const val = (e as React.ChangeEvent<HTMLSelectElement>).target.value;
    if (!val) { onFormChange({ partyBankAccount: "" }); return; }
    const selected = partyBankOptions.find((o) => o.value === val);
    if (!selected) return;
    onFormChange({
      partyBankAccount: selected.value,
      glTo:             selected.ledgerAccount,
      currencyTo:       selected.currency,
    });
  };

  const handleAmountToChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    onChange(e);
    onFormChange({ amount: (e as React.ChangeEvent<HTMLInputElement>).target.value });
  };

  const canAllocate = Number(form?.amountTo || 0) > 0 && !!form?.partyName;

  // ── GL dropdown option lists ──────────────────────────────────────────────
  const glFromSelectOptions = isLoadingLedgers
    ? [{ label: "Loading...", value: "" }]
    : ledgerFromOptions.map((o) => ({ label: o.label, value: o.value }));

  const glToSelectOptions = isLoadingLedgers
    ? [{ label: "Loading...", value: "" }]
    : ledgerToOptions.map((o) => ({ label: o.label, value: o.value }));

  return (
    <div className="space-y-5">
      {islocked && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-xs text-primary leading-relaxed">
            Party details are pre-filled from invoice{" "}
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
            { label: "Pay",               value: "Pay"               },
            { label: "Receive",           value: "Receive"           },
            { label: "Internal Transfer", value: "Internal Transfer" },
          ]}
        />
        <ModalSelect
          label="Party Type"
          name="partyType"
          value={form.partyType}
          disabled={islocked || isPartyLocked}
          onChange={handlePartyTypeChange}
          options={[
            { label: "Supplier",    value: "Supplier"    },
            { label: "Customer",    value: "Customer"    },
            { label: "Shareholder", value: "Shareholder" },
            { label: "Employee",    value: "Employee"    },
          ]}
        />
        <SearchSelect2
          label="Name"
          value={form.partyName ?? ""}
          disabled={islocked || isPartyLocked || !partyType || isLoadingParties}
          onChange={handlePartyNameSelect}
          fetchOptions={(q): Promise<PartyOption[]> => {
            const query = q.toLowerCase();
            return Promise.resolve(
              partyOptions.filter((p) =>
                (p.label || "").toLowerCase().includes(query),
              ),
            );
          }}
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
        <ModalSelect
          label="Mode of Payment"
          name="mode"
          value={form.mode ?? ""}
          onChange={onChange}
          options={
            modesLoading
              ? [{ label: "Loading...", value: "" }]
              : modeOptions.map((o) => ({ label: o.label, value: o.value }))
          }
        />
        <ModalInput
          label="Cheque / Reference No"
          name="referenceNo"
          value={form.referenceNo}
          onChange={onChange}
        />
        <DatePickerInput
          label="Cheque / Reference Date"
          name="referenceDate"
          value={form.referenceDate}
          onChange={(name, value) => onFormChange({ [name]: value })}
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
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10
                          flex items-center justify-center w-8 h-8 rounded-full bg-card border border-[var(--border)] shadow-sm">
            <MoveRight size={14} className="text-primary" />
          </div>

          {/* LEFT — Paid From */}
          <div className="border-r border-[var(--border)] px-5 py-4 space-y-3">
            <ModalSelect
              label="Bank Account"
              name="companyBankAccount"
              value={form.companyBankAccount ?? ""}
              onChange={handleCompanyBankSelect}
              disabled={!form.partyName || isLoadingCompanyBanks}
              options={
                isLoadingCompanyBanks
                  ? [{ label: "Loading...", value: "" }]
                  : companyBankOptions.map((o) => ({ label: o.label, value: o.value }))
              }
            />
            <div className="grid grid-cols-[1fr_100px] gap-2">
              <ModalSelect
                label="Account (GL)"
                name="glFrom"
                value={form.glFrom ?? ""}
                onChange={(e) => {
                  const selected = ledgerFromOptions.find((o) => o.value === e.target.value);
                  onFormChange({
                    glFrom:       selected?.value    ?? e.target.value,
                    currencyFrom: selected?.currency ?? form.currencyFrom ?? "",
                  });
                }}
                options={glFromSelectOptions}
              />
              <ModalSelect
                label="Currency"
                name="currencyFrom"
                value={form.currencyFrom ?? ""}
                onChange={onChange}
                options={buildCurrencyOptions(form.currencyFrom ?? "")}
              />
            </div>
          </div>

          {/* RIGHT — Paid To */}
          <div className="px-5 py-4 space-y-3">
            <ModalSelect
              label="Bank Account"
              name="partyBankAccount"
              value={form.partyBankAccount ?? ""}
              onChange={handlePartyBankSelect}
              disabled={!form.partyName || isLoadingPartyBanks}
              options={
                isLoadingPartyBanks
                  ? [{ label: "Loading...", value: "" }]
                  : partyBankOptions.map((o) => ({ label: o.label, value: o.value }))
              }
            />
            <div className="grid grid-cols-[1fr_100px] gap-2">
              <ModalSelect
                label="Account (GL)"
                name="glTo"
                value={form.glTo ?? ""}
                onChange={(e) => {
                  const selected = ledgerToOptions.find((o) => o.value === e.target.value);
                  onFormChange({
                    glTo:       selected?.value    ?? e.target.value,
                    currencyTo: selected?.currency ?? form.currencyTo ?? "",
                  });
                }}
                options={glToSelectOptions}
              />
              <ModalSelect
                label="Currency"
                name="currencyTo"
                value={form.currencyTo ?? ""}
                onChange={onChange}
                options={buildCurrencyOptions(form.currencyTo ?? "")}
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
              onChange={onChange}
              className="no-spinner"
            />
          </div>

          <div className="flex flex-col items-center justify-end py-4 gap-1 px-2 min-w-[80px]">
            <span className="text-xs text-muted whitespace-nowrap">Exch. Rate</span>
            <div className="relative w-full">
              <input
                type="number"
                name="exchangeRate"
                value={
                  !currenciesDiffer
                    ? ""
                    : (form.exchangeRate ?? "")
                }
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
                  isLoadingRate && currenciesDiffer ? "opacity-50 cursor-not-allowed" : "",
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
                <AlertCircle size={10} className="text-red-400 flex-shrink-0 mt-[1px]" />
                <p className="text-[10px] text-red-500 leading-tight">{rateError}</p>
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
                Allocate against invoices <ArrowRight size={11} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Project & Cost Centre */}
      <div className="grid grid-cols-2 gap-3">
        <ModalInput
          label="Project"
          name="project"
          value={form.project ?? ""}
          onChange={onChange}
        />
        <ModalInput
          label="Cost Centre"
          name="costCenter"
          value={form.costCenter ?? ""}
          onChange={onChange}
        />
      </div>

      {isLoadingDetails && (
        <p className="text-xs text-muted animate-pulse">Fetching party details...</p>
      )}
    </div>
  );
};

export default PaymentDetailsTab;