import React from "react";
import clsx from "clsx";

interface EmptyStateProps {
  title: string;

  description?: string;

  icon?: React.ReactNode;

  action?: React.ReactNode;

  compact?: boolean;

  bordered?: boolean;

  className?: string;
}

/* ─────────────────────────────────────────────────────────────
   EMPTY STATE
   Universal no-data experience for ERP dashboards
───────────────────────────────────────────────────────────── */

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  compact = false,
  bordered = false,
  className,
}) => {
  return (
    <div
      className={clsx(
        "relative flex flex-col items-center justify-center",
        "rounded-[var(--radius-xl)]",
        "bg-[var(--surface-secondary)]",
        "text-center",

        compact
          ? "min-h-[180px] px-ds-5 py-ds-6"
          : "min-h-[280px] px-ds-8 py-ds-10",

        bordered && "border border-[var(--border-subtle)]",

        className
      )}
    >
      {/* ── Decorative Background Glow ───────────────────── */}
      <div
        className={clsx(
          "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
        )}
      >
        <div
          className={clsx(
            "absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2",
            "rounded-full blur-3xl opacity-20",
            "bg-[var(--brand-primary)]"
          )}
        />
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      <div className="relative z-[1] flex max-w-[420px] flex-col items-center">
        {/* Icon */}
        {icon && (
          <div
            className={clsx(
              "mb-ds-5 flex items-center justify-center",
              "rounded-2xl",
              "bg-[var(--surface-primary)]",
              "text-[var(--text-secondary)]",
              "border border-[var(--border-subtle)]",

              compact
                ? "h-14 w-14"
                : "h-18 w-18"
            )}
          >
            <div
              className={clsx(
                compact
                  ? "scale-100"
                  : "scale-110"
              )}
            >
              {icon}
            </div>
          </div>
        )}

        {/* Title */}
        <h3
          className={clsx(
            "font-semibold tracking-[-0.02em]",
            "text-[var(--text-primary)]",
            "leading-tight",

            compact
              ? "text-[16px]"
              : "text-[20px]"
          )}
        >
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p
            className={clsx(
              "mt-ds-3",
              "text-[var(--text-secondary)]",
              "leading-relaxed",

              compact
                ? "max-w-[300px] text-[13px]"
                : "max-w-[360px] text-[14px]"
            )}
          >
            {description}
          </p>
        )}

        {/* Action */}
        {action && (
          <div className="mt-ds-6">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;