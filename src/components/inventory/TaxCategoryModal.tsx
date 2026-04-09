import React, { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TaxCategoryFormData {
  title: string;
  disabled: boolean;
}

interface TaxCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TaxCategoryFormData) => Promise<void>;
  // No isEdit prop — edit only toggles status via ActionMenu, not this modal
}

// ─── Component ────────────────────────────────────────────────────────────────

const TaxCategoryModal: React.FC<TaxCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [titleError, setTitleError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  // Reset form state every time modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setEnabled(true);
      setTitleError("");
      setSubmitting(false);
      // Auto-focus the input after mount
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !submitting) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  // ─── Validation ─────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    if (!title.trim()) {
      setTitleError("Tax category name is required.");
      inputRef.current?.focus();
      return false;
    }
    setTitleError("");
    return true;
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSave({ title: title.trim(), disabled: !enabled });
      onClose();
    } catch {
      // Error already shown by the hook via showApiError
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[1000]"
        onClick={() => !submitting && onClose()}
      />

      {/* Modal Panel */}
      <div
        className="fixed z-[1010] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                   w-full max-w-[560px] mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tax-cat-modal-title"
      >
        {/* Header */}
        <div className="bg-[#C68A2B] px-6 py-5 flex items-start justify-between">
          <div>
            <h2
              id="tax-cat-modal-title"
              className="text-white font-semibold text-lg leading-tight"
            >
              Add Tax Category
            </h2>
            <p className="text-white/80 text-sm mt-0.5">
              Create a new tax category
            </p>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {/* Minimise — kept as no-op placeholder for consistency with rest of modal system */}
            <button
              className="text-white/70 hover:text-white transition-colors p-1 rounded"
              onClick={onClose}
              aria-label="Close"
              disabled={submitting}
            >
              {/* Minus icon */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button
              className="text-white/70 hover:text-white transition-colors p-1 rounded"
              onClick={onClose}
              aria-label="Close modal"
              disabled={submitting}
            >
              {/* X icon */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 bg-[#faf8f5]">
          {/* Tax Category Name */}
          <div className="mb-5">
            <label
              htmlFor="tax-cat-name"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Tax Category Name
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              id="tax-cat-name"
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              placeholder="Enter tax category name"
              disabled={submitting}
              className={[
                "w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors",
                "bg-white text-gray-800 placeholder:text-gray-400",
                titleError
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  : "border-gray-200 focus:border-[#C68A2B] focus:ring-2 focus:ring-[#C68A2B]/10",
                submitting ? "opacity-60 cursor-not-allowed" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            />
            {titleError && (
              <p className="mt-1 text-xs text-red-500">{titleError}</p>
            )}
          </div>

          {/* Enabled Checkbox */}
          <div className="flex items-center gap-2.5">
            <input
              id="tax-cat-enabled"
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={submitting}
              className="w-4 h-4 rounded border-gray-300 text-[#C68A2B] accent-[#C68A2B] cursor-pointer disabled:cursor-not-allowed"
            />
            <label
              htmlFor="tax-cat-enabled"
              className="text-sm text-gray-700 cursor-pointer select-none"
            >
              Enabled
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#faf8f5] border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm
                       font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-[#C68A2B] text-white text-sm font-semibold
                       hover:bg-[#b07a22] transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2 min-w-[72px] justify-center"
          >
            {submitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default TaxCategoryModal;