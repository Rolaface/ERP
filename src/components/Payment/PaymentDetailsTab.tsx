import React, { useEffect, useMemo } from "react";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
import SearchSelect2 from "../ui/modal/SearchSelect";
import {
  usePaymentModes,
  usePartyOptions,
  usePartyDetails,
  type PartyOption,
} from "../../views/PaymentEntry/usePaymentEntryLogic";

interface PaymentDetailsTabProps {
  form: Record<string, any>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onFormChange: (updates: Record<string, any>) => void;
}

// All fields auto-filled by party details API — wiped on party type change
const PARTY_FILLED_FIELDS = {
  partyName: "",
  glFrom: "",
  glTo: "",
  currencyFrom: "",
  currencyTo: "",
  companyBankAccount: "",
  partyBankAccount: "",
};

const PaymentDetailsTab: React.FC<PaymentDetailsTabProps> = ({
  form,
  onChange,
  onFormChange,
}) => {
  const { options: modeOptions, isLoading: modesLoading } = usePaymentModes();
  const { fetchPartyDetails, isLoadingDetails } = usePartyDetails();

  const paymentType: "Pay" | "Receive" | "Internal Transfer" =
    form.paymentType || "Pay";

  const partyType: "Supplier" | "Customer" | "Shareholder" | "Employee" | "" =
    form.partyType || "";

  const { partyOptions, isLoadingParties } = usePartyOptions(partyType);

  // ── Derive selected mode's defaultAccount + currency ─────────────────────
  const selectedMode = useMemo(() => {
    if (!form.mode) return null;
    return modeOptions.find((opt) => opt.value === form.mode) ?? null;
  }, [form.mode, modeOptions]);

  // ── Mode of payment effect ────────────────────────────────────────────────
  // Mode ONLY overwrites its own side — party-filled opposite side is untouched
  useEffect(() => {
    // Guard: if no mode is selected at all, only clear mode-owned side
    // but ONLY if it was previously filled by mode (not by party API)
    if (!selectedMode) {
      if (paymentType === "Pay") {
        onFormChange({ glFrom: "", currencyFrom: "" });
      } else if (paymentType === "Receive") {
        onFormChange({ glTo: "", currencyTo: "" });
      } else {
        onFormChange({ glFrom: "", currencyFrom: "", glTo: "", currencyTo: "" });
      }
      return;
    }

    // Mode selected → only overwrite mode-owned side
    if (paymentType === "Pay") {
      onFormChange({
        glFrom: selectedMode.defaultAccount,
        currencyFrom: selectedMode.currency,
        // glTo + currencyTo → NOT touched, party API owns that side
      });
    } else if (paymentType === "Receive") {
      onFormChange({
        glTo: selectedMode.defaultAccount,
        currencyTo: selectedMode.currency,
        // glFrom + currencyFrom → NOT touched, party API owns that side
      });
    } else {
      onFormChange({
        glFrom: "",
        currencyFrom: "",
        glTo: "",
        currencyTo: "",
      });
    }
  }, [selectedMode, paymentType]); // ← REMOVE onFormChange from deps
  // onFormChange excluded intentionally — it's a stable ref, including it
  // causes infinite re-render loop

  // ── Party Type change: clear all party-filled fields ─────────────────────
  const handlePartyTypeChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    onChange(e);
    onFormChange({ ...PARTY_FILLED_FIELDS });
  };

  // ── Name selected: fetch party details and fill both sides ───────────────
  const handlePartyNameSelect = async (
    _: string,
    option: PartyOption | null
  ) => {
    if (!option?.value) {
      onFormChange({ ...PARTY_FILLED_FIELDS });
      return;
    }

    // Optimistic name update immediately
    onFormChange({ partyName: option.label });

    // Shareholder / Employee → no getPartyDetails call
    if (partyType !== "Supplier" && partyType !== "Customer") return;

    const details = await fetchPartyDetails(option.value, partyType);

    // Silent fail — don't wipe already-filled fields
    if (!details) return;

    if (paymentType === "Pay") {
      // PAY:
      // glFrom + currencyFrom → company_ledger (mode will overwrite this later)
      // glTo   + currencyTo   → party_ledger (mode does NOT touch this side)
      onFormChange({
        partyName: details.partyName || option.label,
        glFrom: details.companyLedgerAccount,
        currencyFrom: details.companyLedgerCurrency,
        glTo: details.partyLedgerAccount,
        currencyTo: details.partyAccountCurrency,
        companyBankAccount: details.companyBankAccount,
        partyBankAccount: details.partyBankAccount,
      });
    } else if (paymentType === "Receive") {
      // RECEIVE:
      // glFrom + currencyFrom → party_ledger (mode does NOT touch this side)
      // glTo   + currencyTo   → company_ledger (mode will overwrite this later)
      onFormChange({
        partyName: details.partyName || option.label,
        glFrom: details.partyLedgerAccount,
        currencyFrom: details.partyAccountCurrency,
        glTo: details.companyLedgerAccount,
        currencyTo: details.companyLedgerCurrency,
        companyBankAccount: details.companyBankAccount,
        partyBankAccount: details.partyBankAccount,
      });
    } else {
      // Internal Transfer: party_ledger → From, company_ledger → To
      onFormChange({
        partyName: details.partyName || option.label,
        glFrom: details.partyLedgerAccount,
        currencyFrom: details.partyAccountCurrency,
        glTo: details.companyLedgerAccount,
        currencyTo: details.companyLedgerCurrency,
        companyBankAccount: details.companyBankAccount,
        partyBankAccount: details.partyBankAccount,
      });
    }
  };

  return (
    <div className="space-y-6">

      {/* Row 1 — Payment Type, Party Type, Name, Date */}
      <div className="grid grid-cols-4 gap-4">
        <ModalSelect
          label="Payment Type"
          name="paymentType"
          value={form.paymentType}
          onChange={onChange}
          options={[
            { label: "Pay", value: "Pay" },
            { label: "Receive", value: "Receive" },
            { label: "Internal Transfer", value: "Internal Transfer" },
          ]}
        />

        <ModalSelect
          label="Party Type"
          name="partyType"
          value={form.partyType}
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
          disabled={!partyType || isLoadingParties}
          onChange={handlePartyNameSelect}
          fetchOptions={(q): Promise<PartyOption[]> => {
            const query = q.toLowerCase();
            return Promise.resolve(
              partyOptions.filter((p) =>
                (p.label || "").toLowerCase().includes(query)
              )
            );
          }}
        />

        <ModalInput
          label="Date"
          type="date"
          name="date"
          value={form.date}
          onChange={onChange}
        />
      </div>

      {/* Row 2 — Mode of Payment, Amount */}
      <div className="grid grid-cols-3 gap-4">
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
        <ModalInput
          label="Cheque / Reference Date"
          type="date"
          name="referenceDate"
          value={form.referenceDate}
          onChange={onChange}
        />

      </div>


      {/* Row 3 — From / To Accounts */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="grid grid-cols-2 px-6 py-3 font-semibold text-gray-700 border-b bg-gradient-to-r from-gray-50 to-gray-100">
          <div>Paid From</div>
          <div>Paid To</div>
        </div>

        <div className="grid grid-cols-[1fr_90px_1fr] gap-x-6 gap-y-4 p-6 items-center">

          {/* Bank Account */}
          <ModalInput
            label="Bank Account"
            name="companyBankAccount"
            value={form.companyBankAccount ?? ""}
            onChange={onChange}
          />

          <div className="flex justify-center items-center text-gray-300">→</div>

          <ModalInput
            label="Bank Account"
            name="partyBankAccount"
            value={form.partyBankAccount ?? ""}
            onChange={onChange}
          />


          {/* Account Paid */}
          <ModalInput
            label="Account Paid"
            name="glFrom"
            value={form.glFrom ?? ""}
            onChange={onChange}
          />

          <div className="flex justify-center items-center text-gray-400">→</div>

          <ModalInput
            label="Account Paid"
            name="glTo"
            value={form.glTo ?? ""}
            onChange={onChange}
          />


          {/* Currency */}
          <ModalInput
            label="Account Currency"
            name="currencyFrom"
            value={form.currencyFrom ?? ""}
            onChange={onChange}
          />

          <div className="flex justify-center items-center text-gray-300">→</div>

          <ModalInput
            label="Account Currency"
            name="currencyTo"
            value={form.currencyTo ?? ""}
            onChange={onChange}
          />


          {/* Amount + Exchange Rate (🔥 MAIN FIX) */}
          <ModalInput
            label="Amount"
            name="amountFrom"
            type="number"
            value={form.amountFrom ?? ""}
            onChange={onChange}
            className="no-spinner"
          />

          <div className="flex flex-col items-center gap-1">
           <div className="flex justify-center items-center text-gray-300">→</div>

            <ModalInput
              label="Exch. Rate"
              name="exchangeRate"
              type="number"
              value={form.exchangeRate ?? ""}
              onChange={onChange}
              className="no-spinner text-center w-[80px]"
            />
          </div>

          <ModalInput
            label="Amount"
            name="amountTo"
            type="number"
            value={form.amountTo ?? ""}
            onChange={onChange}
            className="no-spinner"
          />

        </div>
      </div>


      {/* Loading indicator */}
      {isLoadingDetails && (
        <p className="text-xs text-muted animate-pulse">
          Fetching party details...
        </p>
      )}
    </div>
  );
};

export default PaymentDetailsTab;