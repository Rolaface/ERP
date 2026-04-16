import { useState, useRef, useEffect } from "react";
import FormFieldPro from "../Form/FormFieldV2";
import ButtonPro from "../Form/ButtonPro";
import { ChevronDown } from "lucide-react";

export default function Step2Workspace({
  form,
  errors,
  update,
  next,
  back,
  countryList,
  countriesLoading,
  countriesError,
  timezones,
  currencyOptions,
}: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);

  const [fyOpen, setFyOpen] = useState(false);

  const [tzOpen, setTzOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const [tzSearch, setTzSearch] = useState("");
  const [currencySearch, setCurrencySearch] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const tzRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  const fyRef = useRef<HTMLDivElement>(null);

  const [manualTZ, setManualTZ] = useState(false);
  const [manualCurrency, setManualCurrency] = useState(false);

  const countries = countryList.map((c: any) =>
    typeof c === "string"
      ? { code: c.slice(0, 2).toUpperCase(), name: c }
      : c
  );

  const getFlag = (code: string) =>
    code
      .toUpperCase()
      .replace(/./g, (char) =>
        String.fromCodePoint(127397 + char.charCodeAt(0))
      );

  const filteredCountries = countries.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const getAutoData = (countryCode: string) => {
    try {
      let currency = "";
      try {
        currency =
          new Intl.NumberFormat("en", {
            style: "currency",
            currency: "USD",
          })
            .resolvedOptions()
            .currency || "USD";
      } catch {}

      let timezone = "";
      try {
        const allTZ = (Intl as any).supportedValuesOf
          ? (Intl as any).supportedValuesOf("timeZone")
          : [];

        timezone =
          allTZ.find((tz: string) =>
            tz.toUpperCase().includes(countryCode)
          ) || Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {}

      return {
        timezone,
        currency,
      };
    } catch {
      return null;
    }
  };

  const detectUserLocale = () => {
    try {
      const locale = new Intl.Locale(navigator.language);
      const region = locale.region || "US";
      return region;
    } catch {
      return "US";
    }
  };

  // ✅ STEP 5 FIXED
  const handleFYMonthChange = (month: string) => {
    update("fyStartMonth", Number(month));
  };

  const currencySymbols: any = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CNY: "¥",
    AUD: "$",
    CAD: "$",
    CHF: "CHF",
    SGD: "$",
    AED: "د.إ",
  };

  const fullCurrencyList = [
    "USD","EUR","GBP","INR","JPY","CNY","AUD","CAD","CHF","SGD",
    "AED","NZD","ZAR","SEK","NOK","DKK","HKD","KRW","THB",
    "MYR","IDR","PHP","BRL","MXN",
  ];

  const months = [
    { label: "January", value: "01" },
    { label: "February", value: "02" },
    { label: "March", value: "03" },
    { label: "April", value: "04" },
    { label: "May", value: "05" },
    { label: "June", value: "06" },
    { label: "July", value: "07" },
    { label: "August", value: "08" },
    { label: "September", value: "09" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" },
  ];

  const currencies =
    currencyOptions && currencyOptions.length > 1
      ? currencyOptions
      : fullCurrencyList;

  const filteredTimezones = timezones.filter((t: string) =>
    t.toLowerCase().includes(tzSearch.toLowerCase())
  );

  const filteredCurrencies = currencies.filter((c: string) =>
    c.toLowerCase().includes(currencySearch.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setIsOpen(false);

      if (tzRef.current && !tzRef.current.contains(e.target as Node))
        setTzOpen(false);

      if (currencyRef.current && !currencyRef.current.contains(e.target as Node))
        setCurrencyOpen(false);

      if (fyRef.current && !fyRef.current.contains(e.target as Node))
        setFyOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (form.country) return;

    const userCountryCode = detectUserLocale();

    const matchedCountry = countries.find(
      (c: any) => c.code === userCountryCode
    );

    if (matchedCountry) {
      update("country", matchedCountry.name);

      const auto = getAutoData(userCountryCode);

      if (auto) {
        if (!manualTZ && auto.timezone) {
          update("timezone", auto.timezone);
        }

        if (!manualCurrency && auto.currency) {
          update("currency", auto.currency);
        }
      }
    }
  }, []);

  const handleCountrySelect = (country: any) => {
    update("country", country.name);
    setIsOpen(false);
    setSearch("");

    const auto = getAutoData(country.code);

    if (auto) {
      if (!manualTZ && auto.timezone) update("timezone", auto.timezone);
      if (!manualCurrency && auto.currency) update("currency", auto.currency);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < filteredCountries.length - 1 ? prev + 1 : prev
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : 0));
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredCountries[highlightIndex];
      if (selected) handleCountrySelect(selected);
    }
  };

  // ✅ FIX VALIDATION (uses fyStartMonth now)
  const isValid =
    form.company.trim() &&
    form.abbr.trim() &&
    form.country &&
    form.timezone &&
    form.currency &&
    form.fyStartMonth &&
    form.chartOfAccounts &&
    Object.keys(errors).length === 0;

  return (
    <div className="form-section">

      <div className="form-row">
        <FormFieldPro
          label="Company Name"
          value={form.company}
          error={errors.company}
          placeholder="Acme Corporation"
          onChange={(e: any) => update("company", e.target.value)}
        />

        <FormFieldPro
          label="Abbreviation"
          value={form.abbr}
          error={errors.abbr}
          placeholder="ACME"
          onChange={(e: any) =>
            update("abbr", e.target.value.toUpperCase())
          }
        />
      </div>

      {/* Country + Timezone */}
      <div className="form-row">
        <div className="relative" ref={dropdownRef}>
          <FormFieldPro
            label="Country"
            value={isOpen ? search : form.country}
            placeholder={
              countriesLoading ? "Loading countries..." : "Search country..."
            }
            disabled={countriesLoading}
            onChange={(e: any) => {
              setSearch(e.target.value);
              setIsOpen(true);
              setHighlightIndex(0);
            }}
            onKeyDown={handleKeyDown}
            error={countriesError}
            helperText={countriesError || ""}
            rightElement={
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60 cursor-pointer"
                onClick={() => {
                  setIsOpen(true);
                  setSearch("");
                }}
              />
            }
          />

          {isOpen && (
            <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-xl border bg-card shadow-md">
              {countriesError && (
                <div className="p-3 text-sm text-red-500">
                  {countriesError}
                </div>
              )}

              {!countriesError &&
                filteredCountries.map((c: any) => (
                  <div
                    key={c.name}
                    onClick={() => handleCountrySelect(c)}
                    className="px-3 py-2 cursor-pointer flex gap-2 hover:row-hover"
                  >
                    <span>{getFlag(c.code)}</span>
                    <span>{c.name}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* TIMEZONE */}
        <div className="relative" ref={tzRef}>
          <FormFieldPro
            label="Timezone"
            value={form.timezone}
            onChange={(e: any) => {
              setManualTZ(true);
              update("timezone", e.target.value);
            }}
            rightElement={
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60 cursor-pointer"
                onClick={() => setTzOpen((p) => !p)}
              />
            }
          />

          {tzOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-xl border bg-card shadow-md">
              <input
                className="w-full p-2 text-sm border-b bg-transparent"
                placeholder="Search timezone..."
                onChange={(e) => setTzSearch(e.target.value)}
              />
              <div className="max-h-60 overflow-auto">
                {filteredTimezones.map((t: string) => (
                  <div
                    key={t}
                    onClick={() => {
                      setManualTZ(true);
                      update("timezone", t);
                      setTzOpen(false);
                    }}
                    className="px-3 py-2 cursor-pointer hover:row-hover"
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Currency */}
      <div className="form-row">
        <FormFieldPro label="Charts of Account" value={form.chartOfAccounts || "Standard"} onChange={(e: any) => update("chartOfAccounts", e.target.value)} />

        <div className="relative" ref={currencyRef}>
          <FormFieldPro
            label="Currency"
            value={form.currency}
            onChange={(e: any) => {
              setManualCurrency(true);
              update("currency", e.target.value);
            }}
            rightElement={
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60 cursor-pointer"
                onClick={() => setCurrencyOpen((p) => !p)}
              />
            }
          />

          {currencyOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-xl border bg-card shadow-md">
              <input
                className="w-full p-2 text-sm border-b bg-transparent"
                placeholder="Search currency..."
                onChange={(e) => setCurrencySearch(e.target.value)}
              />
              <div className="max-h-60 overflow-auto">
                {filteredCurrencies.map((c: string) => (
                  <div
                    key={c}
                    onClick={() => {
                      setManualCurrency(true);
                      update("currency", c);
                      setCurrencyOpen(false);
                    }}
                    className="px-3 py-2 cursor-pointer flex justify-between hover:row-hover"
                  >
                    <span>{c}</span>
                    <span className="opacity-60">
                      {currencySymbols[c] || c}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Financial Year */}
      <div className="form-row">
        <div className="relative" ref={fyRef}>
          <FormFieldPro
            label="Financial Year Start From"
            value={
              months.find(m => Number(m.value) === form.fyStartMonth)?.label || ""
            }
            rightElement={
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60 cursor-pointer"
                onClick={() => setFyOpen((p) => !p)}
              />
            }
          />

          {fyOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-xl border bg-card shadow-md">
              <div className="max-h-60 overflow-auto">
                {months.map((m) => (
                  <div
                    key={m.value}
                    onClick={() => {
                      handleFYMonthChange(m.value);
                      setFyOpen(false);
                    }}
                    className="px-3 py-2 cursor-pointer hover:row-hover"
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="form-footer">
        <ButtonPro onClick={back}>Back</ButtonPro>
        <ButtonPro onClick={next} disabled={!isValid}>Continue</ButtonPro>
      </div>
    </div>
  );
}