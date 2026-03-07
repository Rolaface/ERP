import React from "react";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "default";

interface StatusBadgeProps {
  status?: string | null;
  variant?: BadgeVariant;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant }) => {
  const safeStatus = (status ?? "unknown").toLowerCase();

  const getVariant = (): BadgeVariant => {
    if (variant) return variant;

    if (["active", "paid", "completed", "approved"].includes(safeStatus))
      return "success";

    if (["pending", "processing"].includes(safeStatus)) return "warning";

    if (
      [
        "inactive",
        "unactive",
        "overdue",
        "cancelled",
        "failed",
        "rejected",
      ].includes(safeStatus)
    )
      return "danger";

    if (["draft", "new"].includes(safeStatus)) return "info";

    return "default";
  };

  const variantStyles: Record<BadgeVariant, string> = {
    success: "bg-primary/10 text-primary border-[var(--primary)]/20",
    danger: "bg-danger border-theme",
    warning: "bg-warning border-theme",
    info: "bg-info border-theme",
    default: "bg-row-hover text-muted border-theme",
  };

  const currentVariant = getVariant();

  const displayStatus = status
    ? status
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ")
    : "Unknown";

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
        variantStyles[currentVariant]
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-2 bg-current opacity-60" />
      {displayStatus}
    </span>
  );
};

export default StatusBadge;
