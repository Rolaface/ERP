import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getCompanyDefaults } from "../api/companySetupApi"; 

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompanyDefaults {
  company_name:                           string | null;
  abbr:                                   string | null;
  default_currency:                       string | null;
  default_bank_account:                   string | null;
  default_cash_account:                   string | null;
  default_receivable_account:             string | null;
  default_payable_account:                string | null;
  default_income_account:                 string | null;
  default_expense_account:                string | null;
  round_off_account:                      string | null;
  round_off_cost_center:                  string | null;
  write_off_account:                      string | null;
  exchange_gain_loss_account:             string | null;
  unrealized_exchange_gain_loss_account:  string | null;
  default_deferred_revenue_account:       string | null;
  default_deferred_expense_account:       string | null;
  default_advance_received_account:       string | null;
  default_advance_paid_account:           string | null;
  cost_center:                            string | null;
  default_finance_book:                   string | null;
  default_holiday_list:                   string | null;
  default_selling_terms:                  string | null;
  default_buying_terms:                   string | null;
  default_in_transit_warehouse:           string | null;
  default_payroll_payable_account:        string | null;
  default_employee_advance_account:       string | null;
  // extended — saved from CompanyDefaults form
  primary_business_domain:               string | null;
  default_payment_mode:                   string | null;
}

type FetchStatus = "idle" | "loading" | "success" | "error";

interface CompanyDefaultsState {
  // ── Data ──
  defaults:       CompanyDefaults | null;

  // ── Fetch state ──
  status:         FetchStatus;
  error:          string | null;
  lastFetchedAt:  number | null;   // epoch ms — for stale detection
  isHydrated:     boolean;

  // ── Actions ──
  fetchDefaults:  (force?: boolean) => Promise<void>;
  setDefaults:    (data: Partial<CompanyDefaults>) => void;
  clearDefaults:  () => void;
  setHydrated:    () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Re-fetch if cached data is older than 10 minutes */
const STALE_THRESHOLD_MS = 10 * 60 * 1000;

const emptyDefaults: CompanyDefaults = {
  company_name:                           null,
  abbr:                                   null,
  default_currency:                       null,
  default_bank_account:                   null,
  default_cash_account:                   null,
  default_receivable_account:             null,
  default_payable_account:                null,
  default_income_account:                 null,
  default_expense_account:                null,
  round_off_account:                      null,
  round_off_cost_center:                  null,
  write_off_account:                      null,
  exchange_gain_loss_account:             null,
  unrealized_exchange_gain_loss_account:  null,
  default_deferred_revenue_account:       null,
  default_deferred_expense_account:       null,
  default_advance_received_account:       null,
  default_advance_paid_account:           null,
  cost_center:                            null,
  default_finance_book:                   null,
  default_holiday_list:                   null,
  default_selling_terms:                  null,
  default_buying_terms:                   null,
  default_in_transit_warehouse:           null,
  default_payroll_payable_account:        null,
  default_employee_advance_account:       null,
  primary_business_domain:               null,
  default_payment_mode:                   null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCompanyDefaultsStore = create<CompanyDefaultsState>()(
  persist(
    (set, get) => ({
      // ── Initial state ──
      defaults:      null,
      status:        "idle",
      error:         null,
      lastFetchedAt: null,
      isHydrated:    false,

      // ── fetchDefaults ─────────────────────────────────────────────────────
      // Call anywhere. Skips network if fresh data exists, unless force=true.
      fetchDefaults: async (force = false) => {
        const { status, lastFetchedAt, defaults } = get();

        // 1. Already loading — don't double-fetch
        if (status === "loading") return;

        // 2. Have data, not forced, and not stale — skip
        const isStale =
          !lastFetchedAt ||
          Date.now() - lastFetchedAt > STALE_THRESHOLD_MS;

        if (!force && defaults && !isStale) return;

        // 3. Fetch
        set({ status: "loading", error: null });

        try {
          const res = await getCompanyDefaults();
          const data: CompanyDefaults = res?.message?.data ?? res?.data ?? res;

          set({
            defaults:      { ...emptyDefaults, ...data },
            status:        "success",
            error:         null,
            lastFetchedAt: Date.now(),
          });
        } catch (err: any) {
          const message: string =
            err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch company defaults.";

          set({ status: "error", error: message });

          // If we have stale cached data, keep it — better than null
          // (don't wipe defaults on error)
        }
      },

      // ── setDefaults ───────────────────────────────────────────────────────
      // Used after saving CompanyDefaults form — merge into store immediately
      // so modules get fresh data without a refetch round-trip.
      setDefaults: (data) =>
        set((state) => ({
          defaults:      { ...(state.defaults ?? emptyDefaults), ...data },
          lastFetchedAt: Date.now(),
        })),

      // ── clearDefaults ─────────────────────────────────────────────────────
      // Call on logout / company switch
      clearDefaults: () =>
        set({
          defaults:      null,
          status:        "idle",
          error:         null,
          lastFetchedAt: null,
        }),

      // ── setHydrated ───────────────────────────────────────────────────────
      setHydrated: () => set({ isHydrated: true }),
    }),
{
  name: "company-defaults",
  version: 2,

  migrate: (persistedState: any, version: number) => {
    if (version < 2) {
      return {
        defaults:      null,
        lastFetchedAt: null,
      };
    }
    return persistedState;
  },

  partialize: (state) => ({
    defaults:      state.defaults,
    lastFetchedAt: state.lastFetchedAt,
  }),

  onRehydrateStorage: () => (state) => {
    state?.setHydrated();
  },
}
  ),
);