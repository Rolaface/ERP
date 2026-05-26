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

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

type MonthName = typeof MONTH_NAMES[number];

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

/** Returns start/end date strings for a given month index (0–11) and year. */
const getMonthDateRange = (
  monthIndex: number,
  year: number
): { startDate: string; endDate: string } => ({
  startDate: toDateStr(new Date(year, monthIndex, 1)),
  endDate: toDateStr(new Date(year, monthIndex + 1, 0)),
});

/**
 * Derives the month name from a "YYYY-MM-DD" date string.
 *
 * FIX: split gives [YYYY, MM, DD].
 *   - index 0 = year
 *   - index 1 = month  ← we want this
 *   - index 2 = day
 * Previous code used `const [, , month]` which extracted the DAY (index 2).
 * Corrected to `const [, month]` (index 1).
 */
const monthNameFromDateStr = (dateStr: string): MonthName | undefined => {
  if (!dateStr) return undefined;
  const parts = dateStr.split("-").map(Number); // [YYYY, MM, DD]
  const monthOneBased = parts[1];               // MM is at index 1
  if (!monthOneBased || monthOneBased < 1 || monthOneBased > 12) return undefined;
  return MONTH_NAMES[monthOneBased - 1];
};

/**
 * Extracts the year from a "YYYY-MM-DD" string, falling back to current year.
 */
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
  /** Pass true when opening an existing record so defaults are not injected. */
  isEditMode?: boolean;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  data,
  onChange,
  isEditMode = false,
}) => {
  // Guard: run the "set defaults" effect only once, and only in create mode.
  const defaultsApplied = useRef(false);

  useEffect(() => {
    if (isEditMode || defaultsApplied.current) return;
    defaultsApplied.current = true;

    // ── Default currency ──────────────────────────────────────────────────
    if (!data.currency) {
      const baseCurrency = getBaseCurrencyFromStorage();
      if (baseCurrency) onChange("currency", baseCurrency);
    }

    // ── Default payroll month + date range ────────────────────────────────
    if (!data.payrollMonth) {
      const now = new Date();
      const monthName = MONTH_NAMES[now.getMonth()];
      const range = getMonthDateRange(now.getMonth(), now.getFullYear());
      onChange("payrollMonth", monthName);
      onChange("startDate", range.startDate);
      onChange("endDate", range.endDate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — fire once on mount only

  // ── Exchange rate fetcher ─────────────────────────────────────────────────
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

  // ── Field handlers ────────────────────────────────────────────────────────

  const handlePostingDateChange = useCallback(
    async (_name: string, value: string) => {
      onChange("postingDate", value);
      await refreshExchangeRate(data.currency, value);
    },
    [data.currency, onChange, refreshExchangeRate]
  );

  const handleCurrencyChange = useCallback(
    async (val: any) => {
      const value = typeof val === "string" ? val : val?.value;
      onChange("currency", value);
      await refreshExchangeRate(value, data.postingDate);
    },
    [data.postingDate, onChange, refreshExchangeRate]
  );

  /**
   * Month dropdown → derive year from existing startDate, recalculate range.
   * Value-based lookup (no fragile selectedIndex arithmetic).
   */
  const handleMonthChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const monthName = e.target.value as MonthName;
      const monthIndex = MONTH_NAMES.indexOf(monthName);
      if (monthIndex === -1) return;

      // Preserve the year already encoded in startDate if available.
      const year = yearFromDateStr(data.startDate);
      const range = getMonthDateRange(monthIndex, year);

      onChange("payrollMonth", monthName);
      onChange("startDate", range.startDate);
      onChange("endDate", range.endDate);
    },
    [data.startDate, onChange]
  );

  /**
   * Start date → also sync the month dropdown.
   * Does NOT touch endDate — user controls it independently.
   */
  const handleStartDateChange = useCallback(
    (_name: string, value: string) => {
      onChange("startDate", value);
      const derivedMonth = monthNameFromDateStr(value);
      if (derivedMonth) onChange("payrollMonth", derivedMonth);
    },
    [onChange]
  );

  /** End date is fully independent. */
  const handleEndDateChange = useCallback(
    (_name: string, value: string) => {
      onChange("endDate", value);
    },
    [onChange]
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-[fadeIn_0.2s_ease]">
      {/* Row 1: Posting Date · Payroll Month */}
      <div className="grid grid-cols-2 gap-5">
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
            onChange={handleMonthChange}
            options={MONTH_NAMES.map((m) => ({ label: m, value: m }))}
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
            required
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