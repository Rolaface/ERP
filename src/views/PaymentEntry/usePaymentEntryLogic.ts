import { useEffect, useState, useCallback, useRef } from "react";
import {
  getAllModeOfPayment,
  getPartyDetails,
  getBankAccounts,
  getBankAccountOptions,
  getLedgerAccount,
  getExchangeRate,
  type LedgerAccountOption,
  type ExchangeRateResult,
  type PartyDetails,
  type BankAccountOption,
} from "../../api/BankAccountApi";
import dayjs from "dayjs";

export type ModeOfPaymentOption = {
  label: string;
  value: string;
  defaultAccount: string;
  currency: string;
};

export type PartyOption = {
  label: string;
  value: string;
};

export type LedgerOption = {
  label: string;
  value: string;
  currency: string;
};

type UseModeOfPaymentReturn = {
  options: ModeOfPaymentOption[];
  isLoading: boolean;
  error: string | null;
};

type UsePartyOptionsReturn = {
  partyOptions: PartyOption[];
  isLoadingParties: boolean;
};

type UsePartyDetailsReturn = {
  fetchPartyDetails: (
    party: string,
    partyType: "Supplier" | "Customer"
  ) => Promise<PartyDetails | null>;
  isLoadingDetails: boolean;
};

// ── Hook 1: Mode of Payment options ──────────────────────────────────────────
export function usePaymentModes(): UseModeOfPaymentReturn {
  const [options, setOptions] = useState<ModeOfPaymentOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchModes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getAllModeOfPayment(1, 100, 1);

        if (!cancelled) {
          setOptions(
            result.data.map((item) => ({
              label: item.name,
              value: item.id,
              defaultAccount: item.defaultAccount ?? "",
              currency: item.currency ?? "",
            }))
          );
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load payment modes");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchModes();
    return () => { cancelled = true; };
  }, []);

  return { options, isLoading, error };
}

// ── Hook 2: Party options ─────────────────────────────────────────────────────
export function usePartyOptions(
  partyType: "Supplier" | "Customer" | "Company" | "Shareholder" | "Employee" | ""
): UsePartyOptionsReturn {
  const [partyOptions, setPartyOptions] = useState<PartyOption[]>([]);
  const [isLoadingParties, setIsLoadingParties] = useState(false);

  useEffect(() => {
    if (!partyType || partyType === "Company") {
      setPartyOptions([]);
      return;
    }

    let cancelled = false;
    setIsLoadingParties(true);

    getBankAccounts(
      partyType as "Supplier" | "Customer" | "Shareholder" | "Employee",
      "Payment Entry"
    )
      .then((opts) => {
        if (!cancelled) {
          setPartyOptions(opts.map((o) => ({ label: o.label, value: o.value })));
        }
      })
      .catch(() => {
        if (!cancelled) setPartyOptions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingParties(false);
      });

    return () => { cancelled = true; };
  }, [partyType]);

  return { partyOptions, isLoadingParties };
}

// ── Hook 3: Party details ─────────────────────────────────────────────────────
export function usePartyDetails(): UsePartyDetailsReturn {
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchPartyDetails = useCallback(async (
    party: string,
    partyType: "Supplier" | "Customer"
  ): Promise<PartyDetails | null> => {
    setIsLoadingDetails(true);
    try {
      const details = await getPartyDetails(party, partyType);
      return details;
    } catch (err) {
      console.error("Party details fetch failed:", err);
      return null;
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  return { fetchPartyDetails, isLoadingDetails };
}

// ── Hook 4: Company bank accounts ─────────────────────────────────────────────
export function useCompanyBankAccounts() {
  const [options, setOptions] = useState<BankAccountOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCompanyBanks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getBankAccountOptions({ company: true });
      setOptions(data);
    } catch {
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCompanyBanks = useCallback(() => setOptions([]), []);

  return {
    companyBankOptions: options,
    isLoadingCompanyBanks: isLoading,
    fetchCompanyBanks,
    clearCompanyBanks,
  };
}

// ── Hook 5: Party bank accounts ───────────────────────────────────────────────
export function usePartyBankAccounts() {
  const [options, setOptions] = useState<BankAccountOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPartyBanks = useCallback(async (party_type: string, party: string) => {
    setIsLoading(true);
    try {
      const data = await getBankAccountOptions({ party_type, party });
      setOptions(data);
    } catch {
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPartyBanks = useCallback(() => setOptions([]), []);

  return {
    partyBankOptions: options,
    isLoadingPartyBanks: isLoading,
    fetchPartyBanks,
    clearPartyBanks,
  };
}

// ── Hook 6: Ledger accounts (GL) — used standalone if needed ─────────────────
export function useLedgerAccounts(
  payment_type: "Pay" | "Receive" | "",
  filter: "from" | "to",
  partyType: "Supplier" | "Customer" | "Shareholder" | "Employee" | "",
) {
  const [options, setOptions] = useState<LedgerOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!payment_type || !partyType) {
      setOptions([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getLedgerAccount(
      payment_type,
      filter,
      partyType as "Supplier" | "Customer" | "Shareholder" | "Employee",
    )
      .then((data: LedgerAccountOption[]) => {
        if (!cancelled) {
          setOptions(
            data.map((item) => ({
              label: item.name,
              value: item.name,
              currency: item.account_currency,
            }))
          );
        }
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [payment_type, filter, partyType]);

  return { options, isLoading };
}

// ── Hook 7: Currency options — fetched once, used in currency dropdowns ───────
export function useCurrencyOptions() {
  const [currencyOptions, setCurrencyOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    let cancelled = false;

    getBankAccounts("Currency")
      .then((opts) => {
        if (!cancelled) {
          setCurrencyOptions(opts.map((o) => ({ label: o.label, value: o.value })));
        }
      })
      .catch(() => {
        if (!cancelled) setCurrencyOptions([]);
      });

    return () => { cancelled = true; };
  }, []);

  return { currencyOptions };
}

// ── Hook 8: GL options for both From and To in one call ───────────────────────

export function useLedgerOptions(
  paymentType: "Pay" | "Receive" | "Internal Transfer" | "",
  partyType: "Supplier" | "Customer" | "Shareholder" | "Employee" | "",
) {
  const [fromOptions, setFromOptions] = useState<LedgerOption[]>([]);
  const [toOptions, setToOptions]     = useState<LedgerOption[]>([]);
  const [isLoading, setIsLoading]     = useState(false);

  useEffect(() => {
    const fetchableType =
      paymentType === "Pay" || paymentType === "Receive" ? paymentType : null;

    if (!partyType || !fetchableType) {
      setFromOptions([]);
      setToOptions([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      getLedgerAccount(
        fetchableType,
        "from",
        partyType as "Supplier" | "Customer" | "Shareholder" | "Employee",
      ),
      getLedgerAccount(
        fetchableType,
        "to",
        partyType as "Supplier" | "Customer" | "Shareholder" | "Employee",
      ),
    ])
      .then(([from, to]) => {
        if (cancelled) return;
        setFromOptions(from.map((i) => ({ label: i.name, value: i.name, currency: i.account_currency })));
        setToOptions(to.map((i)   => ({ label: i.name, value: i.name, currency: i.account_currency })));
      })
      .catch(() => {
        if (!cancelled) {
          setFromOptions([]);
          setToOptions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [paymentType, partyType]);

  return { fromOptions, toOptions, isLoadingLedgers: isLoading };
}

// ── Hook 9: Exchange rate — debounced, fires when currencies differ ───────────

export function useExchangeRate(
  currencyFrom: string,
  currencyTo: string,
  date: string,
  companyDefaultCurrency?: string 
) {
  const [rate, setRate]         = useState<number | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currenciesKnown  = Boolean(currencyFrom && currencyTo);
  const currenciesDiffer = currenciesKnown && currencyFrom !== currencyTo;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!currenciesDiffer) {
      setRate(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      const effectiveDate = date || dayjs().format("YYYY-MM-DD");
      const result: ExchangeRateResult = await getExchangeRate(currencyFrom, currencyTo, effectiveDate,companyDefaultCurrency);

      setIsLoading(false);

      if (result.error) {
        setError(result.error);
        setRate(null);
      } else {
        setError(null);
        setRate(result.rate);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [currencyFrom, currencyTo, date, companyDefaultCurrency]);

  return { rate, error, isLoadingRate: isLoading, currenciesDiffer };
}