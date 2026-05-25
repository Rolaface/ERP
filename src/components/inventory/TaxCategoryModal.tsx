import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Tags } from "lucide-react";
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
  onSubmit: (data: TaxCategoryFormData) => Promise<boolean>;
  modalId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const TaxCategoryModal: React.FC<TaxCategoryModalProps> = React.memo(({
  isOpen,
  onClose,
  onSubmit,
  modalId,
}) => {
const resolvedModalId = useMemo(
  () => modalId || `tax-category-create-${Date.now()}`,
  [modalId]
);

  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();

  const [title, setTitle] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [titleError, setTitleError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle("");
    setEnabled(true);
    setTitleError("");
    setSubmitting(false);
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
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
    if (!validate()) return false;
    setSubmitting(true);
    try {
      const result = await onSubmit({ title: title.trim(), disabled: !enabled });
      if (result) {
        resetDirty();
        onClose();
      }
      return result;
    } catch {
      return false;
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
      title="Create Tax Category"
      subtitle="Create a new tax category"
      icon={Tags}
      footer={footer}
      maxWidth="lg"
      height="40vh"
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
});

export default TaxCategoryModal;