import React from "react";
import Modal from "../../components/ui/modal/modal";
import { Button } from "../../components/ui/modal/formComponent";
import {
  ModalInput,
  ModalSelect,
} from "../../components/ui/modal/modalComponent";
import { BookOpen } from "lucide-react";
import {
  useCoaLogic,
  ACCOUNT_TYPE_OPTIONS,
  ROOT_TYPE_OPTIONS,
} from "../../hooks/useCoaLogic";
import type { COAAccount } from "../../types/coa";

interface NewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parentAccount?: COAAccount | null;
  editAccount?: COAAccount | null;
}

const NewAccountModal: React.FC<NewAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  parentAccount,
  editAccount,
}) => {
  const {
    form,
    loading,
    errors,
    handleChange,
    handleSubmit,
    reset,
    companies,
    currencies,
    isEditMode,
  } = useCoaLogic(() => {
    onSuccess();
    onClose();
  }, parentAccount, editAccount);
  const footer = (
    <>
      <Button variant="secondary" type="button" onClick={onClose}>
        Cancel
      </Button>
      <div className="flex gap-3">
        <Button variant="secondary" type="button" onClick={reset}>
          Reset
        </Button>
        <Button
          variant="primary"
          type="button"
          loading={loading}
          onClick={handleSubmit}
        >
          {isEditMode ? "Update Account" : "Create New Account"}

        </Button>
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Account" : parentAccount ? "Add Child Account" : "Create Account"}
      subtitle={
        isEditMode
          ? `Editing: ${editAccount?.account_name}`
          : parentAccount
            ? `Creating under: ${parentAccount.account_name}`
            : "Add a new account to the chart of accounts"
      }
      icon={BookOpen}
      footer={footer}
      customWidth="65vw"
      height="550px"
    >
      <div className="grid grid-cols-2 gap-x-8 gap-y-5 py-3 px-1">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-5">
          {/* Account Name */}
          <div className="flex flex-col gap-1">
            <ModalInput
              label="Account Name"
              name="accountName"
              value={isEditMode ? (editAccount?.account_name ?? "") : form.accountName}
              onChange={handleChange}
              required={!isEditMode}
              disabled={isEditMode}
              error={errors.accountName}
            />
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Name of new Account. Note: Please don't create{" "}
              <span className="font-semibold text-main">accounts</span> for
              Customers and Suppliers
            </p>
          </div>

          {/* Account Number */}
          <div className="flex flex-col gap-1">
            <ModalInput
              label="Account Number"
              name="accountNumber"
              value={form.accountNumber}
              onChange={handleChange}
            />
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Number of new Account, it will be included in the account name as
              a prefix
            </p>
          </div>

          {/* Is Group */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                name="isGroup"
                checked={form.isGroup}
                onChange={handleChange}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm font-medium text-main">Is Group</span>
            </label>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Further accounts can be made under Groups, but entries can be made
              against non-Groups
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-5">
          {/* Root Type — only when Is Group is checked */}
          {form.isGroup && (
            <div className="flex flex-col gap-1">
              <ModalSelect
                label="Root Type"
                name="rootType"
                value={form.rootType}
                onChange={handleChange}
                required
                options={[
                  { label: "— Select Root Type —", value: "" },
                  ...ROOT_TYPE_OPTIONS.map((t) => ({ label: t, value: t })),
                ]}
                error={errors.rootType}
              />
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Required for group accounts. Defines the financial
                classification.
              </p>
            </div>
          )}

          {/* Account Type */}
          <div className="flex flex-col gap-1">
            <ModalSelect
              label="Account Type"
              name="accountType"
              value={form.accountType}
              onChange={handleChange}
              options={[
                ...ACCOUNT_TYPE_OPTIONS.map((t) => ({ label: t, value: t })),
              ]}
            />
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Optional. This setting will be used to filter in various
              transactions.
            </p>
          </div>

          {/* Currency */}
          <div className="flex flex-col gap-1">
            <ModalSelect
              label="Currency"
              name="currency"
              value={form.currency}
              onChange={handleChange}
              options={[
                { label: "— Select Currency —", value: "" },
                ...currencies,
              ]}
            />
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Optional. Sets company's default currency, if not specified.
            </p>
          </div>

          {/* Company */}
          <div className="flex flex-col gap-1">
            <ModalSelect
              label="Company"
              name="company"
              value={form.company}
              onChange={handleChange}
              required
              disabled
              options={[

                ...companies,
              ]}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default NewAccountModal;
