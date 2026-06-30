import React, { useCallback, useEffect, useRef } from "react";
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
import { getPayrollPaymentAccounts } from "../../../api/faapi";
import CostCenterSelect from "../../../components/selects/CostCenterSelect";
import { getAllBankAccounts } from "../../../api/BankAccountApi";
import ProjectSelect from "../../../components/selects/ProjectSelect";

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

type MonthName = (typeof MONTH_NAMES)[number];

// ── Currency helpers ──────────────────────────────────────────────────────────
const fetchCurrencyOptions = async (q: string) => {
  const list = await getCurrencyList({ search: q, page: 1, page_size: 20 });
  return (list || []).map((c: any) => ({
    label: `${c.name}${c.symbol ? ` (${c.symbol})` : ""}`,
    value: c.name,
  }));
};

const getBaseCurrencyFromStorage = (): string => {
  try {
    const raw = localStorage.getItem("company-info");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed?.state?.baseCurrency || "";
  } catch {
    return "";
  }
};

// ── Date utilities ────────────────────────────────────────────────────────────
const toDateStr = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getMonthDateRange = (
  monthIndex: number,
  year: number,
): { startDate: string; endDate: string } => ({
  startDate: toDateStr(new Date(year, monthIndex, 1)),
  endDate: toDateStr(new Date(year, monthIndex + 1, 0)),
});

const monthNameFromDateStr = (dateStr: string): MonthName | undefined => {
  if (!dateStr) return undefined;
  const parts = dateStr.split("-").map(Number);
  const monthOneBased = parts[1];
  if (!monthOneBased || monthOneBased < 1 || monthOneBased > 12) return undefined;
  return MONTH_NAMES[monthOneBased - 1];
};

const yearFromDateStr = (dateStr: string): number => {
  if (!dateStr) return new Date().getFullYear();
  const y = parseInt(dateStr.split("-")[0], 10);
  return Number.isFinite(y) ? y : new Date().getFullYear();
};

// ── Modal wrapper ─────────────────────────────────────────────────────────────
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
  isEditMode?: boolean;
  onDirty?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  data,
  onChange,
  isEditMode = false,
}) => {
  const defaultsApplied = useRef(false);

  useEffect(() => {
    if (isEditMode || defaultsApplied.current) return;
    defaultsApplied.current = true;

    if (!data.currency) {
      const baseCurrency = getBaseCurrencyFromStorage();
      if (baseCurrency) onChange("currency", baseCurrency);
    }

    if (!data.payrollMonth) {
      const now = new Date();
      const monthName = MONTH_NAMES[now.getMonth()];
      const range = getMonthDateRange(now.getMonth(), now.getFullYear());
      onChange("payrollMonth", monthName);
      onChange("startDate", range.startDate);
      onChange("endDate", range.endDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    [onChange],
  );

  const handlePostingDateChange = useCallback(
    async (_name: string, value: string) => {
      onChange("postingDate", value);
      await refreshExchangeRate(data.currency, value);
    },
    [data.currency, onChange, refreshExchangeRate],
  );

  const handleCurrencyChange = useCallback(
    async (val: any) => {
      const value = typeof val === "string" ? val : val?.value;
      onChange("currency", value);
      await refreshExchangeRate(value, data.postingDate);
    },
    [data.postingDate, onChange, refreshExchangeRate],
  );

  const handleMonthChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const monthName = e.target.value as MonthName;
      const monthIndex = MONTH_NAMES.indexOf(monthName);
      if (monthIndex === -1) return;
      const year = yearFromDateStr(data.startDate);
      const range = getMonthDateRange(monthIndex, year);
      onChange("payrollMonth", monthName);
      onChange("startDate", range.startDate);
      onChange("endDate", range.endDate);
    },
    [data.startDate, onChange],
  );

  const handleStartDateChange = useCallback(
    (_name: string, value: string) => {
      onChange("startDate", value);
      const derivedMonth = monthNameFromDateStr(value);
      if (derivedMonth) onChange("payrollMonth", derivedMonth);
    },
    [onChange],
  );

  const handleEndDateChange = useCallback(
    (_name: string, value: string) => {
      onChange("endDate", value);
    },
    [onChange],
  );

  const companyName =
    JSON.parse(localStorage.getItem("company-info") || "{}")?.state
      ?.companyName || "";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-5 animate-[fadeIn_0.2s_ease]">
      {/* ── LEFT: sections ── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* ── Schedule ── */}
        <div className="border border-theme rounded-xl p-5">
          <p className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-4">
            Schedule
          </p>
          {/*
            4 equal cols on md+, 2 cols on sm, 1 col on xs
          */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <DatePickerInput
              label="Posting Date"
              name="postingDate"
              required
              value={data.postingDate}
              onChange={handlePostingDateChange}
            />
            <ModalSelect
              label="Payroll Month"
              value={data.payrollMonth || ""}
              onChange={handleMonthChange}
              options={MONTH_NAMES.map((m) => ({ label: m, value: m }))}
            />
            <DatePickerInput
              label="Start Date"
              name="startDate"
              required
              value={data.startDate}
              onChange={handleStartDateChange}
            />
            <DatePickerInput
              label="End Date"
              name="endDate"
              required
              value={data.endDate}
              onChange={handleEndDateChange}
            />
          </div>
        </div>

        {/* ── Financials ── */}
        <div className="border border-theme rounded-xl p-5">
          <p className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-4">
            Financials
          </p>

          {/*
            All 5 financial fields in ONE responsive row.

            Layout breakpoints:
            • xl+  → single row: [Currency w-20] [Exch.Rate w-16] [PayableAcc flex-1] [PaymentAcc flex-1] [BankAcc flex-1]
            • lg   → single row same (modal is 6xl so this should always fit)
            • md   → wraps to 2 rows: top row has currency+exchrate+payable+payment, bank goes full width below
            • sm/xs → stacks vertically

            We achieve this with flex-wrap + explicit min-widths so fields
            wrap naturally at smaller sizes rather than overflowing.
          */}
          <div className="flex flex-wrap gap-3 items-end">

            {/* Currency — fixed narrow */}
            <div className="w-[88px] shrink-0">
              <SearchSelect2
                label="Currency"
                value={data.currency}
                placeholder="Currency…"
                fetchOptions={fetchCurrencyOptions}
                onChange={handleCurrencyChange}
              />
            </div>

            {/* Exchange Rate — fixed very narrow, disabled/auto */}
            <div className="w-[72px] shrink-0">
              <ModalInput
                label="Exch. Rate"
                required
                type="number"
                className="no-spinner"
                value={data.exchangeRate ?? ""}
                onChange={(e) =>
                  onChange("exchangeRate", Number(e.target.value))
                }
                disabled
              />
            </div>

            {/* Payroll Payable Account — grows */}
            <div className="flex-1 min-w-[160px]">
              <SearchSelect2
                label="Payroll Payable Account"
                required
                value={data.payrollPayableAccountLabel || data.payrollPayableAccount} 
                placeholder="Search payable account…"
                fetchOptions={(q) => getPayrollPayableAccounts(companyName, q)}
                onChange={(val: any, option: any) => {
                  const value = typeof val === "string" ? val : val?.value;
                  onChange("payrollPayableAccount", value);
                  onChange("payrollPayableAccountLabel", option?.label ?? value);
                }}
              />
            </div>

            {/* Payment Account — grows */}
            <div className="flex-1 min-w-[160px]">
              <SearchSelect2
                label="Payment Account"
                value={data.paymentAccountLabel || data.paymentAccount}
                placeholder="Search payment account…"
                required
                fetchOptions={(q) => getPayrollPaymentAccounts(companyName, q)}
                onChange={(val: any, option: any) => {
                  const value = typeof val === "string" ? val : val?.value;
                  onChange("paymentAccount", value);
                  onChange("paymentAccountLabel", option?.label ?? value);
                }}
              />
            </div>

            {/* Bank Account — grows, same row on wide screens */}
            <div className="flex-1 min-w-[160px]">
              <SearchSelect2
                label="Bank Account"
                value={data.bankAccount}
                placeholder="Search bank account…"
                required
                fetchOptions={async (q) => {
                  const resp = await getAllBankAccounts({
                    company: true,
                    search: q,
                    page: 1,
                    page_size: 20,
                  });
                  return (resp?.data || []).map((item: any) => ({
                    label: `${item.bankName || "Unknown Bank"}${
                      item.currency ? ` (${item.currency})` : ""
                    }`,
                    value: item.id || item.name || "",
                  }));
                }}
                onChange={(val: any) =>
                  onChange(
                    "bankAccount",
                    typeof val === "string" ? val : val?.value || "",
                  )
                }
              />
            </div>
            

          </div>
        </div>

        {/* ── Allocation ── */}
        <div className="border border-theme rounded-xl p-5">
          <p className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-4">
            Allocation
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CostCenterSelect
              value={data.costCenter}
              onChange={(value: string) => onChange("costCenter", value)}
            />
            <ProjectSelect
              value={data.project}
              onChange={(value: string) => onChange("project", value)}
            />
          </div>
        </div>

      </div>

      {/* ── RIGHT: Configuration ── */}
      <div className="w-60 shrink-0 bg-app border border-theme rounded-xl p-5 h-fit">
        <p className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-4">
          Configuration
        </p>
        <div className="space-y-1">
          {[
            {
              field: "deductTaxForProof",
              label: "Deduct Tax for Unsubmitted Proof",
              desc: "Applies tax deductions if tax saving proofs are not submitted.",
            },
            {
              field: "salarySlipTimesheet",
              label: "Salary Slip Based on Timesheet",
              desc: "Generate slips based on approved timesheet hours.",
            },
          ].map(({ field, label, desc }) => (
            <label
              key={field}
              className="flex items-start gap-3 py-3 border-b border-theme last:border-0 cursor-pointer"
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
    </div>
  );
};