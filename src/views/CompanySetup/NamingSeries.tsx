import React, { useMemo } from "react";
import { ModalInput } from "../../components/ui/modal/modalComponent";
import { Save, FlaskConical, Info } from "lucide-react";
import { useNamingSeries } from "../../hooks/useNamingSeries";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NamingSeriesField {
  key: string;
  label: string;
}

export interface NamingSeriesSection {
  id: string;
  title: string;
  fields: NamingSeriesField[];
}

type SeriesValues = Record<string, string>;

// ─── Static config ────────────────────────────────────────────────────────────

export const SECTIONS: NamingSeriesSection[] = [
  {
    id: "sales",
    title: "SALES",
    fields: [
      { key: "sales_order", label: "SALES ORDER" },
      { key: "sales_invoice", label: "SALES INVOICE" },
      { key: "quotation", label: "QUOTATION" },
      { key: "proforma_invoice", label: "PROFORMA INVOICE" },
      { key: "credit_note", label: "CREDIT NOTE" },   
      { key: "customer", label: "CUSTOMER" },
    ],
  },
  {
    id: "purchase",
    title: "PURCHASE",
    fields: [
      { key: "purchase_order", label: "PURCHASE ORDER" },
      { key: "purchase_invoice", label: "PURCHASE INVOICE" },
      { key: "supplier_quotation", label: "SUPPLIER QUOTATION"},
      { key: "rfq", label: "RFQ (REQUEST FOR QUOTATION)" },
      { key: "sales_debit_notes", label: "DEBIT NOTE" },
      { key: "purchase_receipt", label: "PURCHASE RECEIPT" },
      { key: "supplier", label: "SUPPLIER"},
    ],
  },
  {
    id: "inventory",
    title: "INVENTORY",
    fields: [
      { key: "item_code", label: "ITEM CODE" },
    ],
  },
  {
    id: "accounting",
    title: "ACCOUNTING",
    fields: [
      { key: "journal_entry", label: "JOURNAL ENTRY" },
      { key: "payment_entry", label: "PAYMENT ENTRY" },
    ],
  },
  {
    id: "hr",
    title: "HR",
    fields: [
      { key: "employee", label: "EMPLOYEE" },
    ],
  },
];

// ─── Variables reference ──────────────────────────────────────────────────────

const VARIABLES = [
  { token: ".YYYY.", description: "Year in 4 digits" },
  { token: ".YY.", description: "Year in 2 digits" },
  { token: ".MM.", description: "Month" },
  { token: ".DD.", description: "Day of month" },
  { token: ".WW.", description: "Week of the year" },
  { token: ".{fieldname}.", description: "Fieldname on document e.g. branch" },
  { token: ".FY.", description: "Fiscal Year" },
  { token: ".ABBR.", description: "Company Abbreviation" },
];

const EXAMPLES = ["INV-", "INV-10-", "INVK-", "INV-.YYYY.-.{branch}.-.MM.-.####"];

// ─── Preview generator ────────────────────────────────────────────────────────

function generatePreview(pattern: string): string[] {
  if (!pattern.trim()) return [];
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const yy = yyyy.slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const ww = String(Math.ceil(now.getDate() / 7)).padStart(2, "0");
  const digitMatch = pattern.match(/\.#+/);
  const digitCount = digitMatch ? digitMatch[0].length - 1 : 5;
  const base = pattern
    .replace(/\.YYYY\./g, yyyy)
    .replace(/\.YY\./g, yy)
    .replace(/\.MM\./g, mm)
    .replace(/\.DD\./g, dd)
    .replace(/\.WW\./g, ww)
    .replace(/\.FY\./g, `${yyyy}-${String(Number(yyyy) + 1).slice(2)}`)
    .replace(/\.ABBR\./g, "CO")
    .replace(/\.\{[^}]+\}\./g, "VAL")
    .replace(/\.#+/g, "");
  return [1, 2, 3].map((n) => `${base}${String(n).padStart(digitCount, "0")}`);
}

// ─── SeriesSection ────────────────────────────────────────────────────────────

interface SectionProps {
  section: NamingSeriesSection;
  values: SeriesValues;
  onChange: (key: string, value: string) => void;
}

const SeriesSection: React.FC<SectionProps> = ({ section, values, onChange }) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[11px] font-semibold tracking-widest text-primary uppercase">
        {section.title}
      </span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
      {section.fields.map((field) => (
        <ModalInput
          key={field.key}
          label={field.label}
          name={field.key}
          value={values[field.key] ?? ""}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      ))}
    </div>
  </div>
);

// ─── TryPanel (right sidebar) ─────────────────────────────────────────────────

const TryPanel: React.FC = () => {
  const [tryValue, setTryValue] = React.useState("");
  const previews = useMemo(() => generatePreview(tryValue), [tryValue]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FlaskConical size={14} className="text-primary shrink-0" />
        <span className="text-[11px] font-semibold text-main tracking-wide">
          Try a Naming Series
        </span>
      </div>

      {/* Pattern input */}
      <div>
        <ModalInput
          label="Pattern"
          name="tryPattern"
          value={tryValue}
          placeholder="e.g. INV-.YYYY.-.MM.-"
          onChange={(e) => setTryValue(e.target.value)}
        />
        <p className="text-[10px] text-muted mt-1 leading-relaxed">
          Get a preview of generated names with a series.
        </p>
      </div>

      {/* Preview box */}
      {previews.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-main mb-1.5">
            Preview of generated names
          </p>
          <div className="rounded-lg border border-[var(--border)] bg-app px-3 py-2 space-y-1">
            {previews.map((p, i) => (
              <p key={i} className="text-[11px] font-mono text-main">
                {p}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Rules + Variables + Examples box */}
      <div className="rounded-lg border border-[var(--border)] bg-app px-3 py-3 space-y-3">
        {/* Rules */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Info size={11} className="text-primary shrink-0" />
            <p className="text-[10px] font-semibold text-main">Rules</p>
          </div>
          <ul className="text-[10px] text-muted space-y-1 list-disc list-inside leading-relaxed">
            <li>Each Series Prefix on a new line.</li>
            <li>Allowed special characters are "/" and "-"</li>
            <li>
              Set digit count using{" "}
              <span className="font-mono text-primary">.####</span> — 4 digits.
              Default is 5.
            </li>
            <li>Use variables between (.) dots</li>
          </ul>
        </div>

        {/* Supported Variables */}
        <div>
          <p className="text-[10px] font-semibold text-main mb-1.5">
            Supported Variables
          </p>
          <div className="space-y-1">
            {VARIABLES.map((v) => (
              <div key={v.token} className="flex items-baseline gap-1.5">
                <span className="font-mono text-[10px] text-primary shrink-0 w-[90px]">
                  {v.token}
                </span>
                <span className="text-[10px] text-muted">— {v.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Examples */}
        <div>
          <p className="text-[10px] font-semibold text-main mb-1">Examples</p>
          <ul className="space-y-0.5">
            {EXAMPLES.map((ex) => (
              <li
                key={ex}
                className="text-[10px] font-mono text-primary cursor-pointer hover:underline"
                onClick={() => setTryValue(ex)}
                title="Click to try"
              >
                • {ex}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface NamingSeriesProps {
  onSaveSuccess?: () => void;
}

const NamingSeries: React.FC<NamingSeriesProps> = ({ onSaveSuccess }) => {
  const {
    values,
    isLoading,
    isSaving,
    error,
    handleChange,
    handleSave,
  } = useNamingSeries();

  const onSave = async () => {
    await handleSave();
    onSaveSuccess?.();
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-[12px] text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* Error banner */}
      {error && (
        <div className="shrink-0 mx-6 mt-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-600">
          {error}
        </div>
      )}

      {/* ── Two-column body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT — series fields, scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pt-5 pb-4 min-w-0">
          {SECTIONS.map((section) => (
            <SeriesSection
              key={section.id}
              section={section}
              values={values}
              onChange={handleChange}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="w-px bg-[var(--border)] shrink-0" />

        {/* RIGHT — Try panel, scrollable, fixed width */}
        <div className="w-[300px] shrink-0 overflow-y-auto px-4 pt-5 pb-4">
          <TryPanel />
        </div>
      </div>

      {/* ── Sticky footer ── */}
      <div className="shrink-0 border-t border-[var(--border)] bg-card px-6 py-3 flex justify-start">
        <button
          type="button"
          disabled={isSaving}
          onClick={onSave}
          className={[
            "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-semibold",
            "bg-primary text-white transition-all",
            isSaving
              ? "opacity-60 cursor-not-allowed"
              : "hover:bg-primary/90 active:scale-95",
          ].join(" ")}
        >
          <Save size={13} />
          {isSaving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default NamingSeries;