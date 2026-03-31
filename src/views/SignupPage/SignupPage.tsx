import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Pencil } from "lucide-react";
import { createSite } from "../../api/createSite";

// ---------------- HELPERS ----------------

const generateAbbr = (name: string) => {
  if (!name) return "";
  const words = name.replace(/[,\.]/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
};

const countryList = [
  "India","United States","United Kingdom","Canada","Australia",
  "Germany","France","Spain","Italy","Netherlands","Singapore",
  "UAE","Japan","China","Brazil",
];

const currencyByCountry: Record<string, string> = {
  India:"INR","United States":"USD","United Kingdom":"GBP","Canada":"CAD",
  Australia:"AUD","Germany":"EUR","France":"EUR","Spain":"EUR",
  Italy:"EUR","Netherlands":"EUR","Singapore":"SGD",
  UAE:"AED","Japan":"JPY","China":"CNY","Brazil":"BRL",
};

const chartOfAccountsByCountry: Record<string,string> =
  Object.fromEntries(countryList.map(c=>[c,`${c}+-+Chart+of+Accounts`]));

const timezones = Intl.supportedValuesOf("timeZone");

const getFYDates = (country:string)=>{
  if(country==="India") return {start:"2025-04-01",end:"2026-03-31"};
  return {start:"2025-01-01",end:"2025-12-31"};
};

// ---------------- ANIMATION ----------------

const variants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

// ---------------- COMPONENT ----------------

export default function SignupPage() {
  const navigate = useNavigate();

  const [step,setStep]=useState<1|2|3>(1);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  const [fullName,setFullName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");

  const [company,setCompany]=useState("");
  const [abbr,setAbbr]=useState("");

  const [country,setCountry]=useState("India");
  const [timezone,setTimezone]=useState("Asia/Kolkata");
  const [currency,setCurrency]=useState("INR");
  const [chart,setChart]=useState(chartOfAccountsByCountry["India"]);

  const [fyStart,setFyStart]=useState("2025-04-01");
  const [fyEnd,setFyEnd]=useState("2026-03-31");

  const [editing,setEditing]=useState<string|null>(null);

  // ---------------- EFFECTS ----------------

  useEffect(()=>{
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  },[]);

  useEffect(()=>{
    setCurrency(currencyByCountry[country]);
    setChart(chartOfAccountsByCountry[country]);

    const fy=getFYDates(country);
    setFyStart(fy.start);
    setFyEnd(fy.end);

    if(country==="India") setTimezone("Asia/Kolkata");
  },[country]);

  useEffect(()=>{
    setAbbr(generateAbbr(company));
  },[company]);

  // ---------------- HANDLER ----------------

  const handleConfirm = async ()=>{
    setLoading(true);
    setError("");

    try{
      const res = await createSite({
        currency,country,timezone,
        full_name:fullName,email,password,
        company_name:company,company_abbr:abbr,
        chart_of_accounts:chart,
        fy_start_date:fyStart,
        fy_end_date:fyEnd,
      });

      if(res.message?.status==="accepted"){
        setTimeout(()=>navigate("/login"),1200);
      } else setError(res.message?.message || "Unexpected error");

    }catch(err:any){
      setError(err.message);
    }finally{
      setLoading(false);
    }
  };

  // ---------------- UI HELPERS ----------------

  const input =
    "w-full bg-white border border-gray-200 rounded-[14px] px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition";

  const label =
    "text-[11px] uppercase tracking-wider text-gray-500 font-semibold ml-1";

  // ---------------- RENDER ----------------

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7f8fb] to-[#eef2f7] px-4">

      <div className="w-full max-w-[500px]">

        {/* HEADER + STEPPER */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold tracking-tight">Architect Ledger</h1>

          <div className="flex items-center justify-center gap-4 mt-6">
            {[1,2,3].map((s)=>(
              <React.Fragment key={s}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${step>=s?"bg-indigo-600 text-white":"bg-gray-200 text-gray-400"}`}>
                  {step>s?"✓":s}
                </div>
                {s<3 && <div className="w-10 h-[2px] bg-gray-200" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* CARD */}
        <div className="bg-white rounded-[24px] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.06)]">

          <AnimatePresence mode="wait">

            {/* STEP 1 */}
            {step===1 && (
              <motion.form key="1" {...variants}
                onSubmit={(e)=>{e.preventDefault();setStep(2);}}
                className="space-y-6">

                <div>
                  <h2 className="text-xl font-semibold mb-1">Create your account</h2>
                  <p className="text-sm text-gray-500">Start your journey</p>
                </div>

                <div>
                  <label className={label}>Full Name</label>
                  <input className={input} value={fullName} onChange={e=>setFullName(e.target.value)} />
                </div>

                <div>
                  <label className={label}>Email</label>
                  <input className={input} value={email} onChange={e=>setEmail(e.target.value)} />
                </div>

                <div>
                  <label className={label}>Password</label>
                  <input type="password" className={input} value={password} onChange={e=>setPassword(e.target.value)} />
                </div>

                <button className="w-full bg-indigo-600 text-white py-4 rounded-[14px] flex items-center justify-center gap-2 hover:scale-[1.01] transition">
                  Next <ArrowRight size={16}/>
                </button>
              </motion.form>
            )}

            {/* STEP 2 */}
            {step===2 && (
              <motion.div key="2" {...variants} className="space-y-6">

                <h2 className="text-xl font-semibold">Workspace Setup</h2>

                <div className="grid grid-cols-3 gap-4">
                  <input className={`${input} col-span-2`} placeholder="Company Name"
                    value={company} onChange={e=>setCompany(e.target.value)} />
                  <input className={`${input} bg-gray-100`} value={abbr} readOnly />
                </div>

                <select className={input} value={country} onChange={e=>setCountry(e.target.value)}>
                  {countryList.map(c=><option key={c}>{c}</option>)}
                </select>

                <div className="grid grid-cols-2 gap-4">
                  <select className={input} value={timezone} onChange={e=>setTimezone(e.target.value)}>
                    {timezones.map(t=><option key={t}>{t}</option>)}
                  </select>

                  <select className={input} value={currency} onChange={e=>setCurrency(e.target.value)}>
                    {Object.values(currencyByCountry).map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>

                <select className={input} value={chart} onChange={e=>setChart(e.target.value)}>
                  {Object.entries(chartOfAccountsByCountry).map(([k,v])=>
                    <option key={k} value={v}>{k}</option>
                  )}
                </select>

                <div className="grid grid-cols-2 gap-4">
                  <input type="date" className={input} value={fyStart} onChange={e=>setFyStart(e.target.value)} />
                  <input type="date" className={input} value={fyEnd} onChange={e=>setFyEnd(e.target.value)} />
                </div>

                <button onClick={()=>setStep(3)}
                  className="w-full bg-indigo-600 text-white py-4 rounded-[14px] hover:scale-[1.01] transition">
                  Continue
                </button>

              </motion.div>
            )}

            {/* STEP 3 */}
            {step===3 && (
              <motion.div key="3" {...variants} className="space-y-6">

                <h2 className="text-xl font-semibold">Review & Confirm</h2>

                <div className="space-y-3 text-sm">
                  {[
                    ["Full Name",fullName,setFullName,"name"],
                    ["Email",email,setEmail,"email"],
                    ["Company",company,setCompany,"company"],
                    ["Abbr",abbr,setAbbr,"abbr"],
                    ["Country",country,setCountry,"country"],
                    ["Timezone",timezone,setTimezone,"tz"],
                    ["Currency",currency,setCurrency,"cur"],
                    ["Chart",chart,setChart,"chart"],
                    ["FY Start",fyStart,setFyStart,"start"],
                    ["FY End",fyEnd,setFyEnd,"end"],
                  ].map(([label,val,set,key]:any)=>(
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-gray-500">{label}</span>

                      {editing===key ? (
                        <input value={val}
                          onChange={(e)=>set(e.target.value)}
                          onBlur={()=>setEditing(null)}
                          className="border px-2 py-1 rounded"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{val}</span>
                          <Pencil size={14} className="cursor-pointer opacity-60"
                            onClick={()=>setEditing(key)} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {error && <div className="text-red-500 text-sm">{error}</div>}

                <button onClick={handleConfirm}
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-4 rounded-[14px] hover:scale-[1.01] transition">
                  {loading ? "Creating..." : "Confirm & Create Site"}
                </button>

              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}