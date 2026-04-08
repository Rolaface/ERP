import React, { useState } from "react";
import { MinimizableModal } from "../../components/common/ModalManagerContext";
import { ModalInput } from "../../components/ui/modal/modalComponent";
import Tooltip from "../../components/Tooltip";
import { Button } from "../../components/ui/modal/formComponent";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";

import { createTaxCategory } from "../../api/taxCategoryApi";
import {
  showApiError,
  showSuccess,
  showValidationError,
  showLoading,
  closeSwal,
} from "../../utils/alert";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; 
};

const AddTaxCategoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState("");
  const [enabled, setEnabled] = useState(true);

  const { markDirty, resetDirty, handleCloseWithConfirm } =
    useUnsavedChanges();

  const [modalId] = useState(`tax-category-${Date.now()}`);

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

      resetDirty();
      setTitle("");
      setEnabled(true);

      onClose();
      onSuccess(); 
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={() =>
        handleCloseWithConfirm(() => {
          resetDirty();
          setTitle("");
          setEnabled(true);
          onClose();
        }, modalId)
      }
      title="Add Tax Category"
      subtitle="Create a new tax category"
      maxWidth="md"
      height="40vh"
    >
    
        <form onChange={() => markDirty()} className="flex flex-col gap-4">
          <Tooltip content={title || "Enter tax category name"}>
            <ModalInput
              label="Tax Category Name"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Enter tax category name"
            />
          </Tooltip>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => {
                setEnabled(e.target.checked);
                markDirty();
              }}
            />
            <span className="text-main text-sm">Enabled</span>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                handleCloseWithConfirm(() => {
                  resetDirty();
                  setTitle("");
                  setEnabled(true);
                  onClose();
                }, modalId)
              }
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

export default AddTaxCategoryModal;