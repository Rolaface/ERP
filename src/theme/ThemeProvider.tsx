import { createContext, useContext, useEffect, useState } from "react";

type Theme = 
  | "gold"
  | "amber"
  | "yellow"
  | "dark"
  | "corporate"
  | "midnight"
  | "ocean"
  | "sunset"
  | "rose"
  | "mint"
  | "lavender"
  | "nordic"
  | "cyber"
  | "glass"
  | "luxury"
  | "clinical-sanctuary"
  | "saas-indigo";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("saas-indigo");

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("app-theme") as Theme | null;
    if (saved) setThemeState(saved);
  }, []);

  // Apply to DOM
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
};