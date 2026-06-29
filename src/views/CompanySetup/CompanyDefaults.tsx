import React from "react";
import { ModalInput, ModalSelect } from "../../components/ui/modal/modalComponent";
import { Save } from "lucide-react";
import { useCompanyDefaults } from "../../hooks/useCompanyDefaults";
import SearchSelect2 from "../../components/ui/modal/SearchSelect2";
import { getAllModeOfPayment } from "../../api/BankAccountApi";

interface DefaultsField {
  key: string;
  label: string;
}

export interface DefaultsSection {
  id: string;
  title: string;
  fields: DefaultsField[];
}

type DefaultValues = Record<string, string>;

export const SECTIONS: DefaultsSection[] = [
  {
    id: "basic",
    title: "BASIC INFO",
    fields: [
      { key: "default_currency", label: "DEFAULT CURRENCY" },
    ],
  },
  {
    id: "accounts",
    title: "ACCOUNTS",
    fields: [
      { key: "default_bank_account",                    label: "DEFAULT BANK ACCOUNT" },
      { key: "default_cash_account",                    label: "DEFAULT CASH ACCOUNT" },
      { key: "default_receivable_account",              label: "DEFAULT RECEIVABLE ACCOUNT" },
      { key: "default_payable_account",                 label: "DEFAULT PAYABLE ACCOUNT" },
      { key: "default_income_account",                  label: "DEFAULT INCOME ACCOUNT" },
      { key: "default_expense_account",                 label: "DEFAULT EXPENSE ACCOUNT" },
      { key: "round_off_account",                       label: "ROUND OFF ACCOUNT" },
      { key: "write_off_account",                       label: "WRITE OFF ACCOUNT" },
      { key: "exchange_gain_loss_account",              label: "EXCHANGE GAIN/LOSS ACCOUNT" },
      { key: "unrealized_exchange_gain_loss_account",   label: "UNREALIZED EXCHANGE GAIN/LOSS ACCOUNT" },
      { key: "default_deferred_revenue_account",        label: "DEFAULT DEFERRED REVENUE ACCOUNT" },
      { key: "default_deferred_expense_account",        label: "DEFAULT DEFERRED EXPENSE ACCOUNT" },
      { key: "default_advance_received_account",        label: "DEFAULT ADVANCE RECEIVED ACCOUNT" },
      { key: "default_advance_paid_account",            label: "DEFAULT ADVANCE PAID ACCOUNT" },
    ],
  },
  {
    id: "payroll",
    title: "PAYROLL",
    fields: [
      { key: "default_payroll_payable_account",  label: "DEFAULT PAYROLL PAYABLE ACCOUNT" },
      { key: "default_employee_advance_account", label: "DEFAULT EMPLOYEE ADVANCE ACCOUNT" },
    ],
  },
  {
    id: "cost_center",
    title: "COST CENTER & FINANCE",
    fields: [
      { key: "cost_center",           label: "DEFAULT COST CENTER" },
      { key: "round_off_cost_center", label: "ROUND OFF COST CENTER" },
      { key: "default_finance_book",  label: "DEFAULT FINANCE BOOK" },
    ],
  },
  {
    id: "selling_buying",
    title: "SELLING / BUYING",
    fields: [
      { key: "default_selling_terms",       label: "DEFAULT SELLING TERMS" },
      { key: "default_buying_terms",        label: "DEFAULT BUYING TERMS" },
      { key: "default_in_transit_warehouse", label: "DEFAULT IN-TRANSIT WAREHOUSE" },
    ],
  },
  {
    id: "hr_leave",
    title: "HR & LEAVE",
    fields: [
      { key: "default_holiday_list", label: "DEFAULT HOLIDAY LIST" },
    ],
  },
];

// ─── ModeOfPaymentSelect ──────────────────────────────────────────────────────

const ModeOfPaymentSelect: React.FC<{
  value: string;
  onChange: (val: string) => void;
}> = ({ value, onChange }) => {
  const fetchOptions = async (q: string) => {
    try {
      const res = await getAllModeOfPayment(1, 20, q || undefined, 1);
      return res.data.map((item: { id: string; name: string }) => ({
        label: item.name,
        value: item.id,
      }));
    } catch {
      return [];
    }
  };

  return (
    <div className="flex flex-col min-w-0">
      <span className="block text-[10px] font-medium text-main mb-1">
        DEFAULT PAYMENT MODE
      </span>
      <div className="[&_input]:!py-1 [&_input]:!px-2 [&_input]:!text-[11px] [&_input]:!rounded [&_input]:!border-theme [&_input]:!h-auto">
        <SearchSelect2
          label=""
          value={value}
          onChange={(val) => onChange(val)}
          fetchOptions={fetchOptions}
          placeholder="Search payment mode..."
        />
      </div>
    </div>
  );
};

// ─── Section renderer ─────────────────────────────────────────────────────────

interface SectionProps {
  section: DefaultsSection;
  values: DefaultValues;
  onChange: (key: string, value: string) => void;
}

const DefaultsSectionBlock: React.FC<SectionProps> = ({ section, values, onChange }) => (
  <div className="mb-8 max-w-7xl">
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

      {/* Inject custom fields into the BASIC INFO section */}
      {section.id === "basic" && (
        <>
          {/* Primary Business Domain — select with Product / Service */}
          <ModalSelect
            label="PRIMARY BUSINESS DOMAIN"
            name="primary_business_domain"
            value={values["primary_business_domain"] ?? ""}
            onChange={(e) => onChange("primary_business_domain", e.target.value)}
            options={[
              { label: "Service", value: "Service" },
              { label: "Product", value: "Product" },
            ]}
            placeholder="Select"
          />

          {/* Default Mode of Payment — SearchSelect2 */}
          <ModeOfPaymentSelect
            value={values["default_payment_mode"] ?? ""}
            onChange={(val) => onChange("default_payment_mode", val)}
          />
        </>
      )}
    </div>
  </div>
);

// ─── CompanyDefaults ──────────────────────────────────────────────────────────

interface CompanyDefaultsProps {
  onSaveSuccess?: () => void;
}

const CompanyDefaults: React.FC<CompanyDefaultsProps> = ({ onSaveSuccess }) => {
  const {
    values,
    isLoading,
    isSaving,
    error,
    handleChange,
    handleSave,
  } = useCompanyDefaults();

  const onSave = async () => {
    await handleSave();
    onSaveSuccess?.();
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-[12px] text-muted h-full">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">

      {/* Error banner */}
      {error && (
        <div className="shrink-0 mx-6 mt-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-600">
          {error}
        </div>
      )}

      {/* Main body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 pt-5 pb-4 min-w-0">
          {SECTIONS.map((section) => (
            <DefaultsSectionBlock
              key={section.id}
              section={section}
              values={values}
              onChange={handleChange}
            />
          ))}
        </div>
      </div>

      {/* Sticky footer */}
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

export default CompanyDefaults;