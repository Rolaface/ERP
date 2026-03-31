import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ArrowRight, ArrowLeft, Pencil, Check, Loader2, Clock } from "lucide-react";
import { createSite } from "../../api/createSite";

// ---------------- HELPERS ----------------

const generateAbbr = (name: string): string => {
  if (!name.trim()) return "";
  const words = name.replace(/[,.]/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
};

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const isStrongPassword = (pw: string): boolean => pw.length >= 8;

export const countryList = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "Singapore",
  "UAE",
  "Japan",
  "China",
  "Brazil",
] as const;

type Country = (typeof countryList)[number];

const currencyByCountry: Record<Country, string> = {
  India: "INR",
  "United States": "USD",
  "United Kingdom": "GBP",
  Canada: "CAD",
  Australia: "AUD",
  Germany: "EUR",
  France: "EUR",
  Spain: "EUR",
  Italy: "EUR",
  Netherlands: "EUR",
  Singapore: "SGD",
  UAE: "AED",
  Japan: "JPY",
  China: "CNY",
  Brazil: "BRL",
};

const chartOfAccountsByCountry: Record<Country, string> = Object.fromEntries(
  countryList.map((c) => [c, `${c.replace(/ /g, "+")}+-+Chart+of+Accounts`])
) as Record<Country, string>;

const defaultTimezoneByCountry: Partial<Record<Country, string>> = {
  India: "Asia/Kolkata",
  "United States": "America/New_York",
  "United Kingdom": "Europe/London",
  Canada: "America/Toronto",
  Australia: "Australia/Sydney",
  Germany: "Europe/Berlin",
  France: "Europe/Paris",
  Spain: "Europe/Madrid",
  Italy: "Europe/Rome",
  Netherlands: "Europe/Amsterdam",
  Singapore: "Asia/Singapore",
  UAE: "Asia/Dubai",
  Japan: "Asia/Tokyo",
  China: "Asia/Shanghai",
  Brazil: "America/Sao_Paulo",
};

const getFYDates = (country: Country): { start: string; end: string } => {
  if (country === "India") return { start: "2025-04-01", end: "2026-03-31" };
  return { start: "2025-01-01", end: "2025-12-31" };
};

const timezones: string[] = Intl.supportedValuesOf("timeZone");

// ---------------- ANIMATION ----------------

const slideVariants: Variants = {
  initial: (dir: number) => ({ opacity: 0, x: dir * 48 }),
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -48,
    transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] },
  }),
};

// ---------------- TYPES ----------------

interface Step1Fields {
  fullName: string;
  email: string;
  password: string;
}

interface Step2Fields {
  company: string;
  abbr: string;
  country: Country;
  timezone: string;
  currency: string;
  chart: string;
  fyStart: string;
  fyEnd: string;
}

interface FieldErrors {
  [key: string]: string;
}

// ---------------- COMPONENT ----------------

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);
  const [createdSite, setCreatedSite] = useState("");

  // Step 1
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2
  const [company, setCompany] = useState("");
  const [abbr, setAbbr] = useState("");
  const [country, setCountry] = useState<Country>("India");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [currency, setCurrency] = useState("INR");
  const [chart, setChart] = useState(chartOfAccountsByCountry["India"]);
  const [fyStart, setFyStart] = useState("2025-04-01");
  const [fyEnd, setFyEnd] = useState("2026-03-31");

  // Validation
  const [step1Errors, setStep1Errors] = useState<FieldErrors>({});
  const [step2Errors, setStep2Errors] = useState<FieldErrors>({});
  const [editing, setEditing] = useState<string | null>(null);

  // ---------------- EFFECTS ----------------

  useEffect(() => {
    // Try to detect local timezone on mount, fallback gracefully
    try {
      const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (localTz && timezones.includes(localTz)) setTimezone(localTz);
    } catch {
      setTimezone("Asia/Kolkata");
    }
  }, []);

  useEffect(() => {
    setCurrency(currencyByCountry[country]);
    setChart(chartOfAccountsByCountry[country]);
    const fy = getFYDates(country);
    setFyStart(fy.start);
    setFyEnd(fy.end);
    const tz = defaultTimezoneByCountry[country];
    if (tz && timezones.includes(tz)) setTimezone(tz);
  }, [country]);

  useEffect(() => {
    setAbbr(generateAbbr(company));
  }, [company]);

  // ---------------- VALIDATION ----------------

  const validateStep1 = useCallback((): boolean => {
    const errors: FieldErrors = {};
    if (!fullName.trim()) errors.fullName = "Full name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!isValidEmail(email)) errors.email = "Enter a valid email address";
    if (!password) errors.password = "Password is required";
    else if (!isStrongPassword(password))
      errors.password = "Password must be at least 8 characters";
    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  }, [fullName, email, password]);

  const validateStep2 = useCallback((): boolean => {
    const errors: FieldErrors = {};
    if (!company.trim()) errors.company = "Company name is required";
    if (!abbr.trim()) errors.abbr = "Abbreviation is required";
    if (!fyStart) errors.fyStart = "FY start date is required";
    if (!fyEnd) errors.fyEnd = "FY end date is required";
    if (fyStart && fyEnd && fyStart >= fyEnd)
      errors.fyEnd = "FY end date must be after start date";
    setStep2Errors(errors);
    return Object.keys(errors).length === 0;
  }, [company, abbr, fyStart, fyEnd]);

  // ---------------- NAVIGATION ----------------

  const goNext = (nextStep: 1 | 2 | 3) => {
    setDirection(1);
    setApiError("");
    setStep(nextStep);
  };

  const goBack = (prevStep: 1 | 2 | 3) => {
    setDirection(-1);
    setApiError("");
    setStep(prevStep);
  };

  const handleStep1Next = () => {
    if (validateStep1()) goNext(2);
  };

  const handleStep2Next = () => {
    if (validateStep2()) goNext(3);
  };

  // ---------------- SUBMIT ----------------

  const handleConfirm = async () => {
    setLoading(true);
    setApiError("");

    try {
      const res = await createSite({
        currency,
        country,
        timezone,
        language: "en",
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        company_name: company.trim(),
        company_abbr: abbr.trim().toUpperCase(),
        chart_of_accounts: chart,
        fy_start_date: fyStart,
        fy_end_date: fyEnd,
        setup_demo: 0,
        apps: [],
      });

      if (res.message?.status === "accepted") {
        setCreatedSite(res.message?.site ?? "");
        setSuccess(true);
      } else {
        setApiError(res.message?.message || "Something went wrong. Please try again.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setApiError(err.message || "Network error. Please check your connection.");
      } else {
        setApiError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------- STYLES ----------------

  const inputBase =
    "w-full bg-white border rounded-[14px] px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition placeholder:text-gray-300";

  const inputNormal = `${inputBase} border-gray-200`;
  const inputError = `${inputBase} border-red-400 focus:ring-red-400/20 focus:border-red-400`;

  const labelClass = "text-[11px] uppercase tracking-wider text-gray-500 font-semibold ml-1 mb-1 block";
  const errorClass = "text-red-500 text-xs mt-1 ml-1";

  // ---------------- SUCCESS SCREEN ----------------

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7f8fb] to-[#eef2f7] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="w-full max-w-[460px] bg-white rounded-[24px] p-10 shadow-[0_10px_40px_rgba(0,0,0,0.08)] text-center"
        >
          {/* Animated checkmark */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
              >
                <Check className="text-indigo-600" size={32} strokeWidth={2.5} />
              </motion.div>
            </div>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight mb-2">You're all set!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your workspace is being provisioned. This usually takes{" "}
            <span className="font-medium text-gray-700">2–5 minutes</span>.
          </p>

          {/* Pulsing progress indicator */}
          <div className="bg-indigo-50 rounded-[16px] px-6 py-5 mb-6 text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600" />
              </div>
              <span className="text-sm font-medium text-indigo-700">Site provisioning in progress…</span>
            </div>
            {createdSite && (
              <p className="text-xs text-indigo-500 ml-6">
                Your site:{" "}
                <span className="font-semibold text-indigo-700 break-all">{createdSite}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
            <Clock size={13} />
            <span>You'll be able to log in once provisioning is complete.</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---------------- REVIEW ROWS ----------------

  const reviewRows: Array<{
    label: string;
    val: string;
    set: (v: string) => void;
    key: string;
    type?: string;
  }> = [
    { label: "Full Name", val: fullName, set: setFullName, key: "name" },
    { label: "Email", val: email, set: setEmail, key: "email", type: "email" },
    { label: "Company", val: company, set: setCompany, key: "company" },
    { label: "Abbr", val: abbr, set: setAbbr, key: "abbr" },
    { label: "Country", val: country, set: () => {}, key: "country" }, // not editable inline
    { label: "Timezone", val: timezone, set: setTimezone, key: "tz" },
    { label: "Currency", val: currency, set: setCurrency, key: "cur" },
    { label: "FY Start", val: fyStart, set: setFyStart, key: "start", type: "date" },
    { label: "FY End", val: fyEnd, set: setFyEnd, key: "end", type: "date" },
  ];

  // ---------------- RENDER ----------------

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7f8fb] to-[#eef2f7] px-4 py-12">
      <div className="w-full max-w-[500px]">

        {/* HEADER */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold tracking-tight">Sign Up</h1>

          {/* STEPPER */}
          <div className="flex items-center justify-center gap-4 mt-6">
            {([1, 2, 3] as const).map((s) => (
              <React.Fragment key={s}>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                    ${step > s
                      ? "bg-indigo-600 text-white"
                      : step === s
                      ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                      : "bg-gray-200 text-gray-400"
                    }`}
                >
                  {step > s ? <Check size={12} strokeWidth={3} /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-10 h-[2px] transition-all duration-500 ${step > s ? "bg-indigo-600" : "bg-gray-200"}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* CARD */}
        <div className="bg-white rounded-[24px] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.06)] overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-semibold mb-1">Create your account</h2>
                  <p className="text-sm text-gray-500">Start your journey</p>
                </div>

                {/* Full Name */}
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input
                    className={step1Errors.fullName ? inputError : inputNormal}
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (step1Errors.fullName) setStep1Errors((p) => ({ ...p, fullName: "" }));
                    }}
                  />
                  {step1Errors.fullName && <p className={errorClass}>{step1Errors.fullName}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    className={step1Errors.email ? inputError : inputNormal}
                    placeholder="you@company.com"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (step1Errors.email) setStep1Errors((p) => ({ ...p, email: "" }));
                    }}
                  />
                  {step1Errors.email && <p className={errorClass}>{step1Errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className={labelClass}>Password</label>
                  <input
                    className={step1Errors.password ? inputError : inputNormal}
                    placeholder="Min. 8 characters"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (step1Errors.password) setStep1Errors((p) => ({ ...p, password: "" }));
                    }}
                  />
                  {step1Errors.password && <p className={errorClass}>{step1Errors.password}</p>}
                  {/* Strength indicator */}
                  {password.length > 0 && (
                    <div className="flex gap-1 mt-2 ml-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            password.length >= [4, 8, 12, 16][i]
                              ? ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"][i]
                              : "bg-gray-100"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleStep1Next}
                  className="w-full bg-indigo-600 text-white py-4 rounded-[14px] flex items-center justify-center gap-2 font-medium hover:bg-indigo-700 active:scale-[0.99] transition-all duration-150 mt-2"
                >
                  Next <ArrowRight size={16} />
                </button>
              </motion.div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-semibold mb-1">Workspace Setup</h2>
                  <p className="text-sm text-gray-500">Tell us about your company</p>
                </div>

                {/* Company Name + Abbr */}
                <div>
                  <label className={labelClass}>Company Name</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <input
                        className={step2Errors.company ? inputError : inputNormal}
                        placeholder="Acme Corp."
                        value={company}
                        onChange={(e) => {
                          setCompany(e.target.value);
                          if (step2Errors.company) setStep2Errors((p) => ({ ...p, company: "" }));
                        }}
                      />
                      {step2Errors.company && <p className={errorClass}>{step2Errors.company}</p>}
                    </div>
                    <div>
                      <input
                        className={`${step2Errors.abbr ? inputError : inputNormal} bg-gray-50 text-center font-mono font-bold tracking-widest`}
                        value={abbr}
                        maxLength={5}
                        placeholder="ACM"
                        onChange={(e) => {
                          setAbbr(e.target.value.toUpperCase());
                          if (step2Errors.abbr) setStep2Errors((p) => ({ ...p, abbr: "" }));
                        }}
                      />
                      {step2Errors.abbr && <p className={errorClass}>{step2Errors.abbr}</p>}
                    </div>
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label className={labelClass}>Country</label>
                  <select
                    className={inputNormal}
                    value={country}
                    onChange={(e) => setCountry(e.target.value as Country)}
                  >
                    {countryList.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Timezone + Currency */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Timezone</label>
                    <select
                      className={inputNormal}
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                    >
                      {timezones.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Currency</label>
                    <select
                      className={inputNormal}
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      {[...new Set(Object.values(currencyByCountry))].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Chart of Accounts */}
                <div>
                  <label className={labelClass}>Chart of Accounts</label>
                  <select
                    className={inputNormal}
                    value={chart}
                    onChange={(e) => setChart(e.target.value)}
                  >
                    {Object.entries(chartOfAccountsByCountry).map(([k, v]) => (
                      <option key={k} value={v}>{k}</option>
                    ))}
                  </select>
                </div>

                {/* FY Dates */}
                <div>
                  <label className={labelClass}>Financial Year</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="date"
                        className={step2Errors.fyStart ? inputError : inputNormal}
                        value={fyStart}
                        onChange={(e) => {
                          setFyStart(e.target.value);
                          if (step2Errors.fyStart) setStep2Errors((p) => ({ ...p, fyStart: "" }));
                        }}
                      />
                      {step2Errors.fyStart && <p className={errorClass}>{step2Errors.fyStart}</p>}
                    </div>
                    <div>
                      <input
                        type="date"
                        className={step2Errors.fyEnd ? inputError : inputNormal}
                        value={fyEnd}
                        onChange={(e) => {
                          setFyEnd(e.target.value);
                          if (step2Errors.fyEnd) setStep2Errors((p) => ({ ...p, fyEnd: "" }));
                        }}
                      />
                      {step2Errors.fyEnd && <p className={errorClass}>{step2Errors.fyEnd}</p>}
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => goBack(1)}
                    className="flex items-center gap-2 px-5 py-4 rounded-[14px] border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 active:scale-[0.99] transition-all"
                  >
                    <ArrowLeft size={15} /> Back
                  </button>
                  <button
                    onClick={handleStep2Next}
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-[14px] flex items-center justify-center gap-2 font-medium hover:bg-indigo-700 active:scale-[0.99] transition-all"
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-semibold mb-1">Review & Confirm</h2>
                  <p className="text-sm text-gray-500">Double-check your details before we create your site</p>
                </div>

                {/* Review list */}
                <div className="rounded-[16px] border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                  {reviewRows.map(({ label, val, set, key, type }) => (
                    <div key={key} className="flex justify-between items-center px-4 py-3 bg-gray-50/50 gap-3">
                      <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold w-20 shrink-0">
                        {label}
                      </span>

                      {editing === key ? (
                        <input
                          value={val}
                          type={type ?? "text"}
                          onChange={(e) => set(e.target.value)}
                          onBlur={() => setEditing(null)}
                          onKeyDown={(e) => e.key === "Enter" && setEditing(null)}
                          className="flex-1 text-sm border border-indigo-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 bg-white"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className="text-sm font-medium text-gray-800 text-right break-all">{val || "—"}</span>
                          {/* Only allow editing for non-derived fields */}
                          {key !== "country" && (
                            <button
                              onClick={() => setEditing(key)}
                              className="text-gray-300 hover:text-indigo-500 transition-colors shrink-0"
                              title={`Edit ${label}`}
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* API Error */}
                {apiError && (
                  <div className="bg-red-50 border border-red-100 rounded-[12px] px-4 py-3 text-sm text-red-600">
                    {apiError}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => goBack(2)}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-4 rounded-[14px] border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    <ArrowLeft size={15} /> Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-[14px] flex items-center justify-center gap-2 font-medium hover:bg-indigo-700 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Creating…
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Confirm & Create Site
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}