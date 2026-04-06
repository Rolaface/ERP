import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";

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
  // ---------------- SEARCHABLE DROPDOWN STATE ----------------

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // ---------------- FILTER ----------------

  const filteredCountries = countryList.filter((c: string) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  // ---------------- CLICK OUTSIDE ----------------

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---------------- KEYBOARD NAV ----------------

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
      if (selected) {
        update("country", selected);
        setIsOpen(false);
        setSearch("");
      }
    }
  };

  // ---------------- RENDER ----------------

  return (
    <div className="form-card motion-scale-in">
      {/* Header */}
      <div className="form-header">
        <h2 className="form-title">Workspace Setup</h2>
        <p className="form-subtitle">
          Configure your company environment
        </p>
      </div>

      {/* Form Section */}
      <div className="form-section">

        {/* Company + Abbreviation */}
        <div className="form-row">
          <div className="form-group">
            <label className="label">Company Name</label>
            <input
              className={`input ${errors.company ? "input-error" : ""}`}
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
              placeholder="Acme Corporation"
            />
            {errors.company && (
              <p className="error-text">{errors.company}</p>
            )}
          </div>

          <div className="form-group">
            <label className="label">Abbreviation</label>
            <input
              className={`input ${errors.abbr ? "input-error" : ""}`}
              value={form.abbr}
              onChange={(e) => update("abbr", e.target.value.toUpperCase())}
              placeholder="ACME"
            />
            {errors.abbr && (
              <p className="error-text">{errors.abbr}</p>
            )}
          </div>
        </div>

        {/* 🌍 COUNTRY SEARCHABLE */}
        <div className="form-group">
          <label className="label">Country</label>

          {/* Error */}
          {countriesError && (
            <p className="error-text mb-2">{countriesError}</p>
          )}

          <div className="relative" ref={dropdownRef}>
            {/* Input */}
            <input
              className="input"
              placeholder={
                countriesLoading ? "Loading countries..." : "Search country..."
              }
              value={isOpen ? search : form.country}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsOpen(true);
                setHighlightIndex(0);
              }}
              onKeyDown={handleKeyDown}
              disabled={countriesLoading}
            />

            {/* Dropdown */}
            {isOpen && !countriesLoading && (
              <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-xl border bg-white shadow-lg">

                {/* No results */}
                {!countriesError && filteredCountries.length === 0 && (
                  <div className="p-3 text-sm text-muted">
                    No countries found
                  </div>
                )}

                {/* Options */}
                {!countriesError &&
                  filteredCountries.map((c: string, i: number) => (
                    <div
                      key={c}
                      onClick={() => {
                        update("country", c);
                        setIsOpen(false);
                        setSearch("");
                      }}
                      className={`px-3 py-2 cursor-pointer text-sm ${
                        i === highlightIndex
                          ? "bg-gray-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {c}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Timezone + Currency */}
        <div className="form-row">
          <div className="form-group">
            <label className="label">Timezone</label>
            <select
              className="input"
              value={form.timezone}
              onChange={(e) => update("timezone", e.target.value)}
            >
              {timezones.map((t: string) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Currency</label>
            <select
              className="input"
              value={form.currency}
              onChange={(e) => update("currency", e.target.value)}
            >
              {currencyOptions.map((c: string) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Financial Year */}
        <div className="form-group">
          <label className="label">Financial Year</label>
          <div className="form-row">
            <input
              type="date"
              className={`input ${errors.fyStart ? "input-error" : ""}`}
              value={form.fyStart}
              onChange={(e) => update("fyStart", e.target.value)}
            />
            <input
              type="date"
              className={`input ${errors.fyEnd ? "input-error" : ""}`}
              value={form.fyEnd}
              onChange={(e) => update("fyEnd", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="form-footer flex gap-3">
        <button
          onClick={back}
          className="btn btn-outline flex items-center gap-2"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <button
          onClick={next}
          className="btn btn-primary flex-1 flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}