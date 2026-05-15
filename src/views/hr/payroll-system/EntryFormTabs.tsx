import React, { useCallback, useEffect } from "react";
import type { PayrollEntry } from "../../../types/payrolltypes";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
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

// ── Currency helpers ──────────────────────────────────────────────────────────
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

// ── Date utility: format Date → "YYYY-MM-DD" ─────────────────────────────────
const toDateStr = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};



const getMonthDateRange = (
  month: number,
  year: number,
) => {
  const start = new Date(year, month, 1);

  const end = new Date(year, month + 1, 0);

  return {
    startDate: toDateStr(start),
    endDate: toDateStr(end),
  };
};

// ── Modal wrapper (unchanged) ─────────────────────────────────────────────────
interface PayrollEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const PayrollEntryModal: React.FC<PayrollEntryModalProps> = ({
  isOpen,
  onClose,
  children,
}) => (
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

// ── OverviewTab ───────────────────────────────────────────────────────────────
interface OverviewTabProps {
  data: PayrollEntry;
  onChange: (field: string, value: any) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ data, onChange }) => {
  
  const applyDateRange = useCallback(
    (range: { startDate: string; endDate: string }) => {
      onChange("startDate", range.startDate);
      onChange("endDate", range.endDate);
    },
    [onChange]
  );

 
  const refreshExchangeRate = useCallback(
    async (currency: string, postingDate: string) => {
      if (!currency || !postingDate) return;
      try {
        const resp = await getExchangeRate({
          from_currency: currency,
          to_currency: getBaseCurrencyFromStorage(),
          transaction_date: postingDate,
          args: "for_buying",
        });
        onChange("exchangeRate", Number(resp.message));
      } catch (err) {
        console.error("Failed to fetch exchange rate", err);
      }
    },
    [onChange]
  );
useEffect(() => {
  if (!data.currency) {
    const baseCurrency =
      getBaseCurrencyFromStorage();

    if (baseCurrency) {
      onChange("currency", baseCurrency);
    }
  }
}, []);
useEffect(() => {
  if (!data.payrollMonth) {
    const currentDate = new Date();

    const currentMonth =
      currentDate.toLocaleString(
        "default",
        { month: "long" }
      );

    const year =
      currentDate.getFullYear();

    onChange(
      "payrollMonth",
      currentMonth,
    );

    const range =
      getMonthDateRange(
        currentDate.getMonth(),
        year,
      );

    onChange(
      "startDate",
      range.startDate,
    );

    onChange(
      "endDate",
      range.endDate,
    );
  }
}, []);



  const handlePostingDateChange = useCallback(
    async (_name: string, value: string) => {
      onChange("postingDate", value);

      

      await refreshExchangeRate(data.currency, value);
    },
    [data.currency, onChange, refreshExchangeRate]
  );




  const handleStartDateChange = useCallback(
    (_name: string, value: string) => {
      onChange("startDate", value);

     
    },
    [onChange]
  );


  const handleEndDateChange = useCallback(
    (_name: string, value: string) => {
      onChange("endDate", value);
    },
    [onChange]
  );

  

  const handleCurrencyChange = useCallback(
    async (val: any) => {
      const value = typeof val === "string" ? val : val?.value;
      onChange("currency", value);
      await refreshExchangeRate(value, data.postingDate);
    },
    [data.postingDate, onChange, refreshExchangeRate]
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-[fadeIn_0.2s_ease]">
      {/* Row 1: Payroll Name · Posting Date · Frequency */}
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
            onChange={handlePostingDateChange}
          />
        </div>

        <div>
         <ModalSelect
  label="Payroll Month"
  value={data.payrollMonth || ""}
onChange={(e) => {
  const month = e.target.selectedIndex - 1;

  const year = new Date().getFullYear();

  onChange("payrollMonth", e.target.value);

  const range = getMonthDateRange(
    month,
    year,
  );

  onChange("startDate", range.startDate);
  onChange("endDate", range.endDate);
}}
  options={[
    { label: "January", value: "January" },
    { label: "February", value: "February" },
    { label: "March", value: "March" },
    { label: "April", value: "April" },
    { label: "May", value: "May" },
    { label: "June", value: "June" },
    { label: "July", value: "July" },
    { label: "August", value: "August" },
    { label: "September", value: "September" },
    { label: "October", value: "October" },
    { label: "November", value: "November" },
    { label: "December", value: "December" },
  ]}
/>


        </div>
      </div>

      {/* Row 2: Start Date · End Date · Currency · Exchange Rate */}
      <div className="grid grid-cols-4 gap-5">
        <div>
          <DatePickerInput
            label="Start Date"
            name="startDate"
            required
            value={data.startDate}
            onChange={handleStartDateChange}
          />
        </div>

        <div>
          <DatePickerInput
            label="End Date"
            name="endDate"
            required
            value={data.endDate}
            onChange={handleEndDateChange}
          />
        </div>

        <div>
          <SearchSelect2
            label="Currency"
            value={data.currency}
            placeholder="Search currency…"
            fetchOptions={fetchCurrencyOptions}
            onChange={handleCurrencyChange}
          />
        </div>

        <div>
          <ModalInput
            label="Exchange Rate"
            required
            type="number"
              className="no-spinner"
            value={data.exchangeRate ?? ""}
            onChange={(e) => onChange("exchangeRate", Number(e.target.value))}
            disabled
          />
        </div>
      </div>

      {/* Row 3: Payroll Payable Account */}
      <div className="grid grid-cols-2 gap-5">
        <div>
          <SearchSelect2
            label="Payroll Payable Account"
            value={data.payrollPayableAccount}
            placeholder="Search payroll payable account..."
            fetchOptions={(q) =>
              getPayrollPayableAccounts(
                JSON.parse(localStorage.getItem("company-info") || "{}")?.state
                  ?.companyName || "",
                q
              )
            }
            onChange={(val: any) => {
              const value = typeof val === "string" ? val : val?.value;
              onChange("payrollPayableAccount", value);
            }}
          />
        </div>
        <div className="flex items-end">
          <p className="text-[10px] text-muted leading-relaxed">
            Default account used for posting payroll journal entries. Must match
            your company's chart of accounts.
          </p>
        </div>
      </div>

      {/* Row 4: Toggles */}
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
};