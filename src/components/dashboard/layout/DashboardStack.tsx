import React from "react";

type StackGap =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl";

type StackAlign =
  | "start"
  | "center"
  | "end"
  | "stretch";

type StackJustify =
  | "start"
  | "center"
  | "end"
  | "between";

type StackMaxWidth =
  | "narrow"
  | "medium"
  | "wide"
  | "full";

interface DashboardStackProps {
  children: React.ReactNode;

  /**
   * Semantic vertical spacing.
   */
  gap?: StackGap;

  /**
   * Cross-axis alignment.
   */
  align?: StackAlign;

  /**
   * Main-axis distribution.
   */
  justify?: StackJustify;

  /**
   * Adds separators between children.
   */
  divide?: boolean;

  /**
   * Expands stack vertically.
   */
  fullHeight?: boolean;

  /**
   * Width constraint system.
   */
  maxWidth?: StackMaxWidth;

  className?: string;
}

const GAP_MAP: Record<StackGap, string> = {
  xs: "0.5rem",
  sm: "0.75rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
};

const ALIGN_MAP: Record<StackAlign, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
};

const JUSTIFY_MAP: Record<
  StackJustify,
  string
> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
};

const MAX_WIDTH_MAP: Record<
  StackMaxWidth,
  string
> = {
  narrow: "var(--container-narrow)",
  medium: "var(--container-medium)",
  wide: "var(--container-wide)",
  full: "100%",
};

export default function DashboardStack({
  children,
  gap = "md",
  align = "stretch",
  justify = "start",
  divide = false,
  fullHeight = false,
  maxWidth = "full",
  className = "",
}: DashboardStackProps) {
  const items = React.Children.toArray(children);

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",

        gap: GAP_MAP[gap],

        alignItems: ALIGN_MAP[align],

        justifyContent:
          JUSTIFY_MAP[justify],

        width: "100%",

        maxWidth: MAX_WIDTH_MAP[maxWidth],

        height: fullHeight
          ? "100%"
          : undefined,

        marginInline: "auto",
      }}
    >
      {items.map((child, index) => {
        const isLast =
          index === items.length - 1;

        return (
          <div
            key={index}
            style={{
              width: "100%",

              paddingBottom:
                divide && !isLast
                  ? GAP_MAP[gap]
                  : undefined,

              borderBottom:
                divide && !isLast
                  ? "1px solid var(--border)"
                  : undefined,
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}