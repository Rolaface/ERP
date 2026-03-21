import React, { useEffect, useMemo } from "react";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
import SearchSelect2 from "../ui/modal/SearchSelect";
import { MoveRight } from "lucide-react";
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
  onSettleInvoice?: () => void; // callback to switch to invoices tab
}

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
  onSettleInvoice,
}) => {
  const { options: modeOptions, isLoading: modesLoading } = usePaymentModes();
  const { fetchPartyDetails, isLoadingDetails } = usePartyDetails();

  const paymentType: "Pay" | "Receive" | "Internal Transfer" = form.paymentType || "Pay";
  const partyType: "Supplier" | "Customer" | "Shareholder" | "Employee" | "" = form.partyType || "";
  const { partyOptions, isLoadingParties } = usePartyOptions(partyType);

  const selectedMode = useMemo(() => {
    if (!form.mode) return null;
    return modeOptions.find((opt) => opt.value === form.mode) ?? null;
  }, [form.mode, modeOptions]);

  useEffect(() => {
    if (!selectedMode) {
      if (paymentType === "Pay") onFormChange({ glFrom: "", currencyFrom: "" });
      else if (paymentType === "Receive") onFormChange({ glTo: "", currencyTo: "" });
      else onFormChange({ glFrom: "", currencyFrom: "", glTo: "", currencyTo: "" });
      return;
    }
    if (paymentType === "Pay")
      onFormChange({ glFrom: selectedMode.defaultAccount, currencyFrom: selectedMode.currency });
    else if (paymentType === "Receive")
      onFormChange({ glTo: selectedMode.defaultAccount, currencyTo: selectedMode.currency });
    else
      onFormChange({ glFrom: "", currencyFrom: "", glTo: "", currencyTo: "" });
  }, [selectedMode, paymentType]);

  const handlePartyTypeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange(e);
    onFormChange({ ...PARTY_FILLED_FIELDS });
  };

  const handlePartyNameSelect = async (_: string, option: PartyOption | null) => {
    if (!option?.value) { onFormChange({ ...PARTY_FILLED_FIELDS }); return; }
    onFormChange({ partyName: option.label });
    if (partyType !== "Supplier" && partyType !== "Customer") return;
    const details = await fetchPartyDetails(option.value, partyType);
    if (!details) return;
    if (paymentType === "Pay") {
      onFormChange({
        partyName: details.partyName || option.label,
        glFrom: details.companyLedgerAccount, currencyFrom: details.companyLedgerCurrency,
        glTo: details.partyLedgerAccount, currencyTo: details.partyAccountCurrency,
        companyBankAccount: details.companyBankAccount, partyBankAccount: details.partyBankAccount,
      });
    } else if (paymentType === "Receive") {
      onFormChange({
        partyName: details.partyName || option.label,
        glFrom: details.partyLedgerAccount, currencyFrom: details.partyAccountCurrency,
        glTo: details.companyLedgerAccount, currencyTo: details.companyLedgerCurrency,
        companyBankAccount: details.companyBankAccount, partyBankAccount: details.partyBankAccount,
      });
    } else {
      onFormChange({
        partyName: details.partyName || option.label,
        glFrom: details.partyLedgerAccount, currencyFrom: details.partyAccountCurrency,
        glTo: details.companyLedgerAccount, currencyTo: details.companyLedgerCurrency,
        companyBankAccount: details.companyBankAccount, partyBankAccount: details.partyBankAccount,
      });
    }
  };

  const handleAmountToChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange(e);
    onFormChange({ amount: (e as React.ChangeEvent<HTMLInputElement>).target.value });
  };

  const handleSettleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    onFormChange({ settleInvoice: checked });
    if (checked && onSettleInvoice) {
      onSettleInvoice(); // switch to invoices tab
    }
  };

  return (
    <div className="space-y-5">

      {/* Row 1 — 4 cols but max-w constrained */}
      <div className="grid grid-cols-4 gap-3">
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
            return Promise.resolve(partyOptions.filter((p) => (p.label || "").toLowerCase().includes(query)));
          }}
        />
        <ModalInput label="Date" type="date" name="date" value={form.date} onChange={onChange} />
      </div>

      {/* Row 2 — 3 cols */}
      <div className="grid grid-cols-4 gap-3">
        <ModalSelect
          label="Mode of Payment"
          name="mode"
          value={form.mode ?? ""}
          onChange={onChange}
          options={modesLoading ? [{ label: "Loading...", value: "" }] : modeOptions.map((o) => ({ label: o.label, value: o.value }))}
        />
        <ModalInput label="Cheque / Reference No" name="referenceNo" value={form.referenceNo} onChange={onChange} />
        <ModalInput label="Cheque / Reference Date" type="date" name="referenceDate" value={form.referenceDate} onChange={onChange} />
      </div>

      {/* From / To box */}
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">

        {/* Header */}
        <div className="grid grid-cols-2 bg-[var(--row-hover)] border-b border-[var(--border)]">
          <div className="px-5 py-2.5 text-xs font-semibold text-main border-r border-[var(--border)]">Paid From</div>
          <div className="px-5 py-2.5 text-xs font-semibold text-main">Paid To</div>
        </div>

        {/* Two columns */}
        <div className="relative grid grid-cols-2">

          {/* Single centered arrow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10
                          flex items-center justify-center
                          w-8 h-8 rounded-full bg-card border border-[var(--border)] shadow-sm">
            <MoveRight size={14} className="text-primary" />
          </div>

          {/* LEFT */}
          <div className="border-r border-[var(--border)] px-5 py-4 space-y-3">
            <ModalInput label="Bank Account" name="companyBankAccount" value={form.companyBankAccount ?? ""} onChange={onChange} />
            <ModalInput label="Account Paid" name="glFrom" value={form.glFrom ?? ""} onChange={onChange} />
            <div className="w-40">
              <ModalInput label="Account Currency" name="currencyFrom" value={form.currencyFrom ?? ""} onChange={onChange} />
            </div>
          </div>

          {/* RIGHT */}
          <div className="px-5 py-4 space-y-3">
            <ModalInput label="Bank Account" name="partyBankAccount" value={form.partyBankAccount ?? ""} onChange={onChange} />
            <ModalInput label="Account Paid" name="glTo" value={form.glTo ?? ""} onChange={onChange} />
            <div className="w-40">
              <ModalInput label="Account Currency" name="currencyTo" value={form.currencyTo ?? ""} onChange={onChange} />
            </div>
          </div>
        </div>

        {/* Amount | Exch. Rate | Amount */}
        <div className="border-t border-[var(--border)] px-5 py-4">
          <div className="grid grid-cols-[1fr_80px_1fr] items-end gap-x-4">
            <ModalInput
              label="Amount"
              name="amountFrom"
              type="number"
              value={form.amountFrom ?? ""}
              onChange={onChange}
              className="no-spinner"
            />
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted">Exch. Rate</span>
              <input
                type="number"
                name="exchangeRate"
                value={form.exchangeRate ?? ""}
                onChange={onChange as any}
                placeholder="1"
                className="w-full px-2 py-[7px] text-xs border border-[var(--border)] rounded bg-card focus:outline-none focus:ring-1 focus:ring-primary text-center no-spinner"
              />
            </div>
            <ModalInput
              label="Amount"
              name="amountTo"
              type="number"
              value={form.amountTo ?? ""}
              onChange={handleAmountToChange}
              className="no-spinner"
            />
          </div>
        </div>

      </div>

      {/* Settle Invoice toggle — below amount row, right aligned */}
      <div className="flex justify-end">
        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
          <span className="text-xs font-medium text-main">Settle against invoice</span>
          <div className="relative">
            <input
              type="checkbox"
              checked={!!form.settleInvoice}
              onChange={handleSettleToggle}
              className="sr-only peer"
            />
            <div className="w-8 h-4 rounded-full bg-[var(--border)] peer-checked:bg-primary transition-colors duration-200" />
            <div className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4" />
          </div>
        </label>
      </div>

      {isLoadingDetails && (
        <p className="text-xs text-muted animate-pulse">Fetching party details...</p>
      )}
    </div>
  );
};

export default PaymentDetailsTab;