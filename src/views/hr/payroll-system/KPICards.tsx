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
  const accentMap = {
    primary: { chip: "from-purple-500 to-purple-600" },
    success: { chip: "from-emerald-500 to-emerald-600" },
    warning: { chip: "from-amber-500 to-amber-600" },
    info: { chip: "from-blue-500 to-blue-600" },
  };
  const a = accentMap[accent];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm min-h-[124px]">
      <div className="flex items-center justify-between h-full">
        <div>
          <p className="text-sm font-semibold text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">
            {value}
          </p>
          {sub ? (
            <p className="text-xs font-semibold text-gray-500 mt-1">{sub}</p>
          ) : null}
          {trend ? (
            <span className="mt-2 inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              {trend}
            </span>
          ) : null}
        </div>

        <div className={`p-3 bg-gradient-to-br ${a.chip} rounded-xl shadow-sm`}>
          <div className="text-white">{icon}</div>
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
        accent={onLeaveEmployees > 0 ? "warning" : "info"}
      />
      <Card
        label="Inactive"
        value={inactiveEmployees}
        sub={
          inactiveEmployees > 0 ? "Requires follow-up" : "All employees active"
        }
        icon={<Users className="w-5 h-5" />}
        accent={inactiveEmployees > 0 ? "warning" : "info"}
      />
    </div>
  );
};
