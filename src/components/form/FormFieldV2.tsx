import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

type ChecklistItem = {
  label: string;
  valid: boolean;
};

type Props = {
  label?: string;
  value?: string;
  onChange?: (e: any) => void;
  onKeyDown?: (e: any) => void;

  placeholder?: string;
  type?: string;

  /* STATES */
  error?: string | boolean;
  success?: boolean;
  disabled?: boolean;
  loading?: boolean;

  /* UX */
  helperText?: string;
  rightElement?: React.ReactNode;

  /* NEW: CHECKLIST MODE */
  checklist?: ChecklistItem[];

  /* SYSTEM */
  variant?: "outline" | "filled" | "ghost";
  floatingLabel?: boolean;

  readOnly?: boolean;

  inputRef?: React.Ref<HTMLInputElement>;
};

export default function FormFieldPro({
  label,
  value,
  onChange,
  onKeyDown,
  placeholder = "",
  type = "text",

  error,
  success,
  disabled,
  loading,

  helperText,
  rightElement,
  checklist,

  variant = "outline",
  floatingLabel = false,

  readOnly,
  inputRef,
}: Props) {
  /* ---------------- STATE ---------------- */
  const isError = !!error;
  const isSuccess = !!success && !isError;

  const stateClass = isError
    ? "field-error"
    : isSuccess
    ? "field-success"
    : "field-default";

  /* ---------------- CLASS BUILDER ---------------- */
  const getInputClasses = () => {
    let classes = "input-base";

    if (variant === "filled") classes += " input-filled";
    if (variant === "ghost") classes += " input-ghost";

    classes += ` ${stateClass}`;

    return classes;
  };

  /* ---------------- RIGHT ELEMENT ---------------- */
  const renderRight = () => {
    if (loading) {
      return <Loader2 className="animate-spin" size={16} />;
    }

    return rightElement;
  };

  return (
    <div className="form-field">
      {/* LABEL */}
      {label && !floatingLabel && (
        <label className="form-label">{label}</label>
      )}

      <div className="input-wrapper">
        <motion.input
          ref={inputRef}
          value={value || ""}
          onChange={onChange}
          onKeyDown={onKeyDown}
          type={type}
          placeholder={floatingLabel ? " " : placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={getInputClasses()}
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        />

        {/* FLOATING LABEL */}
        {label && floatingLabel && (
          <label className="floating-label">{label}</label>
        )}

        {/* RIGHT ELEMENT */}
        {(loading || rightElement) && (
          <div
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
            }}
          >
            {renderRight()}
          </div>
        )}
      </div>

      {/* CHECKLIST MODE */}
      {checklist && checklist.length > 0 && (
        <div className="form-checklist">
          {checklist.map((item, i) => (
            <div
              key={i}
              className={`checklist-item ${
                item.valid ? "valid" : "invalid"
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}

      {/* HELPER / ERROR */}
      {(helperText || error) && !checklist && (
        <div
          className={`form-helper ${
            isError ? "error" : isSuccess ? "success" : ""
          }`}
        >
          {typeof error === "string" ? error : helperText}
        </div>
      )}
    </div>
  );
}