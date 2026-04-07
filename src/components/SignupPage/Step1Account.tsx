import { ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ---------------- Utils ---------------- */

const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

/* ---------------- Input Field ---------------- */

function InputField({
  label,
  value,
  error,
  successText,
  onChange,
  inputRef,
  onEnter,
  type = "text",
  asyncStatus,
  rightElement,
  placeholder,
}: any) {
  const isFilled = value?.length > 0;

  const showSuccess =
    !error &&
    isFilled &&
    (!asyncStatus || asyncStatus === "valid");

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </label>

      <div className="relative">
        <motion.input
          ref={inputRef}
          whileFocus={{ scale: 1.01 }}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          onKeyDown={(e) => e.key === "Enter" && !error && value && onEnter?.()}
          className={`
            w-full px-4 pr-10 py-2.5 rounded-xl bg-card border
            transition-all outline-none text-sm
            ${error ? "border-red-400" : ""}
            ${showSuccess ? "border-green-400" : ""}
            ${!error && !showSuccess ? "border-theme" : ""}
            focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-sm
          `}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
          {rightElement ? (
            rightElement
          ) : (
            <AnimatePresence mode="wait">
              {asyncStatus === "loading" && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Loader2 className="w-4 h-4 animate-spin text-muted" />
                </motion.div>
              )}

              {asyncStatus === "taken" && (
                <motion.div key="taken" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <AlertCircle className="w-4 h-4 text-danger" />
                </motion.div>
              )}

              {showSuccess && (
                <motion.div key="success" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle2 className="w-4 h-4 text-success" />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      <div className="min-h-[12px] text-[10px] leading-none">
        <AnimatePresence mode="wait">
          {error && (
            <motion.p key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-danger">
              {error}
            </motion.p>
          )}

          {!error && asyncStatus === "loading" && (
            <motion.p key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted">
              Checking email...
            </motion.p>
          )}

          {!error && asyncStatus === "taken" && (
            <motion.p key="taken" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-danger">
              Account already exists — try logging in
            </motion.p>
          )}

          {showSuccess && successText && (
            <motion.p key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-success">
              {successText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------------- Password Field ---------------- */

function PasswordField({ value, error, onChange, inputRef }: any) {
  const [show, setShow] = useState(false);

  const rules = [
    { label: "At least 8 characters", valid: value.length >= 8 },
    { label: "One number", valid: /\d/.test(value) },
    { label: "One uppercase letter", valid: /[A-Z]/.test(value) },
  ];

  const strength = rules.filter((r) => r.valid).length;

  const strengthColor =
    strength === 1
      ? "#ef4444"
      : strength === 2
      ? "#f59e0b"
      : strength === 3
      ? "#22c55e"
      : "#e5e7eb";

  return (
    <div className="flex flex-col gap-1">
      <InputField
        label="Password"
        value={value}
        error={error}
        type={show ? "text" : "password"}
        onChange={onChange}
        inputRef={inputRef}
        placeholder="Create a strong password"
        rightElement={
          <button
            type="button"
            onClick={() => setShow((p) => !p)}
            className="w-5 h-5 flex items-center justify-center text-muted hover:text-primary transition"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />

      <div className="h-1 rounded-full bg-muted overflow-hidden -mt-0.5">
        <motion.div
          className="h-full"
          animate={{
            width: `${(strength / 3) * 100}%`,
            backgroundColor: strengthColor,
          }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      <div className="space-y-[2px]">
        {rules.map((r, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 text-[10px] ${
              r.valid ? "text-success" : "text-muted opacity-70"
            }`}
          >
            {r.valid ? "✓" : "○"} {r.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Main ---------------- */

export default function Step1Account({ form, errors, update, next }: any) {
  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);

  const [emailStatus, setEmailStatus] = useState<
    "idle" | "loading" | "taken" | "valid"
  >("idle");

  useEffect(() => {
    if (!form.email || !isValidEmail(form.email)) {
      setEmailStatus("idle");
      return;
    }

    setEmailStatus("loading");

    const timer = setTimeout(() => {
      if (form.email.includes("test")) {
        setEmailStatus("taken");
      } else {
        setEmailStatus("valid");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.email]);

  const isValid =
    form.fullName &&
    form.email &&
    form.password &&
    !errors.fullName &&
    !errors.password &&
    emailStatus === "valid";

  return (
    <div className="form-card motion-scale-in shadow-lg p-4">
      {/* Header */}
      <div className="form-header mb-1.5">
        <h2 className="form-title">Create your account</h2>
        <p className="form-subtitle">Get started in under a minute</p>
      </div>

      {/* Form */}
      <div className="form-section space-y-3">
        <InputField
          label="Full Name"
          value={form.fullName}
          error={errors.fullName}
          successText="Nice! That works"
          placeholder="Enter your full name"
          onChange={(e: any) => update("fullName", e.target.value)}
          onEnter={() => emailRef.current?.focus()}
        />

        <InputField
          label="Work Email"
          value={form.email}
          error={errors.email}
          successText="Perfect, email looks valid"
          placeholder="you@company.com"
          asyncStatus={emailStatus}
          onChange={(e: any) => update("email", e.target.value)}
          inputRef={emailRef}
          onEnter={() => passwordRef.current?.focus()}
        />

        <PasswordField
          value={form.password}
          error={errors.password}
          onChange={(e: any) => update("password", e.target.value)}
          inputRef={passwordRef}
        />
      </div>

      {/* CTA */}
      <div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: isValid ? 1.02 : 1 }}
          onClick={next}
          disabled={!isValid}
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-white transition
            ${
              isValid
                ? "bg-primary shadow-md"
                : "bg-primary/40 text-white/70 cursor-not-allowed"
            }
          `}
        >
          Continue <ArrowRight size={15} />
        </motion.button>

        <p className="text-center mt-1.5 text-[9px] text-muted uppercase">
          No credit card required
        </p>
      </div>
    </div>
  );
}