import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import { ChevronDown, Search } from "lucide-react";

// ─── Country display names ────────────────────────────────────────────────────

const COUNTRY_NAMES: Partial<Record<CountryCode, string>> = {
  AC: "Ascension Island", AD: "Andorra", AE: "United Arab Emirates",
  AF: "Afghanistan", AG: "Antigua & Barbuda", AI: "Anguilla", AL: "Albania",
  AM: "Armenia", AO: "Angola", AR: "Argentina", AS: "American Samoa",
  AT: "Austria", AU: "Australia", AW: "Aruba", AZ: "Azerbaijan",
  BA: "Bosnia & Herzegovina", BB: "Barbados", BD: "Bangladesh", BE: "Belgium",
  BF: "Burkina Faso", BG: "Bulgaria", BH: "Bahrain", BI: "Burundi",
  BJ: "Benin", BM: "Bermuda", BN: "Brunei", BO: "Bolivia", BR: "Brazil",
  BS: "Bahamas", BT: "Bhutan", BW: "Botswana", BY: "Belarus", BZ: "Belize",
  CA: "Canada", CD: "DR Congo", CF: "Central African Republic", CG: "Congo",
  CH: "Switzerland", CI: "Côte d'Ivoire", CK: "Cook Islands", CL: "Chile",
  CM: "Cameroon", CN: "China", CO: "Colombia", CR: "Costa Rica", CU: "Cuba",
  CV: "Cape Verde", CY: "Cyprus", CZ: "Czech Republic", DE: "Germany",
  DJ: "Djibouti", DK: "Denmark", DM: "Dominica", DO: "Dominican Republic",
  DZ: "Algeria", EC: "Ecuador", EE: "Estonia", EG: "Egypt", ER: "Eritrea",
  ES: "Spain", ET: "Ethiopia", FI: "Finland", FJ: "Fiji", FM: "Micronesia",
  FO: "Faroe Islands", FR: "France", GA: "Gabon", GB: "United Kingdom",
  GD: "Grenada", GE: "Georgia", GH: "Ghana", GI: "Gibraltar", GL: "Greenland",
  GM: "Gambia", GN: "Guinea", GQ: "Equatorial Guinea", GR: "Greece",
  GT: "Guatemala", GU: "Guam", GW: "Guinea-Bissau", GY: "Guyana",
  HK: "Hong Kong", HN: "Honduras", HR: "Croatia", HT: "Haiti", HU: "Hungary",
  ID: "Indonesia", IE: "Ireland", IL: "Israel", IN: "India", IQ: "Iraq",
  IR: "Iran", IS: "Iceland", IT: "Italy", JM: "Jamaica", JO: "Jordan",
  JP: "Japan", KE: "Kenya", KG: "Kyrgyzstan", KH: "Cambodia", KI: "Kiribati",
  KM: "Comoros", KP: "North Korea", KR: "South Korea", KW: "Kuwait",
  KY: "Cayman Islands", KZ: "Kazakhstan", LA: "Laos", LB: "Lebanon",
  LC: "St. Lucia", LI: "Liechtenstein", LK: "Sri Lanka", LR: "Liberia",
  LS: "Lesotho", LT: "Lithuania", LU: "Luxembourg", LV: "Latvia", LY: "Libya",
  MA: "Morocco", MC: "Monaco", MD: "Moldova", ME: "Montenegro",
  MG: "Madagascar", MH: "Marshall Islands", MK: "North Macedonia",
  ML: "Mali", MM: "Myanmar", MN: "Mongolia", MO: "Macau",
  MQ: "Martinique", MR: "Mauritania", MT: "Malta", MU: "Mauritius",
  MV: "Maldives", MW: "Malawi", MX: "Mexico", MY: "Malaysia",
  MZ: "Mozambique", NA: "Namibia", NE: "Niger", NG: "Nigeria",
  NI: "Nicaragua", NL: "Netherlands", NO: "Norway", NP: "Nepal",
  NR: "Nauru", NZ: "New Zealand", OM: "Oman", PA: "Panama",
  PE: "Peru", PG: "Papua New Guinea", PH: "Philippines", PK: "Pakistan",
  PL: "Poland", PM: "St. Pierre & Miquelon", PR: "Puerto Rico",
  PS: "Palestine", PT: "Portugal", PW: "Palau", PY: "Paraguay",
  QA: "Qatar", RE: "Réunion", RO: "Romania", RS: "Serbia", RU: "Russia",
  RW: "Rwanda", SA: "Saudi Arabia", SB: "Solomon Islands", SC: "Seychelles",
  SD: "Sudan", SE: "Sweden", SG: "Singapore", SH: "St. Helena",
  SI: "Slovenia", SK: "Slovakia", SL: "Sierra Leone", SM: "San Marino",
  SN: "Senegal", SO: "Somalia", SR: "Suriname", SS: "South Sudan",
  ST: "São Tomé & Príncipe", SV: "El Salvador", SX: "Sint Maarten",
  SY: "Syria", SZ: "Eswatini", TC: "Turks & Caicos Islands", TD: "Chad",
  TG: "Togo", TH: "Thailand", TJ: "Tajikistan", TL: "Timor-Leste",
  TM: "Turkmenistan", TN: "Tunisia", TO: "Tonga", TR: "Turkey",
  TT: "Trinidad & Tobago", TV: "Tuvalu", TZ: "Tanzania", UA: "Ukraine",
  UG: "Uganda", US: "United States", UY: "Uruguay", UZ: "Uzbekistan",
  VA: "Vatican City", VC: "St. Vincent & Grenadines", VE: "Venezuela",
  VG: "British Virgin Islands", VI: "US Virgin Islands", VN: "Vietnam",
  VU: "Vanuatu", WS: "Samoa", XK: "Kosovo", YE: "Yemen",
  YT: "Mayotte", ZA: "South Africa", ZM: "Zambia", ZW: "Zimbabwe",
};

// ─── Build options list once at module level ──────────────────────────────────

interface CountryOption {
  iso: CountryCode;
  name: string;
  code: string;   // "+213"
  label: string;  // "Algeria +213"
}

const ALL_OPTIONS: CountryOption[] = getCountries()
  .map((iso) => {
    const name = COUNTRY_NAMES[iso] ?? iso;
    const code = `+${getCountryCallingCode(iso)}`;
    return { iso, name, code, label: `${name} ${code}` };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

// ─── Component ────────────────────────────────────────────────────────────────

interface PhoneCodeSelectProps {
  value: string;
  onChange: (code: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

const PhoneCodeSelect: React.FC<PhoneCodeSelectProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  placeholder = "+",
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Close on outside click ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      // check both trigger and the portal dropdown
      const portalDropdown = document.getElementById("phone-code-portal");
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !(portalDropdown && portalDropdown.contains(target))
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Focus search when opens ─────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  // ── Recalculate position on scroll/resize ───────────────────────────────────
  useEffect(() => {
    if (!open) return;

    const recalc = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        setDropdownPos({ top: rect.bottom + 4, left: rect.left });
      }
    };

    window.addEventListener("scroll", recalc, true);
    window.addEventListener("resize", recalc);
    return () => {
      window.removeEventListener("scroll", recalc, true);
      window.removeEventListener("resize", recalc);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_OPTIONS;
    return ALL_OPTIONS.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.code.includes(q) ||
        o.iso.toLowerCase().includes(q),
    );
  }, [search]);

  const selected = ALL_OPTIONS.find((o) => o.code === value);

  const handleToggle = () => {
    if (disabled) return;
    if (!open) {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        setDropdownPos({ top: rect.bottom + 4, left: rect.left });
      }
    }
    setOpen((p) => !p);
  };

  const handleSelect = (option: CountryOption) => {
    onChange(option.code);
    setOpen(false);
    setSearch("");
  };

  const borderClass = error
    ? "border-danger"
    : open
      ? "border-primary ring-1 ring-primary/30"
      : "border-[var(--border)] hover:border-primary/40";

  return (
    <div ref={containerRef} className="relative">
      {/* ── Trigger ── */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={[
          "flex items-center gap-1 h-[30px] px-2 rounded-md border text-[11px] text-main bg-card transition-all whitespace-nowrap",
          borderClass,
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        ].join(" ")}
        style={{ minWidth: "72px" }}
      >
        <span className="flex-1 text-left font-medium">
          {selected ? (
            selected.code
          ) : (
            <span className="text-muted">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          size={11}
          className={`text-muted transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* ── Portal Dropdown ── */}
      {open &&
        dropdownPos &&
        createPortal(
          <div
            id="phone-code-portal"
            className="bg-card border border-[var(--border)] rounded-lg shadow-xl overflow-hidden"
            style={{
              position: "fixed",
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: "240px",
              zIndex: 99999,
            }}
          >
            {/* Search input */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)]">
              <Search size={12} className="text-muted shrink-0" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or code..."
                className="flex-1 text-[11px] bg-transparent text-main placeholder:text-muted outline-none"
              />
            </div>

            {/* Options list */}
            <div className="overflow-y-auto" style={{ maxHeight: "200px" }}>
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-center text-[11px] text-muted">
                  No results found
                </div>
              ) : (
                filtered.map((option) => {
                  const isActive = option.code === value;
                  return (
                    <button
                      key={option.iso}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                      onClick={() => handleSelect(option)}
                      className={[
                        "w-full flex items-center justify-between px-3 py-1.5 text-left text-[11px] transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-main hover:bg-row-hover",
                      ].join(" ")}
                    >
                      <span className="truncate">{option.name}</span>
                      <span className="ml-2 text-muted font-mono shrink-0">
                        {option.code}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default PhoneCodeSelect;
