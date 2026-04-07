import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type FormFieldProps = {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  placeholder?: string;
  error?: string;
  helper?: string;
  successText?: string;

  type?: string;
  required?: boolean;
  disabled?: boolean;

  inputRef?: React.RefObject<HTMLInputElement>;
  onEnter?: () => void;

  asyncStatus?: "idle" | "loading" | "taken" | "valid";
  rightElement?: React.ReactNode;
};

export default function FormFieldPro({
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
  asyncStatus,
  rightElement,
}: FormFieldProps) {
  const hasError = Boolean(error);
  const isFilled = value?.length > 0;

  const isSuccess =
    !hasError &&
    isFilled &&
    (!asyncStatus || asyncStatus === "valid");

  /* ---------------- Unified Input Styles ---------------- */
  const baseInput =
    "input pr-10 rounded-xl transition-all duration-200";

  const stateStyles = `
    ${hasError ? "input-error" : ""}
    ${isSuccess ? "border-green-400" : ""}
    ${!hasError && !isSuccess ? "focus:border-primary" : ""}
  `;

  return (
    <div className="form-group-v2">
      {/* Label */}
      {label && (
        <label className="form-label-v2">
          {label}
          {required && " *"}
        </label>
      )}

      {/* Input Wrapper */}
      <div className="relative">
        <motion.input
          ref={inputRef}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onEnter) onEnter();
          }}
          whileFocus={{
            scale: 1.01,
            boxShadow: "0 0 0 2px rgba(99,102,241,0.15)",
          }}
          className={`${baseInput} ${stateStyles}`}
        />

        {/* Right Icon */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
          {rightElement ? (
            rightElement
          ) : (
            <AnimatePresence mode="wait">
              {asyncStatus === "loading" && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Loader2 className="w-4 h-4 animate-spin text-muted" />
                </motion.div>
              )}

              {asyncStatus === "taken" && (
                <motion.div
                  key="taken"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <AlertCircle className="w-4 h-4 text-danger" />
                </motion.div>
              )}

              {isSuccess && (
                <motion.div
                  key="success"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <CheckCircle2 className="w-4 h-4 text-success" />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Feedback */}
      <div className="min-h-[16px]">
        <AnimatePresence mode="wait">
          {hasError && (
            <motion.p
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="form-helper-v2 text-danger"
            >
              {error}
            </motion.p>
          )}

          {!hasError && asyncStatus === "loading" && (
            <motion.p
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="form-helper-v2 text-muted"
            >
              Checking...
            </motion.p>
          )}

          {!hasError && asyncStatus === "taken" && (
            <motion.p
              key="taken"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="form-helper-v2 text-danger"
            >
              Already exists
            </motion.p>
          )}

          {isSuccess && successText && (
            <motion.p
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="form-helper-v2 text-success"
            >
              {successText}
            </motion.p>
          )}

          {!hasError && !isSuccess && helper && (
            <motion.p
              key="helper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="form-helper-v2 text-muted"
            >
              {helper}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}