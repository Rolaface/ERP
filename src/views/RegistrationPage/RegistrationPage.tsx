import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// ---- Helpers ----
const getAbbr = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase())
    .join("");

const countryList = [
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
];

const currencyByCountry: Record<string, string> = {
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

const languages = [
  "English",
  "Hindi",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Japanese",
  "Arabic",
  "Portuguese",
];

const getFYDates = (country: string) => {
  if (country === "India") {
    return { start: "2024-04-01", end: "2025-03-31" };
  }
  return { start: "2024-01-01", end: "2024-12-31" };
};

// ---- Component ----
export default function RegistrationPage() {
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

  // Auto detect
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(tz);

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

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;
    setStep(2);
  };

  useEffect(() => {
    setAbbr(getAbbr(company));
  }, [company]);

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex flex-col">
      {/* Navbar */}
      <div className="h-16 flex items-center justify-between px-8 max-w-6xl mx-auto w-full">
        <div className="font-bold text-lg">Architect Ledger</div>
        <div className="text-sm text-gray-600">Sign In</div>
      </div>

      {/* Main */}
      <div className="flex-grow flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow p-8">

          {/* Stepper */}
          <div className="flex justify-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? "bg-indigo-600 text-white" : "border border-indigo-600 text-indigo-600"}`}>
                {step === 2 ? "✓" : "1"}
              </div>
              <span className="text-xs font-bold">Create Account</span>
            </div>
            <div className="w-8 h-[2px] bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? "bg-indigo-600 text-white" : "border"}`}>
                2
              </div>
              <span className="text-xs font-bold">Setup Workspace</span>
            </div>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <h2 className="text-xl font-semibold text-center">Create your free account</h2>
              <input className="w-full border rounded-lg px-4 py-3" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <input className="w-full border rounded-lg px-4 py-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className="w-full border rounded-lg px-4 py-3" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button className="w-full bg-indigo-600 text-white py-3 rounded-xl">Create Account</button>
            </form>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-center">Setup Workspace</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <input className="border rounded-lg px-4 py-3" placeholder="Company Name" value={company} onChange={(e) => setCompany(e.target.value)} />
                <input className="border rounded-lg px-4 py-3" placeholder="Company Abbreviation" value={abbr} readOnly />

                <select className="border rounded-lg px-4 py-3" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  {languages.map((l) => <option key={l}>{l}</option>)}
                </select>

                <select className="border rounded-lg px-4 py-3" value={country} onChange={(e) => setCountry(e.target.value)}>
                  {countryList.map((c) => <option key={c}>{c}</option>)}
                </select>

                <input className="border rounded-lg px-4 py-3" value={timezone} readOnly />
                <input className="border rounded-lg px-4 py-3" value={currency} readOnly />

                <input type="date" className="border rounded-lg px-4 py-3" value={fyStart} onChange={(e) => setFyStart(e.target.value)} />
                <input type="date" className="border rounded-lg px-4 py-3" value={fyEnd} onChange={(e) => setFyEnd(e.target.value)} />
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(1)} 
                className="text-gray-600">Back</button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl"
                >
                  Continue to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 py-6">
        © 2024 Architect Ledger. All rights reserved.
      </div>
    </div>
  );
}
