import React from "react";
import { Users, CheckCircle, Clock, Banknote } from "lucide-react";

interface KPICardsProps {
  totalRecords: number;
  paidCount: number;
  pendingCount: number;
  totalPayout: number;
}

type Accent = "primary" | "success" | "warning" | "info";

const accentMap: Record<
  Accent,
  {
    wrap: string;
    icon: string;
    value: string;
  }
> = {
  primary: {
    wrap: "bg-primary/5 border-primary/10",
    icon: "text-primary",
    value: "text-primary",
  },

  success: {
    wrap: "bg-success/5 border-success/10",
    icon: "text-success",
    value: "text-success",
  },

  warning: {
    wrap: "bg-warning/5 border-warning/10",
    icon: "text-warning",
    value: "text-warning",
  },

  info: {
    wrap: "bg-info/5 border-info/10",
    icon: "text-info",
    value: "text-info",
  },
};

const Chip: React.FC<{
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent: Accent;
}> = ({ label, value, icon, accent }) => {
  const a = accentMap[accent];

  return (
    <div
      className={`h-12 px-3 rounded-xl border flex items-center justify-between ${a.wrap}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className={a.icon}>{icon}</div>

        <div className="min-w-0">
          <p className="text-[10px] text-muted leading-none">{label}</p>

          <p className={`text-sm font-bold leading-tight mt-0.5 ${a.value}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export const KPICards: React.FC<KPICardsProps> = ({
  totalRecords,
  paidCount,
  pendingCount,
  totalPayout,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      <Chip
        label="Employees"
        value={totalRecords}
        icon={<Users className="w-3.5 h-3.5" />}
        accent="info"
      />

      <Chip
        label="Payout"
        value={`${(totalPayout / 1000).toFixed(0)}K`}
        icon={<Banknote className="w-3.5 h-3.5" />}
        accent="primary"
      />

      <Chip
        label="Processed"
        value={paidCount}
        icon={<CheckCircle className="w-3.5 h-3.5" />}
        accent="success"
      />

      <Chip
        label="Pending"
        value={pendingCount}
        icon={<Clock className="w-3.5 h-3.5" />}
        accent={pendingCount > 0 ? "warning" : "info"}
      />
    </div>
  );
};
