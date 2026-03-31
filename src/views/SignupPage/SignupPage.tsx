import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Pencil } from "lucide-react";
import { createSite } from "../../api/createSite";

// ---- Helpers ----

// Improved abbreviation logic
const generateAbbr = (name: string) => {
  if (!name) return "";

  const words = name
    .replace(/[,\.]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();

  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
};

const countryList = [
  "India", "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Spain", "Italy", "Netherlands", "Singapore",
  "UAE", "Japan", "China", "Brazil",
];

const currencyByCountry: Record<string, string> = {
  India: "INR", "United States": "USD", "United Kingdom": "GBP",
  Canada: "CAD", Australia: "AUD", Germany: "EUR", France: "EUR",
  Spain: "EUR", Italy: "EUR", Netherlands: "EUR", Singapore: "SGD",
  UAE: "AED", Japan: "JPY", China: "CNY", Brazil: "BRL",
};

const chartOfAccountsByCountry: Record<string, string> = Object.fromEntries(
  countryList.map((c) => [c, `${c}+-+Chart+of+Accounts`])
);

const timezones = Intl.supportedValuesOf("timeZone");

const getFYDates = (country: string) => {
  if (country === "India") {
    return { start: "2025-04-01", end: "2026-03-31" };
  }
  return { start: "2025-01-01", end: "2025-12-31" };
};

// ---- Animation ----
const formVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export default function SignupPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [company, setCompany] = useState("");
  const [abbr, setAbbr] = useState("");

  const [country, setCountry] = useState("India");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [currency, setCurrency] = useState("INR");
  const [chart, setChart] = useState(chartOfAccountsByCountry["India"]);

  const [fyStart, setFyStart] = useState("2025-04-01");
  const [fyEnd, setFyEnd] = useState("2026-03-31");

  const [editingField, setEditingField] = useState<string | null>(null);

  // ---- Effects ----

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  useEffect(() => {
    setCurrency(currencyByCountry[country]);
    setChart(chartOfAccountsByCountry[country]);

    const fy = getFYDates(country);
    setFyStart(fy.start);
    setFyEnd(fy.end);

    // Auto timezone guess (basic fallback)
    if (country === "India") setTimezone("Asia/Kolkata");
  }, [country]);

  useEffect(() => {
    setAbbr(generateAbbr(company));
  }, [company]);

  // ---- Handlers ----

  const handleConfirm = async () => {
    setLoading(true);
    setError("");

    try {
      const payload = {
        currency,
        country,
        timezone,
        full_name: fullName,
        email,
        password,
        company_name: company,
        company_abbr: abbr,
        chart_of_accounts: chart,
        fy_start_date: fyStart,
        fy_end_date: fyEnd,
      };

      const result = await createSite(payload);

      if (result.message?.status === "accepted") {
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setError(result.message?.message || "Unexpected response");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reviewField = (
    label: string,
    value: string,
    fieldKey: string,
    setter: (val: string) => void
  ) => (
    <div className="flex justify-between items-center">
      <span className="text-gray-600">{label}</span>

      {editingField === fieldKey ? (
        <input
          value={value}
          onChange={(e) => setter(e.target.value)}
          onBlur={() => setEditingField(null)}
          className="border px-2 py-1 rounded"
          autoFocus
        />
      ) : (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
          <Pencil
            size={14}
            className="cursor-pointer opacity-60 hover:opacity-100"
            onClick={() => setEditingField(fieldKey)}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f8fb] px-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl p-8">

        <AnimatePresence mode="wait">

          {/* STEP 1 */}
          {step === 1 && (
            <motion.form
              key="1"
              variants={formVariants}
              initial="enter"
              animate="center"
              exit="exit"
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
              }}
              className="space-y-5"
            >
              <h2 className="text-xl font-semibold text-center">
                Create your account
              </h2>

              <input placeholder="Full Name" value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input" />

              <input placeholder="Email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input" />

              <input type="password" placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input" />

              <button className="btn-primary flex items-center justify-center gap-2">
                Next <ArrowRight size={16} />
              </button>
            </motion.form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <motion.div key="2" variants={formVariants} initial="enter" animate="center" exit="exit" className="space-y-4">

              <h2 className="text-xl font-semibold text-center">Workspace Setup</h2>

              <input placeholder="Company Name" value={company}
                onChange={(e) => setCompany(e.target.value)} className="input" />

              <input value={abbr} readOnly className="input bg-gray-100" />

              <select value={country} onChange={(e) => setCountry(e.target.value)} className="input">
                {countryList.map(c => <option key={c}>{c}</option>)}
              </select>

              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="input">
                {timezones.map(t => <option key={t}>{t}</option>)}
              </select>

              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input">
                {Object.values(currencyByCountry).map(c => <option key={c}>{c}</option>)}
              </select>

              <select value={chart} onChange={(e) => setChart(e.target.value)} className="input">
                {Object.entries(chartOfAccountsByCountry).map(([k, v]) =>
                  <option key={k} value={v}>{k}</option>
                )}
              </select>

              <div className="flex gap-3">
                <input type="date" value={fyStart} onChange={(e) => setFyStart(e.target.value)} className="input" />
                <input type="date" value={fyEnd} onChange={(e) => setFyEnd(e.target.value)} className="input" />
              </div>

              <button onClick={() => setStep(3)} className="btn-primary">
                Continue
              </button>

            </motion.div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <motion.div key="3" variants={formVariants} initial="enter" animate="center" exit="exit" className="space-y-4">

              <h2 className="text-xl font-semibold text-center">Review & Confirm</h2>

              <div className="space-y-3 text-sm">
                {reviewField("Full Name", fullName, "name", setFullName)}
                {reviewField("Email", email, "email", setEmail)}
                {reviewField("Company", company, "company", setCompany)}
                {reviewField("Abbr", abbr, "abbr", setAbbr)}
                {reviewField("Country", country, "country", setCountry)}
                {reviewField("Timezone", timezone, "timezone", setTimezone)}
                {reviewField("Currency", currency, "currency", setCurrency)}
                {reviewField("Chart", chart, "chart", setChart)}
                {reviewField("FY Start", fyStart, "start", setFyStart)}
                {reviewField("FY End", fyEnd, "end", setFyEnd)}
              </div>

              {error && <div className="text-red-500">{error}</div>}

              <button
                onClick={handleConfirm}
                className="w-full btn-primary"
                disabled={loading}
              >
                {loading ? "Creating..." : "Confirm & Create Site"}
              </button>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}