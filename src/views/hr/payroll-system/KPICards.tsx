import React from "react";
import { Users, CheckCircle, Clock, ArrowUpRight } from "lucide-react";

interface KPICardsProps {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  onLeaveEmployees: number;
}

const Card: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ReactNode;
  accent: "primary" | "success" | "warning" | "info";
  trend?: string;
}> = ({ label, value, sub, icon, accent, trend }) => {
  const accentMap: Record<
    "primary" | "success" | "warning" | "info",
    { iconWrap: string; iconColor: string; trend: string }
  > = {
    primary: {
      iconWrap: "from-[var(--primary)] to-[var(--primary-700)]",
      iconColor: "text-white",
      trend: "text-primary bg-primary/10 border-[var(--primary)]/20",
    },
    success: {
      iconWrap: "from-[var(--primary)] to-[var(--primary-700)]",
      iconColor: "text-white",
      trend: "text-primary bg-primary/10 border-[var(--primary)]/20",
    },
    warning: {
      iconWrap: "from-[var(--brand-blue-bottom)] to-[var(--primary)]",
      iconColor: "text-white",
      trend: "text-primary bg-primary/10 border-[var(--primary)]/20",
    },
    info: {
      iconWrap: "from-[var(--brand-blue-top)] to-[var(--brand-blue-bottom)]",
      iconColor: "text-white",
      trend: "text-primary bg-primary/10 border-[var(--primary)]/20",
    },
  };
  const a = accentMap[accent];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm min-h-[96px]">
      <div className="flex items-center justify-between h-full">
        <div>
          <p className="text-xs font-semibold text-gray-600">{label}</p>
          <p className="text-xl font-bold text-gray-900 mt-1 tabular-nums">
            {value}
          </p>
          {sub ? (
            <p className="text-xs font-semibold text-muted mt-1">{sub}</p>
          ) : null}
          {trend ? (
            <span
              className={`mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${a.trend}`}
            >
              <ArrowUpRight className="w-3 h-3" />
              {trend}
            </span>
          ) : null}
        </div>

        <div
          className={`p-3 bg-gradient-to-br ${a.iconWrap} rounded-xl shadow-sm`}
        >
          <div className={a.iconColor}>{icon}</div>
        </div>
      </div>
    </div>
  );
};

export const KPICards: React.FC<KPICardsProps> = ({
  totalEmployees,
  activeEmployees,
  inactiveEmployees,
  onLeaveEmployees,
}) => {
  const activeRate =
    totalEmployees > 0
      ? Math.round((activeEmployees / totalEmployees) * 100)
      : 0;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        label="Total Employees"
        value={totalEmployees}
        icon={<Users className="w-5 h-5" />}
        accent="info"
      />
      <Card
        label="Active"
        value={activeEmployees}
        sub={`${activeRate}% of total`}
        icon={<CheckCircle className="w-5 h-5" />}
        accent="success"
        trend={activeRate >= 75 ? "Healthy workforce" : undefined}
      />
      <Card
        label="On Leave"
        value={onLeaveEmployees}
        sub={onLeaveEmployees > 0 ? "Currently on leave" : "No one on leave"}
        icon={<Clock className="w-5 h-5" />}
        accent="info"
      />
      <Card
        label="Inactive"
        value={inactiveEmployees}
        sub={
          inactiveEmployees > 0 ? "Requires follow-up" : "All employees active"
        }
        icon={<Users className="w-5 h-5" />}
        accent="warning"
      />
    </div>
  );
};
