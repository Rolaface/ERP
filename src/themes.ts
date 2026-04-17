export type Theme =
  | "gold"
  | "dark"
  | "corporate"
  | "ocean"
  | "mint"
  | "lavender"
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
  const theme: Theme = saved ?? "clinical-sanctuary";
  document.documentElement.setAttribute("data-theme", theme);
  return theme;
};
