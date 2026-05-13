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

/** Returns today as "YYYY-MM-DD" in local time — used as the fallback reference
 *  when no posting date has been set yet (e.g. frequency selected first). */
const todayStr = (): string => toDateStr(new Date());

// ── ERPNext-style payroll period calculation ──────────────────────────────────
/**
 * Mirrors ERPNext's `set_start_end_dates` logic in payroll_entry.py.
 *
 * Given a reference date (posting date or a manually set start date) and a
 * payroll frequency, returns the correct { startDate, endDate } pair exactly
 * as ERPNext would compute them.
 *
 * Frequencies supported (matching ERPNext doctype options):
 *   Daily | Weekly | Fortnightly | Bimonthly | Monthly
 */
const getPayrollDateRange = (
  referenceDate: string,
  frequency: string
): { startDate: string; endDate: string } | null => {
  if (!referenceDate || !frequency) return null;

  const ref = new Date(referenceDate + "T00:00:00");
  if (isNaN(ref.getTime())) return null;

  switch (frequency) {
    case "Daily": {
      // Same day — ERPNext keeps start === end for daily payroll
      const s = toDateStr(ref);
      return { startDate: s, endDate: s };
    }

    case "Weekly": {
      // Week that contains the reference date (Mon → Sun, ERPNext convention)
      const day = ref.getDay(); // 0 = Sun … 6 = Sat
      const diffToMon = day === 0 ? -6 : 1 - day;
      const monday = new Date(ref);
      monday.setDate(ref.getDate() + diffToMon);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { startDate: toDateStr(monday), endDate: toDateStr(sunday) };
    }

    case "Fortnightly": {
      // 14-day period starting from the reference date
      const end = new Date(ref);
      end.setDate(ref.getDate() + 13);
      return { startDate: toDateStr(ref), endDate: toDateStr(end) };
    }

    case "Bimonthly": {
      // ERPNext splits the month into two halves:
      //   1st–15th  →  start = 1st, end = 15th
      //   16th–EOM  →  start = 16th, end = last day of month
      const year = ref.getFullYear();
      const month = ref.getMonth();
      const dayOfMonth = ref.getDate();

      if (dayOfMonth <= 15) {
        const start = new Date(year, month, 1);
        const end = new Date(year, month, 15);
        return { startDate: toDateStr(start), endDate: toDateStr(end) };
      } else {
        const start = new Date(year, month, 16);
        const end = new Date(year, month + 1, 0); // last day of month
        return { startDate: toDateStr(start), endDate: toDateStr(end) };
      }
    }

    case "Monthly": {
      // Full calendar month containing the reference date
      const year = ref.getFullYear();
      const month = ref.getMonth();
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0); // last day of month
      return { startDate: toDateStr(start), endDate: toDateStr(end) };
    }

    // Biweekly kept for backward-compat with any stored data — treat same as Fortnightly
    case "Biweekly": {
      const end = new Date(ref);
      end.setDate(ref.getDate() + 13);
      return { startDate: toDateStr(ref), endDate: toDateStr(end) };
    }

    default:
      return null;
  }
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
  /**
   * Applies a computed date range to the form state.
   * Batches both fields so the parent only re-renders once per date resolution.
   */
  const applyDateRange = useCallback(
    (range: { startDate: string; endDate: string }) => {
      onChange("startDate", range.startDate);
      onChange("endDate", range.endDate);
    },
    [onChange]
  );

  /**
   * Fetch exchange rate helper — reused by both posting-date and currency changes.
   */
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

  // ── On mount: if frequency is already set but dates are empty, auto-populate ─
  // This covers the case where the form opens with "Monthly" pre-selected
  // (e.g. from user preferences or a saved draft) and no dates have been filled.
  useEffect(() => {
    if (data.payrollFrequency && !data.startDate && !data.endDate) {
      const reference = data.postingDate || todayStr();
      const range = getPayrollDateRange(reference, data.payrollFrequency);
      if (range) applyDateRange(range);
    }
    // Only run once on mount — exhaustive-deps intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────

  /**
   * Posting date change:
   *  1. Persist the new posting date.
   *  2. If a frequency is already selected, recalculate the date range using
   *     the new posting date as the reference (ERPNext behaviour).
   *  3. Refresh exchange rate.
   */
  const handlePostingDateChange = useCallback(
    async (_name: string, value: string) => {
      onChange("postingDate", value);

      if (data.payrollFrequency && value) {
        const range = getPayrollDateRange(value, data.payrollFrequency);
        if (range) applyDateRange(range);
      }

      await refreshExchangeRate(data.currency, value);
    },
    [data.payrollFrequency, data.currency, onChange, applyDateRange, refreshExchangeRate]
  );

  /**
   * Frequency change:
   *  Use the posting date (preferred) or the current start date as reference,
   *  then compute and apply the new date range — identical to ERPNext's
   *  `payroll_frequency` onchange trigger.
   */
  const handleFrequencyChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const frequency = e.target.value;
      onChange("payrollFrequency", frequency);

      if (frequency) {
        // Prefer posting date → existing start date → today (so Monthly always
        // resolves to a proper range even when the form is freshly opened)
        const reference = data.postingDate || data.startDate || todayStr();
        const range = getPayrollDateRange(reference, frequency);
        if (range) applyDateRange(range);
      }
    },
    [data.postingDate, data.startDate, onChange, applyDateRange]
  );

  /**
   * Start date manual change:
   *  Allow free editing. If a frequency is set, recompute the end date from
   *  the new start date so the period length stays consistent — mirrors how
   *  ERPNext recalculates end_date when start_date is manually adjusted.
   */
  const handleStartDateChange = useCallback(
    (_name: string, value: string) => {
      onChange("startDate", value);

      if (data.payrollFrequency && value) {
        const range = getPayrollDateRange(value, data.payrollFrequency);
        if (range) {
          // Only push the end date; keep the user-chosen start date intact
          onChange("endDate", range.endDate);
        }
      }
    },
    [data.payrollFrequency, onChange]
  );

  /**
   * End date manual change — always allow free override (no auto-recalc).
   */
  const handleEndDateChange = useCallback(
    (_name: string, value: string) => {
      onChange("endDate", value);
    },
    [onChange]
  );

  /**
   * Currency change — refresh exchange rate.
   */
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
            label="Payroll Frequency"
            value={data.payrollFrequency}
            onChange={handleFrequencyChange}
          >
            <option value="">Select frequency</option>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Fortnightly">Fortnightly</option>
            <option value="Bimonthly">Bimonthly</option>
            <option value="Monthly">Monthly</option>
          </ModalSelect>
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