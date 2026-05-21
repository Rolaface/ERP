import React from "react";
import clsx from "clsx";
import SectionHeader from "./SectionHeader";

type SectionSpacing =
  | "none"
  | "xs"
  | "sm"
  | "md"
  | "lg";

interface DashboardSectionProps {
  children: React.ReactNode;

  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;

  className?: string;
  contentClassName?: string;

  spacing?: SectionSpacing;

  borderedHeader?: boolean;
  compactHeader?: boolean;

  fullHeight?: boolean;
}

/* ─────────────────────────────────────────────────────────────
   SPACING SYSTEM
───────────────────────────────────────────────────────────── */

const spacingMap: Record<SectionSpacing, string> = {
  none: "",
  xs: "space-y-ds-2",
  sm: "space-y-ds-3",
  md: "space-y-ds-4",
  lg: "space-y-ds-6",
};

/* ─────────────────────────────────────────────────────────────
   DASHBOARD SECTION
   Structural composition wrapper for dashboard architecture
───────────────────────────────────────────────────────────── */

const DashboardSection: React.FC<DashboardSectionProps> = ({
  children,

  title,
  subtitle,
  actions,

  className,
  contentClassName,

  spacing = "md",

  borderedHeader = false,
  compactHeader = false,

  fullHeight = false,
}) => {
  const hasHeader =
    title || subtitle || actions;

  return (
    <section
      className={clsx(
        "dashboard-section",
        "min-w-0",

        fullHeight && "h-full flex flex-col",

        className
      )}
    >
      {/* ── Section Header ───────────────────────── */}
      {hasHeader && (
        <SectionHeader
          title={title ?? ""}
          subtitle={subtitle}
          actions={actions}
          compact={compactHeader}
          bordered={borderedHeader}
        />
      )}

      {/* ── Section Content ─────────────────────── */}
      <div
        className={clsx(
          "min-w-0",
          spacingMap[spacing],

          fullHeight && "flex-1",

          contentClassName
        )}
      >
        {children}
      </div>
    </section>
  );
};

export default DashboardSection;