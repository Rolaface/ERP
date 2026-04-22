import { useEffect, useState } from "react";
import countriesLib from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";

countriesLib.registerLocale(en);

export const useCountries = () => {
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [detected, setDetected] = useState<any>({});

  useEffect(() => {
    try {
      // ✅ Get ALL countries (official names)
      const allCountries = Object.values(
        countriesLib.getNames("en", { select: "official" })
      );

      // ✅ Sort alphabetically (important for UX)
      const sorted = allCountries.sort((a, b) =>
        a.localeCompare(b)
      );

      setCountries(sorted);

      // (Optional) Keep your existing detection logic here
      setDetected({
        country: "India",
        currency: "INR",
        timezone: "Asia/Kolkata",
      });

    } catch (err: any) {
      setError("Failed to load countries");
    } finally {
      setLoading(false);
    }
  }, []);

  return { countries, loading, error, detected };
};