import React, { useMemo } from "react";
import { MinimizableModal } from "../common/MinimizableModal";
import ModalFooter from "../common/ModalFooter";
import {
  ModalInput,
  ModalSelect,
} from "../ui/modal/modalComponent";
import { BookOpen } from "lucide-react";
import {
  useCoaLogic,
  ACCOUNT_TYPE_OPTIONS,
  ROOT_TYPE_OPTIONS,
} from "../../hooks/useCoaLogic";
import type { COAAccount } from "../../types/coa";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";

interface NewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parentAccount?: COAAccount | null;
  editAccount?: COAAccount | null;
  modalId: string; // required — passed from GlobalModalHandler
}

const NewAccountModal: React.FC<NewAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  parentAccount,
  editAccount,
  modalId,
}) => {
  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();

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
  } = useCoaLogic(
    () => {
      resetDirty();
      onSuccess();
      onClose();
    },
    parentAccount,
    editAccount,
  );

  // Wrap handleChange to mark dirty on every field change
  const handleChangeWithDirty = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    handleChange(e);
    markDirty();
  };

  const footer = useMemo(
    () => (
      <ModalFooter
        onCancel={() => handleCloseWithConfirm(onClose, modalId)}
        onReset={reset}
        onSubmit={handleSubmit}
        isSubmitting={loading}
        submitLabel={isEditMode ? "Update Account" : "Create Account"}
      />
    ),
    [handleCloseWithConfirm, onClose, modalId, reset, handleSubmit, loading, isEditMode],
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, modalId)}
      title={
        isEditMode
          ? "Edit Account"
          : parentAccount
          ? "Add Child Account"
          : "Create Account"
      }
      subtitle={
        isEditMode
          ? `Editing: ${editAccount?.account_name}`
          : parentAccount
          ? `Creating under: ${parentAccount.account_name}`
          : "Add a new account to the chart of accounts"
      }
      icon={BookOpen}
      customWidth="65vw"
      height="auto"
      footer={footer}
    >
      <div
        className="grid grid-cols-2 gap-x-8 gap-y-5 py-3 px-1"
        onChange={() => markDirty()}
      >
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-5">
          {/* Account Name */}
          <div className="flex flex-col gap-1">
            <ModalInput
              label="Account Name"
              name="accountName"
              value={isEditMode ? (editAccount?.account_name ?? "") : form.accountName}
              onChange={handleChangeWithDirty}
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
              onChange={handleChangeWithDirty}
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
                onChange={handleChangeWithDirty}
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
                onChange={handleChangeWithDirty}
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
              onChange={handleChangeWithDirty}
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
              onChange={handleChangeWithDirty}
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
              onChange={handleChangeWithDirty}
              required
              disabled
              options={[...companies]}
            />
          </div>
        </div>
      </div>
    </MinimizableModal>
  );
};

export default NewAccountModal;