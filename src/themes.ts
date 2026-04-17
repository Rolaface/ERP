export type Theme =
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

const THEME_KEY = "erp-theme";

export const setTheme = (theme: Theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
};

export const initTheme = (): Theme => {
  if (typeof window === "undefined") return "clinical-sanctuary";
  const saved = localStorage.getItem(THEME_KEY) as Theme | null;
  const theme: Theme = saved ?? "gold";
  document.documentElement.setAttribute("data-theme", theme);
  return theme;
};
