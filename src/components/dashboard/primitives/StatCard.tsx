import React from "react";
import clsx from "clsx";
import DashboardPanel from "./DashboardPanel";

type StatCardStatus =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info";

interface StatTrend {
  value: string;
  positive?: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number;

  icon?: React.ReactNode;

  trend?: StatTrend;

  status?: StatCardStatus;

  helperText?: string;

  onClick?: () => void;

  loading?: boolean;

  className?: string;
}

/* ─────────────────────────────────────────────────────────────
   STATUS STYLES
───────────────────────────────────────────────────────────── */

const statusStyles: Record<
  StatCardStatus,
  {
    iconBg: string;
    iconColor: string;
    accent: string;
  }
> = {
  default: {
    iconBg: "bg-[var(--surface-secondary)]",
    iconColor: "text-[var(--text-secondary)]",
    accent: "bg-[var(--border-strong)]",
  },

  success: {
    iconBg: "bg-[var(--success-soft)]",
    iconColor: "text-[var(--success)]",
    accent: "bg-[var(--success)]",
  },

  warning: {
    iconBg: "bg-[var(--warning-soft)]",
    iconColor: "text-[var(--warning)]",
    accent: "bg-[var(--warning)]",
  },

  danger: {
    iconBg: "bg-[var(--danger-soft)]",
    iconColor: "text-[var(--danger)]",
    accent: "bg-[var(--danger)]",
  },

  info: {
    iconBg: "bg-[var(--info-soft)]",
    iconColor: "text-[var(--info)]",
    accent: "bg-[var(--info)]",
  },
};

/* ─────────────────────────────────────────────────────────────
   STAT CARD
   Universal ERP metric primitive
───────────────────────────────────────────────────────────── */

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,

  icon,

  trend,

  status = "default",

  helperText,

  onClick,

  loading = false,

  className,
}) => {
  const styles = statusStyles[status];

  const interactive = Boolean(onClick);

  return (
    <DashboardPanel
      padding="sm"
      elevation="sm"
      hoverable={interactive}
      interactive={interactive}
      className={clsx(
        "relative h-full",
        className
      )}
    >


      <button
        type="button"
        onClick={onClick}
        disabled={!interactive}
        className={clsx(
          "flex h-full w-full flex-col",
          "text-left",
          !interactive && "cursor-default"
        )}
      >
        <div className="flex items-start justify-between gap-4">

          {/* Left Content */}
          <div className="min-w-0 flex-1">

            {/* Metric */}
            <h3
              className={clsx(
                "text-[32px] font-bold",
                "tracking-[-0.05em]",
                "leading-none",
                "text-[var(--text-primary)]"
              )}
            >
              {value}
            </h3>

            {/* Label */}
            <p
              className={clsx(
                "mt-2",
                "text-[13px] font-medium",
                "leading-5",
                "text-[var(--text-secondary)]"
              )}
            >
              {label}
            </p>

            {/* Trend / Helper */}
            {(trend || helperText) && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">

                {trend && (
                  <div
                    className={clsx(
                      "inline-flex items-center rounded-full px-2 py-1",
                      "text-[11px] font-semibold leading-none",

                      trend.positive
                        ? "bg-[var(--success-soft)] text-[var(--success)]"
                        : "bg-[var(--danger-soft)] text-[var(--danger)]"
                    )}
                  >
                    {trend.positive ? "↗" : "↘"} {trend.value}
                  </div>
                )}

                {helperText && (
                  <p
                    className={clsx(
                      "text-[12px]",
                      "leading-5",
                      "text-[var(--text-tertiary)]"
                    )}
                  >
                    {helperText}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Icon */}
          {icon && (
            <div
              className={clsx(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                styles.iconBg,
                styles.iconColor
              )}
            >
              {icon}
            </div>
          )}
        </div>

      </button>
    </DashboardPanel>
  );
};

export default StatCard;