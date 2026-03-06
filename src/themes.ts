export type Theme = "gold";

const THEME_KEY = "erp-theme";

export const setTheme = (theme: Theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
};

export const initTheme = (): Theme => {
  if (typeof window === "undefined") return "gold";
  const saved = localStorage.getItem(THEME_KEY);
  const theme: Theme = saved === "gold" ? "gold" : "gold";
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  return theme;
};
