import React, { useEffect, useState } from "react";
import Modal from "../ui/modal/modal";
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
  partyName?: string;
  initialData?: BankAccount | null;
  currency?: string;
   customerId?:string;
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
  customerId
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
    if (currency) {
      setForm((prev) => ({
        ...prev,
        currency: currency,
      }));
    }
  }, [currency]);

  useEffect(() => {
    if (!initialData && defaultAccountFor) {
      setForm((prev) => ({
        ...prev,
        accountFor: defaultAccountFor,
      }));
    }

    if (partyName) {
      if (defaultAccountFor === "Company") {
        setForm((prev) => ({
          ...prev,
          name: partyName,
          displayName: partyName,
          accountHolder: partyName,
          currency: prev.currency || currency || "",
          accountHolderEdited: false,
        }));
      } else if (entities.length) {
        const match = entities.find((e) => e.value === partyName);

        setForm((prev) => ({
          ...prev,
          name: match?.value || partyName,
          displayName: match?.label || partyName,
          accountHolder: match?.label || partyName,
          currency: prev.currency || currency || match?.meta?.currency || "",
          accountHolderEdited: false,
        }));
      }
    }
  }, [defaultAccountFor, partyName, entities, initialData, currency]);

  const validate = () => {
    const e: Record<string, string> = {};

    if (!form.accountFor) e.accountFor = "Required";
    if (!form.name) e.name = "Required";
    if (!form.bank) e.bank = "Required";
    if (!form.accountNumber) e.accountNumber = "Required";
    if (!form.sortCode) e.sortCode = "Required";
    if (!form.currency) e.currency = "Required";

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Bank Account"
      subtitle="Configure  bank  account for Companies or parties"
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
            <ModalSelect
              label="Account For"
              name="accountFor"
              value={form.accountFor}
              onChange={handleChange}
              options={[
                { label: "Supplier", value: "Supplier" },
                { label: "Customer", value: "Customer" },
                { label: "Company", value: "Company" },
              ]}
              required
              disabled={!!defaultAccountFor}
              error={errors.accountFor}
            />

            <SearchSelect2
              label="Name"
              value={form.displayName}
              disabled={
                !form.accountFor ||
                form.accountFor === "Company" ||
                !!defaultAccountFor
              }
              onChange={(_, option: Option) =>
                setForm((prev) => ({
                  ...prev,
                  name: option?.value || "", // backend
                  displayName: option?.label || "", // UI
                  accountHolder: option?.label || "",
                  currency: option?.meta?.currency || prev.currency,
                  accountHolderEdited: false,
                }))
              }
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

            <SearchSelect2
              label="Bank"
              value={form.bank}
              onChange={(_: string, option: Option) => {
                setForm((prev) => ({
                  ...prev,
                  bank: option?.value || "",
                  swiftCode: option?.meta?.swiftCode || "",
                }));
              }}
              fetchOptions={(q): Promise<Option[]> => {
                const query = q.toLowerCase();
                return Promise.resolve(
                  banks.filter((b) => b.label.toLowerCase().includes(query)),
                );
              }}
              required
            />
            <ModalInput
              label="SWIFT Code"
              name="swiftCode"
              value={form.swiftCode}
              disabled
            />

            <SearchSelect2
              label="Currency"
              value={form.currency}
              disabled={!!defaultAccountFor}
              onChange={(_: string, option: Option) =>
                setForm((prev) => ({ ...prev, currency: option?.value || "" }))
              }
              fetchOptions={fetchCurrencyOptions}
            />

            <ModalInput
              label="Account Number"
              name="accountNumber"
              value={form.accountNumber}
              onChange={handleChange}
              required
              error={errors.accountNumber}
            />

            <ModalInput
              label="Account Holder Name"
              name="accountHolder"
              value={form.accountHolder}
              onChange={handleChange}
            />

            <ModalInput
              label="IBAN"
              name="iban"
              value={form.iban}
              onChange={handleChange}
            />

            <ModalInput
              label="IFSC/Sort Code"
              name="sortCode"
              value={form.sortCode}
              onChange={handleChange}
              required
              error={errors.sortCode}
            />

            {/* Row 4 */}
            <div className="col-span-2 w-full">
              <ModalInput
                label="Branch Address"
                name="address"
                value={form.address}
                onChange={handleChange}
              />
            </div>

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

            <label className="flex items-center gap-2">
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

            {/* <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isDisabled}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isDisabled: e.target.checked }))
                }
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-main">Disabled</span>
            </label> */}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddBankAccountModal;
