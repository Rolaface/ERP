import React, { useCallback } from "react";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import { Button } from "../../components/ui/modal/formComponent";
import {
  ModalInput,
  ModalSelect,
} from "../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../components/ui/modal/SearchSelect2";
import { getDefaultAccounts } from "../../api/BankAccountApi";
import { useModeOfPaymentLogic } from "./useModeOfPaymentLogic";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data?: any) => void;
  modalId: string;
  initialData?: any;
  isEdit?: boolean;
  isViewMode?: boolean
}

const AddModeOfPaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  modalId,
  initialData,
  isEdit,
  isViewMode = false,
}) => {
  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();
  const {
    form,
    setForm,
    handleChange,
    handleSubmit,
    loading,
    companies,
    fetchLoading,
    companyLoading,
  } = useModeOfPaymentLogic({
    onSubmit, onClose, initialData,
    isEdit, isViewMode
  });

  const handleClose = () => {
    resetDirty();
    onClose();
  };

  const handleSubmitWithDirtyReset = async () => {
    const didSave = await handleSubmit();
    if (didSave) resetDirty();
  };
  // AFTER — single call
  const fetchGlOptions = useCallback(async (_search?: string) => {
    try {
      const data: { name: string; account_type: string; account_name: string }[] =
        await getDefaultAccounts();
      return data.map((opt) => ({
        value: opt.name,
        label: opt.account_name,
        subLabel: opt.account_type || "",
      }));
    } catch {
      return [];
    }
  }, []);

  const footer = (
    <>
      <Button
        variant="secondary"
        onClick={() => handleCloseWithConfirm(handleClose, modalId)}
        disabled={loading}
      >
        Cancel
      </Button>

      {!isViewMode && (
        <Button
          variant="primary"
          onClick={handleSubmitWithDirtyReset}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </Button>
      )}


    </>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(handleClose, modalId)}
      // title={isEdit ? "Edit Mode of Payment" : "Add Mode of Payment"}
      title={isViewMode ? "View Mode of Payment" : isEdit ? "Edit Mode of Payment" : "Add Mode of Payment"}
      subtitle={
        isViewMode
          ? "Review payment details"
          : isEdit
            ? "Edit payment configuration"
            : "Configure a new payment method"
      }
      footer={footer}
      customWidth="60vw"
      height="48vh"
    >
      {fetchLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="p-6 space-y-6" onChange={markDirty}>
          {/* FORM */}
          <div className="grid grid-cols-3 gap-4">
            <ModalInput
              label="Mode of Payment"
              name="name"
              value={form.name}
              onChange={handleChange}
              disabled={isEdit || isViewMode}
              required
            />
            {/* <ModalInput
  label="Mode of Payment"
  name="name"
  value={form.name}
  onChange={handleChange}
  disabled={isViewMode}  // ← removed isEdit
  required
/> */}

            <ModalSelect
              label="Type"
              name="type"
              value={form.type}
              onChange={handleChange}
              options={[
                { label: "Bank", value: "Bank" },
                { label: "Cash", value: "Cash" },
                { label: "General", value: "General" },
                { label: "Phone", value: "Phone" },
              ]}
              disabled={isViewMode}
              required
            />

            <SearchSelect2
              label="GL Accounts"
              value={form.defaultAccountDisplay || form.defaultAccount}
              onChange={(val, option) => {
                markDirty();
                setForm((p) => ({
                  ...p,
                  defaultAccount: val || "",
                  defaultAccountDisplay: option?.label || "",
                }));
              }}
              fetchOptions={fetchGlOptions}
              disabled={isViewMode}

              required
              placeholder="Select default account"
            />

            <label className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={form.enabled}
                disabled={isViewMode}

                onChange={(e) => {
                  markDirty();
                  setForm((p) => ({ ...p, enabled: e.target.checked }));
                }}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm">Enabled</span>
            </label>
          </div>
        </div>
      )}
    </MinimizableModal>
  );
};

export default AddModeOfPaymentModal;
