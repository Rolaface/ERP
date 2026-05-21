import React from "react";
import clsx from "clsx";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;

  compact?: boolean;
  bordered?: boolean;

  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

/* ─────────────────────────────────────────────────────────────
   SECTION HEADER
   Universal hierarchy primitive for all dashboards
───────────────────────────────────────────────────────────── */

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actions,

  compact = false,
  bordered = false,

  className,
  titleClassName,
  subtitleClassName,
}) => {
  return (
    <div
      className={clsx(
        "flex items-start justify-between gap-4",

        compact
          ? "mb-ds-4"
          : "mb-ds-5",

        bordered && [
          "pb-ds-4",
          "border-b border-[var(--border-subtle)]",
        ],

        className
      )}
    >
      {/* ── Left Content ───────────────────────────── */}
      <div className="min-w-0 flex-1">
        {/* Title */}
        <h2
          className={clsx(
            "text-[var(--text-primary)]",
            "font-semibold tracking-[-0.02em]",
            "leading-tight",

            compact
              ? "text-[15px]"
              : "text-[18px]",

            titleClassName
          )}
        >
          {title}
        </h2>

        {/* Subtitle */}
        {subtitle && (
          <p
            className={clsx(
              "text-[var(--text-secondary)]",
              "leading-relaxed",

              compact
                ? "text-[12px] mt-1"
                : "text-[13px] mt-1.5",

              subtitleClassName
            )}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* ── Actions ───────────────────────────────── */}
      {actions && (
        <div
          className={clsx(
            "flex items-center gap-2",
            "shrink-0"
          )}
        >
          {actions}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;