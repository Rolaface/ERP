import React from "react";
import clsx from "clsx";

type PanelPadding =
  | "none"
  | "xs"
  | "sm"
  | "md"
  | "lg";

type PanelElevation =
  | "flat"
  | "sm"
  | "md"
  | "lg";

interface DashboardPanelProps {
  children: React.ReactNode;

  className?: string;

  padding?: PanelPadding;
  elevation?: PanelElevation;

  hoverable?: boolean;
  interactive?: boolean;
  bordered?: boolean;

  fullHeight?: boolean;

  header?: React.ReactNode;
  footer?: React.ReactNode;
}

/* ─────────────────────────────────────────────────────────────
   STYLE MAPS
───────────────────────────────────────────────────────────── */

const paddingMap: Record<PanelPadding, string> = {
  none: "",
  xs: "p-ds-3",
  sm: "p-ds-4",
  md: "p-ds-5",
  lg: "p-ds-6",
};

const elevationMap: Record<PanelElevation, string> = {
  flat: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */

const DashboardPanel: React.FC<DashboardPanelProps> = ({
  children,

  className,

  padding = "md",
  elevation = "sm",

  hoverable = false,
  interactive = false,
  bordered = true,

  fullHeight = false,

  header,
  footer,
}) => {
  return (
    <section
      className={clsx(
        /* Base */
        "ds-panel",
        "relative overflow-hidden",
        "rounded-[var(--radius-xl)]",
        "bg-[var(--surface-primary)]",
        "transition-[background,border-color,box-shadow,transform]",
        "duration-[var(--motion-normal)]",
        "ease-[var(--ease-standard)]",

        /* Border */
        bordered && "border border-[var(--border-subtle)]",

        /* Elevation */
        elevationMap[elevation],

        /* Height */
        fullHeight && "h-full",

        /* Hover */
        hoverable && [
          "hover:border-[var(--border-strong)]",
          "hover:shadow-lg",
        ],

        /* Interactive */
        interactive && [
          "cursor-pointer",
          "active:scale-[0.995]",
          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-[var(--brand-primary)]",
          "focus-visible:ring-offset-2",
        ],

        className
      )}
    >
      {/* ── Header ───────────────────────────────────── */}
      {header && (
        <div
          className={clsx(
            "border-b border-[var(--border-subtle)]",
            paddingMap[padding]
          )}
        >
          {header}
        </div>
      )}

      {/* ── Body ─────────────────────────────────────── */}
      <div className={clsx(paddingMap[padding])}>
        {children}
      </div>

      {/* ── Footer ───────────────────────────────────── */}
      {footer && (
        <div
          className={clsx(
            "border-t border-[var(--border-subtle)]",
            paddingMap[padding]
          )}
        >
          {footer}
        </div>
      )}
    </section>
  );
};

export default DashboardPanel;