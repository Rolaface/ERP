import React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  LucideIcon,
} from "lucide-react";

interface KPITileProps {
  label: string;
  value: string | number;

  icon: LucideIcon;

  iconBg?: string;
  iconColor?: string;

  trend?: {
    value: string;
    direction?: "up" | "down" | "neutral";
  };

  helperText?: string;

  status?: "default" | "success" | "warning" | "danger" | "info";

  loading?: boolean;

  className?: string;
}

const statusConfig = {
  default: {
    accent: "var(--primary)",
    glow: "rgba(99,102,241,0.18)",
  },

  success: {
    accent: "var(--success)",
    glow: "rgba(34,197,94,0.18)",
  },

  warning: {
    accent: "var(--warning)",
    glow: "rgba(245,158,11,0.18)",
  },

  danger: {
    accent: "var(--danger)",
    glow: "rgba(239,68,68,0.18)",
  },

  info: {
    accent: "var(--info)",
    glow: "rgba(59,130,246,0.18)",
  },
};

const trendConfig = {
  up: {
    icon: ArrowUpRight,
    text: "text-success",
    bg: "bg-success/10",
  },

  down: {
    icon: ArrowDownRight,
    text: "text-danger",
    bg: "bg-danger/10",
  },

  neutral: {
    icon: Minus,
    text: "text-muted",
    bg: "bg-[var(--row-hover)]",
  },
};

const KPITile: React.FC<KPITileProps> = ({
  label,
  value,

  icon: Icon,

  iconBg = "bg-primary/10",
  iconColor = "text-primary",

  trend,
  helperText,

  status = "default",

  loading = false,

  className = "",
}) => {
  const currentStatus = statusConfig[status];

  const trendDirection = trend?.direction ?? "neutral";

  const trendStyles = trendConfig[trendDirection];

  const TrendIcon = trendStyles.icon;

  return (
    <article
      className={`
        group
        relative
        overflow-hidden

        app-surface
        card-interactive
        edge-highlight

        rounded-[26px]

        p-5
        lg:p-6

        min-h-[170px]

        transition-all
        duration-300

        hover:-translate-y-0.5

        ${className}
      `}
    >
      {/* Accent Glow */}

      <div
        className="
          absolute
          inset-x-0
          top-0
          h-[3px]
          opacity-90
        "
        style={{
          background: currentStatus.accent,
          boxShadow: `0 0 24px ${currentStatus.glow}`,
        }}
      />

      {/* Decorative Ambient Orb */}

      <div
        className="
          absolute
          -right-10
          -top-10
          w-32
          h-32
          rounded-full
          blur-3xl
          opacity-40
          pointer-events-none
          transition-transform
          duration-500
          group-hover:scale-110
        "
        style={{
          background: currentStatus.glow,
        }}
      />

      {/* Loading State */}

      {loading ? (
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[var(--row-hover)]" />

            <div className="w-16 h-6 rounded-full bg-[var(--row-hover)]" />
          </div>

          <div className="space-y-3 mt-4">
            <div className="h-8 w-24 rounded-lg bg-[var(--row-hover)]" />

            <div className="h-4 w-32 rounded bg-[var(--row-hover)]" />

            <div className="h-3 w-40 rounded bg-[var(--row-hover)]" />
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex h-full flex-col">
          {/* Top Row */}

          <div className="flex items-start justify-between gap-4">
            {/* Icon */}

            <div
              className={`
                ${iconBg}
                ${iconColor}

                relative

                w-12
                h-12

                rounded-2xl

                flex
                items-center
                justify-center

                shrink-0

                shadow-sm
              `}
            >
              <Icon size={20} strokeWidth={2.2} />
            </div>

            {/* Trend */}

            {trend && (
              <div
                className={`
                  ${trendStyles.bg}
                  ${trendStyles.text}

                  inline-flex
                  items-center
                  gap-1.5

                  rounded-full

                  px-2.5
                  py-1

                  text-[11px]
                  font-semibold
                  tracking-wide
                `}
              >
                <TrendIcon size={12} />

                <span>{trend.value}</span>
              </div>
            )}
          </div>

          {/* Main Content */}

          <div className="mt-6 flex-1 flex flex-col justify-end">
            {/* Value */}

            <div
              className="
                text-[34px]
                lg:text-[38px]

                leading-none
                tracking-tight

                font-bold

                text-main
              "
            >
              {value}
            </div>

            {/* Label */}

            <p
              className="
                mt-3

                text-sm
                font-semibold

                tracking-[0.01em]

                text-main/90
              "
            >
              {label}
            </p>

            {/* Helper Text */}

            {helperText && (
              <p
                className="
                  mt-2

                  text-xs
                  leading-relaxed

                  text-muted
                "
              >
                {helperText}
              </p>
            )}
          </div>
        </div>
      )}
    </article>
  );
};

export default KPITile;