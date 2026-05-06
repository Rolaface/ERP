import React from "react";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import { Button } from "../../components/ui/modal/formComponent";
import {
  ModalInput,
  ModalSelect,
} from "../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../components/ui/modal/SearchSelect";

import { useModeOfPaymentLogic } from "./useModeOfPaymentLogic";

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
  } = useModeOfPaymentLogic({ onSubmit, onClose, initialData,  // ← pass down
    isEdit,});

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={loading}>
        Cancel
      </Button>

      <Button variant="primary" onClick={handleSubmit} disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </Button>
    </>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
     title={isEdit ? "Edit Mode of Payment" : "Add Mode of Payment"}
      subtitle="Configure mode of payment"
      footer={footer}
      customWidth="60vw"
    >
       {fetchLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
      <div className="p-6 space-y-6">
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

          <label className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) =>
                setForm((p) => ({ ...p, enabled: e.target.checked }))
              }
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm">Enabled</span>
          </label>
        </div>

        {/* TABLE */}
        <div className="border rounded-2xl overflow-hidden bg-white">
          <div className="grid grid-cols-[60px_1fr_1fr] px-4 py-3 text-sm font-semibold border-b bg-gray-50">
            <div>No.</div>
            <div>Company</div>
            <div>Default Account</div>
          </div>

          <div className="grid grid-cols-[60px_1fr_1fr] px-4 py-3 items-center gap-3">
            <div>1</div>

            {/* COMPANY */}
            <SearchSelect2
              value={form.company}
              onChange={(_, option) =>
                setForm((p) => ({
                  ...p,
                  company: option?.value || "",
                }))
              }
              fetchOptions={(q) => {
                const query = q.toLowerCase();
                return Promise.resolve(
                  companies.filter((c) =>
                    c.label.toLowerCase().includes(query),
                  ),
                );
              }}
              loading={companyLoading}
              placeholder="Select company"
            />

            {/* ACCOUNT */}
            <SearchSelect2
              value={form.defaultAccount}
              onChange={(_, option) =>
                setForm((p) => ({
                  ...p,
                  defaultAccount: option?.value || "",
                }))
              }
              fetchOptions={(q) => {
                const query = q.toLowerCase();
                return Promise.resolve(
                  accounts.filter((a) => a.label.toLowerCase().includes(query)),
                );
              }}
              loading={accLoading}
              placeholder="Select default account"
            />
          </div>
        </div>
      </div>
      )}
    </MinimizableModal>
  );
};

export default AddModeOfPaymentModal;
