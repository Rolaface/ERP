import React, { useEffect, useRef, useState, useMemo } from "react";
import { Tag } from "lucide-react";
import { Button, Checkbox } from "../ui/modal/formComponent";
import { ModalInput } from "../ui/modal/modalComponent";
import { MinimizableModal } from "../common/MinimizableModal";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TaxCategoryFormData {
  title: string;
  disabled: boolean;
}

interface TaxCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TaxCategoryFormData) => Promise<void>;
  modalId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const TaxCategoryModal: React.FC<TaxCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  modalId,
}) => {
const resolvedModalId = useMemo(
  () => modalId || `tax-category-create-${Date.now()}`,
  [] 
);

  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();

  const [title, setTitle] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [titleError, setTitleError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setEnabled(true);
      setTitleError("");
      setSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const validate = (): boolean => {
    if (!title.trim()) {
      setTitleError("Tax category name is required.");
      inputRef.current?.focus();
      return false;
    }
    setTitleError("");
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSave({ title: title.trim(), disabled: !enabled });
      resetDirty();
      onClose();
    } catch {
      // Error shown by hook via showApiError
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      <Button
        variant="secondary"
        type="button"
        onClick={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        type="button"
        loading={submitting}
        onClick={handleSave}
      >
        Save
      </Button>
    </>
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      title="Add Tax Category"
      subtitle="Create a new tax category"
      icon={Tag}
      footer={footer}
      maxWidth="lg"
    >
      <div className="p-6 flex flex-col gap-5">
        <ModalInput
          ref={inputRef}
          label="Tax Category Name"
          name="tax-cat-name"
          type="text"
          value={title}
          required
          placeholder="Enter tax category name"
          disabled={submitting}
          error={titleError}
          onChange={(e) => {
            setTitle(e.target.value);
            markDirty();
            if (titleError) setTitleError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
          }}
        />

        <Checkbox
          label="Enabled"
          checked={enabled}
          onChange={(val) => {
            setEnabled(val);
            markDirty();
          }}
        />
      </div>
    </MinimizableModal>
  );
};

export default TaxCategoryModal;