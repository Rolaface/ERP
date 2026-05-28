import React from "react";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;

  className?: string;

  /**
   * Controls max content width.
   */
  width?: "medium" | "wide" | "full";

  /**
   * Internal spacing preset.
   */
  padding?: "none" | "sm" | "md" | "lg";

  /**
   * Enables centered container behavior.
   */
  centered?: boolean;

  /**
   * Controls vertical spacing between sections.
   */
  gap?: "sm" | "md" | "lg";

  /**
   * Allows full-height dashboards.
   */
  fullHeight?: boolean;
}

const widthClasses = {
  medium: "max-w-5xl",
  wide: "max-w-7xl",
  full: "max-w-none",
};

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const gapClasses = {
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
};

export default function DashboardShell({
  children,

  className,

  width = "wide",

  padding = "md",

  centered = true,

  gap = "md",

  fullHeight = true,
}: DashboardShellProps) {
  return (
    <main
      className={cn(
        "relative w-full",

        fullHeight && "min-h-screen",

        className
      )}
    >
      <div
        className={cn(
          "flex flex-col",

          gapClasses[gap],

          paddingClasses[padding],

          centered && "mx-auto w-full",

          widthClasses[width]
        )}
      >
        {children}
      </div>
    </main>
  );
}