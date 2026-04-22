import { useEffect, useState, type ChangeEvent } from "react";
import { initTheme, setTheme, type Theme } from "../themes";

const themes: { value: Theme; label: string }[] = [
  { value: "saas-indigo", label: "🚀 SaaS Indigo" },
  { value: "corporate", label: "💼 Corporate" },
  { value: "dark", label: "🌙 Classic Dark" },
  { value: "ocean", label: "🌊 Ocean Cyan" },
  { value: "mint", label: "🍃 Fresh Mint" },
  { value: "lavender", label: "🔮 Lavender" },
  { value: "gold", label: "🏆 Classic Gold" },
  { value: "luxury", label: "💎 Luxury Gold" },
  { value: "clinical-sanctuary", label: "🧪 Clinical Sanctuary" },
  { value: "rola-theme", label: "🟠 rola-theme" },
  { value: "udvell-theme", label: "🟣 udvell-theme" },
];

export function ThemeSwitcher() {
  const [theme, setThemeState] = useState<Theme>("gold");

  useEffect(() => {
    const current = initTheme();
    setThemeState(current);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const t = e.target.value as Theme;
    setTheme(t);
    setThemeState(t);
  };

  return (
    <select
      value={theme}
      onChange={handleChange}
      className="border border-theme rounded px-2 py-1 text-sm bg-card text-main"
    >
      {themes.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  );
}