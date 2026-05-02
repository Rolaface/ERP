import { useState, useRef, useEffect } from "react";
import FormFieldPro from "../Form/FormFieldV2";
import ButtonPro from "../Form/ButtonPro";
import { Eye, EyeOff } from "lucide-react";

const PERSONAL_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];

export default function Step1Account({ form, update, next }: any) {
  const [showPassword, setShowPassword] = useState(false);

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [emailStatus, setEmailStatus] = useState<
    "idle" | "checking" | "valid" | "personal"
  >("idle");

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  /* ---------------- VALIDATION ---------------- */

  const isNameValid = form.fullName?.length > 2;

  const isEmailFormatValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email || "");

  useEffect(() => {
    if (!isEmailFormatValid) {
      setEmailStatus("idle");
      return;
    }

    setEmailStatus("checking");

    const timeout = setTimeout(() => {
      const domain = form.email.split("@")[1];

      if (PERSONAL_DOMAINS.includes(domain)) {
        setEmailStatus("personal");
      } else {
        setEmailStatus("valid");
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [form.email]);

  const password = form.password || "";
  const confirmPassword = form.confirmPassword || "";

  const rules = {
    length: password.length >= 8,
    number: /\d/.test(password),
    uppercase: /[A-Z]/.test(password),
  };

  const passedRules = Object.values(rules).filter(Boolean).length;

  const getStrength = () => {
    if (passedRules === 0) return "";
    if (passedRules === 1) return "Weak";
    if (passedRules === 2) return "Medium";
    return "Strong";
  };

  const strength = getStrength();

  const getPasswordIssues = () => {
    const issues = [];
    if (!rules.length) issues.push("at least 8 characters");
    if (!rules.number) issues.push("a number");
    if (!rules.uppercase) issues.push("an uppercase letter");
    return issues;
  };

  const passwordIssues = getPasswordIssues();

  const isConfirmPasswordValid =
    confirmPassword.length > 0 && confirmPassword === password;

  const isFormValid =
    isNameValid &&
    isEmailFormatValid &&
    passedRules >= 2 &&
    isConfirmPasswordValid;

  const isCheckingEmail = emailStatus === "checking";

  /* ---------------- UX FLOW ---------------- */

  const handleKeyDown = (e: any, nextRef?: any) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextRef) nextRef.current?.focus();
      else if (isFormValid) next();
    }
  };

  /* ---------------- RENDER ---------------- */

  return (
    <div className="form-section">

      <FormFieldPro
        label="Full Name"
        value={form.fullName}
        inputRef={nameRef}
        onKeyDown={(e: any) => handleKeyDown(e, emailRef)}
        onChange={(e: any) => {
          update("fullName", e.target.value);
          setTouched((t) => ({ ...t, name: true }));
        }}
        placeholder="Enter your name"
        success={touched.name && isNameValid}
        error={
          touched.name && !isNameValid
            ? "Name must be at least 3 characters"
            : ""
        }
      />

      <FormFieldPro
        label="Work Email"
        value={form.email}
        inputRef={emailRef}
        onKeyDown={(e: any) => handleKeyDown(e, passwordRef)}
        onChange={(e: any) => {
          update("email", e.target.value);
          setTouched((t) => ({ ...t, email: true }));
        }}
        placeholder="you@company.com"
        success={touched.email && isEmailFormatValid}
        loading={emailStatus === "checking"}
        error={
          touched.email && !isEmailFormatValid
            ? "Enter a valid email address"
            : ""
        }
        helperText={
          touched.email && emailStatus === "personal"
            ? "Use your work email for better collaboration"
            : ""
        }
      />

      <FormFieldPro
        label="Password"
        type={showPassword ? "text" : "password"}
        value={form.password}
        inputRef={passwordRef}
        onKeyDown={(e: any) => handleKeyDown(e, confirmPasswordRef)}
        onChange={(e: any) => {
          update("password", e.target.value);
          setTouched((t) => ({ ...t, password: true }));
        }}
        placeholder="Create password"
        success={
          touched.password &&
          password.length > 0 &&
          rules.length &&
          rules.number &&
          rules.uppercase &&
          /[a-z]/.test(password) &&
          /[^A-Za-z0-9]/.test(password)
        }
        error={
          touched.password && password.length > 0 &&
            !(
              rules.length &&
              rules.number &&
              rules.uppercase &&
              /[a-z]/.test(password) &&
              /[^A-Za-z0-9]/.test(password)
            )
            ? `Missing: ${[
              !rules.length ? "8+ characters" : null,
              !/[a-z]/.test(password) ? "lowercase letter" : null,
              !rules.uppercase ? "uppercase letter" : null,
              !rules.number ? "number" : null,
              !/[^A-Za-z0-9]/.test(password) ? "special character" : null,
            ]
              .filter(Boolean)
              .join(", ")}`
            : ""
        }
        helperText={
          touched.password && password.length > 0
            ? `Use 8–16+ characters with uppercase, lowercase, number & symbol`
            : ""
        }
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="icon-button"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
      />

      <FormFieldPro
        label="Confirm Password"
        type={showPassword ? "text" : "password"}
        value={form.confirmPassword}
        inputRef={confirmPasswordRef}
        onKeyDown={(e: any) => handleKeyDown(e)}
        onChange={(e: any) => {
          update("confirmPassword", e.target.value);
          setTouched((t) => ({ ...t, confirmPassword: true }));
        }}
        placeholder="Re-enter password"
        success={touched.confirmPassword && isConfirmPasswordValid}
        error={
          touched.confirmPassword && !isConfirmPasswordValid
            ? "Passwords do not match"
            : ""
        }
      />

      <div className="form-footer">
        <ButtonPro
          type="button"
          onClick={next}
          disabled={!isFormValid || isCheckingEmail}
        >
          Continue
        </ButtonPro>

        <p className="form-helper" style={{ textAlign: "center" }}>
          No credit card required • We respect your privacy
        </p>
      </div>

    </div>
  );
}