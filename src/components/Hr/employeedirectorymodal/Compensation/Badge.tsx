import React from "react";

export const Badge: React.FC<{
  children: React.ReactNode;
  tone?: "primary" | "muted";
}> = ({ children, tone = "primary" }) => (
  <span
    className={`shrink-0 inline-flex items-center gap-1 rounded-full px-1.5 py-[1px] text-[9px] font-semibold leading-none ${
      tone === "primary"
        ? "bg-primary/10 text-primary"
        : "bg-app text-muted border border-theme"
    }`}
  >
    {children}
  </span>
);
