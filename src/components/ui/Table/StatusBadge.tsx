import React from "react";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "draft" | "default";

interface StatusBadgeProps {
  status?: string | null;
  variant?: BadgeVariant;
}

// Static — defined once, not recreated on every render
const VARIANT_MAP: Record<BadgeVariant, string[]> = {
  success: ["active", "paid", "completed", "approved", "delivered", "verified"],
  warning: ["pending", "processing", "on hold", "under review"],
  danger:  ["inactive", "overdue", "cancelled", "failed", "rejected", "expired"],
  info:    ["sent", "new", "open", "in progress","submitted"],
  draft:   ["draft", "archived"],
  default: ["unknown"],
};

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  success: "bg-success border-theme",
  danger:  "bg-danger border-theme",
  warning: "bg-warning border-theme",
  info:    "bg-info border-theme",
  draft:   "bg-draft border-theme",
  default: "bg-row-hover text-muted border-theme",
};

// Pure utility — no closure needed
function resolveVariant(safeStatus: string, override?: BadgeVariant): BadgeVariant {
  if (override) return override;
  for (const [variant, statuses] of Object.entries(VARIANT_MAP)) {
    if (statuses.includes(safeStatus)) return variant as BadgeVariant;
  }
  return "default";
}

function toTitleCase(str: string): string {
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant }) => {
  const safeStatus  = (status ?? "unknown").toLowerCase();
  const resolved    = resolveVariant(safeStatus, variant);
  const displayText = status ? toTitleCase(status) : "Unknown";

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${VARIANT_STYLES[resolved]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-2 bg-current opacity-60" />
      {displayText}
    </span>
  );
};

export default StatusBadge;