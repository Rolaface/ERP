import React, { useState, useRef, useEffect, useCallback } from "react";
import { Landmark } from "lucide-react";
import { MinimizableModal } from "./common/MinimizableModal";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { createBank , updateBank } from "../api/BankApi";
import type { Bank, BankPayload } from "../api/BankApi";
import { useDataRefreshStore, REFRESH_KEYS } from "../store/dataRefreshStore";
import { showApiError,showSuccess } from "../utils/alert";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface BankFormData {
  bank_name: string;
  swift_number: string;
}

interface BankFormErrors {
  bank_name?: string;
  swift_number?: string;
}

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean> | boolean;
  initialData?: (BankFormData & { name?: string }) | null;
  isEditMode?: boolean;
  modalId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildDefaultForm = (initial?: BankFormData | null): BankFormData => ({
  bank_name: initial?.bank_name ?? "",
  swift_number: initial?.swift_number ?? "",
});

const validate = (form: BankFormData): BankFormErrors => {
  const errors: BankFormErrors = {};

  if (!form.bank_name.trim()) {
    errors.bank_name = "Bank name is required.";
  }

  if (!form.swift_number.trim()) {
    errors.swift_number = "SWIFT number is required.";
  } else if (!/^[A-Z0-9]{8,11}$/.test(form.swift_number.trim().toUpperCase())) {
    errors.swift_number =
      "SWIFT/BIC must be 8–11 alphanumeric characters (e.g. HDFCINBB).";
  }

  return errors;
};

// ─── Component ────────────────────────────────────────────────────────────────

const BankModal: React.FC<BankModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditMode = false,
  modalId,
}) => {
  const resolvedModalId = useRef(modalId).current;
  const triggerRefresh = useDataRefreshStore((s) => s.triggerRefresh);

  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();

  const [form, setForm] = useState<BankFormData>(() =>
    buildDefaultForm(initialData),
  );
  const [errors, setErrors] = useState<BankFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form when initialData changes
  useEffect(() => {
    if (isOpen) {
      setForm(buildDefaultForm(initialData));
      setErrors({});
      resetDirty();
    }
  }, [isOpen, initialData]);

  // ── Field handler ──────────────────────────────────────────────────────────
  const handleChange = useCallback(
    (field: keyof BankFormData, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      markDirty();
      setErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    [markDirty],
  );

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: BankPayload = {
        bank_name: form.bank_name.trim(),
        swift_number: form.swift_number.trim().toUpperCase(),
      };

      let result: Bank;
      if (isEditMode && initialData?.name) {
        result = await updateBank(initialData.name, payload);
        showSuccess("Bank updated successfully.");
      } else {
        result = await createBank(payload);
        showSuccess("Bank created successfully.");
      }

      triggerRefresh(REFRESH_KEYS.Bank);
      await onSubmit(result);
      resetDirty();
      onClose();
    } catch (err: any) {
      showApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, isEditMode, initialData, onSubmit, onClose, triggerRefresh, resetDirty]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setForm(buildDefaultForm(initialData));
    setErrors({});
    resetDirty();
  }, [initialData, resetDirty]);

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footer = (
    <div className="flex items-center justify-between w-full">
      <button
        type="button"
        onClick={handleReset}
        className="px-4 py-2 text-sm font-medium text-muted border border-[var(--border)] rounded-lg hover:bg-[var(--row-hover)] transition-colors"
      >
        Reset
      </button>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleCloseWithConfirm(onClose, resolvedModalId)}
          className="px-4 py-2 text-sm font-medium text-main border border-[var(--border)] rounded-lg hover:bg-[var(--row-hover)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`px-6 py-2 text-sm font-semibold text-white bg-primary rounded-lg shadow-sm shadow-primary/20 hover:opacity-90 transition-all ${
            isSubmitting ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting
            ? "Saving..."
            : isEditMode
            ? "Update Bank"
            : "Add Bank"}
        </button>
      </div>
    </div>
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      title={isEditMode ? "Edit Bank" : "Add New Bank"}
      subtitle="Provide bank name and SWIFT/BIC number"
      icon={Landmark}
      footer={footer}
      customWidth="35vw"
      height="50vh"
    >
      <div className="flex flex-col gap-5 py-1">
        {/* Bank Name */}
        <div>
          <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest mb-1.5">
            Bank Name <span className="text-[var(--danger)]">*</span>
          </label>
          <input
            type="text"
            value={form.bank_name}
            onChange={(e) => handleChange("bank_name", e.target.value)}
            autoFocus
            className={`w-full px-3 py-2 text-sm bg-app border rounded-lg text-main placeholder:text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
              errors.bank_name
                ? "border-[var(--danger)]"
                : "border-[var(--border)]"
            }`}
          />
          {errors.bank_name && (
            <p className="text-[10px] text-[var(--danger)] mt-1">
              {errors.bank_name}
            </p>
          )}
        </div>

        {/* SWIFT Number */}
        <div>
          <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest mb-1.5">
            SWIFT / BIC Number <span className="text-[var(--danger)]">*</span>
          </label>
          <input
            type="text"
            value={form.swift_number}
            onChange={(e) =>
              handleChange("swift_number", e.target.value.toUpperCase())
            }
            maxLength={11}
            className={`w-full px-3 py-2 text-sm bg-app border rounded-lg text-main placeholder:text-muted font-mono tracking-wider focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
              errors.swift_number
                ? "border-[var(--danger)]"
                : "border-[var(--border)]"
            }`}
          />
          {errors.swift_number ? (
            <p className="text-[10px] text-[var(--danger)] mt-1">
              {errors.swift_number}
            </p>
          ) : (
            <p className="text-[10px] text-muted mt-1">
              8–11 alphanumeric characters
            </p>
          )}
        </div>
      </div>
    </MinimizableModal>
  );
};

export default BankModal;