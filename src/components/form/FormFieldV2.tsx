import { CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

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

  /* SYSTEM */
  variant?: "outline" | "filled" | "ghost";
  floatingLabel?: boolean;

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

  variant = "outline",
  floatingLabel = false,

  inputRef, // ✅ FIX: destructured here
}: Props) {
  /* ---------------- CLASS BUILDER ---------------- */
  const getInputClasses = () => {
    let classes = "input-base";

    if (variant === "filled") classes += " input-filled";
    if (variant === "ghost") classes += " input-ghost";

    if (error) classes += " error";
    else if (success) classes += " success";

    return classes;
  };

  /* ---------------- RIGHT ICON ---------------- */
  const renderRightIcon = () => {
    if (loading) {
      return <Loader2 className="animate-spin" size={16} />;
    }

    if (error) {
      return <span style={{ color: "var(--danger)" }}>!</span>;
    }

    if (success) {
      return <CheckCircle2 size={16} style={{ color: "var(--success)" }} />;
    }

    return rightElement;
  };

  return (
    <div className="form-field">
      {/* TOP LABEL */}
      {label && !floatingLabel && (
        <label className="form-label">{label}</label>
      )}

      <div className="input-wrapper">
        <motion.input
          ref={inputRef} // ✅ now works
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown} // ✅ added
          type={type}
          placeholder={floatingLabel ? " " : placeholder}
          disabled={disabled}
          className={getInputClasses()}
          whileFocus={{ scale: 1.01 }}
        />

        {/* FLOATING LABEL */}
        {label && floatingLabel && (
          <label className="floating-label">{label}</label>
        )}

        {/* RIGHT ICON */}
        {(loading || success || error || rightElement) && (
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
            {renderRightIcon()}
          </div>
        )}
      </div>

      {/* HELPER / ERROR */}
      {(helperText || error) && (
        <div
          className={`form-helper ${
            error ? "error" : success ? "success" : ""
          }`}
        >
          {typeof error === "string" ? error : helperText}
        </div>
      )}
    </div>
  );
}