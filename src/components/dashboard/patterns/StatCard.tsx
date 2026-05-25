import React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
} from "lucide-react";

type StatCardStatus =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info";

type StatCardTrend =
  | "up"
  | "down"
  | "neutral";

interface StatCardProps {
  title: string;

  value: string | number;

  subtitle?: string;

  icon?: React.ReactNode;

  trend?: StatCardTrend;

  trendValue?: string;

  status?: StatCardStatus;

  loading?: boolean;

  onClick?: () => void;

  className?: string;
}

const STATUS_MAP: Record<
  StatCardStatus,
  {
    border: string;
    background: string;
    text: string;
  }
> = {
  default: {
    border: "transparent",
    background: "var(--surface-2)",
    text: "var(--text)",
  },

  success: {
    border: "var(--success)",
    background: "rgba(34,197,94,0.08)",
    text: "var(--success)",
  },

  warning: {
    border: "var(--warning)",
    background: "rgba(245,158,11,0.08)",
    text: "var(--warning)",
  },

  danger: {
    border: "var(--danger)",
    background: "rgba(239,68,68,0.08)",
    text: "var(--danger)",
  },

  info: {
    border: "var(--info)",
    background: "rgba(59,130,246,0.08)",
    text: "var(--info)",
  },
};

function TrendIcon({
  trend,
}: {
  trend: StatCardTrend;
}) {
  if (trend === "up") {
    return <ArrowUpRight size={16} />;
  }

  if (trend === "down") {
    return <ArrowDownRight size={16} />;
  }

  return <Minus size={16} />;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  status = "default",
  loading = false,
  onClick,
  className = "",
}: StatCardProps) {
  const statusStyles = STATUS_MAP[status];

  const isInteractive = Boolean(onClick);

  if (loading) {
    return (
      <div
        className={className}
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "1rem",
          padding: "1.25rem",
          minHeight: "160px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "var(--skeleton-base)",
          }}
        />

        <div
          style={{
            marginTop: "1rem",
            width: "80px",
            height: "32px",
            borderRadius: "8px",
            background: "var(--skeleton-base)",
          }}
        />

        <div
          style={{
            marginTop: "0.75rem",
            width: "140px",
            height: "14px",
            borderRadius: "6px",
            background: "var(--skeleton-base)",
          }}
        />

        <div
          style={{
            marginTop: "0.5rem",
            width: "100px",
            height: "12px",
            borderRadius: "6px",
            background: "var(--skeleton-base)",
          }}
        />
      </div>
    );
  }

  return (
    <div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      className={className}
      style={{
        position: "relative",

        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",

        minHeight: "160px",

        padding: "1.25rem",

        borderRadius: "1rem",

        border: "1px solid var(--border)",

        borderTop: `4px solid ${statusStyles.border}`,

        background: "var(--card)",

        transition:
          "transform 180ms ease, box-shadow 180ms ease",

        cursor: isInteractive
          ? "pointer"
          : "default",

        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (!isInteractive) return;

        e.currentTarget.style.transform =
          "translateY(-2px)";

        e.currentTarget.style.boxShadow =
          "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform =
          "translateY(0px)";

        e.currentTarget.style.boxShadow =
          "none";
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        {/* Icon */}
        {icon && (
          <div
            style={{
              width: "48px",
              height: "48px",

              borderRadius: "14px",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              background:
                statusStyles.background,

              color: statusStyles.text,

              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}

        {/* Trend */}
        {trend && trendValue && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",

              fontSize: "0.875rem",
              fontWeight: 600,

              color:
                trend === "up"
                  ? "var(--success)"
                  : trend === "down"
                    ? "var(--danger)"
                    : "var(--muted)",
            }}
          >
            <TrendIcon trend={trend} />

            <span>{trendValue}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          marginTop: "1.5rem",

          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
        }}
      >
        {/* Value */}
        <div
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            lineHeight: 1.1,
            color: "var(--text)",
          }}
        >
          {value}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "var(--text)",
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div
            style={{
              fontSize: "0.85rem",
              color: "var(--muted)",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}