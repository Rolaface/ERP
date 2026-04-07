import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type FormFieldProProps = {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;

  error?: string;
  helper?: string;
  successText?: string;

  asyncStatus?: "idle" | "loading" | "taken" | "valid";

  required?: boolean;
  disabled?: boolean;

  inputRef?: React.RefObject<HTMLInputElement>;
  onEnter?: () => void;

  rightElement?: React.ReactNode;
};

export default function FormFieldPro({
  label,
  value,
  onChange,
  placeholder,
  type = "text",

  error,
  helper,
  successText,

  asyncStatus,

  required = false,
  disabled = false,

  inputRef,
  onEnter,

  rightElement,
}: FormFieldProProps) {
  /* ---------------- STATE ---------------- */

  const hasError = Boolean(error);
  const isFilled = value?.length > 0;

  const isAsyncLoading = asyncStatus === "loading";
  const isAsyncError = asyncStatus === "taken";
  const isAsyncSuccess = asyncStatus === "valid";

  const isSuccess =
    !hasError &&
    isFilled &&
    (!asyncStatus || isAsyncSuccess);

  /* ---------------- UI ---------------- */

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
          whileFocus={{ scale: 1.01 }}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onEnter) onEnter();
          }}
          className={`input pr-10 ${
            hasError || isAsyncError ? "input-error" : ""
          }`}
        />

        {/* Right Icon */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
          {rightElement ? (
            rightElement
          ) : (
            <AnimatePresence mode="wait">
              {isAsyncLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Loader2 className="w-4 h-4 animate-spin text-muted" />
                </motion.div>
              )}

              {(hasError || isAsyncError) && (
                <motion.div
                  key="error"
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
      <div className="form-helper-v2 min-h-[16px]">
        <AnimatePresence mode="wait">
          {hasError && (
            <motion.span key="error" className="text-danger">
              {error}
            </motion.span>
          )}

          {!hasError && isAsyncError && (
            <motion.span key="taken" className="text-danger">
              Already exists — try logging in
            </motion.span>
          )}

          {!hasError && isAsyncLoading && (
            <motion.span key="loading" className="text-muted">
              Checking...
            </motion.span>
          )}

          {isSuccess && successText && (
            <motion.span key="success" className="text-success">
              {successText}
            </motion.span>
          )}

          {!hasError && !isSuccess && helper && (
            <motion.span key="helper" className="text-muted">
              {helper}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}