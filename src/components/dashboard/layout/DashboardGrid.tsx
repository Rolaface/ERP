import React from "react";

type DashboardGridGap = "sm" | "md" | "lg";

type DashboardGridMaxWidth =
  | "narrow"
  | "medium"
  | "wide"
  | "full";

interface DashboardGridProps {
  children: React.ReactNode;

  /**
   * Fixed column count.
   * Ignored if minItemWidth is provided.
   */
  columns?: number;

  /**
   * Responsive auto-fit mode.
   * Example:
   * repeat(auto-fit, minmax(280px, 1fr))
   */
  minItemWidth?: number;

  /**
   * Semantic spacing system.
   */
  gap?: DashboardGridGap;

  /**
   * Makes all children stretch equally.
   */
  equalHeight?: boolean;

  /**
   * Enables CSS dense packing.
   */
  dense?: boolean;

  /**
   * Controls container width.
   */
  maxWidth?: DashboardGridMaxWidth;

  className?: string;
}

const GAP_MAP: Record<DashboardGridGap, string> = {
  sm: "0.75rem",
  md: "1rem",
  lg: "1.5rem",
};

const MAX_WIDTH_MAP: Record<
  DashboardGridMaxWidth,
  string
> = {
  narrow: "var(--container-narrow)",
  medium: "var(--container-medium)",
  wide: "var(--container-wide)",
  full: "100%",
};

export default function DashboardGrid({
  children,
  columns = 3,
  minItemWidth,
  gap = "md",
  equalHeight = true,
  dense = false,
  maxWidth = "full",
  className = "",
}: DashboardGridProps) {
  const gridTemplateColumns = minItemWidth
    ? `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`
    : `repeat(${columns}, minmax(0, 1fr))`;

  return (
    <div
      className={className}
      style={{
        display: "grid",

        gridTemplateColumns,

        gap: GAP_MAP[gap],

        alignItems: equalHeight
          ? "stretch"
          : "start",

        gridAutoFlow: dense ? "dense" : "row",

        width: "100%",

        maxWidth: MAX_WIDTH_MAP[maxWidth],

        marginInline: "auto",
      }}
    >
      {children}
    </div>
  );
}