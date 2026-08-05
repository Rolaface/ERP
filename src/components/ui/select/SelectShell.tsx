import React, { cloneElement, isValidElement } from "react";
import { ChevronDown } from "lucide-react";

interface SelectShellProps {

  icon?: React.ReactNode;
  /** Keep left padding reserved even when `icon` is hidden, so text doesn't jump when a value gets selected. */
  reserveIconSpace?: boolean;
  /** Trailing chevron indicator. Defaults to true. */
  showChevron?: boolean;
  /** Rotate the chevron, e.g. while a dropdown is open. */
  chevronOpen?: boolean;
  disabled?: boolean;
  error?: boolean;
  /** Extra classes for the outer wrapper (e.g. width overrides). */
  className?: string;

  children: React.ReactElement;
}

export default function SelectShell({
  icon,
  reserveIconSpace,
  showChevron = true,
  chevronOpen = false,
  disabled = false,
  error = false,
  className = "",
  children,
}: SelectShellProps) {
  const hasIcon = reserveIconSpace ?? Boolean(icon);

  const fieldClass = [
    "w-full min-h-[28px] py-1.5 border rounded text-[11px] bg-card text-main flex items-center transition-colors duration-150",
    hasIcon ? "pl-6" : "pl-2",
    showChevron ? "pr-6" : "pr-2",
    disabled
      ? "opacity-50 cursor-not-allowed border-theme"
      : error
        ? "border-red-400/60 focus-within:outline-none focus-within:ring-2 focus-within:ring-red-400/40"
        : "border-theme hover:border-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:border-primary",
  ].join(" ");

  const field = isValidElement(children)
    ? cloneElement(children as React.ReactElement<any>, {
        className: [fieldClass, (children.props as any).className]
          .filter(Boolean)
          .join(" "),
      })
    : children;

  return (
    <div className={`relative w-full min-w-0 ${className}`}>
      {icon && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted [&>svg]:w-3.5 [&>svg]:h-3.5">
          {icon}
        </span>
      )}
      {field}
      {showChevron && (
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-150 ${
            chevronOpen ? "rotate-180" : ""
          }`}
        />
      )}
    </div>
  );
}