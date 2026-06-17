import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Tags } from "lucide-react";
import { Button, Checkbox } from "../ui/modal/formComponent";
import { ModalInput } from "../ui/modal/modalComponent";
import { MinimizableModal } from "../common/MinimizableModal";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import ModalFooter from "../../components/common/ModalFooter"

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
  isViewMode?: boolean;
  initialData?: {
    title: string;
    disabled: boolean;
  } | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

const TaxCategoryModal: React.FC<TaxCategoryModalProps> = React.memo(({
  isOpen,
  onClose,
  onSubmit,
  modalId,
  isViewMode = false,
  initialData,
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

    if (initialData) {
      setTitle(initialData.title);
      setEnabled(!initialData.disabled);
    } else {
      setTitle("");
      setEnabled(true);
    }

    setTitleError("");
    setSubmitting(false);

    if (!isViewMode) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialData, isViewMode]);

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
      if (result !== false) {
        resetDirty();
        onClose();
      }
      return result ?? true;
    } catch {
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setTitle("");
    setEnabled(true);
    setTitleError("");
    resetDirty();
  };


  const footer = isViewMode ? (
    <ModalFooter
      onCancel={onClose}
      cancelLabel="Close"
    />
  ) : (
    <ModalFooter
      onCancel={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      onReset={reset}
      onSubmit={handleSave}
      isSubmitting={submitting}
      submitLabel="Submit"
      resetLabel="Reset"
    />
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={isViewMode ? onClose : () => handleCloseWithConfirm(onClose, resolvedModalId)}
      title={isViewMode ? "View Tax Category" : "Add Tax Category"}
      subtitle={isViewMode ? "Read-only view of this tax category" : "Add a new tax category"}
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
          required={!isViewMode}
          placeholder="Enter tax category name"
          disabled={submitting || isViewMode}
          error={titleError}
          onChange={(e) => {
            if (isViewMode) return;
            setTitle(e.target.value);
            markDirty();
            if (titleError) setTitleError("");
          }}
          onKeyDown={(e) => {
            if (isViewMode) return;
            if (e.key === "Enter") handleSave();
          }}
        />

        <Checkbox
          label="Enabled"
          checked={enabled}
          onChange={(val) => {
            if (isViewMode) return;
            setEnabled(val);
            markDirty();
          }}
        />
      </div>
    </MinimizableModal>
  );
});

export default TaxCategoryModal;