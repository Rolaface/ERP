// EntryFormTabs.tsx — New Payroll Entry: Overview, Employees, Accounting tabs
// Fields aligned to Create Payroll Entry API payload

import React from "react";
import { Edit2 } from "lucide-react";
import type { PayrollEntry, Employee } from "../../../types/payrolltypes";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import { EmployeesTab } from "./EmployeesTab";

import {
  ModalInput,
  ModalSelect,
} from "../../../components/ui/modal/modalComponent";
import DatePickerInput from "../../../components/calendar/DatePickerInput";
import { getCurrencyList } from "../../../api/lookupApi";
import { getExchangeRate } from "../../../api/currencyExchangeApi";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import { getPayrollPayableAccounts } from "../../../api/faapi";
// ── Primitives ────────────────────────────────────────────────────────────────
const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({
  children,
  required,
}) => (
  <label className="block text-[10px] font-extrabold text-muted mb-1.5 uppercase tracking-wider">
    {children}
    {required && <span className="text-danger ml-0.5">*</span>}
  </label>
);



const fetchCurrencyOptions = async (q: string) => {
  const list = await getCurrencyList({ search: q, page: 1, page_size: 20 });
  return (list || []).map((c: any) => ({
    label: `${c.name}${c.symbol ? ` (${c.symbol})` : ""}`,
    value: c.name,
  }));
};

const getBaseCurrencyFromStorage = () => {
  try {
    const raw = localStorage.getItem("company-info");

    if (!raw) return "";

    const parsed = JSON.parse(raw);

    return parsed?.state?.baseCurrency || "";
  } catch {
    return "";
  }
};
interface OverviewTabProps {
  data: PayrollEntry;
  onChange: (field: string, value: any) => void;
}

interface PayrollEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}
export const PayrollEntryModal: React.FC<PayrollEntryModalProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  return (
    <MinimizableModal
      modalId="payroll-entry-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="Create Payroll Entry"
      subtitle="Manage payroll entry details"
      maxWidth="6xl"
      height="90vh"
    >
      {children}
    </MinimizableModal>
  );
};

export const OverviewTab: React.FC<OverviewTabProps> = ({ data, onChange }) => (
  <div className="space-y-5 animate-[fadeIn_0.2s_ease]">
    <div className="grid grid-cols-3 gap-5">
      <div>
        <ModalInput
          label="Payroll Name"
          required
          type="text"
          value={data.payrollName}
          onChange={(e) => onChange("payrollName", e.target.value)}
          placeholder="e.g. May 2026 Payroll"
        />
      </div>
      <div>
        <DatePickerInput
  label="Posting Date"
  name="postingDate"
  required
  value={data.postingDate}
  onChange={async (name, value) => {
    onChange(name, value);

    try {
      if (data.currency && value) {
        const resp = await getExchangeRate({
          from_currency: data.currency,
         to_currency: getBaseCurrencyFromStorage(),
          transaction_date: value,
          args: "for_buying",
        });

        onChange("exchangeRate", Number(resp.message));
      }
    } catch (err) {
      console.error("Failed to fetch exchange rate", err);
    }
  }}
/>
      </div>
      <div>
        <ModalSelect
          label="payroll frequency"
          value={data.payrollFrequency}
          onChange={(e) => onChange("payrollFrequency", e.target.value)}
        >
          <option value="">Select frequency</option>
          <option value="Monthly">Monthly</option>
          <option value="Biweekly">Biweekly</option>
          <option value="Weekly">Weekly</option>
        </ModalSelect>
      </div>
    </div>

    <div className="grid grid-cols-4 gap-5">
      <div>
        <DatePickerInput
          label="Start Date"
          name="startDate"
          required
          value={data.startDate}
          onChange={(name, value) => onChange(name, value)}
        />
      </div>
      <div>
        <DatePickerInput
          label="End Date"
          name="endDate"
          required
          value={data.endDate}
          onChange={(name, value) => onChange(name, value)}
        />
      </div>
      <div>
        <SearchSelect2
          label="Currency"
          value={data.currency}
          placeholder="Search currency…"
          fetchOptions={fetchCurrencyOptions}
          onChange={async (val: any) => {
  const value = typeof val === "string" ? val : val?.value;

  onChange("currency", value);

  try {
    if (value && data.postingDate) {
      const resp = await getExchangeRate({
        from_currency: value,
        to_currency: getBaseCurrencyFromStorage(),
        transaction_date: data.postingDate,
        args: "for_buying",
      });

      onChange("exchangeRate", Number(resp.message));
    }
  } catch (err) {
    console.error("Failed to fetch exchange rate", err);
  }
}}
        />
      </div>

      <div>
        <ModalInput
          label="Exchange Rate"
          required
          type="number"
          value={data.exchangeRate ?? ""}
          onChange={(e) => onChange("exchangeRate", Number(e.target.value))}
        />
      </div>
    </div>

   

    <div className="grid grid-cols-2 gap-5">
      <div>
       <SearchSelect2
  label="Payroll Payable Account"
  value={data.payrollPayableAccount}
  placeholder="Search payroll payable account..."
fetchOptions={(q) =>
  getPayrollPayableAccounts(
    JSON.parse(
      localStorage.getItem("company-info") || "{}"
    )?.state?.companyName || "",
    q
  )
}
  onChange={(val: any) => {
    const value =
      typeof val === "string" ? val : val?.value;

    onChange("payrollPayableAccount", value);
  }}
/>
      </div>
      <div className="flex items-end">
        {/* payload hint */}
        <p className="text-[10px] text-muted leading-relaxed">
          Default account used for posting payroll journal entries. Must match
          your company's chart of accounts.
        </p>
      </div>
    </div>

    {/* Toggles */}
    <div className="grid grid-cols-2 gap-4">
      {[
        {
          field: "deductTaxForProof",
          label: "Deduct Tax for Unsubmitted Proof",
          desc: "Apply TDS even if investment proofs are not yet submitted (payload: deduct_tax_for_unsubmitted_tax_exemption_proof)",
        },
        {
          field: "salarySlipTimesheet",
          label: "Salary Slip Based on Timesheet",
          desc: "Calculate pay using logged timesheet hours (payload: salary_slip_based_on_timesheet)",
        },
      ].map(({ field, label, desc }) => (
        <label
          key={field}
          className="flex items-start gap-3 p-4 bg-app border border-theme rounded-xl cursor-pointer hover:border-primary/40 transition"
        >
          <input
            type="checkbox"
            checked={!!(data as any)[field]}
            onChange={(e) => onChange(field, e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-primary cursor-pointer shrink-0"
          />
          <div>
            <p className="text-xs font-bold text-main">{label}</p>
            <p className="text-[10px] text-muted mt-0.5">{desc}</p>
          </div>
        </label>
      ))}
    </div>
  </div>
);



