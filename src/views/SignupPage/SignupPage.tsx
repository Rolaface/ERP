import { useEffect, useState } from "react";
import Step1Account from "../../components/SignupPage/Step1Account";
import Step2Workspace from "../../components/SignupPage/Step2Workspace";
import Step3Review from "../../components/SignupPage/Step3Review";
import Stepper from "../../components/SignupPage/Stepper";
import SuccessScreen from "../../components/SignupPage/SuccessScreen";
import { createSite } from "../../api/createSite";
import { useCountries } from "../../hooks/useCountries";

// ---------------- API TOGGLE ----------------
const USE_MOCK_API = true;

// ---------------- MOCK API ----------------
const mockCreateSite = async () => {
  return new Promise<{ message: { status: string } }>((resolve) => {
    setTimeout(() => {
      resolve({ message: { status: "accepted" } });
    }, 1500);
  });
};

// ---------------- HELPERS ----------------
const generateAbbr = (name: string): string => {
  if (!name.trim()) return "";
  const words = name.replace(/[,.]/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
};

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ---------------- COMPONENT ----------------

export default function SignupPage() {
  const { countries, loading: countriesLoading, error: countriesError, detected } = useCountries();

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
    country: "",
    timezone: "",
    currency: "",
    fyStart: "",
    fyEnd: "",
    chartOfAccounts: "Standard",
  });

  // ---------------- UPDATE ----------------
  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  // ---------------- DERIVED ----------------

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      abbr: generateAbbr(prev.company),
    }));
  }, [form.company]);

  useEffect(() => {
    if (!form.country && detected.country) {
      setForm((prev) => ({
        ...prev,
        country: detected.country,
        currency: detected.currency,
        timezone: detected.timezone,
      }));
    }
  }, [detected]);

  useEffect(() => {
    if (!form.country) return;

    const isIndia = form.country === "India";

    const fy = isIndia
      ? { start: "2025-04-01", end: "2026-03-31" }
      : { start: "2025-01-01", end: "2025-12-31" };

    setForm((prev) => {
      if (prev.fyStart === fy.start && prev.fyEnd === fy.end) return prev;
      return { ...prev, fyStart: fy.start, fyEnd: fy.end };
    });
  }, [form.country]);

  // ---------------- VALIDATION ----------------

  const validateStep1 = () => {
    const err: Record<string, string> = {};
    if (!form.fullName.trim()) err.fullName = "Required";
    if (!form.email.trim()) err.email = "Required";
    else if (!isValidEmail(form.email)) err.email = "Invalid";
    if (!form.password || form.password.length < 8) err.password = "Min 8 chars";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateStep2 = () => {
  const err: Record<string, string> = {};

  if (!form.company.trim()) err.company = "Required";
  if (!form.abbr.trim()) err.abbr = "Required";
  if (!form.country) err.country = "Required";
  if (!form.timezone) err.timezone = "Required";
  if (!form.currency) err.currency = "Required";
  if (!form.fyStart) err.fyStart = "Required";
  if (!form.fyEnd) err.fyEnd = "Required";

  if (form.fyStart && form.fyEnd && form.fyStart >= form.fyEnd) {
    err.fyEnd = "Invalid range";
  }

  setErrors(err);
  return Object.keys(err).length === 0;
};

  // ---------------- SUBMIT ----------------

  const handleSubmit = async () => {
    setLoading(true);
    setApiError("");

    try {
      const res = USE_MOCK_API
        ? await mockCreateSite()
        : await createSite({
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

      if (res?.message?.status === "accepted") setSuccess(true);
      else setApiError("Something went wrong");
    } catch (err: any) {
      setApiError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  if (success) return <SuccessScreen />;

  // ---------------- SMART NAVIGATION ----------------
  const handleStepChange = (targetStep: number) => {
    if (targetStep < step) {
      setStep(targetStep as 1 | 2 | 3);
    }
  };

  // ---------------- RENDER ----------------

  return (
   <div className="signup-page min-h-screen flex items-start justify-center px-4 pt-20">
      <div className="w-full max-w-md">

        {/* 🔥 SINGLE CARD SHELL */}
        <div className="form-card form-card--md">

          {/* STEPper */}
          <div className="pt-3 pb-3 px-6 border-b border-gray-100">
            <Stepper step={step} onStepChange={handleStepChange} />
          </div>

          {/* CONTENT */}
          <div className="px-6 pb-6 step-content">

            

            {step === 1 && (
              <Step1Account
                form={form}
                errors={errors}
                update={update}
                next={() => validateStep1() && setStep(2)}
              />
            )}

            {step === 2 && (
              <Step2Workspace
                form={form}
                errors={errors}
                update={update}
                next={() => validateStep2() && setStep(3)}
                back={() => setStep(1)}
                countryList={countries}
                countriesLoading={countriesLoading}
                countriesError={countriesError}
                timezones={Intl.supportedValuesOf("timeZone")}
                currencyOptions={[form.currency]}
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

      </div>
    </div>
  );
}