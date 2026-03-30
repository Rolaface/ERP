import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// ---- Helpers ----
const getAbbr = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase())
    .join("");

const countryList = [
  "India", "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Spain", "Italy", "Netherlands", "Singapore",
  "UAE", "Japan", "China", "Brazil",
];

const currencyByCountry: Record<string, string> = {
  India: "INR", "United States": "USD", "United Kingdom": "GBP", "Canada": "CAD",
  Australia: "AUD", "Germany": "EUR", "France": "EUR", "Spain": "EUR",
  Italy: "EUR", "Netherlands": "EUR", "Singapore": "SGD", "UAE": "AED",
  Japan: "JPY", "China": "CNY", "Brazil": "BRL",
};

const languages = [
  "English", "Hindi", "Spanish", "French", "German", "Chinese", "Japanese", "Arabic", "Portuguese",
];

const getFYDates = (country: string) => {
  if (country === "India") return { start: "2024-04-01", end: "2025-03-31" };
  return { start: "2024-01-01", end: "2024-12-31" };
};

// ---- Animation Variants ----
const formVariants = {
  enter: { opacity: 0, x: 50 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

// ---- Component ----
export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [company, setCompany] = useState("");
  const [abbr, setAbbr] = useState("");
  const [language, setLanguage] = useState("English");
  const [country, setCountry] = useState("India");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [currency, setCurrency] = useState("INR");
  const [fyStart, setFyStart] = useState("2024-04-01");
  const [fyEnd, setFyEnd] = useState("2025-03-31");

  // Auto detect timezone and language
  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const lang = navigator.language;
    if (lang.includes("hi")) setLanguage("Hindi");
    else if (lang.includes("es")) setLanguage("Spanish");
    else setLanguage("English");
  }, []);

  useEffect(() => {
    setCurrency(currencyByCountry[country] || "USD");
    const fy = getFYDates(country);
    setFyStart(fy.start);
    setFyEnd(fy.end);
  }, [country]);

  useEffect(() => {
    setAbbr(getAbbr(company));
  }, [company]);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;
    setStep(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e0e7ff] flex flex-col font-sans relative overflow-hidden">

      {/* Ambient Background */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-100/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-200/20 blur-3xl pointer-events-none" />

      {/* Navbar */}
      <div className="h-16 flex items-center justify-between px-8 max-w-6xl mx-auto w-full text-gray-700 z-20 relative">
        <div className="font-bold text-xl tracking-tight">Architect Ledger</div>
        <div className="text-sm font-medium hover:underline cursor-pointer" onClick={() => navigate("/login")}>
          Sign In
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="relative w-full max-w-2xl rounded-3xl border border-gray-200 bg-white/70 backdrop-blur-xl shadow-2xl overflow-hidden p-10 z-10">

          {/* Stepper */}
          <div className="flex justify-center items-center mb-10 relative z-10 gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center relative z-10">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                ${step === 1 ? "bg-primary text-white" : "border border-primary text-primary"}`}>
                {step === 2 ? "✓" : "1"}
              </div>
              <span className="text-xs font-semibold text-gray-600 mt-1">Create Account</span>
            </div>

            {/* Connecting Line */}
            <motion.div
              className="flex-1 h-[3px] mt-4 bg-gray-300 rounded-full"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: step === 2 ? 1 : 0 }}
              transition={{ duration: 0.5 }}
            />

            {/* Step 2 */}
            <div className="flex flex-col items-center relative z-10">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                ${step === 2 ? "bg-primary text-white" : "border border-gray-300 text-gray-400"}`}>
                2
              </div>
              <span className="text-xs font-semibold text-gray-600 mt-1">Setup Workspace</span>
            </div>
          </div>

          {/* Step Forms with Animation */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
                onSubmit={handleStep1}
                className="space-y-6 relative z-10"
              >
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Create your free account</h2>

                <div className="space-y-4">
                  {["Full Name", "Email", "Password"].map((label, idx) => (
                    <div key={label}>
                      <label className="text-sm font-medium text-gray-700">{label}</label>
                      <input
                        type={label === "Password" ? "password" : "text"}
                        className="w-full border border-gray-300 rounded-2xl px-5 py-3 mt-1 focus:ring-2 focus:ring-primary focus:outline-none transition shadow-sm"
                        value={label === "Full Name" ? fullName : label === "Email" ? email : password}
                        onChange={(e) => label === "Full Name" ? setFullName(e.target.value) : label === "Email" ? setEmail(e.target.value) : setPassword(e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <button className="w-full bg-primary text-white py-3 rounded-2xl font-semibold shadow-md hover:shadow-xl hover:scale-[1.02] transition-all">
                  Create Account
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="space-y-6 relative z-10"
              >
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Setup Workspace</h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Company Name</label>
                    <input
                      className="w-full border border-gray-300 rounded-2xl px-4 py-3 mt-1 focus:ring-2 focus:ring-primary focus:outline-none transition shadow-sm"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Company Abbreviation</label>
                    <input
                      className="w-full border border-gray-300 rounded-2xl px-4 py-3 mt-1 bg-gray-100 cursor-not-allowed"
                      value={abbr}
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Language</label>
                    <select
                      className="w-full border border-gray-300 rounded-2xl px-4 py-3 mt-1 focus:ring-2 focus:ring-primary focus:outline-none transition shadow-sm"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      {languages.map((l) => <option key={l}>{l}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Country</label>
                    <select
                      className="w-full border border-gray-300 rounded-2xl px-4 py-3 mt-1 focus:ring-2 focus:ring-primary focus:outline-none transition shadow-sm"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    >
                      {countryList.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Timezone</label>
                    <input
                      className="w-full border border-gray-300 rounded-2xl px-4 py-3 mt-1 bg-gray-100 cursor-not-allowed"
                      value={timezone}
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Currency</label>
                    <input
                      className="w-full border border-gray-300 rounded-2xl px-4 py-3 mt-1 bg-gray-100 cursor-not-allowed"
                      value={currency}
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Financial Year Start</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-2xl px-4 py-3 mt-1 focus:ring-2 focus:ring-primary focus:outline-none transition shadow-sm"
                      value={fyStart}
                      onChange={(e) => setFyStart(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Financial Year End</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-2xl px-4 py-3 mt-1 focus:ring-2 focus:ring-primary focus:outline-none transition shadow-sm"
                      value={fyEnd}
                      onChange={(e) => setFyEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="text-gray-500 hover:text-gray-700 font-medium transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    className="bg-primary text-white px-6 py-3 rounded-2xl font-semibold shadow-md hover:shadow-xl hover:scale-[1.02] transition-all"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 py-6 relative z-10">
        © 2024 Architect Ledger. All rights reserved.
      </div>
    </div>
  );
}