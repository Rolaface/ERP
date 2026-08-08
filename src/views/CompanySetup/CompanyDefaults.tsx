import React from "react";
import { ModalInput, ModalSelect } from "../../components/ui/modal/modalComponent";
import { Save } from "lucide-react";
import { useCompanyDefaults } from "../../hooks/useCompanyDefaults";
import SearchSelect2 from "../../components/ui/modal/SearchSelect2";
import { getAllModeOfPayment, getAllBankAccounts } from "../../api/BankAccountApi";
import { getCurrencyList } from "../../api/lookupApi";
// import { getAllCreditLimit, AccountOption } from "../../api/companyDefaultApi";
import { getAllCreditLimit, getExpenseAccounts, getCashAccounts, getIncomeAccounts, getReceivableAccounts, 
  getPayableAccounts, AccountOption, getPayrollPayableAccounts, getEmployeeAdvanceAccounts,
  getExchangeGainLossAccounts, getUnrealizedExchangeGainLossAccounts, getAllCostCenterAccounts } from "../../api/companyDefaultApi";
import { parseFrappeError } from "../hr/tabs/leave-config/hooks/parseFrappeError";
import { getGLNameWithoutAbbreviation } from "../../api/utils/glAccountUtils";
import { FaLinkedin } from "react-icons/fa";
import { useCompanyStore } from "../../store/companyStore";

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
      // default_currency is rendered via CurrencySelect below, not as a plain ModalInput
    ],
  },
  {
    id: "accounts",
    title: "ACCOUNTS",
    fields: [
      // { key: "default_cash_account",                    label: "DEFAULT CASH ACCOUNT" },
      // { key: "default_receivable_account",              label: "DEFAULT RECEIVABLE ACCOUNT" },
      // { key: "default_payable_account",                 label: "DEFAULT PAYABLE ACCOUNT" },
      // { key: "default_income_account",                  label: "DEFAULT INCOME ACCOUNT" },
      // { key: "default_expense_account",                 label: "DEFAULT EXPENSE ACCOUNT" },
      // { key: "round_off_account",                       label: "ROUND OFF ACCOUNT" },
      // { key: "write_off_account",                       label: "WRITE OFF ACCOUNT" },
      // { key: "exchange_gain_loss_account",              label: "EXCHANGE GAIN/LOSS ACCOUNT" },
      // { key: "unrealized_exchange_gain_loss_account",   label: "UNREALIZED EXCHANGE GAIN/LOSS ACCOUNT" },
      // { key: "default_deferred_revenue_account",        label: "DEFAULT DEFERRED REVENUE ACCOUNT" },
      // { key: "default_deferred_expense_account",        label: "DEFAULT DEFERRED EXPENSE ACCOUNT" },
      // { key: "default_advance_received_account",        label: "DEFAULT ADVANCE RECEIVED ACCOUNT" },
      // { key: "default_advance_paid_account",            label: "DEFAULT ADVANCE PAID ACCOUNT" },
    ],
  },
  {
    id: "payroll",
    title: "PAYROLL",
    fields: [
      // { key: "default_payroll_payable_account",  label: "DEFAULT PAYROLL PAYABLE ACCOUNT" },
      // { key: "default_employee_advance_account", label: "DEFAULT EMPLOYEE ADVANCE ACCOUNT" },
    ],
  },
  // {
  //   id: "cost_center",
  //   title: "COST CENTER & FINANCE",
  //   fields: [
  //     { key: "cost_center",           label: "DEFAULT COST CENTER" },
  //     { key: "round_off_cost_center", label: "ROUND OFF COST CENTER" },
  //     { key: "default_finance_book",  label: "DEFAULT FINANCE BOOK" },
  //   ],
  // },
  // {
  //   id: "selling_buying",
  //   title: "SELLING / BUYING",
  //   fields: [
  //     { key: "default_selling_terms",       label: "DEFAULT SELLING TERMS" },
  //     { key: "default_buying_terms",        label: "DEFAULT BUYING TERMS" },
  //     { key: "default_in_transit_warehouse", label: "DEFAULT IN-TRANSIT WAREHOUSE" },
  //   ],
  // },
  {
    id: "credit_limit",
    title: "CREDIT LIMIT",
    fields: [],
  },
  {
    id: "hr_leave",
    title: "HR & LEAVE",
    fields: [
      { key: "default_holiday_list", label: "DEFAULT HOLIDAY LIST" },
    ],
  },
];

const AccountSelect: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  fetcher: () => Promise<AccountOption[] | { id: string; name: string }[]>;
  placeholder: string;
}> = ({ label, value, onChange, fetcher, placeholder }) => {
  const fetchOptions = async (q: string) => {
    try {
      const accounts = await fetcher();
      const filtered = q
        ? accounts.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()))
        : accounts;
      // return filtered.map((a) => ({
      //   label: a.name,
      //   value: a.id,
      //   subLabel: (a as AccountOption).accountType
      //     ? `${(a as AccountOption).accountType}`
      //     : undefined,
      // }));
      return filtered.map((a) => ({
        label: getGLNameWithoutAbbreviation(a.name),
        value: a.id,
        subLabel: (a as AccountOption).accountType
          ? `${(a as AccountOption).accountType}`
          : undefined,
      }));
    }
    catch (err) {
      console.error(`${label} fetch failed:`, err);
      return [];
    }
  };

  return (
    <div className="flex flex-col min-w-0">
      <span className="block text-[10px] font-medium text-main mb-1">
        {label}
      </span>
      <div className="[&_input]:!py-1 [&_input]:!px-2 [&_input]:!text-[11px] [&_input]:!rounded [&_input]:!border-theme [&_input]:!h-auto">
        <SearchSelect2
          label=""
          value={getGLNameWithoutAbbreviation(value)}
          onChange={(val) => onChange(val)}
          fetchOptions={fetchOptions}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

const CostCenterSelect: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}> = ({ label, value, onChange, placeholder }) => {
  const fetchOptions = async (q: string) => {
    try {
      const centers = await getAllCostCenterAccounts();
      const filtered = q
        ? centers.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
        : centers;
      return filtered.map((c) => ({
        label: getGLNameWithoutAbbreviation(c.name),
        value: c.id,
      }));
    } catch (err) {
      parseFrappeError(err || "Failed to fetch cost center accounts");
      return [];
    }
  };

  return (
    <div className="flex flex-col min-w-0">
      <span className="block text-[10px] font-medium text-main mb-1">
        {label}
      </span>
      <div className="[&_input]:!py-1 [&_input]:!px-2 [&_input]:!text-[11px] [&_input]:!rounded [&_input]:!border-theme [&_input]:!h-auto">
        <SearchSelect2
          label=""
          value={getGLNameWithoutAbbreviation(value)}
          onChange={(val) => onChange(val)}
          fetchOptions={fetchOptions}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

const CurrencySelect: React.FC<{
  value: string;
  onChange: (val: string) => void;
}> = ({ value, onChange }) => {
  const fetchOptions = async (q: string) => {
    try {
      const data = await getCurrencyList({ search: q || undefined });
      return data.map((item: { name: string; currency_name?: string; symbol?: string | null }) => ({
        label: item.name,
        value: item.name,
        subLabel: item.symbol ? `${item.currency_name ?? item.name} · ${item.symbol}` : item.currency_name ?? undefined,
      }));
    } catch {
      parseFrappeError("Failed to fetch currency list");
      return [];
    }
  };

  return (
    <div className="flex flex-col min-w-0">
      <span className="block text-[10px] font-medium text-main mb-1">
        DEFAULT CURRENCY
      </span>
      <div className="[&_input]:!py-1 [&_input]:!px-2 [&_input]:!text-[11px] [&_input]:!rounded [&_input]:!border-theme [&_input]:!h-auto">
        <SearchSelect2
          label=""
          value={value}
          onChange={(val) => onChange(val)}
          fetchOptions={fetchOptions}
          placeholder="Search currency..."
        />
      </div>
    </div>
  );
};

// ─── CompanyBankAccountSelect ─────────────────────────────────────────────────

const maskAccountNo = (val?: string | number) => {
  const str = val != null ? String(val) : "";
  if (!str) return "";
  if (str.length <= 4) return "*".repeat(str.length);
  return "*".repeat(str.length - 4) + str.slice(-4);
};

const CompanyBankAccountSelect: React.FC<{
  value: string;
  onChange: (val: string) => void;
}> = ({ value, onChange }) => {
  const fetchOptions = async (q: string) => {
    try {
      const res = await getAllBankAccounts({
        company: true,
        search: q || undefined,
        page: 1,
        page_size: 20,
      });
      return res.data.map((item) => ({
        label: String(item.bankName || item.id),
        value: String(item.id),
        subLabel: [maskAccountNo(item.accountNo), item.currency ? String(item.currency) : ""]
          .filter(Boolean)
          .join(" · "),
      }));
    } catch(error) {
      parseFrappeError(error || "Failed to fetch bank accounts");
      return [];      
    }
  };

  return (
    <div className="flex flex-col min-w-0">
      <span className="block text-[10px] font-medium text-main mb-1">
        DEFAULT BANK ACCOUNT
      </span>
      <div className="[&_input]:!py-1 [&_input]:!px-2 [&_input]:!text-[11px] [&_input]:!rounded [&_input]:!border-theme [&_input]:!h-auto">
        <SearchSelect2
          label=""
          value={value}
          onChange={(val) => onChange(val)}
          fetchOptions={fetchOptions}
          placeholder="Search bank account..."
        />
      </div>
    </div>
  );
};

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

const CreditControllerSelect: React.FC<{
  value: string;
  onChange: (val: string) => void;
}> = ({ value, onChange }) => {
  const fetchOptions = async (q: string) => {
  try {
   const roles = await getAllCreditLimit(q || undefined, 20);
    return roles.map((role) => ({
      label: role.name,
      value: role.id,
      subLabel: role.roleName,
    }));
  } catch (err) {
    parseFrappeError(err || "Failed to fetch credit controller roles");
    return [];
  }
};

  return (
    <div className="flex flex-col min-w-0">
      <span className="block text-[10px] font-medium text-main mb-1">
        DEFAULT CREDIT LIMIT
      </span>
      <div className="[&_input]:!py-1 [&_input]:!px-2 [&_input]:!text-[11px] [&_input]:!rounded [&_input]:!border-theme [&_input]:!h-auto">
        <SearchSelect2
          label=""
          value={value}
          onChange={(val) => onChange(val)}
          fetchOptions={fetchOptions}
          placeholder="Search role..."
        />
      </div>
    </div>
  );
};

// ─── ToggleField ──────────────────────────────────────────────────────────────

const ToggleField: React.FC<{
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  helperText?: string;
}> = ({ label, checked, onChange, helperText }) => (
  <div className="flex flex-col min-w-0 justify-center">
    <span className="block text-[10px] font-medium text-main mb-1">
      {label}
    </span>
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-gray-300",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-[3px]",
          ].join(" ")}
        />
      </button>
      <span className="text-[11px] text-muted">{checked ? "Yes" : "No"}</span>
    </div>
    {helperText && (
      <span className="text-[10px] text-muted mt-1">{helperText}</span>
    )}
  </div>
);

// ─── Section renderer ─────────────────────────────────────────────────────────

interface SectionProps {
  section: DefaultsSection;
  values: DefaultValues;
  onChange: (key: string, value: string) => void;
}

const DefaultsSectionBlock: React.FC<SectionProps> = ({ section, values, onChange }) => {
  const isZraEnabled = useCompanyStore((s) => s.isZraEnabled);
  return (
  <div className="mb-8 max-w-7xl">
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[11px] font-semibold tracking-widest text-primary uppercase">
        {section.title}
      </span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
     {section.id === "accounts" && (
      <>
      <CompanyBankAccountSelect
        value={values["default_bank_account"] ?? ""}
        onChange={(val) => onChange("default_bank_account", val)}
      /> 
      <AccountSelect
        label="DEFAULT CASH ACCOUNT"
        value={values["default_cash_account"] ?? ""}
        onChange={(val) => onChange("default_cash_account", val)}
        fetcher={getCashAccounts}
        placeholder="Search cash account..."
      />
      <AccountSelect
        label="DEFAULT RECEIVABLE ACCOUNT"
        value={values["default_receivable_account"] ?? ""}
        onChange={(val) => onChange("default_receivable_account", val)}
        fetcher={getReceivableAccounts}
        placeholder="Search receivable account..."
      />
      <AccountSelect
        label="DEFAULT PAYABLE ACCOUNT"
        value={values["default_payable_account"] ?? ""}
        onChange={(val) => onChange("default_payable_account", val)}
        fetcher={getPayableAccounts}
        placeholder="Search payable account..."
      />
      <AccountSelect
        label="DEFAULT INCOME ACCOUNT"
        value={values["default_income_account"] ?? ""}
        onChange={(val) => onChange("default_income_account", val)}
        fetcher={getIncomeAccounts}
        placeholder="Search income account..."
      />
      <AccountSelect
        label="DEFAULT EXPENSE ACCOUNT"
        value={values["default_expense_account"] ?? ""}
        onChange={(val) => onChange("default_expense_account", val)}
        fetcher={getExpenseAccounts}
        placeholder="Search expense account..."
      />
       <AccountSelect
        label="DEFAULT WRITE OFF ACCOUNT"
        value={values["default_expense_account"] ?? ""}
        onChange={(val) => onChange("default_expense_account", val)}
        fetcher={getExpenseAccounts}
        placeholder="Search expense account..."
      />
      <AccountSelect
        label="EXCHANGE GAIN/LOSS ACCOUNT"
        value={values["exchange_gain_loss_account"] ?? ""}
        onChange={(val) => onChange("exchange_gain_loss_account", val)}
        fetcher={getExchangeGainLossAccounts}
        placeholder="Search exchange gain/loss account..."
      />
       <AccountSelect
        label="DEFAULT ROUND OFF ACCOUNT"
        value={values["exchange_gain_loss_account"] ?? ""}
        onChange={(val) => onChange("round_off_account", val)}
        fetcher={getExchangeGainLossAccounts}
        placeholder="Search round off account..."
      />
      <AccountSelect
        label="UNREALIZED EXCHANGE GAIN/LOSS ACCOUNT"
        value={values["unrealized_exchange_gain_loss_account"] ?? ""}
        onChange={(val) => onChange("unrealized_exchange_gain_loss_account", val)}
        fetcher={getUnrealizedExchangeGainLossAccounts}
        placeholder="Search unrealized exchange gain/loss account..."
      />
          <ToggleField
            label="USE SEPARATE SEQUENCE FOR CREDIT NOTES"
            checked={
              values["use_separate_sequence_for_credit_notes"] === "true" ||
              String(values["use_separate_sequence_for_credit_notes"]) === "1"
            }
            onChange={(val) => onChange("use_separate_sequence_for_credit_notes", val ? "true" : "false")}
            helperText="Credit notes get their own numbering series"
          />
      {isZraEnabled && (
        <ToggleField
          label="Is RVAT Agent"
          checked={values["is_rvat_agent"] === "true" || String(values["is_rvat_agent"]) === "1"}
          onChange={(val) => onChange("is_rvat_agent", val ? "true" : "false")}
          helperText="This company is an agent and will be using the agent module"
        />
      )}
      </>  
  )}
  {section.id === "payroll" && (
    <>
      <AccountSelect
        label="DEFAULT PAYROLL PAYABLE ACCOUNT"
        value={values["default_payroll_payable_account"] ?? ""}
        onChange={(val) => onChange("default_payroll_payable_account", val)}
        fetcher={getPayrollPayableAccounts}
        placeholder="Search payroll payable account..."
      />
      <AccountSelect
        label="DEFAULT EMPLOYEE ADVANCE ACCOUNT"
        value={values["default_employee_advance_account"] ?? ""}
        onChange={(val) => onChange("default_employee_advance_account", val)}
        fetcher={getEmployeeAdvanceAccounts}
        placeholder="Search employee advance account..."
      />
    </>
  )}

  {section.id === "cost_center" && (
    <>
      <CostCenterSelect
        label="DEFAULT COST CENTER"
        value={values["cost_center"] ?? ""}
        onChange={(val) => onChange("cost_center", val)}
        placeholder="Search cost center..."
      />
      <CostCenterSelect
        label="ROUND OFF COST CENTER"
        value={values["round_off_cost_center"] ?? ""}
        onChange={(val) => onChange("round_off_cost_center", val)}
        placeholder="Search cost center..."
      />
    </>
  )}

  {section.id === "credit_limit" && (
        <CreditControllerSelect
          value={values["credit_controller"] ?? ""}
          onChange={(val) => onChange("credit_controller", val)}
        />
      )}

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
          {/* Default Currency — SearchSelect2 */}
          <CurrencySelect
            value={values["default_currency"] ?? ""}
            onChange={(val) => onChange("default_currency", val)}
          />

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
)};

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