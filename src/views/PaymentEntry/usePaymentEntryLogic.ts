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
  accountName: string;
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
  fetchModes: (search?: string) => Promise<ModeOfPaymentOption[]>;
};

type UsePartyOptionsReturn = {
  partyOptions: PartyOption[];
  isLoadingParties: boolean;
  fetchParties: (search?: string) => Promise<PartyOption[]>;
};

// ── Hook 1: Mode of Payment options ──────────────────────────────────────────
export function usePaymentModes(): UseModeOfPaymentReturn {
  const [options, setOptions] = useState<ModeOfPaymentOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModes = useCallback(async (search?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAllModeOfPayment(1, 100, search, 1);
      const mapped = result.data.map((item: any) => ({
        label: item.name,
        value: item.id,
        defaultAccount: item.defaultAccount ?? "",
        accountName: item.accountName ?? "",
        currency: item.currency ?? "",
      }));
      setOptions(mapped);
      return mapped; // return the fresh data
    } catch (err: any) {
      setError(err.message || "Failed to load payment modes");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModes(); // initial load on mount
  }, [fetchModes]);

  return { options, isLoading, error, fetchModes };
}

// ── Hook 2: Party options
export function usePartyOptions(
  partyType:
    | "Supplier"
    | "Customer"
    | "Company"
    | "Shareholder"
    | "Employee"
    | "",
): UsePartyOptionsReturn {
  const [partyOptions, setPartyOptions] = useState<PartyOption[]>([]);
  const [isLoadingParties, setIsLoadingParties] = useState(false);

  const fetchParties = useCallback(
    async (search?: string) => {
      if (!partyType || partyType === "Company") {
        setPartyOptions([]);
        return [];
      }
      setIsLoadingParties(true);
      try {
        const opts = await getBankAccounts(
          partyType as "Supplier" | "Customer" | "Shareholder" | "Employee",
          undefined,
          search,
        );
        const mapped = opts.map((o: any) => ({
          label: o.label || o.name,
          value: o.partyName || o.id || o.value,
        }));

        setPartyOptions(mapped);
        return mapped; // ← return fresh data
      } catch {
        setPartyOptions([]);
        return [];
      } finally {
        setIsLoadingParties(false);
      }
    },
    [partyType],
  );

  useEffect(() => {
    fetchParties(); // initial load when partyType changes
  }, [fetchParties]);

  return { partyOptions, isLoadingParties, fetchParties };
}

// ── Hook 3: Party details ─────────────────────────────────────────────────────
type UsePartyDetailsReturn = {
  fetchPartyDetails: (
    party: string,
    partyType: "Supplier" | "Customer" | "Employee" | "Shareholder",
  ) => Promise<PartyDetails | null>;
  isLoadingDetails: boolean;
};

export function usePartyDetails(): UsePartyDetailsReturn {
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchPartyDetails = useCallback(
    async (
      party: string,
      partyType: "Supplier" | "Customer" | "Employee" | "Shareholder",
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
    },
    [],
  );

  return { fetchPartyDetails, isLoadingDetails };
}

// ── Hook 4: Company bank accounts ─────────────────────────────────────────────
export function useCompanyBankAccounts() {
  const [options, setOptions] = useState<BankAccountOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCompanyBanks = useCallback(async (search?: string) => {
    setIsLoading(true);
    try {
      const data = await getBankAccountOptions({ company: true, search });
      setOptions(data);
      return data;
    } catch {
      setOptions([]);
      return [];
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

  const fetchPartyBanks = useCallback(
    async (party_type: string, party: string, search?: string) => {
      setIsLoading(true);
      try {
        const data = await getBankAccountOptions({ party_type, party, search });
        setOptions(data);
        return data;
      } catch {
        setOptions([]);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

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
              label: item.account_name,
              value: item.name,
              currency: item.account_currency,
            })),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [payment_type, filter, partyType]);

  return { options, isLoading };
}

// ── Hook 7: Currency options — backend search supported ───────────────────────
export function useCurrencyOptions() {
  const [currencyOptions, setCurrencyOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);

  const fetchCurrencies = useCallback(async (search?: string) => {
    setIsLoadingCurrencies(true);
    try {
      const opts = await getBankAccounts("Currency", undefined, search);
      setCurrencyOptions(opts.map((o) => ({ label: o.label, value: o.value })));
    } catch {
      setCurrencyOptions([]);
    } finally {
      setIsLoadingCurrencies(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrencies(); // initial load on mount
  }, [fetchCurrencies]);

  return { currencyOptions, isLoadingCurrencies, fetchCurrencies };
}

// ── Hook 8: GL options for both From and To in one call ───────────────────────
export function useLedgerOptions(
  paymentType: "Pay" | "Receive" | "Internal Transfer" | "",
  partyType: "Supplier" | "Customer" | "Shareholder" | "Employee" | "",
) {
  const [fromOptions, setFromOptions] = useState<LedgerOption[]>([]);
  const [toOptions, setToOptions] = useState<LedgerOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchableType =
      paymentType === "Pay" ||
        paymentType === "Receive" ||
        paymentType === "Internal Transfer"
        ? paymentType
        : null;

    if (!fetchableType) {
      setFromOptions([]);
      setToOptions([]);
      return;
    }

    if ((paymentType === "Pay" || paymentType === "Receive") && !partyType) {
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
        setFromOptions(
          from.map((i) => ({
            label: i.account_name,
            value: i.name,
            currency: i.account_currency,
          })),
        );
        setToOptions(
          to.map((i) => ({
            label: i.account_name,
            value: i.name,
            currency: i.account_currency,
          })),
        );
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

    return () => {
      cancelled = true;
    };
  }, [paymentType, partyType]);

  const fetchFromOptions = useCallback(
    async (search?: string) => {
      const fetchableType =
        paymentType === "Pay" ||
          paymentType === "Receive" ||
          paymentType === "Internal Transfer"
          ? paymentType
          : null;
      if (!fetchableType) return [];
      if ((paymentType === "Pay" || paymentType === "Receive") && !partyType)
        return [];
      try {
        const data = await getLedgerAccount(
          fetchableType,
          "from",
          partyType,
          search,
        );
        const mapped = data.map((i) => ({
          label: i.account_name,
          value: i.name,
          currency: i.account_currency,
        }));
        setFromOptions(mapped);
        return mapped;
      } catch {
        return [];
      }
    },
    [paymentType, partyType],
  );

  const fetchToOptions = useCallback(
    async (search?: string) => {
      const fetchableType =
        paymentType === "Pay" ||
          paymentType === "Receive" ||
          paymentType === "Internal Transfer"
          ? paymentType
          : null;
      if (!fetchableType) return [];
      if ((paymentType === "Pay" || paymentType === "Receive") && !partyType)
        return [];
      try {
        const data = await getLedgerAccount(
          fetchableType,
          "to",
          partyType,
          search,
        );
        const mapped = data.map((i) => ({
          label: i.account_name,
          value: i.name,
          currency: i.account_currency,
        }));
        setToOptions(mapped);
        return mapped;
      } catch {
        return [];
      }
    },
    [paymentType, partyType],
  );

  return {
    fromOptions,
    toOptions,
    isLoadingLedgers: isLoading,
    fetchFromOptions,
    fetchToOptions,
  };
}

// ── Hook 9: Exchange rate — debounced, fires when currencies differ ───────────
export function useExchangeRate(
  currencyFrom: string,
  currencyTo: string,
  date: string,
  args: "for_selling" | "for_buying",
) {
  const [rate, setRate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currenciesKnown = Boolean(currencyFrom && currencyTo);
  const currenciesDiffer = currenciesKnown && currencyFrom !== currencyTo;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!currenciesKnown) {
      setRate(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!currenciesDiffer) {
      setRate(1);
      setError(null);
      setIsLoading(false);
      return;
    }

    setRate(null);
    setError(null);

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);

      const effectiveDate = date || dayjs().format("YYYY-MM-DD");
      try {
        const result: ExchangeRateResult = await getExchangeRate(
          currencyFrom,
          currencyTo,
          effectiveDate,
          args,
        );

        if (result.error) {
          setError(result.error);
          setRate(null);
        } else {
          setError(null);
          setRate(result.rate);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to fetch exchange rate.");
        setRate(null);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [currencyFrom, currencyTo, currenciesKnown, currenciesDiffer, date, args]);

  return { rate, error, isLoadingRate: isLoading, currenciesDiffer };
}
