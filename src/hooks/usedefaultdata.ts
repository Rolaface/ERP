import { useEffect } from "react";
import { useCompanyDefaultsStore, CompanyDefaults } from "../store/Companydefaultsstore";

export function useCompanyDefaults() {
  const defaults      = useCompanyDefaultsStore((s) => s.defaults);
  const status        = useCompanyDefaultsStore((s) => s.status);
  const error         = useCompanyDefaultsStore((s) => s.error);
  const isHydrated    = useCompanyDefaultsStore((s) => s.isHydrated);
  const fetchDefaults = useCompanyDefaultsStore((s) => s.fetchDefaults);
  const setDefaults   = useCompanyDefaultsStore((s) => s.setDefaults);

  useEffect(() => {
    if (!isHydrated) return;
    fetchDefaults();
  }, [isHydrated]);

  return {
    defaults,
    isLoading: status === "loading",
    isError:   status === "error",
    isReady:   status === "success" && !!defaults,
    error,
    refetch:    () => fetchDefaults(true),
    setDefaults,
    get: <K extends keyof CompanyDefaults>(key: K): string =>
      defaults?.[key] ?? "",
  };
}

// usage: const currency = useDefault("default_currency");
export function useDefault<K extends keyof CompanyDefaults>(key: K): string {
  return useCompanyDefaultsStore((s) => s.defaults?.[key] ?? "");
}

// usage: const { default_income_account, default_receivable_account } =
//          useDefaults(["default_income_account", "default_receivable_account"]);
export function useDefaults<K extends keyof CompanyDefaults>(
  keys: K[],
): Record<K, string> {
  return useCompanyDefaultsStore((s) =>
    Object.fromEntries(
      keys.map((k) => [k, s.defaults?.[k] ?? ""])
    ) as Record<K, string>
  );
}