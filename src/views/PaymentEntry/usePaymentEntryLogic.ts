import { useEffect, useState } from "react";
import {
  getAllModeOfPayment,
  getPartyDetails,
  getBankAccounts,
  type PartyDetails,
} from "../../api/BankAccountApi";

export type ModeOfPaymentOption = {
  label: string;
  value: string;
  defaultAccount: string;
  currency: string; // ← added: will come from backend
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


// ── Hook 2: Party options by type ─────────────────────────────────────────────
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
      "Payment Entry" // ← reference_doctype passed only from payment entry hook
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

// ── Hook 3: Fetch party details on demand ─────────────────────────────────────
export function usePartyDetails(): UsePartyDetailsReturn {
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchPartyDetails = async (
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
  };

  return { fetchPartyDetails, isLoadingDetails };
}