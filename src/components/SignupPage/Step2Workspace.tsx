import { useState, useRef, useEffect } from "react";
import FormFieldPro from "../Form/FormFieldV2";
import ButtonPro from "../Form/ButtonPro";

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

  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredCountries = countryList.filter((c: string) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

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

  const isValid =
    form.company &&
    form.abbr &&
    form.country &&
    form.timezone &&
    form.currency &&
    form.fyStart &&
    form.fyEnd &&
    form.chartOfAccounts &&
    !errors.company &&
    !errors.abbr &&
    !errors.fyStart &&
    !errors.fyEnd;

  return (
    <div className="form-section">

      {/* Company + Abbreviation */}
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

      {/* Country + Timezone + Currency (SINGLE ROW) */}
      <div className="form-row">

        {/* COUNTRY */}
        <div className="relative" ref={dropdownRef}>
          <FormFieldPro
            label="Country"
            value={isOpen ? search : form.country}
            placeholder={
              countriesLoading
                ? "Loading countries..."
                : "Search country..."
            }
            onChange={(e: any) => {
              setSearch(e.target.value);
              setIsOpen(true);
              setHighlightIndex(0);
            }}
            onKeyDown={handleKeyDown}
            disabled={countriesLoading}
            error={countriesError}
            helperText={countriesError ? countriesError : ""}
            rightElement={
              <div
                className="absolute inset-0 cursor-pointer"
                onClick={() => setIsOpen(true)}
              />
            }
          />

          {isOpen && !countriesLoading && (
            <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-xl border bg-card shadow-md">
              {!countriesError && filteredCountries.length === 0 && (
                <div className="p-3 text-sm text-muted">
                  No countries found
                </div>
              )}

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
                        ? "row-hover"
                        : "hover:row-hover"
                    }`}
                  >
                    {c}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* TIMEZONE */}
        <FormFieldPro
          label="Timezone"
          value={form.timezone}
          onChange={(e: any) => update("timezone", e.target.value)}
          rightElement={
            <select
              className="absolute inset-0 opacity-0 cursor-pointer"
              value={form.timezone}
              onChange={(e) => update("timezone", e.target.value)}
            >
              {timezones.map((t: string) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          }
        />

        {/* CURRENCY */}
        <FormFieldPro
          label="Currency"
          value={form.currency}
          onChange={(e: any) => update("currency", e.target.value)}
          rightElement={
            <select
              className="absolute inset-0 opacity-0 cursor-pointer"
              value={form.currency}
              onChange={(e) => update("currency", e.target.value)}
            >
              {currencyOptions.map((c: string) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          }
        />
      </div>

      {/* Charts of Account */}
      <FormFieldPro
        label="Charts of Account"
        value={form.chartOfAccounts || "Standard"}
        onChange={(e: any) =>
          update("chartOfAccounts", e.target.value)
        }
      />

      {/* Financial Year */}
      <div className="form-row">
        <FormFieldPro
          label="Financial Year From"
          type="date"
          value={form.fyStart}
          onChange={(e: any) => update("fyStart", e.target.value)}
          error={errors.fyStart}
        />

        <FormFieldPro
          label="Financial Year To"
          type="date"
          value={form.fyEnd}
          onChange={(e: any) => update("fyEnd", e.target.value)}
          error={errors.fyEnd}
        />
      </div>

      {/* CTA */}
      <div className="form-footer">
        <div className="flex gap-3">
          <ButtonPro onClick={back}>
            Back
          </ButtonPro>

          <ButtonPro onClick={next} disabled={!isValid}>
            Continue
          </ButtonPro>
        </div>
      </div>
    </div>
  );
}