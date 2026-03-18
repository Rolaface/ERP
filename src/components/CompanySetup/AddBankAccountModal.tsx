import React from "react";
import Modal from "../ui/modal/modal";
import { Button, Input, Select } from "../ui/modal/formComponent";
import { Building2, CreditCard, Star } from "lucide-react";
import DatePickerInput from "../calendar/DatePickerInput";
import { useBankAccLogic } from "./Usebankacclogic";
import type { BankAccount } from "../../types/company";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newAccount: BankAccount) => void;

}

// ─── Section heading ──────────────────────────────────────────────────────────
const SectionHeading: React.FC<{
  icon: React.ReactNode;
  title: string;
}> = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-5">
    <span className="text-primary">{icon}</span>
    <div>
      <p className="text-sm font-semibold text-main leading-tight">{title}</p>
    </div>
  </div>
);

// ─── Checkbox row ─────────────────────────────────────────────────────────────
const CheckRow: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}> = ({ checked, onChange, label, hint }) => (
  <label className="flex items-start gap-2.5 cursor-pointer select-none group">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 w-4 h-4 accent-primary rounded shrink-0"
    />
    <span>
      <span className="block text-sm font-medium text-main leading-tight group-hover:text-primary transition-colors">
        {label}
      </span>
      {hint && (
        <span className="block text-[11px] text-muted mt-0.5">{hint}</span>
      )}
    </span>
  </label>
);

// ─── Date picker sx ───────────────────────────────────────────────────────────
const DATE_SX = {
  width: "100%",
  "& .MuiOutlinedInput-root": {
    height: "42px",
    borderRadius: "8px",
    backgroundColor: "transparent",
  },
  "& .MuiOutlinedInput-input": { padding: "10px 12px", fontSize: "14px" },
  "& fieldset": { borderColor: "#d1d5db" },
  "&:hover fieldset": { borderColor: "#9ca3af" },
};

// ═══════════════════════════════════════════════════════════════════════════════
const AddBankAccountModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
 
}) => {
  const {
    form,
    isCompanyAccount,
    isDefaultAccount,
    isDisabled,
    partyType,
    party,
    bankOptions,
    accountOptions,
    handleChange,
    handleDateChange,
    handleReset,
    handleSubmit,
    setIsCompanyAccount,
    setIsDefaultAccount,
    setIsDisabled,
    setPartyType,
    setParty,
    companyName
  } = useBankAccLogic({ onSubmit, onClose });

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
        <Button variant="primary" type="submit" form="bankAccountForm">
          Save Account
        </Button>
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Bank Account"
      subtitle="Configure account for transactions & sync"
      icon={Building2}
      footer={footer}
      maxWidth="full"
      height="85vh"
    >
      <form id="bankAccountForm" onSubmit={handleSubmit} className="h-full">
        {/* ── Two-column layout, NO border between them ── */}
        <div className="grid grid-cols-2 max-h-[75vh] overflow-y-auto">
          {/* ════ LEFT COLUMN ════════════════════════════════════════════════ */}
          <div className="p-8 space-y-8 border-r border-theme/40">
            {/* Account Configuration */}
            <section>
              <SectionHeading
                icon={<Star className="w-4 h-4" />}
                title="Account Configuration"
              />
              <div className="space-y-5">
                <Select
                  label="Account Name"
                  name="accountName"
                  value={form.accountName}
                  onChange={handleChange}
                  required
                  options={accountOptions}
                />
                <Select
                  label="Bank"
                  name="bankName"
                  value={form.bankName}
                  onChange={handleChange}
                  required
                  options={bankOptions}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Account Type"
                    name="accountType"
                    value={form.accountType ?? ""}
                    onChange={handleChange}
                    options={[
                      { value: "current", label: "Current" },
                      { value: "savings", label: "Savings" },
                      { value: "loan", label: "Loan" },
                    ]}
                  />
                  <Select
                    label="Account Subtype"
                    name="accountSubtype"
                    value={form.accountSubtype ?? ""}
                    onChange={handleChange}
                    options={[
                      { value: "primary", label: "Primary" },
                      { value: "secondary", label: "Secondary" },
                    ]}
                  />
                </div>
              </div>
            </section>

            {/* Account Details */}
            <section>
              <SectionHeading
                icon={<CreditCard className="w-4 h-4" />}
                title="Account Details"
              />
              <div className="space-y-4">
                {/* IBAN full-width left | Branch Code right aligned with it */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="IBAN"
                    name="iban"
                    value={form.iban ?? ""}
                    onChange={handleChange}
                  />
                  <Input
                    label="Branch Code"
                    name="sortCode"
                    value={form.sortCode ?? ""}
                    onChange={handleChange}
                  />
                </div>
                {/* Bank Account No — right-aligned under Branch Code */}
                <div className="grid grid-cols-2 gap-4">
                  <div /> {/* empty left cell to keep alignment */}
                  <Input
                    label="Bank Account No"
                    name="accountNo"
                    value={form.accountNo}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </section>
          </div>

          {/* ════ RIGHT COLUMN ═══════════════════════════════════════════════ */}
          <div className="p-8 space-y-8">
            {/* Account Options */}
            <section>
              <SectionHeading
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                }
                title="Account Options"
              />
              <div className="space-y-4">
                <CheckRow
                  checked={isDisabled}
                  onChange={setIsDisabled}
                  label="Disabled"
                  hint="Deactivate without deleting"
                />
                <CheckRow
                  checked={isDefaultAccount}
                  onChange={setIsDefaultAccount}
                  label="Is Default Account"
                  hint="Auto used in payments"
                />
                <div className="space-y-1">
                  <CheckRow
                    checked={isCompanyAccount}
                    onChange={setIsCompanyAccount}
                    label="Is Company Account"
                  />
                  <p className="text-[11px] text-muted pl-6 leading-snug">
                    Setting the account as a Company Account is necessary for
                    Bank Reconciliation
                  </p>
                </div>

                {/* Company field — only when Is Company Account checked */}
                {isCompanyAccount && (
                  <div className="pl-0 pt-1">
                    <label className="block text-sm font-medium text-main mb-1.5">
                      Company
                    </label>
                    <div className="px-3 py-2.5 rounded-lg border border-theme bg-app/60 text-sm text-main min-h-[42px] flex items-center">
                      <div>
                        <p className="text-xs text-muted">Company</p>
                        <p className="text-sm font-medium text-main">
                          {companyName || "Loading..."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Party Details — only when Is Company Account NOT checked */}
                {!isCompanyAccount && (
                  <div className="pt-2 space-y-4">
                    <p className="text-xs font-semibold text-muted uppercase tracking-widest">
                      Party Details
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        label="Party Type"
                        name="partyType"
                        value={partyType}
                        onChange={(e) => setPartyType(e.target.value)}
                        options={[
                          { value: "customer", label: "Customer" },
                          { value: "supplier", label: "Supplier" },
                          { value: "employee", label: "Employee" },
                        ]}
                      />
                      <Input
                        label="Party"
                        name="party"
                        value={party}
                        onChange={(e) => setParty(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Integration Details */}
            <section>
              <SectionHeading
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                }
                title="Integration Details"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-main mb-1.5">
                    Date Added
                  </label>
                  <DatePickerInput
                    name="dateAdded"
                    value={form.dateAdded}
                    onChange={handleDateChange}
                    sx={DATE_SX}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddBankAccountModal;
