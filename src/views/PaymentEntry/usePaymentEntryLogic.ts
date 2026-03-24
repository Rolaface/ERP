import { useEffect, useState,useCallback } from "react";
import {
  getAllModeOfPayment,
  getPartyDetails,
  getBankAccounts,
  getBankAccountOptions,
  getLedgerAccount,
    type LedgerAccountOption,

  type PartyDetails,
   type BankAccountOption
} from "../../api/BankAccountApi";

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

// ── Hook 1: Mode of Payment options 
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
          setPartyOptions(
            opts.map((o) => ({ label: o.label, value: o.value }))
          );
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
  }, []); // stable reference

  return { fetchPartyDetails, isLoadingDetails };
}


//Hook 4
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
  }, []); // stable reference — no deps

  const clearCompanyBanks = useCallback(() => setOptions([]), []);

  return {
    companyBankOptions: options,
    isLoadingCompanyBanks: isLoading,
    fetchCompanyBanks,
    clearCompanyBanks,
  };
}

// ── Hook 5: Party bank accounts 
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
  }, []); // stable reference — no deps

  const clearPartyBanks = useCallback(() => setOptions([]), []);

  return {
    partyBankOptions: options,
    isLoadingPartyBanks: isLoading,
    fetchPartyBanks,
    clearPartyBanks,
  };
}
// ── Hook 6: Ledger accounts (GL) ──────────────────────────────────────────

export type LedgerOption = {
  label: string;
  value: string;
  currency: string;
};

export function useLedgerAccounts(
  payment_type: "Pay" | "Receive" | "",
  filter: "from" | "to"
) {
  const [options, setOptions] = useState<LedgerOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!payment_type) {
      setOptions([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getLedgerAccount(payment_type, filter)
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
  }, [payment_type, filter]);

  return { options, isLoading };
}