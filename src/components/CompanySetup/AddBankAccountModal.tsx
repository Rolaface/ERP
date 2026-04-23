import React, { useEffect, useState } from "react";
import { MinimizableModal } from "../common/MinimizableModal";
import { Button } from "../ui/modal/formComponent";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
import { Building2 } from "lucide-react";
import { useBankAccLogic } from "./Usebankacclogic";
import DatePickerInput from "../calendar/DatePickerInput";
import SearchSelect2 from "../ui/modal/SearchSelect";
import { BankAccount } from "../../types/BankAccount/bank";
import { fetchCurrencyOptions } from "../../utils/currencyOptions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  defaultAccountFor?: AccountType;
  modalId: string;
  partyName?: string;
  initialData?: BankAccount | null;
  currency?: string;
  customerId?: string;
  partyId?: string;
}

type Option = {
  label: string;
  value: string;
  meta?: Record<string, any>;
};

type AccountType = "Supplier" | "Customer" | "Company" | "Bank";

const AddBankAccountModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultAccountFor,
  partyName,
  initialData,
  currency,
  modalId,
  partyId,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const {
    form,
    setForm,
    handleChange,
    handleSubmit,
    handleReset,
    banks,
    entities,
    reportingAccounts,
    isCompany,
    isSubmitting,
  } = useBankAccLogic({ onSubmit, onClose });

  useEffect(() => {
    if (!initialData && defaultAccountFor) {
      setForm((prev) => ({ ...prev, accountFor: defaultAccountFor }));
    }
    if (currency) {
      setForm((prev) => ({ ...prev, currency }));
    }
  }, [defaultAccountFor, initialData, currency]);

  // Effect 2 — set name/holder once entities are loaded
  useEffect(() => {
    if (!partyName || !defaultAccountFor || initialData) return;

    if (defaultAccountFor === "Company") {
      setForm((prev) => ({
        ...prev,
        partyId: partyName,
        name: partyName,
        displayName: partyName,
        accountHolder: prev.accountHolderEdited
          ? prev.accountHolder
          : partyName,
        accountHolderEdited: false,
      }));
      return;
    }

    if (!entities.length) return;

    const match = entities.find((e) => e.value === partyId);

    setForm((prev) => ({
      ...prev,
      partyId: match?.value || partyId || "",
      name: match?.value || partyId || "",
      displayName: match?.label || partyName,
      accountHolder: prev.accountHolderEdited
        ? prev.accountHolder
        : (match?.label ?? match?.value ?? partyName),
      currency: prev.currency || currency || match?.meta?.currency || "",
      accountHolderEdited: false,
    }));
  }, [partyName, defaultAccountFor, entities, initialData, currency]);
  
  const clearError = (field: string) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.accountFor) e.accountFor = "Account For is required";
    if (!form.name && !form.partyId) e.name = "Name is required";
    if (!form.bank) e.bank = "Bank is required";
    if (!form.accountNumber) e.accountNumber = "Account Number is required";
    if (!form.sortCode) e.sortCode = "IFSC / Sort Code is required";
    if (!form.currency) e.currency = "Currency is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = (e: any) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;
    handleSubmit(e);
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
        <Button
          variant="primary"
          type="button"
          onClick={onSave}
          disabled={isSubmitting}
          className={isSubmitting ? "opacity-60 cursor-not-allowed" : ""}
        >
          {isSubmitting ? "Saving..." : "Save Account"}
        </Button>
      </div>
    </>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      title="Add Bank Account"
      subtitle="Configure bank account for Companies or parties"
      icon={Building2}
      footer={footer}
      customWidth="60vw"
      height="65vh"
    >
      <form
        id="bankForm"
        onSubmit={handleSubmit}
        className="h-full overflow-hidden"
      >
        <div className="h-full overflow-y-auto p-8">
          <div className="grid grid-cols-3 gap-5">
            {/* Date */}
            <div className="w-[110px]">
              <DatePickerInput
                label="Date of Addition"
                name="dateAdded"
                value={form.dateAdded}
                onChange={(name, value) =>
                  setForm((prev) => ({ ...prev, [name]: value }))
                }
              />
            </div>

            {/* Account For */}
            <ModalSelect
              label="Account For"
              name="accountFor"
              value={form.accountFor}
              onChange={(e) => {
                handleChange(e);
                clearError("accountFor");
              }}
              options={[
                { label: "Supplier", value: "Supplier" },
                { label: "Customer", value: "Customer" },
                { label: "Company", value: "Company" },
              ]}
              required
              disabled={!!defaultAccountFor}
              error={errors.accountFor}
            />

            {/* Name */}
            <div className="flex flex-col gap-1">
              <SearchSelect2
                label="Name"
                value={form.displayName}
                disabled={
                  !form.accountFor ||
                  form.accountFor === "Company" ||
                  !!defaultAccountFor
                }
                onChange={(_, option: Option) => {
                  setForm((prev) => ({
                    ...prev,
                    partyId: option?.value || "",
                    name: option?.value || "",
                    displayName: option?.label || "",
                    accountHolder: option?.label || "",
                    currency: option?.meta?.currency || prev.currency,
                    accountHolderEdited: false,
                  }));
                  clearError("name");
                }}
                fetchOptions={(q): Promise<Option[]> => {
                  const query = q.toLowerCase();
                  return Promise.resolve(
                    entities.filter((item) =>
                      item.label.toLowerCase().includes(query),
                    ),
                  );
                }}
                required
              />
              {/* ← error for Name was missing */}
              {errors.name && (
                <span className="text-danger text-[10px]">{errors.name}</span>
              )}
            </div>

            {/* Bank */}
            <div className="flex flex-col gap-1">
              <SearchSelect2
                label="Bank"
                value={form.bank}
                onChange={(_: string, option: Option) => {
                  setForm((prev) => ({
                    ...prev,
                    bank: option?.value || "",
                    swiftCode: option?.meta?.swiftCode || "",
                  }));
                  clearError("bank");
                }}
                fetchOptions={(q): Promise<Option[]> => {
                  const query = q.toLowerCase();
                  return Promise.resolve(
                    banks.filter((b) => b.label.toLowerCase().includes(query)),
                  );
                }}
                required
              />
              {/* ← error for Bank was missing */}
              {errors.bank && (
                <span className="text-danger text-[10px]">{errors.bank}</span>
              )}
            </div>

            {/* Swift Code — read only, auto filled from bank */}
            <ModalInput
              label="SWIFT Code"
              name="swiftCode"
              value={form.swiftCode}
              disabled
            />

            {/* Currency */}
            <div className="flex flex-col gap-1">
              <SearchSelect2
                label="Currency"
                value={form.currency}
                disabled={!!defaultAccountFor}
                onChange={(_: string, option: Option) => {
                  setForm((prev) => ({
                    ...prev,
                    currency: option?.value || "",
                  }));
                  clearError("currency");
                }}
                fetchOptions={fetchCurrencyOptions}
              />
              {/* ← error for Currency was missing */}
              {errors.currency && (
                <span className="text-danger text-[10px]">
                  {errors.currency}
                </span>
              )}
            </div>

            {/* Account Number */}
            <ModalInput
              label="Account Number"
              name="accountNumber"
              value={form.accountNumber}
              onChange={(e) => {
                handleChange(e);
                clearError("accountNumber");
              }}
              required
              error={errors.accountNumber}
            />

            {/* Account Holder */}
            <ModalInput
              label="Account Holder Name"
              name="accountHolder"
              value={form.accountHolder}
              onChange={handleChange}
            />

            {/* IBAN */}
            <ModalInput
              label="IBAN"
              name="iban"
              value={form.iban}
              onChange={handleChange}
            />

            {/* Sort Code */}
            <ModalInput
              label="IFSC / Sort Code"
              name="sortCode"
              value={form.sortCode}
              onChange={(e) => {
                handleChange(e);
                clearError("sortCode");
              }}
              required
              error={errors.sortCode}
            />

            {/* Branch Address */}
            <div className="col-span-2 w-full">
              <ModalInput
                label="Branch Address"
                name="address"
                value={form.address}
                onChange={handleChange}
              />
            </div>

            {/* Reporting Account — Company only */}
            {isCompany && (
              <SearchSelect2
                label="Reporting Account"
                value={form.reportingAccount}
                onChange={(_: string, option: Option) =>
                  setForm((prev) => ({
                    ...prev,
                    reportingAccount: option?.value || "",
                  }))
                }
                fetchOptions={(q): Promise<Option[]> => {
                  const query = q.toLowerCase();
                  return Promise.resolve(
                    reportingAccounts.filter((acc) =>
                      acc.label.toLowerCase().includes(query),
                    ),
                  );
                }}
              />
            )}

            {/* Default checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isDefault: e.target.checked }))
                }
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-main">Default Bank Account</span>
            </label>
          </div>
        </div>
      </form>
    </MinimizableModal>
  );
};

export default AddBankAccountModal;
