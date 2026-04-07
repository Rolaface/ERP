import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import FormFieldPro from "../Form/FormFieldV2";
import ButtonPro from "../Form/ButtonPro";

/* ---------------- Utils ---------------- */
const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

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
    <div className="space-y-2">
      <FormFieldPro
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
            className="text-muted hover:text-primary transition-colors"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />

      {/* Strength Bar */}
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full"
          animate={{
            width: `${(strength / 3) * 100}%`,
            backgroundColor: strengthColor,
          }}
        />
      </div>

      {/* Rules */}
      <div className="space-y-1">
        {rules.map((r, i) => (
          <div
            key={i}
            className={`text-[10px] ${
              r.valid ? "text-success" : "text-muted"
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

  const [loading, setLoading] = useState(false);

  /* ---------------- Email Async Validation ---------------- */
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

  /* ---------------- Validation ---------------- */
  const isValid =
    form.fullName &&
    form.email &&
    form.password &&
    !errors.fullName &&
    !errors.password &&
    emailStatus === "valid";

  /* ---------------- Handle Continue ---------------- */
  const handleContinue = async () => {
    if (!isValid) return;

    setLoading(true);

    // simulate async (API / navigation)
    setTimeout(() => {
      setLoading(false);
      next();
    }, 600);
  };

  return (
    <div className="form-card-v2 motion-scale-in space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="form-title-v2">Create your account</h2>
        <p className="form-subtitle-v2">
          Get started in under a minute
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <FormFieldPro
          label="Full Name"
          value={form.fullName}
          error={errors.fullName}
          successText="Nice! That works"
          placeholder="Enter your full name"
          onChange={(e: any) => update("fullName", e.target.value)}
          onEnter={() => emailRef.current?.focus()}
        />

        <FormFieldPro
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
      <div className="space-y-2">
        <ButtonPro
          onClick={handleContinue}
          disabled={!isValid}
          loading={loading}
          rightIcon={<ArrowRight size={14} />}
          fullWidth
        >
          Continue
        </ButtonPro>

        <p className="text-center text-[10px] text-muted uppercase">
          No credit card required
        </p>
      </div>
    </div>
  );
}