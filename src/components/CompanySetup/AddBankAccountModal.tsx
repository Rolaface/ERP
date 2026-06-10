import React, { useEffect, useState } from "react";
import { MinimizableModal } from "../common/MinimizableModal";
import { Button } from "../ui/modal/formComponent";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
import { Landmark } from "lucide-react";
import { useBankAccLogic } from "./Usebankacclogic";
import DatePickerInput from "../calendar/DatePickerInput";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import { Option } from "../ui/modal/SearchSelect2"
import { BankAccount } from "../../types/BankAccount/bank";
import { fetchCurrencyOptions } from "../../utils/currencyOptions";
import { getBankAccountById ,getBankAccounts } from "../../api/BankAccountApi";
import { showApiError } from "../../utils/alert";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";

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
  isViewMode?: boolean;

}


type AccountType = "Supplier" | "Customer" | "Company" | "Bank" | "Employee";

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
  isViewMode = false,

}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { markDirty, resetDirty, handleCloseWithConfirm, containerRef } =
    useUnsavedChanges();
  const {
    form,
    setForm,
    handleChange,
    handleSubmit,
    handleReset,
    banks,
    entities,
    isCompany,
    isSubmitting,
    handleAccountForChange,
  } = useBankAccLogic({ onSubmit, onClose, isEdit: !!initialData });

  const handleClose = () => {
    resetDirty();
    onClose();
  };

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

  useEffect(() => {
    if (!initialData?.id) return;

    const load = async () => {
      try {
        const data = await getBankAccountById(String(initialData.id));
        if (!data) return;

        setForm((prev) => ({
          ...prev,
          dateAdded: data.dateAdded || prev.dateAdded,
          accountFor: data.accountFor || prev.accountFor,
          name: data.partyName || "",
          partyId: data.partyName || "",
          displayName: data.partyName || "",
          bank: data.bank || "",
          swiftCode: data.swiftNumber || "",
          currency: data.currency || "",
          accountNumber: data.bank_account_no || "",
          accountHolder: data.accountHolderName || "",
          sortCode: data.branch_code || "",
          iban: data.iban || "",
          isDefault: Number(data.is_default) === 1,
          isDisabled: Number(data.disabled) === 1,
          reportingAccount: data.ledgerAccount || "",
        }));
      } catch (err) {
        showApiError(err);
      }
    };

    load();
  }, [initialData?.id]);

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
    // if (!form.currency) e.currency = "Currency is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = (e: any) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;
    handleSubmit(e);
  };

  const footer = isViewMode ? (
    <Button variant="secondary" onClick={handleClose}>
      Close
    </Button>
  ) : (
    <>
      <Button
        variant="secondary"
        onClick={() => handleCloseWithConfirm(handleClose, modalId)}
      >
        Cancel
      </Button>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            handleReset();
            resetDirty();
          }}
        >
          Reset
        </Button>

        <Button
          variant="primary"
          type="button"
          onClick={onSave}
          disabled={isSubmitting}
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
      onClose={() =>
        isViewMode ? handleClose() : handleCloseWithConfirm(handleClose, modalId)
      }
      title="Create Bank Account"
      subtitle="Configure bank account for Companies or parties"
      icon={Landmark}
      footer={footer}
      customWidth="60vw"
      height="65vh"
      formContainerRef={containerRef}
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
                disabled={isViewMode}

                value={form.dateAdded}
                onChange={(name, value) => {
                  markDirty();
                  setForm((prev) => ({ ...prev, [name]: value }));
                }
                }
              />
            </div>



            {/* Account For */}
            <div className="flex flex-col text-sm min-w-0">
              <span className="block text-[10px] font-medium text-main mb-1">
                Account For
                <span className="text-danger">*</span>
              </span>
              <select
                name="accountFor"
                disabled={isViewMode || !!defaultAccountFor}
                value={form.accountFor}
                onChange={(e) => {
                  const value = e.target.value;
                  console.log("[plain select] onChange value:", value);
                  if (!value) return;
                  markDirty();
                  handleAccountForChange(value as AccountType);
                  clearError("accountFor");
                }}
                className={`py-1 px-2 border rounded text-[11px] text-main bg-card transition-all w-auto min-w-0 ${errors.accountFor
                  ? "border-danger"
                  : isViewMode || !!defaultAccountFor
                    ? "bg-app cursor-not-allowed opacity-60 border-theme"
                    : "border-[var(--border)] hover:border-primary/40"
                  }`}
              >
                <option value="" disabled>Select</option>
                <option value="Supplier">Supplier</option>
                <option value="Customer">Customer</option>
                <option value="Company">Company</option>
                <option value="Employee">Employee</option>
              </select>
              {errors.accountFor && (
                <span className="text-danger text-[10px] mt-1">{errors.accountFor}</span>
              )}
            </div>

            {/* Name */}
            <div className="flex flex-col gap-1">
              <SearchSelect2
                label="Name"
                value={form.displayName}
                disabled={
                  isViewMode ||
                  !form.accountFor ||
                  form.accountFor === "Company" ||
                  !!defaultAccountFor
                }
                onChange={(_, option: Option) => {
                  markDirty();
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
                disabled={isViewMode}

                onChange={(_: string, option: Option) => {
                  markDirty();
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
                disabled={isViewMode || !!defaultAccountFor}

                onChange={(_: string, option: Option) => {
                  markDirty();
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
              disabled={isViewMode}
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
              disabled={isViewMode}
              value={form.accountHolder}
              onChange={handleChange}
            />

            {/* IBAN */}
            <ModalInput
              label="IBAN"
              disabled={isViewMode}
              name="iban"
              value={form.iban}
              onChange={handleChange}
            />

            {/* Sort Code */}
            <ModalInput
              label="IFSC / Sort Code"
              disabled={isViewMode}
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
            {/* <div className="col-span-2 w-full">
              <ModalInput
                label="Branch Address"
                disabled={isViewMode}
                name="address"
                value={form.address}
                onChange={handleChange}
              />
            </div> */}

            {/* Reporting Account — Company only */}
            {isCompany && (
              <SearchSelect2
                label="Reporting Account"
                value={form.reportingAccount}
                required
                onChange={(_: string, option: Option) => {
                  markDirty();
                  setForm((prev) => ({
                    ...prev,
                    reportingAccount: option?.value || "",
                  }));
                }}
                fetchOptions={async (q): Promise<Option[]> => {
                  const data = await getBankAccounts("Account");
                  const list = Array.isArray(data) ? data : [];
                  if (!q) return list;
                  return list.filter((acc) =>
                    acc.label.toLowerCase().includes(q.toLowerCase())
                  );
                }}
              />
            )}

            {/* Default checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => {
                  markDirty();
                  setForm((p) => ({ ...p, isDefault: e.target.checked }));
                }
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