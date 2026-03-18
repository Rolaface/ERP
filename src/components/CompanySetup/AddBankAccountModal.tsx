import React from "react";
import Modal from "../ui/modal/modal";
import { Button } from "../ui/modal/formComponent";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
import { Building2 } from "lucide-react";
import { useBankAccLogic } from "./Usebankacclogic";
import DatePickerInput from "../calendar/DatePickerInput";
import SearchSelect from "../ui/modal/SearchSelect";


interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const AddBankAccountModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const {
    form,
    setForm,
    handleChange,
    handleSubmit,
    handleReset,
    bankOptions,
    accountForOptions,
    currencyOptions,
    isCompany,
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
        <Button variant="primary" type="submit" form="bankForm">
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
      subtitle="Configure account for transactions"
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
              options={accountForOptions}
              required
            />

            <ModalInput
              label="Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              disabled
            />

            <SearchSelect
              label="Bank"
              value={form.bank}
              onChange={(value) => {
                const selected = bankOptions.find((b) => b.value === value);

                if (!selected) return;

                setForm((prev) => ({
                  ...prev,
                  bank: selected.value,
                  swiftCode: selected.swiftCode,
                }));
              }}
              fetchOptions={async (q) =>
                bankOptions
                  .filter((b) =>
                    b.label.toLowerCase().includes(q.toLowerCase())
                  )
                  .map((b) => ({
                    label: b.label,
                    value: b.value,
                  }))
              }
              required
            />
            <ModalInput
              label="SWIFT Code"
              name="swiftCode"
              value={form.swiftCode}
              disabled
            />


            {!isCompany ? (
              <SearchSelect
                label="Currency"
                value={form.currency}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, currency: value }))
                }
                fetchOptions={async (q) =>
                  currencyOptions
                    .filter((c) =>
                      c.label.toLowerCase().includes(q.toLowerCase())
                    )
                    .map((c) => ({
                      label: c.label,
                      value: c.value,
                    }))
                }
              />
            ) : (
              <div />
            )}
            <ModalInput
              label="Account Number"
              name="accountNumber"
              value={form.accountNumber}
              onChange={handleChange}
              required
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
            />



            {/* Row 4 */}
            <div className="col-span-2 w-full">
              <ModalInput
                label="Address"
                name="address"
                value={form.address}
                onChange={handleChange}
              />
            </div>



          </div>


          <div className="flex gap-8 mt-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isDefault: e.target.checked }))
                }
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-main">Default Account</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isDisabled}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isDisabled: e.target.checked }))
                }
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-main">Disabled</span>
            </label>
          </div>

        </div>
      </form>
    </Modal>
  );
};

export default AddBankAccountModal;