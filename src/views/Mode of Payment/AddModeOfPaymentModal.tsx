import React from "react";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import { Button } from "../../components/ui/modal/formComponent";
import {
  ModalInput,
  ModalSelect,
} from "../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../components/ui/modal/SearchSelect";
import { Wallet } from "lucide-react";
import { useModeOfPaymentLogic } from "./useModeOfPaymentLogic";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data?: any) => void;
  modalId: string;
  initialData?: any;
  isEdit?: boolean;
}

const AddModeOfPaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  modalId,
  initialData,
  isEdit,
}) => {
  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();
  const {
    form,
    setForm,
    handleChange,
    handleSubmit,
    loading,
    companies,
    accounts,
    fetchLoading,
    accLoading,
    companyLoading,
  } = useModeOfPaymentLogic({
    onSubmit, onClose, initialData,  // ← pass down
    isEdit,
  });

  const handleClose = () => {
    resetDirty();
    onClose();
  };

  const handleSubmitWithDirtyReset = async () => {
    const didSave = await handleSubmit();
    if (didSave) resetDirty();
  };

  const footer = (
    <>
      <Button
        variant="secondary"
        onClick={() => handleCloseWithConfirm(handleClose, modalId)}
        disabled={loading}
      >
        Cancel
      </Button>

      <Button
        variant="primary"
        onClick={handleSubmitWithDirtyReset}
        disabled={loading}
      >
        {loading ? "Saving..." : "Save"}
      </Button>
    </>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(handleClose, modalId)}
      title={isEdit ? "Edit Mode of Payment" : "Add Mode of Payment"}
      subtitle="Configure mode of payment"
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
              disabled={isEdit}
              required
            />

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
              required
            />

            <SearchSelect2
              label="Default Account"
              value={form.defaultAccount}
              onChange={(_, option) => {
                markDirty();
                setForm((p) => ({
                  ...p,
                  defaultAccount: option?.value || "",
                }));
              }}
              fetchOptions={(q) => {
                const query = q.toLowerCase();
                return Promise.resolve(
                  accounts.filter((a) => a.label.toLowerCase().includes(query)),
                );
              }}
              loading={accLoading}
              required
              placeholder="Select default account"
            />

            <label className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={form.enabled}
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
