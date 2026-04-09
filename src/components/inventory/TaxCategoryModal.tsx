import React, { useState } from "react";
import { useModalStore } from "../../store/modalStore";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import { ModalInput } from "../../components/ui/modal/modalComponent";
import { Button } from "../../components/ui/modal/formComponent";

import { createTaxCategory } from "../../api/taxCategoryApi";
import {
  showApiError,
  showSuccess,
  showValidationError,
  showLoading,
  closeSwal,
} from "../../utils/alert";

interface TaxCategoryModalProps {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
}

export const TaxCategoryModal: React.FC<TaxCategoryModalProps> = ({
  modalId,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const modals = useModalStore((state) => state.modals);
  const modal = modals.find((m) => m.id === modalId);

  const [title, setTitle] = useState("");
  const [enabled, setEnabled] = useState(true);

  const handleSave = async () => {
    if (!title.trim()) {
      showValidationError("Tax Category name is required");
      return;
    }

    try {
      showLoading("Creating Tax Category...");

      const payload = {
        title: title.trim(),
        disabled: enabled ? 0 : 1,
      };

      const res = await createTaxCategory(payload);

      closeSwal();
      showSuccess(res?.message || "Tax Category created successfully");

      setTitle("");
      setEnabled(true);

      if (modal?.context?.callback) {
        await modal.context.callback(payload);
      }
      
      onClose();
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  if (!modal) return null;

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      title="Add Tax Category"
      subtitle="Create a new tax category"
      maxWidth="md"
      height="40vh"
    >
      <form className="flex flex-col gap-4">
        <ModalInput
          label="Tax Category Name"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Enter tax category name"
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span className="text-main text-sm">Enabled</span>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button type="button" variant="primary" onClick={handleSave}>
            Save
          </Button>
        </div>
      </form>
    </MinimizableModal>
  );
};

export default TaxCategoryModal;