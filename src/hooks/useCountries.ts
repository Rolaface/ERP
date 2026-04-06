import { useEffect, useState } from "react";

export function useCountries() {
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detected, setDetected] = useState({
    country: "",
    currency: "",
    timezone: "",
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");

        // 🌍 Parallel fetch (countries + IP info)
        const [countriesRes, ipRes] = await Promise.all([
          fetch("https://restcountries.com/v3.1/all?fields=name,currencies,timezones"),
          fetch("https://ipapi.co/json/"),
        ]);

        const countriesData = await countriesRes.json();
        const ipData = await ipRes.json();

        const countryNames = countriesData
          .map((c: any) => c.name.common)
          .sort((a: string, b: string) => a.localeCompare(b));

        setCountries(countryNames);

        // 🌍 detect user
        const detectedCountry = ipData.country_name;
        const matched = countriesData.find(
          (c: any) => c.name.common === detectedCountry
        );

        const currency =
          matched?.currencies
            ? Object.keys(matched.currencies)[0]
            : "USD";

        const timezone =
          matched?.timezones?.[0] || Intl.DateTimeFormat().resolvedOptions().timeZone;

        setDetected({
          country: detectedCountry || "United States",
          currency,
          timezone,
        });

      } catch (err) {
        console.error(err);
        setError("Failed to load countries");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  return { countries, loading, error, detected };
}