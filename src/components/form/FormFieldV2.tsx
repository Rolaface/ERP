import React from "react";

type FormFieldV2Props = {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  helper?: string;
  successText?: string; // ✅ NEW
  type?: string;
  required?: boolean;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  onEnter?: () => void;
};

export default function FormFieldV2({
  label,
  value,
  onChange,
  placeholder,
  error,
  helper,
  successText,
  type = "text",
  required = false,
  disabled = false,
  inputRef,
  onEnter,
}: FormFieldV2Props) {
  const hasError = Boolean(error);
  const isFilled = value?.length > 0;
  const isSuccess = !hasError && isFilled;

  return (
    <div className="form-group-v2">
      {/* Label */}
      {label && (
        <label className="form-label-v2">
          {label}
          {required && " *"}
        </label>
      )}

      {/* Input */}
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) onEnter();
        }}
        className={`input ${hasError ? "input-error" : ""}`}
      />

      {/* Feedback */}
      {hasError ? (
        <span className="form-helper-v2 text-danger">{error}</span>
      ) : isSuccess && successText ? (
        <span className="form-helper-v2 text-success">
          {successText}
        </span>
      ) : helper ? (
        <span className="form-helper-v2 text-muted">{helper}</span>
      ) : null}
    </div>
  );
}