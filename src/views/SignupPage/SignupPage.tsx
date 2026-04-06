import { useEffect, useState } from "react";
import Step1Account from "../../components/SignupPage/Step1Account";
import Step2Workspace from "../../components/SignupPage/Step2Workspace";
import Step3Review from "../../components/SignupPage/Step3Review";
import Stepper from "../../components/SignupPage/Stepper";
import SuccessScreen from "../../components/SignupPage/SuccessScreen";
import { createSite } from "../../api/createSite";

// ---------------- API TOGGLE ----------------

// 👉 Switch this to false when backend is ready
const USE_MOCK_API = true;

// ---------------- MOCK API ----------------

const mockCreateSite = async () => {
  return new Promise<{ message: { status: string; message?: string } }>((resolve) => {
    setTimeout(() => {
      resolve({
        message: {
          status: "accepted",
        },
      });
    }, 1500); // simulate delay
  });
};

// ---------------- CONSTANTS ----------------



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

const timezones = Intl.supportedValuesOf("timeZone");

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
  const [countriesError, setCountriesError] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [countryList, setCountryList] = useState<string[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState("");

  const [editing, setEditing] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<Record<string, string>>({
    fullName: "",
    email: "",
    password: "",
    company: "",
    abbr: "",
    country: "",
    timezone: "Asia/Kolkata",
    currency: "INR",
    fyStart: "2025-04-01",
    fyEnd: "2026-03-31",
  });

  // ---------------- UPDATE ----------------

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));

    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  // ---------------- DERIVED LOGIC ----------------

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      abbr: generateAbbr(prev.company),
    }));
  }, [form.company]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setCountriesLoading(true);
        setCountriesError("");

        const cached = localStorage.getItem("countries");

        if (cached) {
          setCountryList(JSON.parse(cached));
          setCountriesLoading(false);
          return;
        }

        const res = await fetch("https://restcountries.com/v3.1/all?fields=name");
        const data = await res.json();

        const countries = data
          .map((c: any) => c.name.common)
          .sort((a: string, b: string) => a.localeCompare(b));

        setCountryList(countries);
        localStorage.setItem("countries", JSON.stringify(countries));
      } catch (err) {
  console.error("Failed to fetch countries", err);
  setCountriesError("Failed to load countries. Please refresh.");
} finally {
        setCountriesLoading(false);
      }
    };

    fetchCountries();
  }, []);

  useEffect(() => {
  const fy = getFYDates(form.country);
  const newCurrency = currencyByCountry[form.country] || "USD";

  setForm((prev) => {
    if (
      prev.currency === newCurrency &&
      prev.fyStart === fy.start &&
      prev.fyEnd === fy.end
    ) {
      return prev; // 🚀 prevents unnecessary re-render
    }

    return {
      ...prev,
      currency: newCurrency,
      fyStart: fy.start,
      fyEnd: fy.end,
    };
  });
}, [form.country]);

  useEffect(() => {
  if (countryList.length && !form.country) {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const region = locale.split("-")[1]; // e.g. en-IN → IN

    const regionMap: Record<string, string> = {
      IN: "India",
      US: "United States",
    };

    const detectedCountry = regionMap[region] || "United States";

    setForm((prev) => ({
      ...prev,
      country: detectedCountry,
    }));
  }
}, [countryList.length]);

  // ---------------- VALIDATION ----------------

  const validateStep1 = () => {
    const err: Record<string, string> = {};

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
    const err: Record<string, string> = {};

    if (!form.company.trim()) err.company = "Company required";
    if (!form.abbr.trim()) err.abbr = "Abbreviation required";

    if (form.fyStart >= form.fyEnd)
      err.fyEnd = "End must be after start";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // ---------------- SUBMIT (API SWITCH) ----------------

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
          company_abbr: form.abbr.trim().toUpperCase(),
          chart_of_accounts: "Standard",
          fy_start_date: form.fyStart,
          fy_end_date: form.fyEnd,
          setup_demo: 0,
          apps: [],
        });

      if (res?.message?.status === "accepted") {
        setSuccess(true);
      } else {
        setApiError(res?.message?.message || "Something went wrong");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setApiError(err.message || "Network error");
      } else {
        setApiError("Unexpected error occurred");
      }
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

        {/* STEP 1 */}
        {step === 1 && (
          <Step1Account
            form={form}
            errors={errors}
            update={update}
            next={() => {
              if (validateStep1()) setStep(2);
            }}
          />
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <Step2Workspace
            form={form}
            errors={errors}
            update={update}
            next={() => {
              if (validateStep2()) setStep(3);
            }}
            back={() => setStep(1)}
            countryList={countryList}
            countriesLoading ={countriesLoading}
            countriesError={countriesError}
            timezones={timezones}
            currencyOptions={[...new Set(Object.values(currencyByCountry))]}
          />
        )}

        {/* STEP 3 */}
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