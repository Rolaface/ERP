import { useTheme } from "./ThemeProvider";

const THEMES = [
  "gold",
  "amber",
  "yellow",
  "dark",
  "corporate",
  "midnight",
  "ocean",
  "sunset",
  "rose",
  "mint",
  "lavender",
  "nordic",
  "cyber",
  "glass",
  "luxury",
  "clinical-sanctuary",
  "saas-indigo",
] as const;

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card border border-theme rounded-xl shadow-lg p-3 w-[220px]">
      <div className="text-xs font-semibold text-muted mb-2 uppercase">
        Theme Switcher
      </div>

      <div className="grid grid-cols-2 gap-2">
        {THEMES.map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`
              text-xs px-2 py-1 rounded-md border
              ${theme === t ? "bg-primary text-white" : "bg-transparent"}
            `}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}