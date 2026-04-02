import { useEffect, useState } from "react";
import Step1Account
 from "../../components/SignupPage/Step1Account";
import Step2Workspace from "../../components/SignupPage/Step2Workspace";
import Step3Review from "../../components/SignupPage/Step3Review";
import Stepper from "../../components/SignupPage/Stepper";
import { createSite } from "../../api/createSite";

// ---------------- HELPERS ----------------

const generateAbbr = (name: string): string => {
  if (!name.trim()) return "";
  const words = name.replace(/[,.]/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
};

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const currencyByCountry: Record<string, string> = {
  India: "INR",
  "United States": "USD",
};

const getFYDates = (country: string) => {
  if (country === "India") {
    return { start: "2025-04-01", end: "2026-03-31" };
  }
  return { start: "2025-01-01", end: "2025-12-31" };
};

// ---------------- COMPONENT ----------------

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState("");

  const [editing, setEditing] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    company: "",
    abbr: "",
    country: "India",
    timezone: "Asia/Kolkata",
    currency: "INR",
    fyStart: "2025-04-01",
    fyEnd: "2026-03-31",
  });

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ---------------- DERIVED LOGIC ----------------

  useEffect(() => {
    update("abbr", generateAbbr(form.company));
  }, [form.company]);

  useEffect(() => {
    update("currency", currencyByCountry[form.country]);
    const fy = getFYDates(form.country);
    update("fyStart", fy.start);
    update("fyEnd", fy.end);
  }, [form.country]);

  // ---------------- VALIDATION ----------------

  const validateStep1 = () => {
    const err: any = {};

    if (!form.fullName.trim()) err.fullName = "Full name is required";
    if (!form.email.trim()) err.email = "Email is required";
    else if (!isValidEmail(form.email)) err.email = "Invalid email";

    if (!form.password) err.password = "Password required";
    else if (form.password.length < 8)
      err.password = "Min 8 characters";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateStep2 = () => {
    const err: any = {};

    if (!form.company.trim()) err.company = "Company required";
    if (!form.abbr.trim()) err.abbr = "Abbreviation required";

    if (form.fyStart >= form.fyEnd)
      err.fyEnd = "End must be after start";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // ---------------- SUBMIT ----------------

  const handleSubmit = async () => {
    setLoading(true);
    setApiError("");

    try {
      const res = await createSite({
        currency: form.currency,
        country: form.country,
        timezone: form.timezone,
        language: "en",
        full_name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        company_name: form.company.trim(),
        company_abbr: form.abbr.trim(),
        chart_of_accounts: "Standard",
        fy_start_date: form.fyStart,
        fy_end_date: form.fyEnd,
        setup_demo: 0,
        apps: [],
      });

      if (res.message?.status === "accepted") {
        setSuccess(true);
      } else {
        setApiError(res.message?.message || "Something went wrong");
      }
    } catch (err: any) {
      setApiError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- SUCCESS ----------------

  if (success) return <SuccessScreen />;

  // ---------------- RENDER ----------------

  return (
    <div className="signup-page min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="heading-lg">Sign Up</h1>
          <Stepper step={step} />
        </div>

        {/* STEPS */}
        {step === 1 && (
          <Step1Account
            form={form}
            update={update}
            errors={errors}
            next={() => {
              if (validateStep1()) setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <Step2Workspace
            form={form}
            update={update}
            errors={errors}
            next={() => {
              if (validateStep2()) setStep(3);
            }}
            back={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <Step3Review
            form={form}
            update={update}
            editing={editing}
            setEditing={setEditing}
            back={() => setStep(2)}
            submit={handleSubmit}
            loading={loading}
            apiError={apiError}
          />
        )}

      </div>
    </div>
  );
}