import React from "react";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "draft" | "default";

interface StatusBadgeProps {
  status?: string | null;
  variant?: BadgeVariant;
}

const VARIANT_MAP: Record<BadgeVariant, string[]> = {
  success: ["paid", "completed", "delivered", "verified"],

  warning: ["pending", "processing", "on hold", "under review"],

  danger: ["inactive", "overdue", "cancelled", "failed", "rejected", "expired", "unpaid"],

  info: ["sent", "new", "open", "in progress", "submitted", "approved", "partially paid", "partly paid"],

  draft: ["draft", "archived"],

  default: ["unknown"],
};

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  success: "bg-green-100 text-green-700 border-green-200",
  danger: "bg-red-100 text-red-700 border-red-200",
  warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
  info: "bg-blue-100 text-blue-700 border-blue-200",
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  default: "bg-gray-50 text-gray-500 border-gray-200",
};

function resolveVariant(safeStatus: string, override?: BadgeVariant): BadgeVariant {
  if (override) return override;

  for (const [variant, statuses] of Object.entries(VARIANT_MAP)) {
    if (statuses.includes(safeStatus)) {
      return variant as BadgeVariant;
    }
  }

  return "default";
}

function normalizeStatus(status?: string | null): string {
  return (status ?? "unknown")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function toTitleCase(str: string): string {
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant }) => {
  const safeStatus = normalizeStatus(status);
  const resolved = resolveVariant(safeStatus, variant);
  const displayText = status ? toTitleCase(safeStatus) : "Unknown";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${VARIANT_STYLES[resolved]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {displayText}
    </span>
  );
};

export default StatusBadge;