import React, { useState, useEffect } from "react";
import { Tag } from "lucide-react";
import { MinimizableModal } from "../../components/common/ModalManagerContext";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { Button } from "../ui/modal/formComponent";
import { ModalInput } from "../ui/modal/modalComponent";
import Tooltip from "../Tooltip";

// ─── Types ───────────────────────────────────────────────

interface TaxCategoryFormData {
  title: string;
  taxRate: number;
  disabled: boolean;
}

interface TaxCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: TaxCategoryFormData) => void;
  initialData?: TaxCategoryFormData | null;
  isEditMode?: boolean;
  modalId?: string;
}

// ─── Default ─────────────────────────────────────────────

const defaultForm: TaxCategoryFormData = {
  title: "",
  taxRate: 0,
  disabled: false,
};

// ─── Component ───────────────────────────────────────────

const TaxTemplateModal: React.FC<TaxCategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditMode = false,
  modalId,
}) => {
  const resolvedModalId =
    modalId ||
    (isEditMode
      ? `tax-template-edit-${Date.now()}`
      : `tax-template-create-${Date.now()}`);

  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();

  const [form, setForm] = useState<TaxCategoryFormData>(
    initialData ?? defaultForm
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Sync on open
  useEffect(() => {
    if (isOpen) {
      setForm(initialData ?? defaultForm);
      setErrors({});
    }
  }, [isOpen, initialData]);

  const reset = () => {
    setForm(initialData ?? defaultForm);
    setErrors({});
  };

  const handleCloseWithWarning = () =>
    handleCloseWithConfirm(() => {
      resetDirty();
      reset();
      onClose();
    }, resolvedModalId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    markDirty();
  };

  // ─── Validation ───────────────────────────────────────

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) newErrors.title = "Title is required";
    if (form.taxRate < 0) newErrors.taxRate = "Invalid rate";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit?.({
        ...form,
        taxRate: Number(form.taxRate),
      });

      resetDirty();
      reset();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // ─── Footer ──────────────────────────────────────────

  const footer = (
    <>
      <Button variant="secondary" onClick={handleCloseWithWarning}>
        Cancel
      </Button>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            resetDirty();
            reset();
          }}
        >
          Reset
        </Button>

        <Button variant="primary" loading={loading} onClick={handleSubmit}>
          {isEditMode ? "Update" : "Submit"}
        </Button>
      </div>
    </>
  );

  // ─── UI ──────────────────────────────────────────────

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={handleCloseWithWarning}
      title={isEditMode ? "Edit Tax Template" : "Add Tax Template"}
      subtitle="Create simple tax template"
      icon={Tag}
      footer={footer}
      maxWidth="4xl"
      height="60vh"   // ✅ FIXED → minimize works
    >
      <form
        onChange={() => markDirty()}
        onSubmit={(e) => e.preventDefault()}
        className="h-full flex flex-col"
      >
        <div className="p-4">

          {/* ONE LINE LAYOUT */}
          <div className="grid grid-cols-12 gap-4 items-end">

            {/* Title */}
            <div className="col-span-5">
              <Tooltip content={form.title || "Enter title"}>
                <ModalInput
                  label="Title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  error={errors.title}
                />
              </Tooltip>
            </div>

            {/* Tax Rate */}
            <div className="col-span-4">
              <ModalInput
                label="Tax Rate (%)"
                name="taxRate"
                type="number"
                value={form.taxRate}
                onChange={handleChange}
                error={errors.taxRate}
              />
            </div>

            {/* Disabled */}
            <div className="col-span-3 flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  name="disabled"
                  checked={form.disabled}
                  onChange={handleChange}
                  className="accent-primary"
                />
                Disabled
              </label>
            </div>

          </div>
        </div>
      </form>
    </MinimizableModal>
  );
};

export default TaxTemplateModal;