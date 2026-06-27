// hooks/useCompanyData.ts
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCompanyStore } from "../store/companyStore";
import { getCompanyById } from "../api/companySetupApi";
import { getCurrencyList } from "../api/lookupApi";

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID ?? "DASH";

const fetchWithRetry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error("Max retries reached");
};

export const useCompanyData = () => {
  const navigate = useNavigate();
  const { companyName, isHydrated, setCompanyInfo, ...rest } = useCompanyStore();

  useEffect(() => {
    if (!isHydrated) return;
    if (companyName) return;

    const refetch = async () => {
      try {
        const companyRes = await fetchWithRetry(() => getCompanyById(COMPANY_ID));
        const company = companyRes?.data;

        let currencySymbol = company?.baseCurrency || "";
        try {
          const currencies = await fetchWithRetry(
            () => getCurrencyList({ search: company?.baseCurrency }),
            2
          );
          const matched = currencies.find((c) => c.code === company?.baseCurrency);
          if (matched?.symbol) currencySymbol = matched.symbol;
        } catch {
          console.warn("Currency fetch failed");
        }

        setCompanyInfo({
          companyName: company?.companyName,
          baseCurrency: company?.baseCurrency,
          currencySymbol,
          companyAddress: company?.address || {},
          domain: company?.domain ?? "",
          industryType: company?.industryType ?? "",
        });
      } catch {
        navigate("/login");
      }
    };

    refetch();
  }, [isHydrated, companyName]); 

  return { companyName, isHydrated, ...rest };
};