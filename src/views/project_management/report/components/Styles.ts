
export const cardCls = "bg-card border border-[var(--border)] rounded-xl";

const btnBase =
  "inline-flex items-center justify-center gap-1.5 text-xs rounded-lg transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed";

export const actionBtnCls = `${btnBase} h-9 px-3.5 font-semibold border border-[var(--border)] bg-card text-main hover:bg-row-hover`;
export const primaryBtnCls = `${btnBase} h-10 px-5 font-bold bg-primary text-white hover:bg-primary/90`;
export const secondaryBtnCls = `${btnBase} h-10 px-5 font-semibold border border-[var(--border)] bg-card text-main hover:bg-row-hover`;

export const inputCls =
  "h-9 px-2.5 text-xs border border-[var(--border)] rounded-lg bg-card text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";
export const pageBtnCls =
  "p-1 rounded-md border border-[var(--border)] bg-card text-main hover:bg-row-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all";