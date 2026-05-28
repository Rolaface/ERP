import { useState, useRef } from "react";
import FormFieldPro from "../form/FormFieldV2";
import ButtonPro from "../form/ButtonPro";
import FloatingDropdown from "./FloatingDropdown";
import { ChevronDown } from "lucide-react";
import { getCurrencyList } from "../../api/lookupApi";

export default function Step2Workspace({
  form,
  errors,
  update,
  next,
  back,
  countryList,
  timezones,
  currencyOptions,
}: any) {

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [tzSearch, setTzSearch] = useState("");
  const [currencySearch, setCurrencySearch] = useState("");
  const [apiCurrencies, setApiCurrencies] = useState<any[]>([]);
const [loadingCurrencies, setLoadingCurrencies] = useState(false);

  const countryRef = useRef<any>(null);
  const tzRef = useRef<any>(null);
  const currencyRef = useRef<any>(null);
  const fyRef = useRef<any>(null);

  const countries = countryList.map((c: any) =>
    typeof c === "string"
      ? { code: c.slice(0, 2).toUpperCase(), name: c }
      : c
  );

  const filteredCountries = countries.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTimezones = timezones.filter((t: string) =>
    t.toLowerCase().includes(tzSearch.toLowerCase())
  );

const fetchCurrencyOptions = async (q: string = "") => {
    setLoadingCurrencies(true);
    try {
      const response = await getCurrencyList({ search: q, page: 1, page_size: 20 });
      
      const list = response || [];
      
      const formattedList = list.map((c: any) => ({
        label: `${c.name}${c.symbol ? ` (${c.symbol})` : ""}`,
        value: c.name,
      }));
      
      setApiCurrencies(formattedList);
    } catch (error) {
      console.error("Failed to fetch currencies:", error);
    } finally {
      setLoadingCurrencies(false);
    }
  };
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const getMonthLabel = (month: number) => {
    return new Intl.DateTimeFormat(undefined, {
      month: "long",
    }).format(new Date(2024, month - 1));
  };

  const toggle = (name: string) => {
    setOpenDropdown(prev => (prev === name ? null : name));
  };

  const close = () => setOpenDropdown(null);

  const isValid =
    form.company &&
    form.abbr &&
    form.country &&
    form.timezone &&
    form.currency &&
    form.fyStartMonth &&
    form.chartOfAccounts &&
    Object.keys(errors).length === 0;

  return (
    <div className="form-section">

      {/* ROW 1 */}
      <div className="form-row">
        <FormFieldPro
          label="Company Name"
          value={form.company}
          onChange={(e: any) => update("company", e.target.value)}
        />
        <FormFieldPro
          label="Abbreviation"
          value={form.abbr}
          onChange={(e: any) =>
            update("abbr", e.target.value.toUpperCase())
          }
        />
      </div>

      {/* ROW 2 */}
      <div className="form-row">

        {/* COUNTRY */}
        <div
          ref={countryRef}
          className="w-full cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            toggle("country");
          }}
        >
          <FormFieldPro
            label="Country"
            value={form.country}
            readOnly
            placeholder="Select country"
            rightElement={<ChevronDown className="icon-muted" />}
          />
        </div>

        <FloatingDropdown
          open={openDropdown === "country"}
          onClose={close}
          referenceRef={countryRef}
        >
          <input
            autoFocus
            className="dropdown-search"
            placeholder="Search country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {filteredCountries.map((c: any) => (
            <div
              key={c.name}
              onClick={(e) => {
                e.stopPropagation();
                update("country", c.name);
                close();
              }}
              className="dropdown-item"
            >
              {c.name}
            </div>
          ))}
        </FloatingDropdown>

        {/* TIMEZONE */}
        <div
          ref={tzRef}
          className="w-full cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            toggle("timezone");
          }}
        >
          <FormFieldPro
            label="Timezone"
            value={form.timezone}
            readOnly
            rightElement={<ChevronDown className="icon-muted" />}
          />
        </div>

        <FloatingDropdown
          open={openDropdown === "timezone"}
          onClose={close}
          referenceRef={tzRef}
        >
          <input
            autoFocus
            className="dropdown-search"
            placeholder="Search timezone..."
            value={tzSearch}
            onChange={(e) => setTzSearch(e.target.value)}
          />

          {filteredTimezones.map((t: string) => (
            <div
              key={t}
              onClick={(e) => {
                e.stopPropagation();
                update("timezone", t);
                close();
              }}
              className="dropdown-item"
            >
              {t}
            </div>
          ))}
        </FloatingDropdown>

      </div>

      {/* ROW 3 */}
      <div className="form-row">

        <FormFieldPro
          label="Charts of Account"
          value={form.chartOfAccounts || "Standard"}
          onChange={(e: any) =>
            update("chartOfAccounts", e.target.value)
          }
        />

        {/* CURRENCY */}
{/* CURRENCY */}
<div
  ref={currencyRef}
  className="w-full cursor-pointer"
  onClick={(e) => {
    e.stopPropagation();
    toggle("currency");
    
    // Fetch immediately when the user opens the dropdown
    if (openDropdown !== "currency") {
      fetchCurrencyOptions(currencySearch);
    }
  }}
>
  <FormFieldPro
    label="Currency"
    value={form.currency}
    readOnly
    rightElement={<ChevronDown className="icon-muted" />}
  />
</div>

<FloatingDropdown
  open={openDropdown === "currency"}
  onClose={close}
  referenceRef={currencyRef}
>
  <input
    autoFocus
    className="dropdown-search"
    placeholder="Search currency..."
    value={currencySearch}
    onChange={(e) => {
      const query = e.target.value;
      setCurrencySearch(query);
      // Fetch new options as the user types
      fetchCurrencyOptions(query); 
    }}
  />

  {loadingCurrencies ? (
    <div className="dropdown-item text-gray-400">Loading...</div>
  ) : (
    apiCurrencies.map((c: any) => (
      <div
        key={c.value}
        onClick={(e) => {
          e.stopPropagation();
          update("currency", c.value); // Updates form with the value (e.g. "AED")
          close();
        }}
        className="dropdown-item"
      >
        {c.label} {/* Renders "AED (د.إ)" */}
      </div>
    ))
  )}
</FloatingDropdown>

      </div>

      {/* ROW 4 */}
      <div className="form-row">

        <div
          ref={fyRef}
          className="w-full cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            toggle("fy");
          }}
        >
          <FormFieldPro
            label="Financial Year Start From"
            value={
              form.fyStartMonth
                ? getMonthLabel(form.fyStartMonth)
                : ""
            }
            readOnly
            rightElement={<ChevronDown className="icon-muted" />}
          />
        </div>

        <FloatingDropdown
          open={openDropdown === "fy"}
          onClose={close}
          referenceRef={fyRef}
        >
          {months.map((m) => (
            <div
              key={m}
              onClick={(e) => {
                e.stopPropagation();
                update("fyStartMonth", m);
                close();
              }}
              className="dropdown-item"
            >
              {getMonthLabel(m)}
            </div>
          ))}
        </FloatingDropdown>

      </div>

      {/* FOOTER */}
      <div className="form-footer">
        <ButtonPro variant="ghost" onClick={back}>
          Back
        </ButtonPro>

        <ButtonPro onClick={next} disabled={!isValid}>
          Continue
        </ButtonPro>
      </div>

    </div>
  );
}